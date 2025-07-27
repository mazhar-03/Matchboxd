using System.Security.Claims;
using Matchboxd.API.DAL;
using Matchboxd.API.Dtos;
using Matchboxd.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Matchboxd.API.Controller;

[ApiController]
[Route("api/matches")]
public class MatchesController : ControllerBase
{
    private readonly AppDbContext _context;

    public MatchesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllMatches()
    {
        try
        {
            var matches = await _context.Matches
                .Include(m => m.Ratings)
                .Include(m => m.Comments)
                .OrderByDescending(m => m.MatchDate)
                .ToListAsync();

            var matchIds = matches.Select(m => m.Id).ToList();

            var watchCounts = await _context.WatchedMatches
                .Where(w => matchIds.Contains(w.MatchId))
                .GroupBy(w => w.MatchId)
                .Select(g => new { MatchId = g.Key, Count = g.Select(w => w.UserId).Distinct().Count() })
                .ToDictionaryAsync(g => g.MatchId, g => g.Count);

            var matchSummaries = matches.Select(m => new MatchSummaryDto
            {
                Id = m.Id,
                HomeTeam = m.HomeTeam,
                AwayTeam = m.AwayTeam,
                MatchDate = m.MatchDate,
                Status = m.Status,
                ScoreHome = m.ScoreHome,
                ScoreAway = m.ScoreAway,
                AverageRating = m.Ratings.Any() ? m.Ratings.Average(r => r.Score) : 0,
                TotalComments = m.Comments.Count,
                WatchCount = watchCounts.ContainsKey(m.Id) ? watchCounts[m.Id] : 0
            }).ToList();

            return Ok(matchSummaries);
        }
        catch (Exception e)
        {
            return BadRequest($"Error while getting matches: {e.Message}");
        }
    }


    [HttpGet("{id}")]
    public async Task<IActionResult> GetMatchById(int id)
    {
        try
        {
            var match = await _context.Matches
                .Include(m => m.Ratings).ThenInclude(r => r.User)
                .Include(m => m.Comments).ThenInclude(c => c.User)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (match == null)
                return NotFound();

            var watchCount = await _context.WatchedMatches
                .Where(w => w.MatchId == id)
                .Select(w => w.UserId)
                .Distinct()
                .CountAsync();

            var dto = new MatchDto
            {
                Id = match.Id,
                HomeTeam = match.HomeTeam,
                AwayTeam = match.AwayTeam,
                MatchDate = match.MatchDate,
                Status = match.Status,
                ScoreHome = match.ScoreHome,
                ScoreAway = match.ScoreAway,
                Description = match.Description,
                WatchCount = watchCount,
                Ratings = match.Ratings.Select(r => new RatingDto
                {
                    Score = r.Score,
                    Username = r.User.Username,
                    CreatedAt = r.CreatedAt
                }).ToList(),
                Comments = match.Comments.Select(c => new CommentDto
                {
                    Content = c.Content,
                    Username = c.User.Username,
                    CreatedAt = c.CreatedAt
                }).ToList()
            };

            return Ok(dto);
        }
        catch (Exception e)
        {
            return BadRequest("Error while getting match: " + e.Message);
        }
    }


    [HttpPost("{id}/rate-comment")]
    public async Task<IActionResult> RateAndCommentMatch(int id, [FromBody] CreateRatingCommentDto dto)
    {
        try
        {
            var match = await _context.Matches.FindAsync(id);
            if (match == null)
                return NotFound("Match not found");

            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null)
                return NotFound("User not found");

            if (dto.Score.HasValue)
            {
                var rating = new Rating
                {
                    MatchId = id,
                    UserId = dto.UserId,
                    Score = dto.Score.Value,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Ratings.Add(rating);
            }

            if (!string.IsNullOrWhiteSpace(dto.Content))
            {
                if (match.Status != "finished")
                    return BadRequest("Cannot comment before match is finished");

                var comment = new Comment
                {
                    MatchId = id,
                    UserId = dto.UserId,
                    Content = dto.Content,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Comments.Add(comment);
            }

            await _context.SaveChangesAsync();

            return Ok("Rating and/or comment added");
        }
        catch (Exception e)
        {
            return BadRequest("Error while adding comment and/or rating: " + e.Message);
        }
    }

    [HttpPost("{matchId}/watch")]
    public async Task<IActionResult> MarkAsWatched(int matchId)
    {
        var userId = await GetCurrentUserIdAsync(); 

        var alreadyWatched = await _context.WatchedMatches
            .AnyAsync(w => w.UserId == userId && w.MatchId == matchId);

        if (alreadyWatched)
            return BadRequest("You already marked this match as watched.");

        _context.WatchedMatches.Add(new WatchedMatch
        {
            UserId = userId,
            MatchId = matchId
        });

        await _context.SaveChangesAsync();
        return Ok("Match marked as watched.");
    }

    [HttpPost("{id}/favorite")]
    public async Task<IActionResult> FavoriteMatch(int id, [FromBody] CreateFavoriteDto dto)
    {
        try
        {
            var match = await _context.Matches.FindAsync(id);
            if (match == null)
                return NotFound("Match not found");

            var alreadyExists = await _context.Favorites
                .AnyAsync(f => f.MatchId == id && f.UserId == dto.UserId);

            if (alreadyExists)
                return BadRequest("Match is already in favorites");

            var fav = new Favorite
            {
                MatchId = id,
                UserId = dto.UserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Favorites.Add(fav);
            await _context.SaveChangesAsync();

            return Ok("Match added to favorites");
        }
        catch (Exception e)
        {
            return BadRequest("Error while adding favorite: " + e.Message);
        }
    }
    private async Task<int> GetCurrentUserIdAsync()
    {
        var usernameClaim = User.FindFirst(ClaimTypes.Name)?.Value ??
                            User.FindFirst("username")?.Value ??
                            User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(usernameClaim))
            throw new UnauthorizedAccessException("Username not found in claims.");

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == usernameClaim);

        if (user == null)
            throw new UnauthorizedAccessException("User not found in database.");

        return user.Id;
    }
}