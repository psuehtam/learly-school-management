using Learly.API.Auth.Filters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Learly.API.Controllers;

[ApiController]
[Route("api/sistema")]
[Authorize]
[SchoolUserOnly]
public sealed class SistemaController : ControllerBase
{
    /// <summary>Data de referência do servidor (fuso local da API) para cálculos que não devem depender do relógio do navegador.</summary>
    [HttpGet("data-referencia")]
    public ActionResult<DataReferenciaResponse> ObterDataReferencia()
    {
        var hoje = DateOnly.FromDateTime(DateTime.Today);
        return Ok(new DataReferenciaResponse(hoje.ToString("yyyy-MM-dd")));
    }
}

public sealed record DataReferenciaResponse(string DataHoje);
