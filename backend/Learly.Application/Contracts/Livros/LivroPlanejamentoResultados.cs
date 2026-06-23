using Learly.Application.Contracts.Livros.Responses;

namespace Learly.Application.Contracts.Livros;

public sealed record LivroPlanejamentoConsultaResultado(bool Ok, LivroPlanejamentoResponse? Planejamento, string? Mensagem, LivrosEscolaFalha Falha);

public sealed record LivroPlanejamentoSalvarResultado(bool Ok, LivroPlanejamentoResponse? Planejamento, string? Mensagem, LivrosEscolaFalha Falha);
