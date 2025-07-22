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
    private readonly PasswordHasher<User> _passwordHasher = new();
    private readonly ITokenService _tokenService;

    public AuthController(AppDbContext dbContext, ITokenService tokenService)
    {
        _context = dbContext;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    {
        // Check if username or email already exists
        if (await _context.Users.AnyAsync(u => u.Username == registerDto.Username))
            return BadRequest("Username is already taken.");

        if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email))
            return BadRequest("Email is already registered.");

        var user = new User
        {
            Username = registerDto.Username,
            Email = registerDto.Email,
            CreatedAt = DateTime.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, registerDto.Password);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok("User registered successfully.");
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        var user = await _context.Users.SingleOrDefaultAsync(u => u.Username == loginDto.Username);

        if (user == null)
            return Unauthorized("User not found.");

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, loginDto.Password);

        if (result == PasswordVerificationResult.Failed)
            return Unauthorized("Invalid password.");

        var token = _tokenService.GenerateToken(user.Username);

        return Ok(new { token });
    }
}