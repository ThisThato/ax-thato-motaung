namespace ApexBlog.Api.Contracts;

public sealed record AuthResponse(string Token, UserDto User);

public sealed record UserDto(
    Guid Id,
    string FullName,
    string Username,
    string Email,
    bool IsAdmin,
    string ProfileImage
);

public sealed record SignUpRequest(string FullName, string Email, string Password);
public sealed record SignInRequest(string Email, string Password);
