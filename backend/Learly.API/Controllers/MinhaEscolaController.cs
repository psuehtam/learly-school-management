using Learly.API.Auth;
using Learly.API.Auth.Filters;
using Learly.API.Http;
using Learly.API.Mapping;
using Learly.Application.Contracts.Escolas.Requests;
using Learly.Application.Services.Escolas;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Learly.API.Controllers;

[ApiController]
[Route("api/minha-escola")]
[Authorize]
[SchoolUserOnly]
public sealed class MinhaEscolaController : ControllerBase
{
    private readonly IEscolasService _escolasService;

    public MinhaEscolaController(IEscolasService escolasService)
    {
        _escolasService = escolasService;
    }

    [HttpGet]
    [RequirePermission("VISUALIZAR_USUARIO", "GERENCIAR_CONFIGURACOES_SISTEMA")]
    public async Task<IActionResult> Obter(CancellationToken cancellationToken)
    {
        var resultado = await _escolasService.ObterMinhaEscolaAsync(
            AppUserContextMapper.From(HttpContext.GetUserContext()),
            cancellationToken);
        return resultado.ToActionResult(this);
    }

    [HttpPut]
    [RequirePermission("GERENCIAR_CONFIGURACOES_SISTEMA")]
    public async Task<IActionResult> Atualizar(
        [FromBody] AtualizarMinhaEscolaRequest body,
        CancellationToken cancellationToken)
    {
        var resultado = await _escolasService.AtualizarMinhaEscolaAsync(
            body,
            AppUserContextMapper.From(HttpContext.GetUserContext()),
            cancellationToken);
        return resultado.ToActionResult(this);
    }

    [HttpGet("configuracoes")]
    [RequirePermission("VISUALIZAR_USUARIO", "GERENCIAR_CONFIGURACOES_SISTEMA")]
    public async Task<IActionResult> ObterConfiguracoes(CancellationToken cancellationToken)
    {
        var resultado = await _escolasService.ObterConfiguracoesAsync(
            AppUserContextMapper.From(HttpContext.GetUserContext()),
            cancellationToken);
        return resultado.ToActionResult(this);
    }

    [HttpGet("configuracoes/consulta-turmas")]
    [RequirePermission("CRIAR_TURMA", "AGENDAR_TURMA", "EDITAR_TURMA", "VISUALIZAR_TURMA", "EDITAR_MATRICULA")]
    public async Task<IActionResult> ObterConfiguracoesConsultaTurmas(CancellationToken cancellationToken)
    {
        var resultado = await _escolasService.ObterConfiguracoesAsync(
            AppUserContextMapper.From(HttpContext.GetUserContext()),
            cancellationToken);
        return resultado.ToActionResult(this);
    }

    [HttpPut("configuracoes")]
    [RequirePermission("GERENCIAR_CONFIGURACOES_SISTEMA")]
    public async Task<IActionResult> AtualizarConfiguracoes(
        [FromBody] AtualizarEscolaConfiguracoesRequest body,
        CancellationToken cancellationToken)
    {
        var resultado = await _escolasService.AtualizarConfiguracoesAsync(
            body,
            AppUserContextMapper.From(HttpContext.GetUserContext()),
            cancellationToken);
        return resultado.ToActionResult(this);
    }

    [HttpPost("logo")]
    [RequirePermission("GERENCIAR_CONFIGURACOES_SISTEMA")]
    public async Task<IActionResult> EnviarLogo(
        [FromForm] IFormFile arquivo,
        CancellationToken cancellationToken)
    {
        if (arquivo is null || arquivo.Length == 0)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Requisicao invalida",
                Detail = "Arquivo obrigatorio.",
                Status = StatusCodes.Status400BadRequest
            });
        }

        await using var stream = arquivo.OpenReadStream();
        var resultado = await _escolasService.EnviarLogoAsync(
            stream,
            arquivo.FileName,
            arquivo.ContentType,
            arquivo.Length,
            AppUserContextMapper.From(HttpContext.GetUserContext()),
            cancellationToken);
        return resultado.ToActionResult(this);
    }

    [HttpGet("logo")]
    [RequirePermission("VISUALIZAR_USUARIO", "GERENCIAR_CONFIGURACOES_SISTEMA")]
    public async Task<IActionResult> ObterLogo(CancellationToken cancellationToken)
    {
        var resultado = await _escolasService.ObterLogoAsync(
            AppUserContextMapper.From(HttpContext.GetUserContext()),
            cancellationToken);
        return resultado.ToActionResult(this);
    }
}
