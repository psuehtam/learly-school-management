namespace Learly.Application.Contracts.Aulas;

public sealed record AulaOperacaoResultado(bool Ok, string? Mensagem, int StatusCode);
