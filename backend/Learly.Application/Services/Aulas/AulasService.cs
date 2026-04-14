using Learly.Application.Services.Common;
using Learly.Domain.Entities;
using Learly.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Learly.Application.Services.Aulas;

public sealed class AulaListItemDto
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

public sealed class CriarAulaInput
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

public sealed class EditarAulaInput
{
    public int? CapituloId { get; set; }
    public DateOnly? DataAula { get; set; }
    public TimeOnly? HorarioInicio { get; set; }
    public TimeOnly? HorarioFim { get; set; }
    public string? ConteudoDado { get; set; }
    public string? Status { get; set; }
}

public interface IAulasService
{
    Task<IReadOnlyList<AulaListItemDto>> ListarAsync(AppUserContext uc, CancellationToken ct);
    Task<AulaListItemDto?> ObterPorIdAsync(int id, AppUserContext uc, CancellationToken ct);
    Task<(bool Success, int? Id, string? Error)> CriarAsync(CriarAulaInput input, AppUserContext uc, CancellationToken ct);
    Task<(bool Success, string? Error, int StatusCode)> EditarAsync(int id, EditarAulaInput input, AppUserContext uc, CancellationToken ct);
    Task<(bool Success, string? Error, int StatusCode)> CancelarAsync(int id, AppUserContext uc, CancellationToken ct);
}

public sealed class AulasService : IAulasService
{
    private readonly LearlyDbContext _db;

    public AulasService(LearlyDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<AulaListItemDto>> ListarAsync(AppUserContext uc, CancellationToken ct)
    {
        var query = _db.Aulas.AsNoTracking()
            .Where(a => _db.Escolas.Any(e => e.Id == a.EscolaId && e.CodigoEscola == uc.CodigoEscola));

        if (IsProfessor(uc))
        {
            query = query.Where(a => a.ProfessorId == uc.UserId);
        }

        return await query
            .OrderByDescending(a => a.DataAula)
            .ThenBy(a => a.HorarioInicio)
            .Select(ToDto())
            .ToListAsync(ct);
    }

    public async Task<AulaListItemDto?> ObterPorIdAsync(int id, AppUserContext uc, CancellationToken ct)
    {
        var query = _db.Aulas.AsNoTracking()
            .Where(a => a.Id == id)
            .Where(a => _db.Escolas.Any(e => e.Id == a.EscolaId && e.CodigoEscola == uc.CodigoEscola));

        if (IsProfessor(uc))
        {
            query = query.Where(a => a.ProfessorId == uc.UserId);
        }

        return await query.Select(ToDto()).FirstOrDefaultAsync(ct);
    }

    public async Task<(bool Success, int? Id, string? Error)> CriarAsync(CriarAulaInput input, AppUserContext uc, CancellationToken ct)
    {
        var escola = await _db.Escolas.AsNoTracking()
            .FirstOrDefaultAsync(e => e.CodigoEscola == uc.CodigoEscola && e.Status == "Ativo", ct);
        if (escola is null) return (false, null, "Acesso negado.");

        var turma = await _db.Turmas.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == input.TurmaId && t.EscolaId == escola.Id, ct);
        if (turma is null) return (false, null, "Turma nao encontrada nesta escola.");

        var professorId = input.ProfessorId ?? uc.UserId;

        var entidade = new Aula
        {
            EscolaId = escola.Id,
            TurmaId = input.TurmaId,
            CapituloId = input.CapituloId,
            ProfessorId = professorId,
            NumeroAula = input.NumeroAula,
            DataAula = input.DataAula,
            HorarioInicio = input.HorarioInicio,
            HorarioFim = input.HorarioFim,
            ConteudoDado = input.ConteudoDado,
            TipoAula = input.TipoAula ?? "Normal",
            Status = "Agendada",
        };

        _db.Aulas.Add(entidade);
        await _db.SaveChangesAsync(ct);
        return (true, entidade.Id, null);
    }

    public async Task<(bool Success, string? Error, int StatusCode)> EditarAsync(int id, EditarAulaInput input, AppUserContext uc, CancellationToken ct)
    {
        var aula = await _db.Aulas
            .Where(a => a.Id == id)
            .Where(a => _db.Escolas.Any(e => e.Id == a.EscolaId && e.CodigoEscola == uc.CodigoEscola))
            .FirstOrDefaultAsync(ct);
        if (aula is null) return (false, "Aula nao encontrada.", 404);

        if (IsProfessor(uc) && aula.ProfessorId != uc.UserId)
        {
            return (false, "Voce so pode editar suas proprias aulas.", 403);
        }

        if (input.CapituloId.HasValue) aula.CapituloId = input.CapituloId.Value;
        if (input.DataAula.HasValue) aula.DataAula = input.DataAula.Value;
        if (input.HorarioInicio.HasValue) aula.HorarioInicio = input.HorarioInicio.Value;
        if (input.HorarioFim.HasValue) aula.HorarioFim = input.HorarioFim.Value;
        if (input.ConteudoDado is not null) aula.ConteudoDado = input.ConteudoDado;
        if (input.Status is not null) aula.Status = input.Status;

        await _db.SaveChangesAsync(ct);
        return (true, null, 204);
    }

    public async Task<(bool Success, string? Error, int StatusCode)> CancelarAsync(int id, AppUserContext uc, CancellationToken ct)
    {
        var aula = await _db.Aulas
            .Where(a => a.Id == id)
            .Where(a => _db.Escolas.Any(e => e.Id == a.EscolaId && e.CodigoEscola == uc.CodigoEscola))
            .FirstOrDefaultAsync(ct);
        if (aula is null) return (false, "Aula nao encontrada.", 404);

        if (IsProfessor(uc) && aula.ProfessorId != uc.UserId)
        {
            return (false, "Voce so pode cancelar suas proprias aulas.", 403);
        }

        aula.Status = "Cancelada";
        await _db.SaveChangesAsync(ct);
        return (true, null, 204);
    }

    private static bool IsProfessor(AppUserContext uc) =>
        string.Equals(uc.Perfil, "Professor", StringComparison.OrdinalIgnoreCase);

    private static Expression<Func<Aula, AulaListItemDto>> ToDto() =>
        a => new AulaListItemDto
        {
            Id = a.Id,
            TurmaId = a.TurmaId,
            ProfessorId = a.ProfessorId,
            NumeroAula = a.NumeroAula,
            DataAula = a.DataAula,
            HorarioInicio = a.HorarioInicio,
            HorarioFim = a.HorarioFim,
            ConteudoDado = a.ConteudoDado,
            TipoAula = a.TipoAula,
            Status = a.Status
        };
}
