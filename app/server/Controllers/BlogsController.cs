using System.Security.Claims;
using ApexBlog.Api.Contracts;
using ApexBlog.Api.Data;
using ApexBlog.Api.Models;
using ApexBlog.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApexBlog.Api.Controllers;

[ApiController]
[Route("api/blogs")]
public sealed class BlogsController(AppDbContext dbContext, BlogLogicService blogLogicService) : ControllerBase
{
    private static readonly string[] AllowedEmojis = ["👍", "❤️", "😂", "🎉", "🔥", "👏"];

    [Authorize]
    [HttpGet("mine")]
    public async Task<ActionResult<object>> GetMyBlogs([FromQuery] int limit = 50)
    {
        var user = await ResolveUser();
        if (user is null) return Unauthorized(new { error = "Unauthorized" });
        if (!user.IsAdmin) return StatusCode(StatusCodes.Status403Forbidden, new { error = "Only administrators can manage blogs" });

        var safeLimit = Math.Clamp(limit, 1, 100);

        var blogs = await dbContext.Blogs
            .AsNoTracking()
            .Where(x => x.AuthorId == user.Id)
            .OrderByDescending(x => x.UpdatedAt)
            .Take(safeLimit)
            .Select(x => new BlogCardDto(
                x.BlogId,
                x.Title,
                x.Description,
                blogLogicService.SplitTags(x.TagsCsv),
                user.FullName,
                user.Username,
                user.ProfileImage,
                x.PublishedAt,
                x.TotalComments,
                x.TotalReactions,
                x.TotalReads
            ))
            .ToListAsync();

        return Ok(new { blogs });
    }

    [Authorize]
    [HttpGet("{blogId}/edit")]
    public async Task<ActionResult<object>> GetBlogForEdit(string blogId)
    {
        var user = await ResolveUser();
        if (user is null) return Unauthorized(new { error = "Unauthorized" });

        var blog = await dbContext.Blogs
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.BlogId == blogId);

        if (blog is null)
        {
            return NotFound(new { error = "Blog not found" });
        }

        if (!blogLogicService.CanMutateBlog(user, blog))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = "You can only edit your own admin articles" });
        }

        return Ok(new
        {
            blog = new
            {
                blog.BlogId,
                blog.Title,
                description = blog.Description,
                content = blog.Content,
                contentBlocks = blogLogicService.DeserializeContentBlocks(blog.ContentBlocksJson, blog.Content),
                banner = blog.Banner,
                tags = blogLogicService.SplitTags(blog.TagsCsv),
                blog.Draft,
                blog.PublishedAt,
                blog.UpdatedAt
            }
        });
    }

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
                blogLogicService.SplitTags(x.TagsCsv),
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

        var tags = blogLogicService.SplitTags(blog.TagsCsv);
        var similarBlogs = await dbContext.Blogs
            .AsNoTracking()
            .Include(x => x.Author)
            .Where(x => !x.Draft && x.Id != blog.Id)
            .OrderByDescending(x => x.PublishedAt)
            .Select(x => new
            {
                x.BlogId,
                x.Title,
                x.Description,
                x.TagsCsv,
                x.PublishedAt,
                x.TotalComments,
                x.TotalReactions,
                x.TotalReads,
                AuthorName = x.Author.FullName,
                AuthorUsername = x.Author.Username,
                AuthorImage = x.Author.ProfileImage
            })
            .ToListAsync();

        var filteredSimilar = similarBlogs
            .Where(x => blogLogicService.SplitTags(x.TagsCsv).Intersect(tags).Any())
            .Take(6)
            .Select(x => new
            {
                x.BlogId,
                x.Title,
                x.Description,
                tags = blogLogicService.SplitTags(x.TagsCsv),
                x.PublishedAt,
                x.TotalComments,
                x.TotalReactions,
                x.TotalReads,
                x.AuthorName,
                x.AuthorUsername,
                x.AuthorImage
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
                contentBlocks = blogLogicService.DeserializeContentBlocks(blog.ContentBlocksJson, blog.Content),
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
        if (!user.IsAdmin) return StatusCode(StatusCodes.Status403Forbidden, new { error = "Only administrators can create blogs" });

        if (!request.Draft &&
            (string.IsNullOrWhiteSpace(request.Title) ||
             string.IsNullOrWhiteSpace(request.Description) ||
             (!blogLogicService.HasBlockContent(request.ContentBlocks) && string.IsNullOrWhiteSpace(request.Content))))
        {
            return BadRequest(new { error = "Title, description and content are required" });
        }

        var tags = blogLogicService.NormalizeTags(request.Tags);
        var slugBase = blogLogicService.BuildSlugBase(request.Title);

        var blog = new BlogPost
        {
            Id = Guid.NewGuid(),
            BlogId = $"{slugBase}-{Guid.NewGuid().ToString("N")[..6]}",
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Content = request.Content,
            ContentBlocksJson = blogLogicService.SerializeContentBlocks(request.ContentBlocks, request.Content),
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

        var blog = await dbContext.Blogs.FirstOrDefaultAsync(x => x.BlogId == blogId);
        if (blog is null) return NotFound(new { error = "Blog not found" });
        if (!blogLogicService.CanMutateBlog(user, blog))
            return StatusCode(StatusCodes.Status403Forbidden, new { error = "You can only update your own admin articles" });

        blog.Title = request.Title.Trim();
        blog.Description = request.Description.Trim();
        blog.Content = request.Content;
        blog.ContentBlocksJson = blogLogicService.SerializeContentBlocks(request.ContentBlocks, request.Content);
        blog.Banner = request.Banner?.Trim() ?? string.Empty;
        blog.TagsCsv = string.Join(',', blogLogicService.NormalizeTags(request.Tags));
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

        var blog = await dbContext.Blogs.FirstOrDefaultAsync(x => x.BlogId == blogId);
        if (blog is null) return NotFound(new { error = "Blog not found" });
        if (!blogLogicService.CanMutateBlog(user, blog))
            return StatusCode(StatusCodes.Status403Forbidden, new { error = "You can only delete your own admin articles" });

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

}
