using Learly.API.Auth;
using Learly.API.Auth.Filters;
using Learly.API.Http;
using Learly.API.Mapping;
using Learly.Application.Contracts.Escolas.Requests;
using Learly.Application.Contracts.Escolas.Responses;
using Learly.Application.Services.Escolas;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Learly.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class EscolasController : ControllerBase
{
    private readonly IEscolasService _escolasService;

    public EscolasController(IEscolasService escolasService)
    {
        _escolasService = escolasService;
    }

    /// <summary>
    /// Super Admin: todas as escolas. Usuário de escola: apenas a própria (tenant).
    /// </summary>
    [HttpGet]
    [ServiceFilter(typeof(EscolaListagemAuthorizeFilter))]
    public async Task<ActionResult<IReadOnlyList<EscolaListItemResponse>>> Listar(
        CancellationToken cancellationToken)
    {
        var listagem = await _escolasService.ListarAsync(AppUserContextMapper.From(HttpContext.GetUserContext()), cancellationToken);
        if (listagem.ContextoTenantInvalido)
        {
            return Forbid();
        }

        return Ok(listagem.Itens);
    }

    /// <summary>Apenas Super Admin pode criar escolas (novo tenant).</summary>
    [HttpPost]
    [SuperAdminOnly]
    public async Task<IActionResult> Criar([FromBody] CriarEscolaRequest body, CancellationToken cancellationToken)
    {
        var resultado = await _escolasService.CriarAsync(body, cancellationToken);
        return resultado.ToActionResult(this);
    }
}
