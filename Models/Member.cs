namespace personal_task_tracker_backend.Models
{
    public class Member
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string College { get; set; } = string.Empty;
    }
}
