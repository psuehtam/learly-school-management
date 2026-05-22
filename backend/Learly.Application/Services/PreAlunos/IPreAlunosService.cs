using Learly.Application.Contracts.PreAlunos;
using Learly.Application.Contracts.PreAlunos.Requests;
using Learly.Application.Contracts.PreAlunos.Responses;
using Learly.Application.Services.Common;

namespace Learly.Application.Services.PreAlunos;

public interface IPreAlunosService
{
    Task<PreAlunosCatalogoLivrosResultado> ListarCatalogoLivrosInteresseAsync(
        AppUserContext uc,
        CancellationToken cancellationToken = default);

    Task<PreAlunosListagemResultado> ListarAsync(
        ListarPreAlunosQuery query,
        AppUserContext uc,
        CancellationToken cancellationToken = default);

    Task<PreAlunoDetalheResultado> ObterPorIdAsync(
        int id,
        AppUserContext uc,
        CancellationToken cancellationToken = default);

    Task<PreAlunoCriacaoResultado> CriarAsync(
        CriarPreAlunoRequest request,
        AppUserContext uc,
        CancellationToken cancellationToken = default);

    Task<PreAlunoOperacaoResultado> EditarAsync(
        int id,
        CriarPreAlunoRequest request,
        AppUserContext uc,
        CancellationToken cancellationToken = default);

    Task<PreAlunoOperacaoResultado> SubmeterParaAprovacaoAsync(
        int id,
        AppUserContext uc,
        CancellationToken cancellationToken = default);

    Task<PrepararConversaoResultado> PrepararConversaoAsync(
        int id,
        AppUserContext uc,
        CancellationToken cancellationToken = default);

    Task<PreAlunoAprovacaoResultado> AprovarAsync(
        int id,
        AprovarPreAlunoRequest request,
        AppUserContext uc,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PreAlunoDocumentoResponse>> ListarDocumentosAsync(
        int preAlunoId,
        AppUserContext uc,
        CancellationToken cancellationToken = default);

    Task<PreAlunoDocumentoUploadResultado> UploadDocumentoAsync(
        int preAlunoId,
        string tipoCodigo,
        string? nomeExibicao,
        string nomeArquivoOriginal,
        string? contentType,
        Stream conteudo,
        long tamanhoBytes,
        AppUserContext uc,
        CancellationToken cancellationToken = default);

    Task<(Stream? Stream, string? ContentType, string? NomeArquivo)?> ObterArquivoDocumentoAsync(
        int preAlunoId,
        string tipoCodigo,
        AppUserContext uc,
        CancellationToken cancellationToken = default);

    Task<PreAlunoOperacaoResultado> ReprovarAsync(
        int id,
        ReprovarPreAlunoRequest request,
        AppUserContext uc,
        CancellationToken cancellationToken = default);

    Task<PreAlunoOperacaoResultado> CancelarAsync(
        int id,
        AppUserContext uc,
        CancellationToken cancellationToken = default);
}
