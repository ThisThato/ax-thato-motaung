using System.Text.Json;
using ApexBlog.Api.Contracts;
using ApexBlog.Api.Models;

namespace ApexBlog.Api.Services;

public sealed class BlogLogicService
{
    public bool CanMutateBlog(User user, BlogPost blog)
    {
        return user.IsAdmin && blog.AuthorId == user.Id;
    }

    public bool HasBlockContent(ContentBlockDto[]? blocks)
    {
        if (blocks is null || blocks.Length == 0)
        {
            return false;
        }

        return blocks.Any(block =>
            (block.Type.Equals("paragraph", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(block.Text))
            || (block.Type.Equals("image", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(block.Src))
            || (block.Type.Equals("code", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(block.Code))
        );
    }

    public string SerializeContentBlocks(ContentBlockDto[]? blocks, string fallbackContent)
    {
        var normalized = (blocks ?? [])
            .Where(block =>
                (block.Type.Equals("paragraph", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(block.Text))
                || (block.Type.Equals("image", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(block.Src))
                || (block.Type.Equals("code", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(block.Code))
            )
            .Select(block => new ContentBlockDto(
                string.IsNullOrWhiteSpace(block.Id) ? Guid.NewGuid().ToString("N") : block.Id,
                block.Type.Trim().ToLowerInvariant(),
                block.Text,
                block.Src,
                block.Alt,
                block.Language,
                block.Code
            ))
            .ToArray();

        if (normalized.Length == 0 && !string.IsNullOrWhiteSpace(fallbackContent))
        {
            normalized =
            [
                new ContentBlockDto(
                    Guid.NewGuid().ToString("N"),
                    "paragraph",
                    fallbackContent,
                    null,
                    null,
                    null,
                    null
                )
            ];
        }

        return JsonSerializer.Serialize(normalized);
    }

    public ContentBlockDto[] DeserializeContentBlocks(string? json, string fallbackContent)
    {
        if (!string.IsNullOrWhiteSpace(json))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<ContentBlockDto[]>(json);
                if (parsed is { Length: > 0 })
                {
                    return parsed;
                }
            }
            catch
            {
            }
        }

        if (!string.IsNullOrWhiteSpace(fallbackContent))
        {
            return
            [
                new ContentBlockDto(
                    Guid.NewGuid().ToString("N"),
                    "paragraph",
                    fallbackContent,
                    null,
                    null,
                    null,
                    null
                )
            ];
        }

        return [];
    }

    public string[] NormalizeTags(string[] tags)
    {
        return tags
            .Select(x => x.Trim().ToLowerInvariant())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct()
            .Take(8)
            .ToArray();
    }

    public string[] SplitTags(string tagsCsv)
    {
        if (string.IsNullOrWhiteSpace(tagsCsv)) return [];
        return tagsCsv
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(x => x.Trim())
            .Where(x => x.Length > 0)
            .ToArray();
    }

    public string BuildSlugBase(string title)
    {
        var slugBase = string.Join('-', title
            .ToLowerInvariant()
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(OnlySlugChars)
            .Where(x => x.Length > 0));

        return string.IsNullOrWhiteSpace(slugBase) ? "untitled" : slugBase;
    }

    private static string OnlySlugChars(string value)
    {
        var chars = value.Where(char.IsLetterOrDigit).ToArray();
        return new string(chars);
    }
}
