using Learly.Application.Contracts.Templates.Requests;
using Learly.Application.Contracts.Templates.Responses;
using Learly.Domain.Interfaces.Persistence;
using Learly.Domain.Interfaces.Repositories;

namespace Learly.Application.Services.Templates;

public sealed class TemplatesAdminService : ITemplatesAdminService
{
    private readonly ITemplatePermissoesRepository _templates;
    private readonly IPermissaoRepository _permissoes;
    private readonly IUnitOfWork _unitOfWork;

    public TemplatesAdminService(
        ITemplatePermissoesRepository templates,
        IPermissaoRepository permissoes,
        IUnitOfWork unitOfWork)
    {
        _templates = templates;
        _permissoes = permissoes;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<PerfilTemplateListItemResponse>> ListarPerfisTemplateAsync(
        CancellationToken cancellationToken = default)
    {
        var rows = await _templates.ListarPerfisTemplateAsync(cancellationToken);
        return rows.Select(r => new PerfilTemplateListItemResponse { Id = r.Id, Nome = r.Nome }).ToList();
    }

    public async Task<IReadOnlyList<PermissaoModuloGrupoResponse>> ListarPermissoesAgrupadasAsync(
        CancellationToken cancellationToken = default)
    {
        var todas = await _permissoes.ListarTodasOrdenadasPorNomeAsync(cancellationToken);
        var grupos = todas
            .Select(p => new
            {
                Modulo = PermissaoModuloClassifier.InferirModulo(p.Nome),
                Item = new PermissaoCatalogoItemResponse
                {
                    Id = p.Id,
                    Nome = p.Nome,
                    Descricao = p.Descricao
                }
            })
            .GroupBy(x => x.Modulo, StringComparer.OrdinalIgnoreCase)
            .OrderBy(g => PermissaoModuloClassifier.RotuloDoModulo(g.Key), StringComparer.OrdinalIgnoreCase)
            .Select(g => new PermissaoModuloGrupoResponse
            {
                Modulo = g.Key,
                ModuloRotulo = PermissaoModuloClassifier.RotuloDoModulo(g.Key),
                Permissoes = g.Select(x => x.Item).OrderBy(p => p.Nome, StringComparer.OrdinalIgnoreCase).ToList()
            })
            .ToList();
        return grupos;
    }

    public async Task<PerfilTemplatePermissoesResponse?> ObterPermissoesDoPerfilTemplateAsync(
        int perfilTemplateId,
        CancellationToken cancellationToken = default)
    {
        if (!await _templates.PerfilTemplateExisteAsync(perfilTemplateId, cancellationToken))
        {
            return null;
        }

        var nome = await _templates.ObterNomePerfilTemplateAsync(perfilTemplateId, cancellationToken);
        var ids = await _templates.ObterPermissaoIdsDoPerfilTemplateAsync(perfilTemplateId, cancellationToken);
        return new PerfilTemplatePermissoesResponse
        {
            PerfilTemplateId = perfilTemplateId,
            Nome = nome ?? string.Empty,
            PermissaoIds = ids
        };
    }

    public async Task<SalvarTemplatePermissoesResultado> SalvarPermissoesDoPerfilTemplateAsync(
        int perfilTemplateIdDaRota,
        SalvarTemplatePermissoesRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.PerfilTemplateId != perfilTemplateIdDaRota)
        {
            return SalvarTemplatePermissoesResultado.IdRotaCorpoInconsistente;
        }

        if (!await _templates.PerfilTemplateExisteAsync(perfilTemplateIdDaRota, cancellationToken))
        {
            return SalvarTemplatePermissoesResultado.PerfilNaoEncontrado;
        }

        var ids = request.PermissoesIds ?? [];

        await _unitOfWork.ExecuteInTransactionAsync(
            async () =>
            {
                await _templates.SubstituirVinculosPermissoesAsync(perfilTemplateIdDaRota, ids, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            },
            cancellationToken);

        return SalvarTemplatePermissoesResultado.Ok;
    }
}
