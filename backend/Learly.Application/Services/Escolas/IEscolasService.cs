using Learly.Application.Contracts.Escolas;
using Learly.Application.Contracts.Escolas.Requests;
using Learly.Application.Services.Common;

namespace Learly.Application.Services.Escolas;

public interface IEscolasService
{
    Task<EscolasListagemResultado> ListarAsync(AppUserContext userContext, CancellationToken cancellationToken = default);

    Task<EscolaCriacaoResultado> CriarAsync(CriarEscolaRequest request, CancellationToken cancellationToken = default);
}
