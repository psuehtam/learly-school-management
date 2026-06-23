using Learly.API.Auth;
using Learly.API.Auth.Filters;
using Learly.API.Http;
using Learly.API.Mapping;
using Learly.Application.Contracts.Alunos.Requests;
using Learly.Application.Contracts.Alunos.Responses;
using Learly.Application.Services.Alunos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Learly.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[SchoolUserOnly]
public sealed class AlunosController : ControllerBase
{
    private readonly IAlunosService _alunosService;
    private readonly IAlunoPerfilService _alunoPerfilService;

    public AlunosController(IAlunosService alunosService, IAlunoPerfilService alunoPerfilService)
    {
        _alunosService = alunosService;
        _alunoPerfilService = alunoPerfilService;
    }

    [HttpGet]
    [RequirePermission("VISUALIZAR_ALUNO")]
    public async Task<IActionResult> Listar([FromQuery] ListarAlunosQuery? filtro, CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var resultado = await _alunosService.ListarAsync(filtro ?? new ListarAlunosQuery(), uc, cancellationToken);
        return resultado.ToActionResult(this);
    }

    [HttpGet("{id:int}")]
    [RequirePermission("VISUALIZAR_ALUNO")]
    public async Task<IActionResult> ObterPorId(int id, CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var resultado = await _alunosService.ObterPorIdAsync(id, uc, cancellationToken);
        return resultado.ToActionResult(this);
    }

    [HttpGet("{alunoId:int}/ocorrencias")]
    [RequirePermission("VISUALIZAR_OCORRENCIA")]
    public async Task<IActionResult> ListarOcorrencias(int alunoId, CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var itens = await _alunoPerfilService.ListarOcorrenciasAsync(alunoId, uc, cancellationToken);
        return Ok(itens);
    }

    [HttpPost("{alunoId:int}/ocorrencias")]
    [RequirePermission("CRIAR_OCORRENCIA_ACADEMICA", "CRIAR_OCORRENCIA_ADMINISTRATIVA")]
    public async Task<IActionResult> CriarOcorrencia(
        int alunoId,
        [FromBody] SalvarAlunoOcorrenciaRequest body,
        CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var (ok, item, erro, status) = await _alunoPerfilService.SalvarOcorrenciaAsync(
            alunoId, null, body, uc, cancellationToken);

        if (!ok)
            return StatusCode(status, new ProblemDetails { Title = "Falha", Detail = erro, Status = status });

        return item is null ? StatusCode(status) : StatusCode(status, item);
    }

    [HttpPut("{alunoId:int}/ocorrencias/{ocorrenciaId:int}")]
    [RequirePermission("EDITAR_OCORRENCIA")]
    public async Task<IActionResult> AtualizarOcorrencia(
        int alunoId,
        int ocorrenciaId,
        [FromBody] SalvarAlunoOcorrenciaRequest body,
        CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var (ok, item, erro, status) = await _alunoPerfilService.SalvarOcorrenciaAsync(
            alunoId, ocorrenciaId, body, uc, cancellationToken);

        if (!ok)
            return StatusCode(status, new ProblemDetails { Title = "Falha", Detail = erro, Status = status });

        return item is null ? StatusCode(status) : Ok(item);
    }

    [HttpGet("{alunoId:int}/documentos")]
    [RequirePermission("VISUALIZAR_ALUNO")]
    public async Task<IActionResult> ListarDocumentos(int alunoId, CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var itens = await _alunoPerfilService.ListarDocumentosAsync(alunoId, uc, cancellationToken);
        return Ok(itens);
    }

    [HttpPost("{alunoId:int}/documentos")]
    [RequirePermission("ANEXAR_DOCUMENTO_ALUNO")]
    public IActionResult AnexarDocumento(int alunoId)
    {
        return StatusCode(StatusCodes.Status501NotImplemented, new ProblemDetails
        {
            Title = "Em desenvolvimento",
            Detail = "Upload de documentos do aluno sera disponibilizado em breve.",
            Status = StatusCodes.Status501NotImplemented
        });
    }

    [HttpDelete("{alunoId:int}/documentos/{documentoId:int}")]
    [RequirePermission("EXCLUIR_DOCUMENTO_ALUNO")]
    public IActionResult ExcluirDocumento(int alunoId, int documentoId)
    {
        return StatusCode(StatusCodes.Status501NotImplemented, new ProblemDetails
        {
            Title = "Em desenvolvimento",
            Detail = "Exclusao de documentos do aluno sera disponibilizada em breve.",
            Status = StatusCodes.Status501NotImplemented
        });
    }

    [HttpGet("{alunoId:int}/faltas")]
    [RequirePermission("VISUALIZAR_PRESENCA")]
    public async Task<IActionResult> ListarFaltas(int alunoId, CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var itens = await _alunoPerfilService.ListarFaltasAsync(alunoId, uc, cancellationToken);
        return Ok(itens);
    }

    [HttpPatch("{alunoId:int}/faltas/{presencaId:int}/justificar")]
    [RequirePermission("JUSTIFICAR_FALTA_ALUNO")]
    public async Task<IActionResult> JustificarFalta(
        int alunoId,
        int presencaId,
        [FromBody] JustificarAlunoFaltaRequest body,
        CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var (ok, erro, status) = await _alunoPerfilService.JustificarFaltaAsync(
            alunoId, presencaId, body, uc, cancellationToken);

        if (!ok)
            return StatusCode(status, new ProblemDetails { Title = "Falha", Detail = erro, Status = status });

        return NoContent();
    }
}
