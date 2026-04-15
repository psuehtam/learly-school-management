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
    private static readonly HashSet<string> ValidStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "Agendada",
        "Realizada",
        "Cancelada"
    };

    public AulasService(LearlyDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<AulaListItemDto>> ListarAsync(AppUserContext uc, CancellationToken ct)
    {
        var escolaId = await GetActiveSchoolIdAsync(uc.CodigoEscola, ct);
        if (!escolaId.HasValue)
        {
            return [];
        }

        var query = _db.Aulas.AsNoTracking()
            .Where(a => a.EscolaId == escolaId.Value);

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
        var escolaId = await GetActiveSchoolIdAsync(uc.CodigoEscola, ct);
        if (!escolaId.HasValue)
        {
            return null;
        }

        var query = _db.Aulas.AsNoTracking()
            .Where(a => a.Id == id)
            .Where(a => a.EscolaId == escolaId.Value);

        if (IsProfessor(uc))
        {
            query = query.Where(a => a.ProfessorId == uc.UserId);
        }

        return await query.Select(ToDto()).FirstOrDefaultAsync(ct);
    }

    public async Task<(bool Success, int? Id, string? Error)> CriarAsync(CriarAulaInput input, AppUserContext uc, CancellationToken ct)
    {
        var escolaId = await GetActiveSchoolIdAsync(uc.CodigoEscola, ct);
        if (!escolaId.HasValue) return (false, null, "Acesso negado.");

        if (input.NumeroAula <= 0)
        {
            return (false, null, "Numero da aula deve ser maior que zero.");
        }

        if (input.HorarioFim <= input.HorarioInicio)
        {
            return (false, null, "Horario fim deve ser maior que horario inicio.");
        }

        var turma = await _db.Turmas.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == input.TurmaId && t.EscolaId == escolaId.Value, ct);
        if (turma is null) return (false, null, "Turma nao encontrada nesta escola.");

        var professorId = input.ProfessorId ?? uc.UserId;
        var professorValido = await IsProfessorAtSchoolAsync(professorId, escolaId.Value, ct);
        if (!professorValido)
        {
            return (false, null, "Professor invalido para esta escola.");
        }

        var entidade = new Aula
        {
            EscolaId = escolaId.Value,
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
        if (IsProfessor(uc))
        {
            return (false, "Professor nao pode editar aulas.", 403);
        }

        var escolaId = await GetActiveSchoolIdAsync(uc.CodigoEscola, ct);
        if (!escolaId.HasValue) return (false, "Acesso negado.", 403);

        var aula = await _db.Aulas
            .Where(a => a.Id == id)
            .Where(a => a.EscolaId == escolaId.Value)
            .FirstOrDefaultAsync(ct);
        if (aula is null) return (false, "Aula nao encontrada.", 404);

        var horarioInicio = input.HorarioInicio ?? aula.HorarioInicio;
        var horarioFim = input.HorarioFim ?? aula.HorarioFim;
        if (horarioFim <= horarioInicio)
        {
            return (false, "Horario fim deve ser maior que horario inicio.", 400);
        }

        if (input.Status is not null)
        {
            var normalizedStatus = input.Status.Trim();
            if (!ValidStatuses.Contains(normalizedStatus))
            {
                return (false, "Status da aula invalido.", 400);
            }

            if (!CanTransition(aula.Status, normalizedStatus))
            {
                return (false, "Transicao de status nao permitida.", 409);
            }

            aula.Status = normalizedStatus;
        }

        if (input.CapituloId.HasValue) aula.CapituloId = input.CapituloId.Value;
        if (input.DataAula.HasValue) aula.DataAula = input.DataAula.Value;
        if (input.HorarioInicio.HasValue) aula.HorarioInicio = input.HorarioInicio.Value;
        if (input.HorarioFim.HasValue) aula.HorarioFim = input.HorarioFim.Value;
        if (input.ConteudoDado is not null) aula.ConteudoDado = input.ConteudoDado;

        await _db.SaveChangesAsync(ct);
        return (true, null, 204);
    }

    public async Task<(bool Success, string? Error, int StatusCode)> CancelarAsync(int id, AppUserContext uc, CancellationToken ct)
    {
        if (IsProfessor(uc))
        {
            return (false, "Professor nao pode cancelar aulas.", 403);
        }

        var escolaId = await GetActiveSchoolIdAsync(uc.CodigoEscola, ct);
        if (!escolaId.HasValue) return (false, "Acesso negado.", 403);

        var aula = await _db.Aulas
            .Where(a => a.Id == id)
            .Where(a => a.EscolaId == escolaId.Value)
            .FirstOrDefaultAsync(ct);
        if (aula is null) return (false, "Aula nao encontrada.", 404);

        if (!CanTransition(aula.Status, "Cancelada"))
        {
            return (false, "Transicao de status nao permitida.", 409);
        }

        aula.Status = "Cancelada";
        await _db.SaveChangesAsync(ct);
        return (true, null, 204);
    }

    private static bool IsProfessor(AppUserContext uc) =>
        string.Equals(uc.Perfil, "Professor", StringComparison.OrdinalIgnoreCase);

    private async Task<int?> GetActiveSchoolIdAsync(string? codigoEscola, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(codigoEscola))
        {
            return null;
        }

        return await _db.Escolas.AsNoTracking()
            .Where(e => e.CodigoEscola == codigoEscola && e.Status == "Ativo")
            .Select(e => (int?)e.Id)
            .FirstOrDefaultAsync(ct);
    }

    private async Task<bool> IsProfessorAtSchoolAsync(int usuarioId, int escolaId, CancellationToken ct)
    {
        return await _db.Usuarios.AsNoTracking()
            .Where(u => u.Id == usuarioId && u.EscolaId == escolaId && u.Status == "Ativo")
            .Join(
                _db.Perfis.AsNoTracking(),
                u => new { u.PerfilId, u.EscolaId },
                p => new { PerfilId = p.Id, p.EscolaId },
                (_, p) => p.Nome)
            .AnyAsync(nome => string.Equals(nome, "Professor", StringComparison.OrdinalIgnoreCase), ct);
    }

    private static bool CanTransition(string currentStatus, string nextStatus)
    {
        if (string.Equals(currentStatus, nextStatus, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return currentStatus.ToLowerInvariant() switch
        {
            "agendada" => string.Equals(nextStatus, "Realizada", StringComparison.OrdinalIgnoreCase)
                || string.Equals(nextStatus, "Cancelada", StringComparison.OrdinalIgnoreCase),
            "realizada" => false,
            "cancelada" => false,
            _ => false
        };
    }

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
