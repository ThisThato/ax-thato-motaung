using System.Text.Json;
using ApexBlog.Api.Contracts;
using ApexBlog.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ApexBlog.Api.Data;

public static class AppDbSeeder
{
    public static async Task SeedAsync(AppDbContext dbContext)
    {
        if (await dbContext.Blogs.AnyAsync())
        {
            return;
        }

        var owner = await GetOrCreateUser(
            dbContext,
            email: "apex-owner@apex.local",
            username: "apex-owner",
            fullName: "Apex Admin",
            isAdmin: true,
            seed: "apex-owner"
        );

        var thabo = await GetOrCreateUser(
            dbContext,
            email: "thabo@apex.local",
            username: "thabo",
            fullName: "Thabo M",
            isAdmin: false,
            seed: "thabo"
        );

        var neo = await GetOrCreateUser(
            dbContext,
            email: "neo@apex.local",
            username: "neo",
            fullName: "Neo K",
            isAdmin: false,
            seed: "neo"
        );

        var lele = await GetOrCreateUser(
            dbContext,
            email: "lele@apex.local",
            username: "lele",
            fullName: "Lele M",
            isAdmin: false,
            seed: "lele"
        );

        var now = DateTime.UtcNow;

        var blog1 = new BlogPost
        {
            Id = Guid.NewGuid(),
            BlogId = "solid-principles-csharp-101",
            Title = "SOLID Principles in C# with Practical Examples",
            Description = "A practical walk-through of SOLID principles using small C# code examples you can apply in real projects.",
            Content = "SOLID is a set of design principles that helps make software easier to maintain and evolve.\n\n- Single Responsibility Principle\n- Open/Closed Principle\n- Liskov Substitution Principle\n- Interface Segregation Principle\n- Dependency Inversion Principle\n\nIn C#, these principles usually become visible in how we shape interfaces, services, and dependency injection boundaries.",
            ContentBlocksJson = SerializeBlocks(
            [
                Paragraph("SOLID is a set of design principles that helps make software easier to maintain and evolve."),
                Image("https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80", "SOLID code architecture"),
                Paragraph("- Single Responsibility Principle\n- Open/Closed Principle\n- Liskov Substitution Principle\n- Interface Segregation Principle\n- Dependency Inversion Principle"),
                Image("https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1400&q=80", "C# development"),
                Paragraph("In C#, these principles usually become visible in how we shape interfaces, services, and dependency injection boundaries."),
                Code("csharp", "public interface INotifier\n{\n    Task SendAsync(string message);\n}\n\npublic sealed class OrderService\n{\n    private readonly INotifier _notifier;\n\n    public OrderService(INotifier notifier)\n    {\n        _notifier = notifier;\n    }\n}")
            ]),
            Banner = "",
            TagsCsv = "c#,architecture,backend",
            Draft = false,
            TotalReads = 94,
            TotalComments = 2,
            TotalReactions = 12,
            AuthorId = owner.Id,
            PublishedAt = now.AddDays(-1),
            UpdatedAt = now.AddDays(-1)
        };

        var blog2 = new BlogPost
        {
            Id = Guid.NewGuid(),
            BlogId = "cloud-deployment-azure-dotnet",
            Title = "Deploying .NET APIs to the Cloud: Practical Checklist",
            Description = "A concise deployment checklist for shipping reliable .NET APIs in cloud environments.",
            Content = "Cloud deployment succeeds when you design for observability, failure, and repeatability.\n\nStart with health checks, centralized logs, config separation, and CI/CD pipelines.\n\nThen validate scaling and graceful shutdown behavior before production rollout.",
            ContentBlocksJson = SerializeBlocks(
            [
                Paragraph("Cloud deployment succeeds when you design for observability, failure, and repeatability."),
                Image("https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=80", "Cloud deployment"),
                Paragraph("Start with health checks, centralized logs, config separation, and CI/CD pipelines."),
                Paragraph("Then validate scaling and graceful shutdown behavior before production rollout."),
                Code("yaml", "healthChecks:\n  - path: /health\n    intervalSeconds: 30\n\nresources:\n  requests:\n    cpu: \"250m\"\n    memory: \"256Mi\"")
            ]),
            Banner = "",
            TagsCsv = "cloud,devops,c#",
            Draft = false,
            TotalReads = 76,
            TotalComments = 1,
            TotalReactions = 8,
            AuthorId = owner.Id,
            PublishedAt = now.AddDays(-3),
            UpdatedAt = now.AddDays(-3)
        };

        var blog3 = new BlogPost
        {
            Id = Guid.NewGuid(),
            BlogId = "frontend-performance-react-patterns",
            Title = "React Performance Patterns That Actually Matter",
            Description = "Focus on measurable React optimizations: rendering boundaries, memoization, and payload control.",
            Content = "Optimize where users feel latency first: route transitions, large lists, and expensive client transforms.\n\nMeasure before and after each change using browser profiling.",
            ContentBlocksJson = SerializeBlocks(
            [
                Paragraph("Optimize where users feel latency first: route transitions, large lists, and expensive client transforms."),
                Image("https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80", "React performance"),
                Paragraph("Measure before and after each change using browser profiling."),
                Code("tsx", "const Chart = React.memo(function Chart({ points }: { points: number[] }) {\n  return <canvas data-points={points.length} />;\n});")
            ]),
            Banner = "",
            TagsCsv = "react,frontend,performance",
            Draft = false,
            TotalReads = 58,
            TotalComments = 0,
            TotalReactions = 5,
            AuthorId = owner.Id,
            PublishedAt = now.AddDays(-5),
            UpdatedAt = now.AddDays(-5)
        };

        dbContext.Blogs.AddRange(blog1, blog2, blog3);

        dbContext.Comments.AddRange(
            new Comment
            {
                Id = Guid.NewGuid(),
                BlogPostId = blog1.Id,
                UserId = thabo.Id,
                Content = "Great explanation of DIP.",
                CommentedAt = now.AddHours(-18)
            },
            new Comment
            {
                Id = Guid.NewGuid(),
                BlogPostId = blog1.Id,
                UserId = neo.Id,
                Content = "Would love a follow-up on clean architecture.",
                CommentedAt = now.AddHours(-12)
            },
            new Comment
            {
                Id = Guid.NewGuid(),
                BlogPostId = blog2.Id,
                UserId = lele.Id,
                Content = "This helped us fix readiness probes.",
                CommentedAt = now.AddHours(-8)
            }
        );

        await dbContext.SaveChangesAsync();
    }

    private static async Task<User> GetOrCreateUser(
        AppDbContext dbContext,
        string email,
        string username,
        string fullName,
        bool isAdmin,
        string seed)
    {
        var existing = await dbContext.Users.FirstOrDefaultAsync(x => x.Email == email);
        if (existing is not null)
        {
            return existing;
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            Username = username,
            FullName = fullName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("ChangeMe123!"),
            ProfileImage = $"https://api.dicebear.com/6.x/notionists-neutral/svg?seed={Uri.EscapeDataString(seed)}",
            IsAdmin = isAdmin,
            JoinedAt = DateTime.UtcNow
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();
        return user;
    }

    private static string SerializeBlocks(IEnumerable<ContentBlockDto> blocks)
    {
        return JsonSerializer.Serialize(blocks.ToArray());
    }

    private static ContentBlockDto Paragraph(string text)
    {
        return new ContentBlockDto(Guid.NewGuid().ToString("N"), "paragraph", text, null, null, null, null);
    }

    private static ContentBlockDto Image(string src, string alt)
    {
        return new ContentBlockDto(Guid.NewGuid().ToString("N"), "image", null, src, alt, null, null);
    }

    private static ContentBlockDto Code(string language, string code)
    {
        return new ContentBlockDto(Guid.NewGuid().ToString("N"), "code", null, null, null, language, code);
    }
}
