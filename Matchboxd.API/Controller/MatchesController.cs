namespace Matchboxd.API.Controller;

[ApiController]
[Route("api/[controller]")]
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
        var matches = await _context.Matches
            .OrderByDescending(m => m.MatchDate)
            .ToListAsync();
        return Ok(matches);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetMatchById(int id)
    {
        var match = await _context.Matches
            .Include(m => m.Comments)
            .Include(m => m.Ratings)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (match == null)
            return NotFound();

        return Ok(match);
    }
}
