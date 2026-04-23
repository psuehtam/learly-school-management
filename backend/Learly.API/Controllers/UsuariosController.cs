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
/// <see cref="EscolaListagemAuthorizeFilter"/> exige VISUALIZAR_ESCOLAS ou GERENCIAR_ESCOLAS (alinhado ao padrao de <see cref="EscolasController"/>).
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

    /// <summary>Cria usuario apenas na escola do token (CodigoEscola); ignora qualquer escola enviada implicitamente no corpo.</summary>
    [HttpPost("minha-escola")]
    [ServiceFilter(typeof(EscolaListagemAuthorizeFilter))]
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
}
