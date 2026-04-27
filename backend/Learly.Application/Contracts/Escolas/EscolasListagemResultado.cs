using Learly.Application.Contracts.Escolas.Responses;

namespace Learly.Application.Contracts.Escolas;

public sealed record EscolasListagemResultado(
    IReadOnlyList<EscolaListItemResponse> Itens,
    bool ContextoTenantInvalido);
