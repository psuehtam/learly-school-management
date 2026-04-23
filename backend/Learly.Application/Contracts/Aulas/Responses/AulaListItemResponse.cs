namespace Learly.Application.Contracts.Aulas.Responses;

public sealed class AulaListItemResponse
{
    public int Id { get; init; }
    public int TurmaId { get; init; }
    public int ProfessorId { get; init; }
    public int NumeroAula { get; init; }
    public DateOnly DataAula { get; init; }
    public TimeOnly HorarioInicio { get; init; }
    public TimeOnly HorarioFim { get; init; }
    public string? ConteudoDado { get; init; }
    public string TipoAula { get; init; } = "Normal";
    public string Status { get; init; } = "Agendada";
}
