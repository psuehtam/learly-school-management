using Learly.Application.Contracts.Aulas;
using Learly.Application.Contracts.Aulas.Requests;
using Learly.Application.Contracts.Aulas.Responses;
using Learly.Application.Services.Common;

namespace Learly.Application.Services.Aulas;

public interface IAulasService
{
    Task<IReadOnlyList<AulaListItemResponse>> ListarAsync(AppUserContext uc, CancellationToken cancellationToken = default);

    Task<AulaListItemResponse?> ObterPorIdAsync(int id, AppUserContext uc, CancellationToken cancellationToken = default);

    Task<AulaCriacaoResultado> CriarAsync(
        CriarAulaRequest request,
        AppUserContext uc,
        CancellationToken cancellationToken = default);

    Task<AulaOperacaoResultado> EditarAsync(
        int id,
        EditarAulaRequest request,
        AppUserContext uc,
        CancellationToken cancellationToken = default);

    Task<AulaOperacaoResultado> CancelarAsync(int id, AppUserContext uc, CancellationToken cancellationToken = default);
}
