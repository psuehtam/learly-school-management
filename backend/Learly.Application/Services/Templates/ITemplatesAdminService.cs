using Learly.Application.Contracts.Templates.Requests;
using Learly.Application.Contracts.Templates.Responses;

namespace Learly.Application.Services.Templates;

public interface ITemplatesAdminService
{
    Task<IReadOnlyList<PerfilTemplateListItemResponse>> ListarPerfisTemplateAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PermissaoModuloGrupoResponse>> ListarPermissoesAgrupadasAsync(
        CancellationToken cancellationToken = default);

    Task<PerfilTemplatePermissoesResponse?> ObterPermissoesDoPerfilTemplateAsync(
        int perfilTemplateId,
        CancellationToken cancellationToken = default);

    Task<SalvarTemplatePermissoesResultado> SalvarPermissoesDoPerfilTemplateAsync(
        int perfilTemplateIdDaRota,
        SalvarTemplatePermissoesRequest request,
        CancellationToken cancellationToken = default);
}
