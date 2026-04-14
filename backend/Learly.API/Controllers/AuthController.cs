using Learly.API.Auth;
using Learly.API.Auth.Services;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;

namespace Learly.API.Controllers;

[ApiController]
[Route("auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        var result = await _authService.LoginAsync(request);
        if (!result.Success || result.Data is null || string.IsNullOrWhiteSpace(result.AccessToken))
        {
            return Unauthorized(new ProblemDetails
            {
                Title = "Nao autorizado",
                Detail = result.Error ?? "Credenciais invalidas.",
                Status = StatusCodes.Status401Unauthorized
            });
        }

        // Secure=true em http:// faz o navegador ignorar ou não enviar o cookie → 401 em /api/me.
        // Em produção (HTTPS) mantém Secure; em dev (http://localhost) usa false.
        var secure = Request.IsHttps;
        var expires = result.Data.ExpiraEmUtc;

        Response.Cookies.Append(AuthConstants.AccessTokenCookieName, result.AccessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = secure,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = expires
        });

        Response.Cookies.Append("auth_session", "1", new CookieOptions
        {
            HttpOnly = false,
            Secure = secure,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = expires
        });

        return Ok(result.Data);
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        var secureLogout = Request.IsHttps;
        Response.Cookies.Delete(AuthConstants.AccessTokenCookieName, new CookieOptions
        {
            Path = "/",
            Secure = secureLogout,
            SameSite = SameSiteMode.Lax
        });
        Response.Cookies.Delete("auth_session", new CookieOptions
        {
            Path = "/",
            Secure = secureLogout,
            SameSite = SameSiteMode.Lax
        });
        return NoContent();
    }
}
