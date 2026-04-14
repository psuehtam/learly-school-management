using Learly.API.Auth;
using Learly.API.Auth.Filters;
using Learly.Application.Services.Common;
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
    public async Task<IActionResult> Listar(CancellationToken ct)
    {
        var rawUserContext = this.GetUserContext();
        if (!rawUserContext.IsSuperAdmin &&
            !rawUserContext.HasPermission("VISUALIZAR_ESCOLAS") &&
            !rawUserContext.HasPermission("GERENCIAR_ESCOLAS"))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ProblemDetails
            {
                Title = "Permissao insuficiente",
                Detail = "Permissao necessaria: VISUALIZAR_ESCOLAS ou GERENCIAR_ESCOLAS",
                Status = StatusCodes.Status403Forbidden
            });
        }

        var uc = ToAppUserContext(rawUserContext);
        var escolas = await _escolasService.ListarAsync(uc, ct);
        if (!uc.IsSuperAdmin && string.IsNullOrWhiteSpace(uc.CodigoEscola))
        {
            return Forbid();
        }
        return Ok(escolas);
    }

    /// <summary>Apenas Super Admin pode criar escolas (novo tenant).</summary>
    [HttpPost]
    [SuperAdminOnly]
    public async Task<IActionResult> Criar([FromBody] CriarEscolaRequest body, CancellationToken ct)
    {
        var result = await _escolasService.CriarAsync(new CriarEscolaInput
        {
            CodigoEscola = body.CodigoEscola,
            NomeFantasia = body.NomeFantasia,
            RazaoSocial = body.RazaoSocial,
            Cnpj = body.Cnpj
        }, ct);
        if (!result.Success || result.Escola is null)
        {
            var isConflict = string.Equals(result.Error, "Ja existe escola com este codigo.", StringComparison.Ordinal);
            if (isConflict)
            {
                return Conflict(new ProblemDetails
                {
                    Title = "Conflito",
                    Detail = result.Error,
                    Status = StatusCodes.Status409Conflict
                });
            }
            return BadRequest(new ProblemDetails
            {
                Title = "Requisicao invalida",
                Detail = result.Error ?? "Falha ao criar escola.",
                Status = StatusCodes.Status400BadRequest
            });
        }

        return StatusCode(StatusCodes.Status201Created, result.Escola);
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

public sealed class CriarEscolaRequest
{
    public string CodigoEscola { get; set; } = string.Empty;
    public string NomeFantasia { get; set; } = string.Empty;
    public string? RazaoSocial { get; set; }
    public string? Cnpj { get; set; }
}
