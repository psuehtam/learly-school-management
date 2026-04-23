using Learly.Application.Contracts.Escolas.Responses;

namespace Learly.Application.Contracts.Escolas;

public enum EscolaCriacaoFalha
{
    Nenhuma,
    Validacao,
    CodigoReservado,
    CodigoDuplicado,
    EmailDuplicado,
    ErroInterno
}

public sealed record EscolaCriacaoResultado(
    bool Ok,
    EscolaListItemResponse? Escola,
    string? Mensagem,
    EscolaCriacaoFalha Falha);
