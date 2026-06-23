namespace Learly.Domain.Entities;

/// <summary>Um card de dia de aula no planejamento de um livro — tabela <c>livros_planejamento_dias</c>.</summary>
public sealed class LivroPlanejamentoDia
{
    public int Id { get; internal set; }
    public int EscolaId { get; internal set; }
    public int LivroId { get; internal set; }
    public int Ordem { get; internal set; }
    public DateTime DataCriacao { get; internal set; }
    public DateTime DataAtualizacao { get; internal set; }

    public Livro Livro { get; internal set; } = null!;
    public ICollection<LivroPlanejamentoAlocacao> Alocacoes { get; internal set; } = [];
}
