namespace ApexBlog.Api.Contracts;

public sealed record ContentBlockDto(
    string Id,
    string Type,
    string? Text,
    string? Src,
    string? Alt,
    string? Language,
    string? Code
);

public sealed record CreateBlogRequest(
    string Title,
    string Description,
    string Content,
    ContentBlockDto[]? ContentBlocks,
    string[] Tags,
    string? Banner,
    bool Draft
);

public sealed record UpdateBlogRequest(
    string Title,
    string Description,
    string Content,
    ContentBlockDto[]? ContentBlocks,
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
