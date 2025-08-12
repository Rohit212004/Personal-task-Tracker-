using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("[controller]")]

public class TestController : ControllerBase

{
    private readonly IMyLogger _logger;

    public TestController(IMyLogger logger)
    {
        _logger = logger;
    }

    [HttpGet("logtest")]
    public IActionResult TestLog()
    {
        _logger.Log("Entered logging verification function", "INFO");
        _logger.Log("SUCCESS:logs written successfully", "SUCCESS!");
        return Ok("Logs written to MySQL");
    }
}
