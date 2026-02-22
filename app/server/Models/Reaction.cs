namespace ApexBlog.Api.Models;

public sealed class Reaction
{
    public Guid Id { get; set; }
    public Guid BlogPostId { get; set; }
    public BlogPost BlogPost { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string Emoji { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
