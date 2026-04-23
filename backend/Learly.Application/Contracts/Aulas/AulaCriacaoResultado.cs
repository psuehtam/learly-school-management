namespace Learly.Application.Contracts.Aulas;

public enum AulaCriacaoFalha
{
    Nenhuma,
    AcessoNegado,
    Validacao
}

public sealed record AulaCriacaoResultado(bool Ok, int? Id, string? Mensagem, AulaCriacaoFalha Falha);
