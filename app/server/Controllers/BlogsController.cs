using System.Security.Claims;
using ApexBlog.Api.Contracts;
using ApexBlog.Api.Data;
using ApexBlog.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApexBlog.Api.Controllers;

[ApiController]
[Route("api/blogs")]
public sealed class BlogsController(AppDbContext dbContext) : ControllerBase
{
    private static readonly string[] AllowedEmojis = ["👍", "❤️", "😂", "🎉", "🔥", "👏"];

    [HttpGet]
    public async Task<ActionResult<object>> GetBlogs([FromQuery] int limit = 20)
    {
        var safeLimit = Math.Clamp(limit, 1, 50);

        var blogs = await dbContext.Blogs
            .AsNoTracking()
            .Where(x => !x.Draft)
            .OrderByDescending(x => x.PublishedAt)
            .Take(safeLimit)
            .Select(x => new BlogCardDto(
                x.BlogId,
                x.Title,
                x.Description,
                SplitTags(x.TagsCsv),
                x.Author.FullName,
                x.Author.Username,
                x.Author.ProfileImage,
                x.PublishedAt,
                x.TotalComments,
                x.TotalReactions,
                x.TotalReads
            ))
            .ToListAsync();

        return Ok(new { blogs });
    }

    [HttpGet("{blogId}")]
    public async Task<ActionResult<object>> GetBlog(string blogId)
    {
        var blog = await dbContext.Blogs
            .AsNoTracking()
            .Include(x => x.Author)
            .FirstOrDefaultAsync(x => x.BlogId == blogId && !x.Draft);

        if (blog is null)
        {
            return NotFound(new { error = "Blog not found" });
        }

        await dbContext.Blogs
            .Where(x => x.Id == blog.Id)
            .ExecuteUpdateAsync(updates => updates.SetProperty(x => x.TotalReads, x => x.TotalReads + 1));

        var tags = SplitTags(blog.TagsCsv);
        var similarBlogs = await dbContext.Blogs
            .AsNoTracking()
            .Where(x => !x.Draft && x.Id != blog.Id)
            .OrderByDescending(x => x.PublishedAt)
            .Select(x => new
            {
                x.BlogId,
                x.Title,
                x.Description,
                x.TagsCsv,
                x.PublishedAt
            })
            .ToListAsync();

        var filteredSimilar = similarBlogs
            .Where(x => SplitTags(x.TagsCsv).Intersect(tags).Any())
            .Take(6)
            .Select(x => new
            {
                x.BlogId,
                x.Title,
                x.Description,
                tags = SplitTags(x.TagsCsv),
                x.PublishedAt
            })
            .ToList();

        return Ok(new
        {
            blog = new
            {
                blog.BlogId,
                blog.Title,
                description = blog.Description,
                content = blog.Content,
                banner = blog.Banner,
                tags,
                blog.PublishedAt,
                blog.TotalComments,
                blog.TotalReactions,
                reads = blog.TotalReads + 1,
                author = new
                {
                    blog.Author.FullName,
                    blog.Author.Username,
                    blog.Author.ProfileImage
                }
            },
            similarBlogs = filteredSimilar
        });
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<object>> Create([FromBody] CreateBlogRequest request)
    {
        var user = await ResolveUser();
        if (user is null) return Unauthorized(new { error = "Unauthorized" });
        if (!user.IsAdmin) return Forbid();

        if (!request.Draft &&
            (string.IsNullOrWhiteSpace(request.Title) ||
             string.IsNullOrWhiteSpace(request.Description) ||
             string.IsNullOrWhiteSpace(request.Content)))
        {
            return BadRequest(new { error = "Title, description and content are required" });
        }

        var tags = NormalizeTags(request.Tags);
        var slugBase = string.Join('-', request.Title
            .ToLowerInvariant()
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(OnlySlugChars)
            .Where(x => x.Length > 0));
        if (string.IsNullOrWhiteSpace(slugBase)) slugBase = "untitled";

        var blog = new BlogPost
        {
            Id = Guid.NewGuid(),
            BlogId = $"{slugBase}-{Guid.NewGuid().ToString("N")[..6]}",
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Content = request.Content,
            Banner = request.Banner?.Trim() ?? string.Empty,
            TagsCsv = string.Join(',', tags),
            Draft = request.Draft,
            AuthorId = user.Id,
            PublishedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        dbContext.Blogs.Add(blog);
        await dbContext.SaveChangesAsync();

        return Created($"/api/blogs/{blog.BlogId}", new { blog.BlogId });
    }

    [Authorize]
    [HttpPut("{blogId}")]
    public async Task<ActionResult<object>> Update(string blogId, [FromBody] UpdateBlogRequest request)
    {
        var user = await ResolveUser();
        if (user is null) return Unauthorized(new { error = "Unauthorized" });
        if (!user.IsAdmin) return Forbid();

        var blog = await dbContext.Blogs.FirstOrDefaultAsync(x => x.BlogId == blogId);
        if (blog is null) return NotFound(new { error = "Blog not found" });

        blog.Title = request.Title.Trim();
        blog.Description = request.Description.Trim();
        blog.Content = request.Content;
        blog.Banner = request.Banner?.Trim() ?? string.Empty;
        blog.TagsCsv = string.Join(',', NormalizeTags(request.Tags));
        blog.Draft = request.Draft;
        blog.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();
        return Ok(new { message = "Blog updated" });
    }

    [Authorize]
    [HttpDelete("{blogId}")]
    public async Task<ActionResult<object>> Delete(string blogId)
    {
        var user = await ResolveUser();
        if (user is null) return Unauthorized(new { error = "Unauthorized" });
        if (!user.IsAdmin) return Forbid();

        var blog = await dbContext.Blogs.FirstOrDefaultAsync(x => x.BlogId == blogId);
        if (blog is null) return NotFound(new { error = "Blog not found" });

        dbContext.Blogs.Remove(blog);
        await dbContext.SaveChangesAsync();
        return Ok(new { message = "Blog deleted" });
    }

    [HttpGet("{blogId}/comments")]
    public async Task<ActionResult<object>> GetComments(string blogId)
    {
        var blog = await dbContext.Blogs.FirstOrDefaultAsync(x => x.BlogId == blogId);
        if (blog is null) return NotFound(new { error = "Blog not found" });

        var comments = await dbContext.Comments
            .AsNoTracking()
            .Where(x => x.BlogPostId == blog.Id)
            .OrderByDescending(x => x.CommentedAt)
            .Select(x => new
            {
                x.Id,
                comment = x.Content,
                x.CommentedAt,
                user = new
                {
                    x.User.FullName,
                    x.User.Username,
                    x.User.ProfileImage
                }
            })
            .ToListAsync();

        return Ok(new { comments });
    }

    [Authorize]
    [HttpPost("{blogId}/comments")]
    public async Task<ActionResult<object>> AddComment(string blogId, [FromBody] CommentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Comment))
        {
            return BadRequest(new { error = "Comment is required" });
        }

        var user = await ResolveUser();
        if (user is null) return Unauthorized(new { error = "Unauthorized" });

        var blog = await dbContext.Blogs.FirstOrDefaultAsync(x => x.BlogId == blogId);
        if (blog is null) return NotFound(new { error = "Blog not found" });

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            BlogPostId = blog.Id,
            UserId = user.Id,
            Content = request.Comment.Trim(),
            CommentedAt = DateTime.UtcNow
        };

        dbContext.Comments.Add(comment);
        blog.TotalComments += 1;
        await dbContext.SaveChangesAsync();

        return Ok(new { message = "Comment added" });
    }

    [AllowAnonymous]
    [HttpGet("{blogId}/reactions")]
    public async Task<ActionResult<object>> GetReactions(string blogId)
    {
        var blog = await dbContext.Blogs.FirstOrDefaultAsync(x => x.BlogId == blogId);
        if (blog is null) return NotFound(new { error = "Blog not found" });

        var grouped = await dbContext.Reactions
            .Where(x => x.BlogPostId == blog.Id)
            .GroupBy(x => x.Emoji)
            .Select(group => new { Emoji = group.Key, Count = group.Count() })
            .ToListAsync();

        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var currentUserId);
        var userEmojis = currentUserId == Guid.Empty
            ? new List<string>()
            : await dbContext.Reactions
                .Where(x => x.BlogPostId == blog.Id && x.UserId == currentUserId)
                .Select(x => x.Emoji)
                .ToListAsync();

        var counts = grouped.ToDictionary(x => x.Emoji, x => x.Count);
        return Ok(new { counts, userEmojis });
    }

    [Authorize]
    [HttpPost("{blogId}/reactions")]
    public async Task<ActionResult<object>> ToggleReaction(string blogId, [FromBody] ReactionRequest request)
    {
        if (!AllowedEmojis.Contains(request.Emoji))
        {
            return BadRequest(new { error = "Unsupported emoji" });
        }

        var user = await ResolveUser();
        if (user is null) return Unauthorized(new { error = "Unauthorized" });

        var blog = await dbContext.Blogs.FirstOrDefaultAsync(x => x.BlogId == blogId);
        if (blog is null) return NotFound(new { error = "Blog not found" });

        var existing = await dbContext.Reactions
            .FirstOrDefaultAsync(x => x.BlogPostId == blog.Id && x.UserId == user.Id && x.Emoji == request.Emoji);

        if (existing is null)
        {
            dbContext.Reactions.Add(new Reaction
            {
                Id = Guid.NewGuid(),
                BlogPostId = blog.Id,
                UserId = user.Id,
                Emoji = request.Emoji,
                CreatedAt = DateTime.UtcNow
            });
            blog.TotalReactions += 1;
        }
        else
        {
            dbContext.Reactions.Remove(existing);
            blog.TotalReactions = Math.Max(blog.TotalReactions - 1, 0);
        }

        await dbContext.SaveChangesAsync();

        var grouped = await dbContext.Reactions
            .Where(x => x.BlogPostId == blog.Id)
            .GroupBy(x => x.Emoji)
            .Select(group => new { Emoji = group.Key, Count = group.Count() })
            .ToListAsync();

        return Ok(new { counts = grouped.ToDictionary(x => x.Emoji, x => x.Count), totalReactions = blog.TotalReactions });
    }

    private async Task<User?> ResolveUser()
    {
        var userIdText = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdText, out var userId))
        {
            return null;
        }

        return await dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId);
    }

    private static string[] NormalizeTags(string[] tags)
    {
        return tags
            .Select(x => x.Trim().ToLowerInvariant())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct()
            .Take(8)
            .ToArray();
    }

    private static string[] SplitTags(string tagsCsv)
    {
        if (string.IsNullOrWhiteSpace(tagsCsv)) return [];
        return tagsCsv
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(x => x.Trim())
            .Where(x => x.Length > 0)
            .ToArray();
    }

    private static string OnlySlugChars(string value)
    {
        var chars = value.Where(char.IsLetterOrDigit).ToArray();
        return new string(chars);
    }
}
