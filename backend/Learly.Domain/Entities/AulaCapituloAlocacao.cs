namespace Learly.Domain.Entities;

/// <summary>Pivô runtime N:M entre aulas agendadas e capítulos — tabela <c>aulas_capitulos_alocacao</c>.</summary>
public sealed class AulaCapituloAlocacao
{
    public int Id { get; internal set; }
    public int EscolaId { get; internal set; }
    public int AulaId { get; internal set; }
    public int CapituloId { get; internal set; }
    public int MinutosAlocados { get; internal set; }
    public int Ordem { get; internal set; }
    public DateTime DataCriacao { get; internal set; }

    public Aula Aula { get; internal set; } = null!;
    public Capitulo Capitulo { get; internal set; } = null!;
}
