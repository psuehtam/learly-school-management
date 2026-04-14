namespace Learly.Application.Services.Common;

public sealed class AppUserContext
{
    public int UserId { get; init; }
    public string Perfil { get; init; } = string.Empty;
    public string? CodigoEscola { get; init; }
    public bool IsSuperAdmin { get; init; }
    public IReadOnlySet<string> Permissions { get; init; } = new HashSet<string>();
}
