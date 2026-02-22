namespace ApexBlog.Api.Models;

public sealed class Comment
{
    public Guid Id { get; set; }
    public Guid BlogPostId { get; set; }
    public BlogPost BlogPost { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string Content { get; set; } = string.Empty;
    public DateTime CommentedAt { get; set; } = DateTime.UtcNow;
}
