namespace ApexBlog.Api.Contracts;

public sealed record CreateBlogRequest(
    string Title,
    string Description,
    string Content,
    string[] Tags,
    string? Banner,
    bool Draft
);

public sealed record UpdateBlogRequest(
    string Title,
    string Description,
    string Content,
    string[] Tags,
    string? Banner,
    bool Draft
);

public sealed record BlogCardDto(
    string BlogId,
    string Title,
    string Description,
    string[] Tags,
    string AuthorName,
    string AuthorUsername,
    string AuthorImage,
    DateTime PublishedAt,
    int TotalComments,
    int TotalReactions,
    int TotalReads
);

public sealed record CommentRequest(string Comment);
public sealed record ReactionRequest(string Emoji);
