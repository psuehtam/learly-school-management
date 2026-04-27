using Learly.API.Auth;
using Learly.API.Auth.Filters;
using Learly.API.Http;
using Learly.API.Mapping;
using Learly.Application.Contracts.Aulas.Requests;
using Learly.Application.Contracts.Aulas.Responses;
using Learly.Application.Contracts.Common;
using Learly.Application.Services.Aulas;
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

    [HttpGet]
    [RequirePermission("VISUALIZAR_AULA")]
    public async Task<ActionResult<IReadOnlyList<AulaListItemResponse>>> Listar(CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var aulas = await _aulasService.ListarAsync(uc, cancellationToken);
        return Ok(aulas);
    }

    [HttpGet("{id:int}")]
    [RequirePermission("VISUALIZAR_AULA")]
    public async Task<ActionResult<AulaListItemResponse>> ObterPorId(int id, CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var aula = await _aulasService.ObterPorIdAsync(id, uc, cancellationToken);
        if (aula is null)
        {
            return NotFound(new MensagemResponse("Aula nao encontrada."));
        }

        return Ok(aula);
    }

    [HttpPost]
    [RequirePermission("CRIAR_AULA")]
    public async Task<IActionResult> Criar([FromBody] CriarAulaRequest body, CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var resultado = await _aulasService.CriarAsync(body, uc, cancellationToken);
        return resultado.ToActionResult(this);
    }

    [HttpPut("{id:int}")]
    [RequirePermission("EDITAR_AULA")]
    public async Task<IActionResult> Editar(int id, [FromBody] EditarAulaRequest body, CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var resultado = await _aulasService.EditarAsync(id, body, uc, cancellationToken);
        return resultado.ToActionResult(this, "Falha ao editar aula.");
    }

    [HttpDelete("{id:int}")]
    [RequirePermission("CANCELAR_AULA")]
    public async Task<IActionResult> Cancelar(int id, CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var resultado = await _aulasService.CancelarAsync(id, uc, cancellationToken);
        return resultado.ToActionResult(this, "Falha ao cancelar aula.");
    }
}
