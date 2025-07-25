using System.Security.Claims;
using Matchboxd.API.DAL;
using Matchboxd.API.Dtos;
using Matchboxd.API.Models;
using Matchboxd.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Matchboxd.API.Controller;

[ApiController]
[Route("api/settings")]
public class SettingsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly EmailService _emailService;
    private readonly PasswordHasher<User> _passwordHasher = new();
    private readonly ITokenService _tokenService;
    private readonly ILogger<SettingsController> _logger;

    public SettingsController(AppDbContext context, ITokenService tokenService, EmailService emailService,
        ILogger<SettingsController> logger)
    {
        _context = context;
        _tokenService = tokenService;
        _emailService = emailService;
        _logger = logger;
    }

    [Authorize]
    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromForm] UpdateUserProfileDto dto)
    {
        // 1. Validate User
        var usernameClaim = User.FindFirstValue(ClaimTypes.Name) ?? 
                            User.FindFirstValue("username") ?? 
                            User.FindFirstValue("sub"); // "sub" is standard JWT for subject
        if (string.IsNullOrEmpty(usernameClaim))
            return Unauthorized("Invalid user claims");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == usernameClaim);
        if (user == null) return NotFound("User not found.");

        // 2. Update User Info (Username/Email)
        if (!string.IsNullOrWhiteSpace(dto.Username))
        {
            if (await IsUsernameTaken(dto.Username, user.Username))
                return BadRequest("Username is already taken.");
        
            user.Username = dto.Username; // Add this line to actually update the username
        }


        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            if (await IsEmailTaken(dto.Email, user.Email))
                return BadRequest("Email is already taken.");
        
            user.Email = dto.Email; // Add this line to actually update the email
            user.EmailVerified = false;
            await SendVerificationEmail(user);
        }

        // 3. Update Password (if provided)
        if (!string.IsNullOrWhiteSpace(dto.CurrentPassword)
            && !string.IsNullOrWhiteSpace(dto.NewPassword))
        {
            var passwordError = await UpdatePassword(user, dto.CurrentPassword, dto.NewPassword);
            if (passwordError != null) return BadRequest(passwordError);
        }

        // 4. Handle Profile Picture Upload
        if (dto.ProfileImage != null)
        {
            var uploadResult = await UploadProfileImage(dto.ProfileImage, user.ProfileImageUrl);
            if (!uploadResult.Success)
                return BadRequest(uploadResult.Error);

            user.ProfileImageUrl = uploadResult.FileUrl;
        }

        await _context.SaveChangesAsync();
        var newToken = _tokenService.GenerateToken(user);

        // 5. Return Response
        return Ok(new ProfileUpdateResponse
        {
            Message = "Profile updated successfully",
            Token = newToken,
            AvatarUrl = GetFullImageUrl(user.ProfileImageUrl), // Absolute URL
            Username = user.Username
        });
    }

// --- Helper Methods --- //

    private async Task<bool> IsUsernameTaken(string newUsername, string currentUsername)
        => newUsername != currentUsername
           && await _context.Users.AnyAsync(u => u.Username == newUsername);

    private async Task<bool> IsEmailTaken(string newEmail, string currentEmail)
        => newEmail != currentEmail
           && await _context.Users.AnyAsync(u => u.Email == newEmail);

    private async Task<string?> UpdatePassword(User user, string currentPassword, string newPassword)
    {
        if (newPassword.Length < 8)
            return "Password must be at least 8 characters long.";

        if (_passwordHasher.VerifyHashedPassword(user, user.PasswordHash, currentPassword)
            != PasswordVerificationResult.Success)
            return "Current password is incorrect.";

        user.PasswordHash = _passwordHasher.HashPassword(user, newPassword);
        return null;
    }

    private async Task SendVerificationEmail(User user)
    {
        var frontendBaseUrl = "http://localhost:3000";
        var verificationLink = $"{frontendBaseUrl}/verify-email?token={user.VerificationToken}";
        await _emailService.SendVerificationEmailAsync(user.Email, user.Username, verificationLink);
    }

    private async Task<(bool Success, string? FileUrl, string? Error)> UploadProfileImage(
        IFormFile file, string? existingImagePath)
    {
        // Validate file
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(extension))
            return (false, null, "Invalid file type. Only JPG/PNG/GIF allowed.");

        if (file.Length > 5 * 1024 * 1024) // 5MB
            return (false, null, "File size exceeds 5MB limit.");

        if (!string.IsNullOrEmpty(existingImagePath))
        {
            var oldPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", existingImagePath.TrimStart('/'));
            if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
        }

        // Save new image
        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads/profiles");
        if (!Directory.Exists(uploadsDir)) Directory.CreateDirectory(uploadsDir);

        var uniqueName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsDir, uniqueName);

        using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        return (true, $"/uploads/profiles/{uniqueName}", null);
    }

    private string GetFullImageUrl(string? relativePath)
        => relativePath != null
            ? $"{Request.Scheme}://{Request.Host}{relativePath}"
            : null;
}