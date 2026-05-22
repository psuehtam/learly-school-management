namespace Learly.Application.Contracts.PreAlunos.Responses;

public sealed record PreAlunoDocumentoResponse(
    int Id,
    string TipoCodigo,
    string NomeExibicao,
    string NomeArquivoOriginal,
    string? ContentType,
    long TamanhoBytes,
    DateTime DataUpload,
    string UrlDownload);
