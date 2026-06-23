namespace Learly.Domain.Entities;

/// <summary>Alocação N:M entre dia de planejamento e capítulo — tabela <c>livros_planejamento_alocacoes</c>.</summary>
public sealed class LivroPlanejamentoAlocacao
{
    public int Id { get; internal set; }
    public int EscolaId { get; internal set; }
    public int DiaId { get; internal set; }
    public int CapituloId { get; internal set; }
    public int MinutosAlocados { get; internal set; }
    public int Ordem { get; internal set; }
    public DateTime DataCriacao { get; internal set; }
    public DateTime DataAtualizacao { get; internal set; }

    public LivroPlanejamentoDia Dia { get; internal set; } = null!;
    public Capitulo Capitulo { get; internal set; } = null!;
}
