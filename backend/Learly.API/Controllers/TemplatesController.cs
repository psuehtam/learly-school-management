using Learly.API.Auth.Filters;
using Learly.Application.Contracts.Templates.Requests;
using Learly.Application.Contracts.Templates.Responses;
using Learly.Application.Services.Templates;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Learly.API.Controllers;

/// <summary>Gestão de templates de perfil/permissão (Super Admin).</summary>
[ApiController]
[Route("api/templates")]
[Authorize]
[SuperAdminOnly]
public sealed class TemplatesController : ControllerBase
{
    private readonly ITemplatesAdminService _templatesAdmin;

    public TemplatesController(ITemplatesAdminService templatesAdmin)
    {
        _templatesAdmin = templatesAdmin;
    }

    /// <summary>Lista todos os perfis de template.</summary>
    [HttpGet("perfis")]
    public async Task<ActionResult<IReadOnlyList<PerfilTemplateListItemResponse>>> ListarPerfis(
        CancellationToken cancellationToken)
    {
        var itens = await _templatesAdmin.ListarPerfisTemplateAsync(cancellationToken);
        return Ok(itens);
    }

    /// <summary>Lista todas as permissões do sistema agrupadas por módulo (inferido pelo nome).</summary>
    [HttpGet("permissoes")]
    public async Task<ActionResult<IReadOnlyList<PermissaoModuloGrupoResponse>>> ListarPermissoesAgrupadas(
        CancellationToken cancellationToken)
    {
        var grupos = await _templatesAdmin.ListarPermissoesAgrupadasAsync(cancellationToken);
        return Ok(grupos);
    }

    /// <summary>Retorna os IDs de permissões vinculados ao perfil de template.</summary>
    [HttpGet("perfis/{perfilTemplateId:int}/permissoes")]
    public async Task<ActionResult<PerfilTemplatePermissoesResponse>> ObterPermissoesDoPerfil(
        int perfilTemplateId,
        CancellationToken cancellationToken)
    {
        var dto = await _templatesAdmin.ObterPermissoesDoPerfilTemplateAsync(perfilTemplateId, cancellationToken);
        if (dto is null)
        {
            return NotFound();
        }

        return Ok(dto);
    }

    /// <summary>Substitui todas as permissões do perfil de template pelas informadas.</summary>
    [HttpPost("perfis/{perfilTemplateId:int}/permissoes")]
    public async Task<IActionResult> SalvarPermissoesDoPerfil(
        int perfilTemplateId,
        [FromBody] SalvarTemplatePermissoesRequest body,
        CancellationToken cancellationToken)
    {
        var resultado = await _templatesAdmin.SalvarPermissoesDoPerfilTemplateAsync(perfilTemplateId, body, cancellationToken);
        return resultado switch
        {
            SalvarTemplatePermissoesResultado.IdRotaCorpoInconsistente => BadRequest(new ProblemDetails
            {
                Title = "Requisicao invalida",
                Detail = "PerfilTemplateId do corpo deve ser igual ao da rota.",
                Status = StatusCodes.Status400BadRequest
            }),
            SalvarTemplatePermissoesResultado.PerfilNaoEncontrado => NotFound(),
            _ => NoContent()
        };
    }
}
