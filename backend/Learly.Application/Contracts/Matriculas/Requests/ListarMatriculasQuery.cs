namespace Learly.Application.Contracts.Matriculas.Requests;

public sealed class ListarMatriculasQuery
{
    public string? Status { get; set; }
    /// <summary>"inativos" → Cancelado + Trancado + Concluido</summary>
    public string? Grupo { get; set; }
    public int? AlunoId { get; set; }
    public int? TurmaId { get; set; }
}
