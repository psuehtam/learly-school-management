using Learly.Application.Contracts.Livros;
using Learly.Application.Contracts.Livros.Requests;
using Learly.Application.Services.Common;

namespace Learly.Application.Services.Livros;

public interface ILivroPlanejamentoService
{
    Task GerarRascunhoAsync(int livroId, int escolaId, CancellationToken cancellationToken = default);

    Task<LivroPlanejamentoConsultaResultado> ObterPlanejamentoAsync(
        int livroId,
        AppUserContext uc,
        CancellationToken cancellationToken = default);

    Task<LivroPlanejamentoSalvarResultado> SalvarPlanejamentoAsync(
        int livroId,
        SalvarPlanejamentoRequest body,
        AppUserContext uc,
        CancellationToken cancellationToken = default);
}
