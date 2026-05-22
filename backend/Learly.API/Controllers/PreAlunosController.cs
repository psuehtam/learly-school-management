using Learly.API.Auth;
using Learly.API.Auth.Filters;
using Learly.API.Http;
using Learly.API.Mapping;
using Learly.Application.Contracts.PreAlunos.Requests;
using Learly.Application.Services.PreAlunos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Learly.API.Controllers;

[ApiController]
[Route("api/pre-alunos")]
[Authorize]
[SchoolUserOnly]
public sealed class PreAlunosController : ControllerBase
{
    private readonly IPreAlunosService _preAlunosService;

    public PreAlunosController(IPreAlunosService preAlunosService)
    {
        _preAlunosService = preAlunosService;
    }

    [HttpGet("livros-interesse")]
    [RequirePermission("VISUALIZAR_PRE_ALUNO")]
    public async Task<IActionResult> ListarLivrosInteresse(CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var r = await _preAlunosService.ListarCatalogoLivrosInteresseAsync(uc, cancellationToken);
        return r.ToActionResult(this);
    }

    [HttpGet]
    [RequirePermission("VISUALIZAR_PRE_ALUNO")]
    public async Task<IActionResult> Listar([FromQuery] ListarPreAlunosQuery? filtro, CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var r = await _preAlunosService.ListarAsync(filtro ?? new ListarPreAlunosQuery(), uc, cancellationToken);
        return r.ToActionResult(this);
    }

    [HttpGet("{id:int}")]
    [RequirePermission("VISUALIZAR_PRE_ALUNO")]
    public async Task<IActionResult> Obter(int id, CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var r = await _preAlunosService.ObterPorIdAsync(id, uc, cancellationToken);
        return r.ToActionResult(this);
    }

    [HttpGet("{id:int}/preparar-conversao")]
    [RequirePermission("APROVAR_MATRICULA")]
    public async Task<IActionResult> PrepararConversao(int id, CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var r = await _preAlunosService.PrepararConversaoAsync(id, uc, cancellationToken);
        return r.ToActionResult(this);
    }

    [HttpGet("{id:int}/documentos")]
    [RequirePermission("VISUALIZAR_PRE_ALUNO", "APROVAR_MATRICULA")]
    public async Task<IActionResult> ListarDocumentos(int id, CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var docs = await _preAlunosService.ListarDocumentosAsync(id, uc, cancellationToken);
        return Ok(docs);
    }

    [HttpPost("{id:int}/documentos")]
    [RequirePermission("EDITAR_PRE_ALUNO", "CRIAR_PRE_ALUNO")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> UploadDocumento(
        int id,
        [FromForm] string tipoCodigo,
        [FromForm] IFormFile arquivo,
        [FromForm] string? nomeExibicao,
        CancellationToken cancellationToken)
    {
        if (arquivo is null || arquivo.Length == 0)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Requisicao invalida",
                Detail = "Arquivo e obrigatorio.",
                Status = StatusCodes.Status400BadRequest
            });
        }

        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        await using var stream = arquivo.OpenReadStream();
        var r = await _preAlunosService.UploadDocumentoAsync(
            id,
            tipoCodigo,
            nomeExibicao,
            arquivo.FileName,
            arquivo.ContentType,
            stream,
            arquivo.Length,
            uc,
            cancellationToken);

        return r.ToActionResult(this);
    }

    [HttpGet("{id:int}/documentos/{tipoCodigo}/arquivo")]
    [RequirePermission("VISUALIZAR_PRE_ALUNO", "APROVAR_MATRICULA")]
    public async Task<IActionResult> DownloadDocumento(int id, string tipoCodigo, CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var arquivo = await _preAlunosService.ObterArquivoDocumentoAsync(id, tipoCodigo, uc, cancellationToken);
        if (arquivo is null || arquivo.Value.Stream is null)
            return NotFound();

        var (stream, contentType, nomeArquivo) = arquivo.Value;
        var tipo = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType;
        return File(stream, tipo, nomeArquivo ?? "documento");
    }

    [HttpPost]
    [RequirePermission("CRIAR_PRE_ALUNO")]
    public async Task<IActionResult> Criar([FromBody] CriarPreAlunoRequest body, CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var r = await _preAlunosService.CriarAsync(body, uc, cancellationToken);
        return r.ToActionResult(this);
    }

    [HttpPut("{id:int}")]
    [RequirePermission("EDITAR_PRE_ALUNO")]
    public async Task<IActionResult> Editar(
        int id,
        [FromBody] CriarPreAlunoRequest body,
        CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var r = await _preAlunosService.EditarAsync(id, body, uc, cancellationToken);
        return r.ToActionResult(this, "Falha ao editar pre-aluno.");
    }

    [HttpPatch("{id:int}/submeter-aprovacao")]
    [RequirePermission("EDITAR_PRE_ALUNO", "CRIAR_PRE_ALUNO")]
    public async Task<IActionResult> SubmeterParaAprovacao(int id, CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var r = await _preAlunosService.SubmeterParaAprovacaoAsync(id, uc, cancellationToken);
        return r.ToActionResult(this, "Falha ao submeter pre-aluno para aprovacao.");
    }

    [HttpPatch("{id:int}/aprovar")]
    [RequirePermission("APROVAR_MATRICULA")]
    public async Task<IActionResult> Aprovar(
        int id,
        [FromBody] AprovarPreAlunoRequest body,
        CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var r = await _preAlunosService.AprovarAsync(id, body, uc, cancellationToken);
        return r.ToActionResult(this, "Falha ao aprovar pre-aluno.");
    }

    [HttpPatch("{id:int}/reprovar")]
    [RequirePermission("REPROVAR_MATRICULA")]
    public async Task<IActionResult> Reprovar(
        int id,
        [FromBody] ReprovarPreAlunoRequest body,
        CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var r = await _preAlunosService.ReprovarAsync(id, body, uc, cancellationToken);
        return r.ToActionResult(this, "Falha ao recusar pre-aluno.");
    }

    [HttpPatch("{id:int}/cancelar")]
    [RequirePermission("CANCELAR_PRE_ALUNO")]
    public async Task<IActionResult> Cancelar(int id, CancellationToken cancellationToken)
    {
        var uc = AppUserContextMapper.From(HttpContext.GetUserContext());
        var r = await _preAlunosService.CancelarAsync(id, uc, cancellationToken);
        return r.ToActionResult(this, "Falha ao cancelar pre-aluno.");
    }
}
