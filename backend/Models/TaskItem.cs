using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaskApi.Models
{
    [Table("Tasks")]
    public class TaskItem
    {
        [Key]
        public int Id { get; set; } // Auto-increment in MySQL

        [Required]
        [MaxLength(255)]
        public string Name { get; set; } // Task title

        [Required]
        public string Desc { get; set; } // Task description

        [Required]
        public DateTime DueDate { get; set; } // Due date

        public bool Status { get; set; } = false; // Completed or not

        [Required]
        [MaxLength(10)]
        public string Priority { get; set; } = "medium"; // Priority: low, medium, high, urgent
    }
}