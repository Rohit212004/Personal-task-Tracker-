using Google.Apis.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using MySql.Data.MySqlClient;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;

[Route("api/auth")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly string _connectionString;
    private readonly string _jwtSecret;

    public AuthController(IConfiguration config)
    {
        _connectionString = config.GetConnectionString("MySQL");
        var jwtKey = config["Jwt:Key"] ?? config["JwtSettings:Secret"];
        if (string.IsNullOrWhiteSpace(jwtKey))
        {
            throw new ArgumentNullException("Jwt:Key", "JWT secret is not configured.");
        }
        _jwtSecret = jwtKey;
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] TokenRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Token))
            {
                return BadRequest(new { success = false, message = "Google token is required." });
            }

            var payload = await GoogleJsonWebSignature.ValidateAsync(request.Token);

            using (var conn = new MySqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string checkQuery = "SELECT id FROM users WHERE google_id=@gid OR email=@em";
                using (var cmd = new MySqlCommand(checkQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@gid", payload.Subject);
                    cmd.Parameters.AddWithValue("@em", payload.Email);

                    var exists = await cmd.ExecuteScalarAsync();

                    if (exists == null)
                    {
                        string insertQuery = @"INSERT INTO users (google_id, name, email, profile_picture, created_at) 
                                               VALUES (@gid, @name, @em, @pic, NOW())";
                        using (var insertCmd = new MySqlCommand(insertQuery, conn))
                        {
                            insertCmd.Parameters.AddWithValue("@gid", payload.Subject);
                            insertCmd.Parameters.AddWithValue("@name", payload.Name);
                            insertCmd.Parameters.AddWithValue("@em", payload.Email);
                            insertCmd.Parameters.AddWithValue("@pic", payload.Picture);
                            await insertCmd.ExecuteNonQueryAsync();
                        }
                    }
                }
            }

            var jwt = GenerateJwtToken(payload.Subject, payload.Name, payload.Email);

            return Ok(new
            {
                success = true,
                jwt,
                user = new
                {
                    name = payload.Name,
                    email = payload.Email,
                    profile_picture = payload.Picture
                }
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = $"Google login failed: {ex.Message}" });
        }
    }

    [HttpPost("signup")]
    public async Task<IActionResult> Signup([FromBody] SignupRequest request)
    {
        try
        {
            request.Username = request.Username?.Trim();
            request.Email = request.Email?.Trim();
            request.Password = request.Password?.Trim();
            request.FullName = request.FullName?.Trim();

            if (string.IsNullOrWhiteSpace(request.Username) ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password) ||
                string.IsNullOrWhiteSpace(request.FullName))
            {
                return BadRequest(new { success = false, message = "All fields are required." });
            }

            if (request.Password.Length < 6)
            {
                return BadRequest(new { success = false, message = "Password must be at least 6 characters long." });
            }

            if (!IsValidEmail(request.Email))
            {
                return BadRequest(new { success = false, message = "Please enter a valid email address." });
            }

            using (var conn = new MySqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string checkQuery = "SELECT COUNT(*) FROM users WHERE username=@username OR email=@email";
                using (var checkCmd = new MySqlCommand(checkQuery, conn))
                {
                    checkCmd.Parameters.AddWithValue("@username", request.Username);
                    checkCmd.Parameters.AddWithValue("@email", request.Email);

                    var exists = Convert.ToInt32(await checkCmd.ExecuteScalarAsync());
                    if (exists > 0)
                    {
                        return BadRequest(new { success = false, message = "Username or email already exists." });
                    }
                }

                string hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);

                string insertQuery = @"INSERT INTO users (username, email, password_hash, name, created_at) 
                                       VALUES (@username, @email, @password, @name, NOW())";

                using (var insertCmd = new MySqlCommand(insertQuery, conn))
                {
                    insertCmd.Parameters.AddWithValue("@username", request.Username);
                    insertCmd.Parameters.AddWithValue("@email", request.Email);
                    insertCmd.Parameters.AddWithValue("@password", hashedPassword);
                    insertCmd.Parameters.AddWithValue("@name", request.FullName);

                    await insertCmd.ExecuteNonQueryAsync();
                }
            }

            return Ok(new { success = true, message = "Account created successfully!" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = $"Registration failed: {ex.Message}" });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            request.Username = request.Username?.Trim();
            request.Password = request.Password?.Trim();

            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { success = false, message = "Username and password are required." });
            }

            using (var conn = new MySqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string query = @"SELECT id, username, email, password_hash, name, profile_picture 
                                 FROM users 
                                 WHERE username=@username OR email=@username";

                using (var cmd = new MySqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@username", request.Username);

                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            var storedPasswordHash = reader.GetString(reader.GetOrdinal("password_hash"));

                            if (!BCrypt.Net.BCrypt.Verify(request.Password, storedPasswordHash))
                            {
                                return BadRequest(new { success = false, message = "Incorrect password." });
                            }

                            var userId = reader.GetInt32(reader.GetOrdinal("id"));
                            var username = reader.GetString(reader.GetOrdinal("username"));
                            var email = reader.GetString(reader.GetOrdinal("email"));
                            var name = reader.GetString(reader.GetOrdinal("name"));

                            var profilePictureIndex = reader.GetOrdinal("profile_picture");
                            var profilePicture = reader.IsDBNull(profilePictureIndex)
                                ? null
                                : reader.GetString(profilePictureIndex);

                            var jwt = GenerateJwtToken(userId.ToString(), name, email);

                            return Ok(new
                            {
                                success = true,
                                jwt,
                                user = new
                                {
                                    name = name,
                                    email = email,
                                    username = username,
                                    profile_picture = profilePicture
                                }
                            });
                        }
                        else
                        {
                            return BadRequest(new { success = false, message = "User not found." });
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = $"Login failed: {ex.Message}" });
        }
    }

    private string GenerateJwtToken(string userId, string name, string email)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        // Ensure at least 256-bit signing key
        var keyBytes = System.Security.Cryptography.SHA256.HashData(Encoding.UTF8.GetBytes(_jwtSecret));

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Name, name ?? ""),
                new Claim(ClaimTypes.Email, email ?? "")
            }),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }
}

public class TokenRequest
{
    public string Token { get; set; }
}

public class SignupRequest
{
    public string Username { get; set; }
    public string Email { get; set; }
    public string Password { get; set; }
    public string FullName { get; set; }
}

public class LoginRequest
{
    public string Username { get; set; }
    public string Password { get; set; }
}
