namespace Learly.Application.Contracts.Turmas.Requests;

public sealed class CriarTurmaRequest
{
    public int ProfessorId { get; set; }
    public int LivroId { get; set; }
    public string? Sala { get; set; }
    public string? Observacoes { get; set; }
    /// <summary>0=Dom … 6=Sáb. Opcional na criação; obrigatório antes de ativar.</summary>
    public List<int>? DiasSemana { get; set; }
    public string? HorarioInicio { get; set; }
    public string? HorarioFim { get; set; }
    /// <summary>Matrículas em espera sem turma que devem ser enturmadas na nova turma.</summary>
    public List<int>? MatriculaIds { get; set; }
}
