using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Matchboxd.API.Helpers.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Matchboxd.API.Services;

public class TokenService : ITokenService
{
    private readonly JwtOptions _jwtOptions;

    public TokenService(IOptions<JwtOptions> jwtOptions)
    {
        _jwtOptions = jwtOptions.Value;
    }

    public string GenerateToken(string username)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_jwtOptions.Key);

        // Include Issuer and Audience as claims explicitly
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Sub, username),
            new(JwtRegisteredClaimNames.Iss, _jwtOptions.Issuer),
            new(JwtRegisteredClaimNames.Aud, _jwtOptions.Audience)
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Issuer = _jwtOptions.Issuer,
            Audience = _jwtOptions.Audience,
            Expires = DateTime.UtcNow.AddMinutes(20),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature
            )
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}