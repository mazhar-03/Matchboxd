using Matchboxd.API.DAL;
using Matchboxd.API.Dtos;
using Matchboxd.API.Models;
using Matchboxd.API.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Matchboxd.API.Controller;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly EmailService _emailService;
    private readonly PasswordHasher<User> _passwordHasher = new();
    private readonly ITokenService _tokenService;

    public AuthController(AppDbContext context, ITokenService tokenService, EmailService emailService)
    {
        _context = context;
        _tokenService = tokenService;
        _emailService = emailService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        var user = await _context.Users
            .SingleOrDefaultAsync(u => u.Username == loginDto.Username);

        if (user == null) return Unauthorized("User not found.");
        if (!user.EmailVerified) return Unauthorized("Email not verified.");

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, loginDto.Password);
        if (result == PasswordVerificationResult.Failed) 
            return Unauthorized("Invalid password.");

        var token = _tokenService.GenerateToken(user);

        // Set HTTP-only cookie
        Response.Cookies.Append("token", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = false, // Enable in production (requires HTTPS)
            SameSite = SameSiteMode.Lax,
            Expires = DateTime.UtcNow.AddMinutes(20),
            Domain = "localhost", // Important for local development
            Path = "/", // Make available to all paths
            IsEssential = true
        });

        return Ok(new { 
            message = "Login successful", 
            token, // Still return in body for client-side use if needed
            username = user.Username,
            userPhoto = user.ProfileImageUrl
        });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        // Clear the authentication cookie
        Response.Cookies.Delete("AuthToken", new CookieOptions
        {
            HttpOnly = true,
            Secure = true, // Use in HTTPS environments
            SameSite = SameSiteMode.Strict,
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddDays(-1) // Expire immediately
        });

        return Ok(new { message = "Successfully logged out" });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            return BadRequest("Email already registered.");

        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email,
            PasswordHash = _passwordHasher.HashPassword(null!, dto.Password),
            EmailVerified = false,
            VerificationToken = TokenGenerator.GenerateVerificationToken(),
            VerificationTokenExpiry = DateTime.UtcNow.AddHours(24)
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var frontendBaseUrl = "http://localhost:3000";
        var verificationLink = $"{frontendBaseUrl}/verify-email?token={user.VerificationToken}";


        await _emailService.SendVerificationEmailAsync(user.Email, user.Username, verificationLink);

        return Ok("Registration successful! Please check your email to verify your account.");
    }

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailDto dto)
    {
        if (string.IsNullOrEmpty(dto.Token))
            return BadRequest(new { message = "Token is missing." });

        var user = await _context.Users.FirstOrDefaultAsync(u => u.VerificationToken == dto.Token);
        if (user == null)
            return BadRequest(new { message = "Invalid token." });

        if (user.VerificationTokenExpiry < DateTime.UtcNow)
            return BadRequest(new { message = "Token expired." });

        user.EmailVerified = true;
        user.VerificationToken = null;
        user.VerificationTokenExpiry = null;

        Console.WriteLine("Incoming verification token: " + dto.Token);

        await _context.SaveChangesAsync();
        return Ok(new { message = "Email verified successfully!\nYou can close this page." });
    }


    [HttpPost("resend-verification-email")]
    public async Task<IActionResult> ResendVerificationEmail([FromBody] ResendVerificationDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null)
            return NotFound("User not found.");

        if (user.EmailVerified)
            return BadRequest("Email already verified.");

        user.VerificationToken = TokenGenerator.GenerateVerificationToken();
        user.VerificationTokenExpiry = DateTime.UtcNow.AddHours(24);

        await _context.SaveChangesAsync();

        var frontendBaseUrl = "http://localhost:3000";
        var verificationLink = $"{frontendBaseUrl}/verify-email?token={user.VerificationToken}";

        await _emailService.SendVerificationEmailAsync(user.Email, user.Username, verificationLink);

        return Ok("Verification email resent.");
    }
}