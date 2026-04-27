namespace Learly.Application.Contracts.Templates.Responses;

/// <summary>
/// Permissões atualmente marcadas para um perfil de template.
/// </summary>
public sealed class PerfilTemplatePermissoesResponse
{
    public int PerfilTemplateId { get; init; }

    public string Nome { get; init; } = string.Empty;

    public IReadOnlyList<int> PermissaoIds { get; init; } = [];
}
