using System.Security.Claims;
using ApexBlog.Api.Contracts;
using ApexBlog.Api.Data;
using ApexBlog.Api.Models;
using ApexBlog.Api.Services;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApexBlog.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(AppDbContext dbContext, JwtService jwtService, IConfiguration configuration) : ControllerBase
{
    [HttpPost("signup")]
    public async Task<ActionResult<AuthResponse>> SignUp([FromBody] SignUpRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) || request.FullName.Trim().Length < 3)
        {
            return BadRequest(new { error = "Full name must be at least 3 characters" });
        }

        if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))
        {
            return BadRequest(new { error = "Valid email is required" });
        }

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
        {
            return BadRequest(new { error = "Password must be at least 6 characters" });
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var existing = await dbContext.Users.AnyAsync(x => x.Email == email);
        if (existing)
        {
            return Conflict(new { error = "Email already in use" });
        }

        var ownerEmail = configuration["OwnerEmail"]?.Trim().ToLowerInvariant();
        var adminExists = await dbContext.Users.AnyAsync(x => x.IsAdmin);
        var isAdmin = !string.IsNullOrWhiteSpace(ownerEmail)
            ? email == ownerEmail
            : !adminExists;

        var usernameSeed = new string(email.Split('@')[0].Where(char.IsLetterOrDigit).ToArray());
        var username = $"{(string.IsNullOrWhiteSpace(usernameSeed) ? "user" : usernameSeed)}-{Guid.NewGuid().ToString("N")[..6]}";

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName.Trim(),
            Email = email,
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            IsAdmin = isAdmin,
            ProfileImage = $"https://api.dicebear.com/6.x/notionists-neutral/svg?seed={Uri.EscapeDataString(username)}"
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();

        return Ok(BuildAuthResponse(user));
    }

    [HttpPost("signin")]
    public async Task<ActionResult<AuthResponse>> SignIn([FromBody] SignInRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { error = "Email and password are required" });
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Email == email);
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { error = "Invalid credentials" });
        }

        return Ok(BuildAuthResponse(user));
    }

    [HttpPost("google")]
    public async Task<ActionResult<AuthResponse>> GoogleSignIn([FromBody] GoogleSignInRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.IdToken))
        {
            return BadRequest(new { error = "Google token is required" });
        }

        var audiences = configuration.GetSection("GoogleAuth:AllowedClientIds").Get<string[]>()
            ?.Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .ToArray() ?? [];

        if (audiences.Length == 0)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "Google sign-in is not configured" });
        }

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = audiences
            });
        }
        catch (InvalidJwtException)
        {
            return Unauthorized(new { error = "Invalid Google token" });
        }

        if (string.IsNullOrWhiteSpace(payload.Email))
        {
            return Unauthorized(new { error = "Google account email is missing" });
        }

        var email = payload.Email.Trim().ToLowerInvariant();
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Email == email);

        if (user is null)
        {
            var ownerEmail = configuration["OwnerEmail"]?.Trim().ToLowerInvariant();
            var adminExists = await dbContext.Users.AnyAsync(x => x.IsAdmin);
            var isAdmin = !string.IsNullOrWhiteSpace(ownerEmail)
                ? email == ownerEmail
                : !adminExists;

            var fullName = string.IsNullOrWhiteSpace(payload.Name)
                ? email.Split('@')[0]
                : payload.Name.Trim();

            user = new User
            {
                Id = Guid.NewGuid(),
                FullName = fullName,
                Email = email,
                Username = await GenerateUniqueUsernameAsync(email),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N")),
                IsAdmin = isAdmin,
                ProfileImage = string.IsNullOrWhiteSpace(payload.Picture)
                    ? $"https://api.dicebear.com/6.x/notionists-neutral/svg?seed={Uri.EscapeDataString(fullName)}"
                    : payload.Picture
            };

            dbContext.Users.Add(user);
            await dbContext.SaveChangesAsync();
        }

        return Ok(BuildAuthResponse(user));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<object>> Me()
    {
        var userIdText = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdText, out var userId))
        {
            return Unauthorized(new { error = "Invalid token" });
        }

        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId);
        if (user is null)
        {
            return Unauthorized(new { error = "User not found" });
        }

        return Ok(new { user = ToUserDto(user) });
    }

    private AuthResponse BuildAuthResponse(User user)
    {
        var token = jwtService.CreateToken(user);
        return new AuthResponse(token, ToUserDto(user));
    }

    private async Task<string> GenerateUniqueUsernameAsync(string email)
    {
        var seed = new string(email.Split('@')[0].Where(char.IsLetterOrDigit).ToArray());
        var baseUsername = string.IsNullOrWhiteSpace(seed) ? "user" : seed;
        var username = baseUsername;
        var attempt = 0;

        while (await dbContext.Users.AnyAsync(x => x.Username == username))
        {
            attempt++;
            username = $"{baseUsername}-{attempt:D2}";
        }

        return username;
    }

    private static UserDto ToUserDto(User user)
    {
        return new UserDto(user.Id, user.FullName, user.Username, user.Email, user.IsAdmin, user.ProfileImage);
    }
}
