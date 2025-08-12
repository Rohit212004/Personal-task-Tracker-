using System;
using MySql.Data.MySqlClient;
using Microsoft.Extensions.Configuration;

public interface IMyLogger
{
    void Log(string message, string level = "INFO");
}

public class MyLogger : IMyLogger
{
    private readonly string _connectionString;
    private readonly bool _isLoggingEnabled;
    private readonly bool _isAIEnhancementEnabled;

    public MyLogger(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("MySqlLogs");
        _isLoggingEnabled = configuration.GetValue<bool>("LoggingSettings:IsLoggingEnabled");
        _isAIEnhancementEnabled = configuration.GetValue<bool>("LoggingSettings:IsAIEnhancementEnabled");
    }

    public void Log(string message, string level = "INFO")
    {
        if (!_isLoggingEnabled) return;

        Console.WriteLine($"[{DateTime.UtcNow:O}] [{level}] {message}");

        SaveToDatabase(DateTime.UtcNow, level, message);

        if (_isAIEnhancementEnabled && AIEngine.IsAnomalyDetected(message))
        {
            Console.WriteLine("⚠ AI detected anomaly: " + message);
        }
    }

    private void SaveToDatabase(DateTime timestamp, string level, string message)
    {
        try
        {
            using var conn = new MySqlConnection(_connectionString);
            conn.Open();

            using var cmd = new MySqlCommand(
                "INSERT INTO Logs (Timestamp, Level, Message) VALUES (@ts, @lv, @msg)", conn);
            cmd.Parameters.AddWithValue("@ts", timestamp);
            cmd.Parameters.AddWithValue("@lv", level);
            cmd.Parameters.AddWithValue("@msg", message);
            cmd.ExecuteNonQuery();
        }
        catch (Exception ex)
        {
            Console.WriteLine("❌ Failed to save log to MySQL: " + ex.Message);
        }
    }
}

public static class AIEngine
{
    public static bool IsAnomalyDetected(string logMessage)
    {
        return logMessage.Contains("Error", StringComparison.OrdinalIgnoreCase) ||
               logMessage.Contains("Exception", StringComparison.OrdinalIgnoreCase);
    }
}