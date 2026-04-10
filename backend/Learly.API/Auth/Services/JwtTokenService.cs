using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Learly.API.Auth.Services;

public interface IJwtTokenService
{
    (string token, DateTime expiresAtUtc) GenerateToken(LoginUserDto user);
}

public sealed class JwtTokenService : IJwtTokenService
{
    private readonly JwtOptions _jwtOptions;

    public JwtTokenService(IOptions<JwtOptions> jwtOptions)
    {
        _jwtOptions = jwtOptions.Value;
    }

    public (string token, DateTime expiresAtUtc) GenerateToken(LoginUserDto user)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
            new("userId", user.UserId.ToString()),
            new("nome", user.Nome),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Name, user.Nome),
            new(ClaimTypes.Role, user.Perfil)
        };

        if (user.IsSuperAdmin)
        {
            claims.Add(new Claim("isSuperAdmin", "true"));
            claims.Add(new Claim("role", "SuperAdmin"));
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(user.CodigoEscola))
            {
                claims.Add(new Claim("codigoEscola", user.CodigoEscola));
            }

            claims.Add(new Claim("role", "SchoolUser"));
        }

        claims.AddRange(user.Permissoes.Select(p => new Claim("permissions", p)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(_jwtOptions.ExpireMinutes);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expires,
            Issuer = _jwtOptions.Issuer,
            Audience = _jwtOptions.Audience,
            SigningCredentials = credentials
        };

        var handler = new JwtSecurityTokenHandler();
        var token = handler.CreateToken(tokenDescriptor);
        return (handler.WriteToken(token), expires);
    }
}
