namespace Learly.Domain.ReadModels;

public sealed record LivroListagemItem(
    int Id,
    string Nome,
    string Status,
    int QuantidadeCapitulos,
    int TotalDuracaoMinutos);
