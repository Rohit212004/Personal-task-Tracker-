using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskApi.Data;
using TaskApi.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TaskApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TasksController : ControllerBase
    {
        private readonly TaskDbContext _context;

        public TasksController(TaskDbContext context)
        {
            _context = context;
        }

        // GET: api/tasks
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaskItem>>> GetTasks()
        {
            return await _context.Tasks
                .OrderByDescending(t => t.Id) // latest first
                .ToListAsync();
        }

        // GET: api/tasks/5
        [HttpGet("{id}")]
        public async Task<ActionResult<TaskItem>> GetTask(int id)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null) return NotFound();
            return task;
        }

        // POST: api/tasks
        [HttpPost]
        public async Task<ActionResult<TaskItem>> CreateTask(TaskItem task)
        {
            // Auto-set Status to false if not provided
            if (task.Status == null)
                task.Status = false;

            // Set default priority if not provided
            if (string.IsNullOrEmpty(task.Priority))
                task.Priority = "medium";

            // Validate priority value
            var validPriorities = new[] { "low", "medium", "high", "urgent" };
            if (!validPriorities.Contains(task.Priority.ToLower()))
            {
                return BadRequest("Priority must be one of: low, medium, high, urgent");
            }

            task.Priority = task.Priority.ToLower(); // Normalize to lowercase

            // Save new task
            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTask), new { id = task.Id }, task);
        }

        // PUT: api/tasks/5
        [HttpPut("{id}")]
        public async Task<ActionResult<TaskItem>> UpdateTask(int id, TaskItem updatedTask)
        {
            if (id != updatedTask.Id) return BadRequest();

            var task = await _context.Tasks.FindAsync(id);
            if (task == null) return NotFound();

            // Validate priority value if provided
            if (!string.IsNullOrEmpty(updatedTask.Priority))
            {
                var validPriorities = new[] { "low", "medium", "high", "urgent" };
                if (!validPriorities.Contains(updatedTask.Priority.ToLower()))
                {
                    return BadRequest("Priority must be one of: low, medium, high, urgent");
                }
                task.Priority = updatedTask.Priority.ToLower(); // Normalize to lowercase
            }

            // Update fields
            task.Name = updatedTask.Name;
            task.Desc = updatedTask.Desc;
            task.DueDate = updatedTask.DueDate;
            task.Status = updatedTask.Status;

            await _context.SaveChangesAsync();
            
            // Return the updated task so frontend gets the latest data
            return Ok(task);
        }

        // DELETE: api/tasks/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null) return NotFound();

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}