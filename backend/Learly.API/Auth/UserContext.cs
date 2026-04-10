using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace Learly.API.Auth;

/// <summary>
/// Dados extraídos do JWT para uso nos controllers/filtros.
/// Única fonte de verdade: claims do token validado pelo middleware de autenticação.
/// </summary>
public sealed class UserContext
{
    public int UserId { get; init; }
    public string Nome { get; init; } = string.Empty;
    public string Perfil { get; init; } = string.Empty;
    public string? CodigoEscola { get; init; }
    public bool IsSuperAdmin { get; init; }
    public IReadOnlySet<string> Permissions { get; init; } = new HashSet<string>();

    public bool HasPermission(string permission) => Permissions.Contains(permission);

    /// <summary>Extrai UserContext de um ClaimsPrincipal (token já validado).</summary>
    public static UserContext FromClaims(ClaimsPrincipal user)
    {
        var userIdStr = user.FindFirst("userId")?.Value ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        _ = int.TryParse(userIdStr, out var userId);

        var permissions = user.FindAll("permissions")
            .Select(c => c.Value)
            .ToHashSet(StringComparer.Ordinal);

        return new UserContext
        {
            UserId = userId,
            Nome = user.FindFirst(ClaimTypes.Name)?.Value ?? "Desconhecido",
            Perfil = user.FindFirst(ClaimTypes.Role)?.Value ?? "",
            CodigoEscola = user.FindFirst("codigoEscola")?.Value,
            IsSuperAdmin = string.Equals(user.FindFirst("isSuperAdmin")?.Value, "true", StringComparison.OrdinalIgnoreCase),
            Permissions = permissions,
        };
    }
}

/// <summary>Extension para extrair UserContext do HttpContext de forma consistente.</summary>
public static class UserContextExtensions
{
    private const string Key = "__UserContext";

    public static UserContext GetUserContext(this HttpContext httpContext)
    {
        if (httpContext.Items.TryGetValue(Key, out var cached) && cached is UserContext uc)
            return uc;

        uc = UserContext.FromClaims(httpContext.User);
        httpContext.Items[Key] = uc;
        return uc;
    }

    public static UserContext GetUserContext(this ControllerBase controller) =>
        controller.HttpContext.GetUserContext();
}
