using ApexBlog.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ApexBlog.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<BlogPost> Blogs => Set<BlogPost>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Reaction> Reactions => Set<Reaction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.Email).IsUnique();
            entity.HasIndex(x => x.Username).IsUnique();
            entity.Property(x => x.Email).HasMaxLength(180);
            entity.Property(x => x.Username).HasMaxLength(80);
            entity.Property(x => x.FullName).HasMaxLength(160);
        });

        modelBuilder.Entity<BlogPost>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.BlogId).IsUnique();
            entity.Property(x => x.BlogId).HasMaxLength(180);
            entity.Property(x => x.Title).HasMaxLength(240);
            entity.Property(x => x.Description).HasMaxLength(400);
            entity.Property(x => x.TagsCsv).HasMaxLength(1000);
            entity.HasOne(x => x.Author)
                .WithMany(x => x.Blogs)
                .HasForeignKey(x => x.AuthorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Comment>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Content).HasMaxLength(1000);
            entity.HasOne(x => x.BlogPost)
                .WithMany(x => x.Comments)
                .HasForeignKey(x => x.BlogPostId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.User)
                .WithMany(x => x.Comments)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Reaction>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Emoji).HasMaxLength(8);
            entity.HasIndex(x => new { x.BlogPostId, x.UserId, x.Emoji }).IsUnique();
            entity.HasOne(x => x.BlogPost)
                .WithMany(x => x.Reactions)
                .HasForeignKey(x => x.BlogPostId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.User)
                .WithMany(x => x.Reactions)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
