namespace Learly.Application.Contracts.Livros.Responses;

public sealed record LivroEscolaResponse(
    int Id,
    string Nome,
    string Status,
    int QuantidadeCapitulos = 0,
    int TotalDuracaoMinutos = 0,
    IReadOnlyList<LivroCapituloItemResponse>? Capitulos = null);
