namespace Learly.Application.Contracts.Aulas.Requests;

public sealed class EditarAulaRequest
{
    public int? CapituloId { get; set; }
    public DateOnly? DataAula { get; set; }
    public TimeOnly? HorarioInicio { get; set; }
    public TimeOnly? HorarioFim { get; set; }
    public string? ConteudoDado { get; set; }
    public string? Status { get; set; }
}
