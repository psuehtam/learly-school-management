using Learly.API.Auth;
using Learly.API.Auth.Filters;
using Learly.Application.Services.Aulas;
using Learly.Application.Services.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Learly.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[SchoolUserOnly]
public sealed class AulasController : ControllerBase
{
    private readonly IAulasService _aulasService;

    public AulasController(IAulasService aulasService)
    {
        _aulasService = aulasService;
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
        var uc = ToAppUserContext(this.GetUserContext());
        var aulas = await _aulasService.ListarAsync(uc, ct);
        return Ok(aulas);
    }

    [HttpGet("{id:int}")]
    [RequirePermission("VISUALIZAR_AULA")]
    public async Task<IActionResult> ObterPorId(int id, CancellationToken ct)
    {
        var uc = ToAppUserContext(this.GetUserContext());
        var aula = await _aulasService.ObterPorIdAsync(id, uc, ct);
        if (aula is null) return NotFound(new { message = "Aula nao encontrada." });
        return Ok(aula);
    }

    [HttpPost]
    [RequirePermission("CRIAR_AULA")]
    public async Task<IActionResult> Criar([FromBody] CriarAulaRequest body, CancellationToken ct)
    {
        var uc = ToAppUserContext(this.GetUserContext());
        var result = await _aulasService.CriarAsync(new CriarAulaInput
        {
            TurmaId = body.TurmaId,
            CapituloId = body.CapituloId,
            ProfessorId = body.ProfessorId,
            NumeroAula = body.NumeroAula,
            DataAula = body.DataAula,
            HorarioInicio = body.HorarioInicio,
            HorarioFim = body.HorarioFim,
            ConteudoDado = body.ConteudoDado,
            TipoAula = body.TipoAula
        }, uc, ct);
        if (!result.Success || !result.Id.HasValue)
        {
            if (string.Equals(result.Error, "Acesso negado.", StringComparison.Ordinal))
            {
                return Forbid();
            }
            return BadRequest(new ProblemDetails
            {
                Title = "Requisicao invalida",
                Detail = result.Error ?? "Falha ao criar aula.",
                Status = StatusCodes.Status400BadRequest
            });
        }
        return StatusCode(StatusCodes.Status201Created, new { id = result.Id.Value });
    }

    [HttpPut("{id:int}")]
    [RequirePermission("EDITAR_AULA")]
    public async Task<IActionResult> Editar(int id, [FromBody] EditarAulaRequest body, CancellationToken ct)
    {
        var uc = ToAppUserContext(this.GetUserContext());
        var result = await _aulasService.EditarAsync(id, new EditarAulaInput
        {
            CapituloId = body.CapituloId,
            DataAula = body.DataAula,
            HorarioInicio = body.HorarioInicio,
            HorarioFim = body.HorarioFim,
            ConteudoDado = body.ConteudoDado,
            Status = body.Status
        }, uc, ct);
        if (!result.Success)
        {
            if (result.StatusCode == StatusCodes.Status404NotFound)
                return NotFound(new ProblemDetails { Title = "Nao encontrado", Detail = result.Error, Status = result.StatusCode });
            if (result.StatusCode == StatusCodes.Status403Forbidden)
                return StatusCode(result.StatusCode, new ProblemDetails { Title = "Acesso negado", Detail = result.Error, Status = result.StatusCode });
        }
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [RequirePermission("CANCELAR_AULA")]
    public async Task<IActionResult> Cancelar(int id, CancellationToken ct)
    {
        var uc = ToAppUserContext(this.GetUserContext());
        var result = await _aulasService.CancelarAsync(id, uc, ct);
        if (!result.Success)
        {
            if (result.StatusCode == StatusCodes.Status404NotFound)
                return NotFound(new ProblemDetails { Title = "Nao encontrado", Detail = result.Error, Status = result.StatusCode });
            if (result.StatusCode == StatusCodes.Status403Forbidden)
                return StatusCode(result.StatusCode, new ProblemDetails { Title = "Acesso negado", Detail = result.Error, Status = result.StatusCode });
        }
        return NoContent();
    }

    private static AppUserContext ToAppUserContext(UserContext uc) => new()
    {
        UserId = uc.UserId,
        Perfil = uc.Perfil,
        CodigoEscola = uc.CodigoEscola,
        IsSuperAdmin = uc.IsSuperAdmin,
        Permissions = uc.Permissions
    };
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
