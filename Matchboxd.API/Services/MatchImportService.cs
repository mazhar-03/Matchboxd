namespace Matchboxd.API.Services;

using Matchboxd.API.Models;
using Matchboxd.API.DAL;
using System.Net.Http.Json;

public class MatchImportService
{
    private readonly HttpClient _httpClient;
    private readonly AppDbContext _context;

    public MatchImportService(IHttpClientFactory factory, AppDbContext context)
    {
        _httpClient = factory.CreateClient("FootballData");
        _context = context;
    }

    public async Task ImportMatchesAsync()
    {
        var response = await _httpClient.GetFromJsonAsync<MatchesResponse>("competitions/2021/matches");

        if (response?.Matches == null) return;

        foreach (var match in response.Matches)
        {
            if (!_context.Matches.Any(m => m.ExternalId == match.Id))
            {
                _context.Matches.Add(new Match
                {
                    ExternalId = match.Id,
                    HomeTeam = match.HomeTeam.Name,
                    AwayTeam = match.AwayTeam.Name,
                    MatchDate = match.UtcDate,
                    Status = match.Status,
                    Description = $"{match.Competition.Name} - {match.Stage}"
                });
            }
        }
        await _context.SaveChangesAsync();

    }

}
