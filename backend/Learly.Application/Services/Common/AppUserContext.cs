namespace Learly.Application.Services.Common;

public sealed class AppUserContext
{
    /// <summary>
    /// Contexto sintético para jobs em segundo plano (ex.: <c>Learly.Worker</c>): visão de super administrador sem escola fixa.
    /// </summary>
    public static AppUserContext SystemJob { get; } = new()
    {
        UserId = 0,
        Perfil = "System",
        CodigoEscola = null,
        IsSuperAdmin = true,
        Permissions = new HashSet<string>()
    };

    public int UserId { get; init; }
    public string Perfil { get; init; } = string.Empty;
    public string? CodigoEscola { get; init; }
    public bool IsSuperAdmin { get; init; }
    public IReadOnlySet<string> Permissions { get; init; } = new HashSet<string>();
}
