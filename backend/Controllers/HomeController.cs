﻿// using Microsoft.AspNetCore.Mvc;

// namespace TaskApi.Controllers
// {
//     [ApiController]
//     [Route("home")]
//     public class HomeController : ControllerBase
//     {
//         [HttpGet("getHealth")]
//         public IActionResult GetHealth()
//         {
//             return Ok("API is healthy ✅");
//         }
//     }
// }

using Microsoft.AspNetCore.Mvc;

namespace personal_task_tracker_backend.Controllers
{
    [ApiController]
    [Route("/")]
    public class HomeController : ControllerBase
    {
        [HttpGet]
        public string Index()
        {
            return "Welcome to the Personal Task Tracker API!";
        }
    }
}
