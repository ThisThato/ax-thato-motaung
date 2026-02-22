namespace ApexBlog.Api.Models;

public sealed class BlogPost
{
    public Guid Id { get; set; }
    public string BlogId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Content { get; set; } = "[]";
    public string ContentBlocksJson { get; set; } = "[]";
    public string Banner { get; set; } = string.Empty;
    public string TagsCsv { get; set; } = string.Empty;
    public bool Draft { get; set; }

    public int TotalReads { get; set; }
    public int TotalComments { get; set; }
    public int TotalReactions { get; set; }

    public Guid AuthorId { get; set; }
    public User Author { get; set; } = null!;

    public DateTime PublishedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Reaction> Reactions { get; set; } = new List<Reaction>();
}
