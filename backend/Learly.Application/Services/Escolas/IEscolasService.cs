using Learly.Application.Contracts.Escolas;
using Learly.Application.Contracts.Escolas.Requests;
using Learly.Application.Services.Common;

namespace Learly.Application.Services.Escolas;

public interface IEscolasService
{
    Task<EscolasListagemResultado> ListarAsync(AppUserContext userContext, CancellationToken cancellationToken = default);

    Task<EscolaCriacaoResultado> CriarAsync(CriarEscolaRequest request, CancellationToken cancellationToken = default);

    Task<MinhaEscolaConsultaResultado> ObterMinhaEscolaAsync(AppUserContext uc, CancellationToken cancellationToken = default);

    Task<MinhaEscolaAtualizacaoResultado> AtualizarMinhaEscolaAsync(
        AtualizarMinhaEscolaRequest request,
        AppUserContext uc,
        CancellationToken cancellationToken = default);

    Task<EscolaConfiguracoesConsultaResultado> ObterConfiguracoesAsync(
        AppUserContext uc,
        CancellationToken cancellationToken = default);

    Task<EscolaConfiguracoesAtualizacaoResultado> AtualizarConfiguracoesAsync(
        AtualizarEscolaConfiguracoesRequest request,
        AppUserContext uc,
        CancellationToken cancellationToken = default);

    Task<EscolaLogoUploadResultado> EnviarLogoAsync(
        Stream conteudo,
        string nomeArquivo,
        string contentType,
        long tamanhoBytes,
        AppUserContext uc,
        CancellationToken cancellationToken = default);

    Task<EscolaLogoArquivoResultado> ObterLogoAsync(AppUserContext uc, CancellationToken cancellationToken = default);
}
