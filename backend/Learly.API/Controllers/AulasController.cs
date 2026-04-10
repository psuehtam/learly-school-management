using Learly.API.Auth;
using Learly.API.Auth.Filters;
using Learly.Domain.Entities;
using Learly.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Learly.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[SchoolUserOnly]
public sealed class AulasController : ControllerBase
{
    private readonly LearlyDbContext _db;

    public AulasController(LearlyDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Lista aulas com filtro por role:
    /// - Professor: apenas suas aulas.
    /// - Demais (Admin, Coordenador, Secretaria): todas da escola.
    /// - Comercial: 403.
    /// </summary>
    [HttpGet]
    [RequirePermission("VISUALIZAR_AULA")]
    public async Task<IActionResult> Listar(CancellationToken ct)
    {
        var uc = this.GetUserContext();

        var query = _db.Aulas.AsNoTracking()
            .Where(a => _db.Escolas.Any(e => e.Id == a.EscolaId && e.CodigoEscola == uc.CodigoEscola));

        if (IsProfessor(uc))
        {
            query = query.Where(a => a.ProfessorId == uc.UserId);
        }

        var aulas = await query
            .OrderByDescending(a => a.DataAula)
            .ThenBy(a => a.HorarioInicio)
            .Select(a => new AulaListItemDto
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
                Status = a.Status,
            })
            .ToListAsync(ct);

        return Ok(aulas);
    }

    [HttpGet("{id:int}")]
    [RequirePermission("VISUALIZAR_AULA")]
    public async Task<IActionResult> ObterPorId(int id, CancellationToken ct)
    {
        var uc = this.GetUserContext();

        var query = _db.Aulas.AsNoTracking()
            .Where(a => a.Id == id)
            .Where(a => _db.Escolas.Any(e => e.Id == a.EscolaId && e.CodigoEscola == uc.CodigoEscola));

        if (IsProfessor(uc))
        {
            query = query.Where(a => a.ProfessorId == uc.UserId);
        }

        var aula = await query.FirstOrDefaultAsync(ct);
        if (aula is null) return NotFound(new { message = "Aula nao encontrada." });

        return Ok(new AulaListItemDto
        {
            Id = aula.Id,
            TurmaId = aula.TurmaId,
            ProfessorId = aula.ProfessorId,
            NumeroAula = aula.NumeroAula,
            DataAula = aula.DataAula,
            HorarioInicio = aula.HorarioInicio,
            HorarioFim = aula.HorarioFim,
            ConteudoDado = aula.ConteudoDado,
            TipoAula = aula.TipoAula,
            Status = aula.Status,
        });
    }

    [HttpPost]
    [RequirePermission("CRIAR_AULA")]
    public async Task<IActionResult> Criar([FromBody] CriarAulaRequest body, CancellationToken ct)
    {
        var uc = this.GetUserContext();

        var escola = await _db.Escolas.AsNoTracking()
            .FirstOrDefaultAsync(e => e.CodigoEscola == uc.CodigoEscola && e.Status == "Ativo", ct);
        if (escola is null) return Forbid();

        var turma = await _db.Turmas.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == body.TurmaId && t.EscolaId == escola.Id, ct);
        if (turma is null) return BadRequest(new { message = "Turma nao encontrada nesta escola." });

        var professorId = body.ProfessorId ?? uc.UserId;

        var entidade = new Aula
        {
            EscolaId = escola.Id,
            TurmaId = body.TurmaId,
            CapituloId = body.CapituloId,
            ProfessorId = professorId,
            NumeroAula = body.NumeroAula,
            DataAula = body.DataAula,
            HorarioInicio = body.HorarioInicio,
            HorarioFim = body.HorarioFim,
            ConteudoDado = body.ConteudoDado,
            TipoAula = body.TipoAula ?? "Normal",
            Status = "Agendada",
        };

        _db.Aulas.Add(entidade);
        await _db.SaveChangesAsync(ct);

        return StatusCode(StatusCodes.Status201Created, new { id = entidade.Id });
    }

    [HttpPut("{id:int}")]
    [RequirePermission("EDITAR_AULA")]
    public async Task<IActionResult> Editar(int id, [FromBody] EditarAulaRequest body, CancellationToken ct)
    {
        var uc = this.GetUserContext();

        var aula = await _db.Aulas
            .Where(a => a.Id == id)
            .Where(a => _db.Escolas.Any(e => e.Id == a.EscolaId && e.CodigoEscola == uc.CodigoEscola))
            .FirstOrDefaultAsync(ct);

        if (aula is null) return NotFound(new { message = "Aula nao encontrada." });

        if (IsProfessor(uc) && aula.ProfessorId != uc.UserId)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Voce so pode editar suas proprias aulas." });
        }

        if (body.CapituloId.HasValue) aula.CapituloId = body.CapituloId.Value;
        if (body.DataAula.HasValue) aula.DataAula = body.DataAula.Value;
        if (body.HorarioInicio.HasValue) aula.HorarioInicio = body.HorarioInicio.Value;
        if (body.HorarioFim.HasValue) aula.HorarioFim = body.HorarioFim.Value;
        if (body.ConteudoDado is not null) aula.ConteudoDado = body.ConteudoDado;
        if (body.Status is not null) aula.Status = body.Status;

        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [RequirePermission("CANCELAR_AULA")]
    public async Task<IActionResult> Cancelar(int id, CancellationToken ct)
    {
        var uc = this.GetUserContext();

        var aula = await _db.Aulas
            .Where(a => a.Id == id)
            .Where(a => _db.Escolas.Any(e => e.Id == a.EscolaId && e.CodigoEscola == uc.CodigoEscola))
            .FirstOrDefaultAsync(ct);

        if (aula is null) return NotFound(new { message = "Aula nao encontrada." });

        if (IsProfessor(uc) && aula.ProfessorId != uc.UserId)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Voce so pode cancelar suas proprias aulas." });
        }

        aula.Status = "Cancelada";
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static bool IsProfessor(UserContext uc) =>
        string.Equals(uc.Perfil, "Professor", StringComparison.OrdinalIgnoreCase);
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

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

public sealed class EditarAulaRequest
{
    public int? CapituloId { get; set; }
    public DateOnly? DataAula { get; set; }
    public TimeOnly? HorarioInicio { get; set; }
    public TimeOnly? HorarioFim { get; set; }
    public string? ConteudoDado { get; set; }
    public string? Status { get; set; }
}
