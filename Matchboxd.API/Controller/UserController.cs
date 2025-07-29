using Matchboxd.API.DAL;
using Matchboxd.API.Dtos;
using Matchboxd.API.Models;
using Matchboxd.API.Services;

namespace Matchboxd.API.Controller;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

[ApiController]
[Route("api/users")]
[Authorize]  
public class UserController : ControllerBase
{
    private readonly AppDbContext _context;

    public UserController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("me/reviews")]
    public async Task<IActionResult> GetUserReviews()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized("User not found in token");

        int userId = int.Parse(userIdClaim.Value);

        // Maçlarla birlikte yorum ve puanları da çek
        var matches = await _context.Matches
            .Include(m => m.Comments)
            .Include(m => m.Ratings)
            .Where(m => m.Comments.Any(c => c.UserId == userId) || m.Ratings.Any(r => r.UserId == userId))
            .ToListAsync(); // <--- burada SQL biter, artık C# tarafındayız

        var result = new List<ReviewDto>();

        foreach (var match in matches)
        {
            var userComment = match.Comments.FirstOrDefault(c => c.UserId == userId);
            var userRating = match.Ratings.FirstOrDefault(r => r.UserId == userId);

            result.Add(new ReviewDto
            {
                MatchId = match.Id,
                HomeTeam = match.HomeTeam,
                AwayTeam = match.AwayTeam,
                Score = userRating?.Score,
                Comment = userComment?.Content,
                ReviewedAt = userComment?.CreatedAt ?? userRating?.CreatedAt
            });
        }

        return Ok(result);
    }
    
    [HttpGet("me/favorites")]
    public async Task<IActionResult> GetUserFavorites()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized("User not found in token");

        int userId = int.Parse(userIdClaim.Value);

        var favorites = await _context.Favorites
            .Where(f => f.UserId == userId)
            .Include(f => f.Match)
            .Select(f => new FavoriteMatchDto
            {
                MatchId = f.MatchId,
                HomeTeam = f.Match.HomeTeam,
                AwayTeam = f.Match.AwayTeam,
                MatchDate = f.Match.MatchDate,
                Status = f.Match.Status,
            })
            .ToListAsync();

        return Ok(favorites);
    }
    
    [HttpGet("me/favorites/{matchId}")]
    [Authorize]
    public async Task<IActionResult> IsFavorite(int matchId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized("User not found in token");

        int userId = int.Parse(userIdClaim.Value);

        var exists = await _context.Favorites.AnyAsync(f => f.UserId == userId && f.MatchId == matchId);

        return Ok(new { hasFavorited = exists });
    }

    
    [HttpPost("me/favorite/toggle")]
    [Authorize]
    public async Task<IActionResult> ToggleFavorite([FromBody] ToggleFavoriteDto dto)
    {
        int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);

        var match = await _context.Matches.FindAsync(dto.MatchId);
        if (match == null)
            return NotFound("Match not found");

        var fav = await _context.Favorites
            .FirstOrDefaultAsync(f => f.UserId == userId && f.MatchId == dto.MatchId);

        if (fav != null)
        {
            _context.Favorites.Remove(fav);
            await _context.SaveChangesAsync();
            return Ok("Removed from favorites");
        }

        _context.Favorites.Add(new Favorite
        {
            MatchId = dto.MatchId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok("Added to favorites");
    }

    
    [HttpGet("me/diary")]
    public async Task<IActionResult> GetUserDiary()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized("User not found in token");

        int userId = int.Parse(userIdClaim.Value);

        var watchedMatches = await _context.WatchedMatches
            .Where(w => w.UserId == userId)
            .Include(w => w.Match)
            .ToListAsync();

        var matchIds = watchedMatches.Select(w => w.MatchId).ToList();

        var ratings = await _context.Ratings
            .Where(r => matchIds.Contains(r.MatchId) && r.UserId == userId)
            .ToListAsync();

        var comments = await _context.Comments
            .Where(c => matchIds.Contains(c.MatchId) && c.UserId == userId)
            .ToListAsync();

        var favorites = await _context.Favorites
            .Where(f => matchIds.Contains(f.MatchId) && f.UserId == userId)
            .ToListAsync();

        var diaryEntries = watchedMatches
            .Select(w => {
                var rating = ratings.FirstOrDefault(r => r.MatchId == w.MatchId);
                var comment = comments.FirstOrDefault(c => c.MatchId == w.MatchId);
                var isFavorite = favorites.Any(f => f.MatchId == w.MatchId);

                return new DiaryEntryDto
                {
                    MatchId = w.MatchId,
                    HomeTeam = w.Match.HomeTeam,
                    AwayTeam = w.Match.AwayTeam,
                    MatchDate = w.Match.MatchDate,
                    Score = rating?.Score,
                    Comment = comment?.Content,
                    Favorite = isFavorite,
                    WatchedAt = w.WatchedAt
                };
            })
            .OrderByDescending(d => d.WatchedAt)
            .ToList();

        return Ok(diaryEntries);
    }

    [HttpGet("me/matches/{matchId}/watched")]
    public async Task<IActionResult> HasWatchedMatch(int matchId)
    {
        var userId = await FindUserService.GetCurrentUserIdAsync(User, _context);
        var hasWatched = await _context.WatchedMatches
            .AnyAsync(w => w.UserId == userId && w.MatchId == matchId);

        return Ok(new { hasWatched });
    }

}
