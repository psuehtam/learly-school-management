using Learly.Application.Contracts.PreAlunos.Responses;

namespace Learly.Application.Contracts.PreAlunos;

public enum PrepararConversaoFalha
{
    Nenhuma,
    AcessoNegado,
    NaoEncontrado,
    Validacao
}

public sealed record PrepararConversaoResultado(
    bool Ok,
    PrepararConversaoPreAlunoResponse? Dados,
    string? Mensagem,
    PrepararConversaoFalha Falha);
