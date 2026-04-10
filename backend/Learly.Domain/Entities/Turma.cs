using System.ComponentModel.DataAnnotations.Schema;

namespace Learly.Domain.Entities;

[Table("turmas")]
public class Turma
{
    [Column("id")]
    public int Id { get; set; }

    [Column("escola_id")]
    public int EscolaId { get; set; }

    [Column("professor_id")]
    public int ProfessorId { get; set; }

    [Column("livro_id")]
    public int LivroId { get; set; }

    [Column("nome")]
    public string Nome { get; set; } = string.Empty;

    [Column("sala")]
    public string? Sala { get; set; }

    [Column("horario")]
    public TimeOnly? Horario { get; set; }

    [Column("data_inicio")]
    public DateOnly? DataInicio { get; set; }

    [Column("data_termino_prevista")]
    public DateOnly? DataTerminoPrevista { get; set; }

    [Column("observacoes")]
    public string? Observacoes { get; set; }

    [Column("status")]
    public string Status { get; set; } = "Em Espera";
}
