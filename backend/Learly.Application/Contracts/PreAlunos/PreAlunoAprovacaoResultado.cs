namespace Learly.Application.Contracts.PreAlunos;

public enum PreAlunoAprovacaoFalha
{
    Nenhuma,
    AcessoNegado,
    NaoEncontrado,
    Validacao,
    Conflito
}

public sealed record PreAlunoAprovacaoResultado(
    bool Ok,
    int? AlunoId,
    int? MatriculaId,
    string? Mensagem,
    PreAlunoAprovacaoFalha Falha);
