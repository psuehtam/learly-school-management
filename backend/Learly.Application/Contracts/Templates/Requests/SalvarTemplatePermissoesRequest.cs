namespace Learly.Application.Contracts.Templates.Requests;

/// <summary>
/// Corpo para salvar as permissões vinculadas a um perfil de template.
/// </summary>
public sealed class SalvarTemplatePermissoesRequest
{
    /// <summary>Deve coincidir com o <c>perfilTemplateId</c> da rota.</summary>
    public int PerfilTemplateId { get; set; }

    public List<int> PermissoesIds { get; set; } = [];
}
