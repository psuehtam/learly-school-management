using Learly.Application.Contracts.PreAlunos.Responses;

namespace Learly.Application.Contracts.PreAlunos;

public enum PreAlunoDocumentoUploadFalha
{
    Nenhuma,
    AcessoNegado,
    NaoEncontrado,
    Validacao,
    Conflito
}

public sealed record PreAlunoDocumentoUploadResultado(
    bool Ok,
    PreAlunoDocumentoResponse? Documento,
    string? Mensagem,
    PreAlunoDocumentoUploadFalha Falha);
