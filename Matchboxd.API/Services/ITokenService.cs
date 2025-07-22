namespace Matchboxd.API.Services;

public interface ITokenService
{
    string GenerateToken(string username);
}