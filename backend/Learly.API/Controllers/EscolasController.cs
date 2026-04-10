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
public sealed class EscolasController : ControllerBase
{
    private readonly LearlyDbContext _db;

    public EscolasController(LearlyDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Super Admin: todas as escolas. Usuário de escola: apenas a própria (tenant).
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Listar(CancellationToken ct)
    {
        var query = _db.Escolas.AsNoTracking().Where(e => e.Status == "Ativo");

        if (IsSuperAdmin())
        {
            var todas = await query
                .Where(e => e.CodigoEscola != AuthConstants.SystemSchoolCode)
                .OrderBy(e => e.CodigoEscola)
                .Select(e => new EscolaListItemDto(e.Id, e.CodigoEscola, e.NomeFantasia, e.Status))
                .ToListAsync(ct);
            return Ok(todas);
        }

        var codigo = User.FindFirst("codigoEscola")?.Value;
        if (string.IsNullOrWhiteSpace(codigo))
        {
            return Forbid();
        }

        var uma = await query
            .Where(e => e.CodigoEscola == codigo)
            .OrderBy(e => e.CodigoEscola)
            .Select(e => new EscolaListItemDto(e.Id, e.CodigoEscola, e.NomeFantasia, e.Status))
            .ToListAsync(ct);

        return Ok(uma);
    }

    /// <summary>Apenas Super Admin pode criar escolas (novo tenant).</summary>
    [HttpPost]
    [SuperAdminOnly]
    public async Task<IActionResult> Criar([FromBody] CriarEscolaRequest body, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.CodigoEscola) || string.IsNullOrWhiteSpace(body.NomeFantasia))
        {
            return BadRequest(new { message = "CodigoEscola e NomeFantasia sao obrigatorios." });
        }

        var codigo = body.CodigoEscola.Trim().ToUpperInvariant();
        if (string.Equals(codigo, AuthConstants.SystemSchoolCode, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Codigo reservado ao sistema." });
        }

        if (await _db.Escolas.AnyAsync(e => e.CodigoEscola == codigo, ct))
        {
            return Conflict(new { message = "Ja existe escola com este codigo." });
        }

        var entidade = new Escola
        {
            CodigoEscola = codigo,
            NomeFantasia = body.NomeFantasia.Trim(),
            RazaoSocial = string.IsNullOrWhiteSpace(body.RazaoSocial) ? null : body.RazaoSocial.Trim(),
            Cnpj = string.IsNullOrWhiteSpace(body.Cnpj) ? null : body.Cnpj.Trim(),
            Status = "Ativo"
        };

        _db.Escolas.Add(entidade);
        await _db.SaveChangesAsync(ct);

        var dto = new EscolaListItemDto(
            entidade.Id,
            entidade.CodigoEscola,
            entidade.NomeFantasia,
            entidade.Status);
        return StatusCode(StatusCodes.Status201Created, dto);
    }

    private bool IsSuperAdmin() => this.GetUserContext().IsSuperAdmin;
}

public sealed record EscolaListItemDto(int Id, string CodigoEscola, string NomeFantasia, string Status);

public sealed class CriarEscolaRequest
{
    public string CodigoEscola { get; set; } = string.Empty;
    public string NomeFantasia { get; set; } = string.Empty;
    public string? RazaoSocial { get; set; }
    public string? Cnpj { get; set; }
}
