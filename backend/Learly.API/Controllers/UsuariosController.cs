using Learly.API.Auth;
using Learly.API.Auth.Filters;
using Learly.API.Mapping;
using Learly.Application.Contracts.Usuarios.Requests;
using Learly.Application.Contracts.Usuarios.Responses;
using Learly.Application.Services.Usuarios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Learly.API.Controllers;

/// <summary>
/// Gestao de usuarios no tenant da escola.
/// <see cref="SchoolUserOnlyAttribute"/> garante usuario de escola (nao super admin) com <c>codigoEscola</c> no token.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[SchoolUserOnly]
public sealed class UsuariosController : ControllerBase
{
    private readonly IUsuariosService _usuariosService;

    public UsuariosController(IUsuariosService usuariosService)
    {
        _usuariosService = usuariosService;
    }

    /// <summary>Lista usuarios do mesmo tenant (escola) do token.</summary>
    [HttpGet("minha-escola")]
    [Authorize(Policy = "VISUALIZAR_USUARIO")]
    public async Task<ActionResult<IReadOnlyList<UsuarioMinhaEscolaListItemResponse>>> ListarMinhaEscola(
        CancellationToken cancellationToken)
    {
        var itens = await _usuariosService.ListarMinhaEscolaAsync(
            AppUserContextMapper.From(HttpContext.GetUserContext()),
            cancellationToken);
        return Ok(itens);
    }

    /// <summary>Lista perfis ativos da escola do token para uso no cadastro de usuario.</summary>
    [HttpGet("minha-escola/perfis")]
    [Authorize(Policy = "CRIAR_USUARIO")]
    public async Task<ActionResult<IReadOnlyList<PerfilMinhaEscolaListItemResponse>>> ListarPerfisMinhaEscola(
        CancellationToken cancellationToken)
    {
        var itens = await _usuariosService.ListarPerfisMinhaEscolaAsync(
            AppUserContextMapper.From(HttpContext.GetUserContext()),
            cancellationToken);
        return Ok(itens);
    }

    /// <summary>Cria usuario apenas na escola do token (CodigoEscola); ignora qualquer escola enviada implicitamente no corpo.</summary>
    [HttpPost("minha-escola")]
    [Authorize(Policy = "CRIAR_USUARIO")]
    public async Task<ActionResult<CriarUsuarioResponse>> CriarParaMinhaEscola(
        [FromBody] CriarUsuarioParaMinhaEscolaRequest body,
        CancellationToken cancellationToken)
    {
        var criado = await _usuariosService.CriarParaMinhaEscolaAsync(
            AppUserContextMapper.From(HttpContext.GetUserContext()),
            body,
            cancellationToken);
        return StatusCode(StatusCodes.Status201Created, criado);
    }

    /// <summary>Edita dados de um usuario da escola do token.</summary>
    [HttpPut("minha-escola/{usuarioId:int}")]
    [Authorize(Policy = "EDITAR_USUARIO")]
    public async Task<IActionResult> EditarDaMinhaEscola(
        int usuarioId,
        [FromBody] EditarUsuarioMinhaEscolaRequest body,
        CancellationToken cancellationToken)
    {
        await _usuariosService.EditarDaMinhaEscolaAsync(
            usuarioId,
            AppUserContextMapper.From(HttpContext.GetUserContext()),
            body,
            cancellationToken);
        return NoContent();
    }
}
