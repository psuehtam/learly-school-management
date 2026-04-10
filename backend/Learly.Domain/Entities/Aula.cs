using System.ComponentModel.DataAnnotations.Schema;

namespace Learly.Domain.Entities;

[Table("aulas")]
public class Aula
{
    [Column("id")]
    public int Id { get; set; }

    [Column("escola_id")]
    public int EscolaId { get; set; }

    [Column("turma_id")]
    public int TurmaId { get; set; }

    [Column("capitulo_id")]
    public int? CapituloId { get; set; }

    [Column("professor_id")]
    public int ProfessorId { get; set; }

    [Column("numero_aula")]
    public int NumeroAula { get; set; }

    [Column("data_aula")]
    public DateOnly DataAula { get; set; }

    [Column("horario_inicio")]
    public TimeOnly HorarioInicio { get; set; }

    [Column("horario_fim")]
    public TimeOnly HorarioFim { get; set; }

    [Column("conteudo_dado")]
    public string? ConteudoDado { get; set; }

    [Column("tipo_aula")]
    public string TipoAula { get; set; } = "Normal";

    [Column("status")]
    public string Status { get; set; } = "Agendada";
}
