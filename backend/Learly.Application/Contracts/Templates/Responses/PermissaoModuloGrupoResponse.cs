namespace Learly.Application.Contracts.Templates.Responses;

/// <summary>
/// Agrupamento lógico de permissões (módulo inferido a partir do nome, ex.: segundo segmento de <c>VISUALIZAR_USUARIO</c>).
/// </summary>
public sealed class PermissaoModuloGrupoResponse
{
    public string Modulo { get; init; } = string.Empty;

    public string ModuloRotulo { get; init; } = string.Empty;

    public IReadOnlyList<PermissaoCatalogoItemResponse> Permissoes { get; init; } = [];
}
