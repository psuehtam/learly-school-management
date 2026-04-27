namespace Learly.Application.Contracts.Aulas.Requests;

public sealed class CriarAulaRequest
{
    public int TurmaId { get; set; }
    public int? CapituloId { get; set; }
    public int? ProfessorId { get; set; }
    public int NumeroAula { get; set; }
    public DateOnly DataAula { get; set; }
    public TimeOnly HorarioInicio { get; set; }
    public TimeOnly HorarioFim { get; set; }
    public string? ConteudoDado { get; set; }
    public string? TipoAula { get; set; }
}
