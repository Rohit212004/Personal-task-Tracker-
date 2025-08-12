using Google.Apis.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using MySql.Data.MySqlClient;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

[Route("api/auth")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly string _connectionString;
    private readonly string _jwtSecret;

    public AuthController(IConfiguration config)
    {
        _connectionString = config.GetConnectionString("MySQL");
        _jwtSecret = config["JwtSettings:Secret"];
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] TokenRequest request)
    {
        try
        {
            // 1. Validate Google token
            var payload = await GoogleJsonWebSignature.ValidateAsync(request.Token);

            // 2. Store or update in MySQL
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
                        string insertQuery = "INSERT INTO users (google_id, name, email, profile_picture) VALUES (@gid, @name, @em, @pic)";
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

            // 3. Generate JWT token
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_jwtSecret);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, payload.Subject),
                    new Claim(ClaimTypes.Name, payload.Name ?? ""),
                    new Claim(ClaimTypes.Email, payload.Email ?? "")
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var jwt = tokenHandler.WriteToken(token);

            // 4. Send back to frontend
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
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
}

public class TokenRequest
{
    public string Token { get; set; }
}
