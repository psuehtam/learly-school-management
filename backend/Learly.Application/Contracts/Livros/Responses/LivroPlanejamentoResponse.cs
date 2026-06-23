namespace Learly.Application.Contracts.Livros.Responses;

public sealed record LivroPlanejamentoResponse(
    int LivroId,
    string LivroNome,
    int DuracaoAulaMinutos,
    IReadOnlyList<LivroPlanejamentoDiaResponse> Dias);

public sealed record LivroPlanejamentoDiaResponse(
    int Id,
    int Ordem,
    int MinutosUsados,
    IReadOnlyList<LivroPlanejamentoAlocacaoResponse> Alocacoes);

public sealed record LivroPlanejamentoAlocacaoResponse(
    int Id,
    int CapituloId,
    string CapituloNome,
    int MinutosAlocados,
    int Ordem);
