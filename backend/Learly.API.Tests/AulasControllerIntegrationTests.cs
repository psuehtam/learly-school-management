using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace Learly.API.Tests;

public sealed class AulasControllerIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public AulasControllerIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task EditarAula_ComStatusInvalido_DeveRetornar400()
    {
        using var client = _factory.CreateClient(new()
        {
            AllowAutoRedirect = false,
            HandleCookies = true,
            BaseAddress = new Uri("https://localhost")
        });

        var loginResponse = await client.PostAsJsonAsync("/auth/login", new
        {
            codigoEscola = "ESC-1",
            email = "comum@learly.com",
            senha = "123456"
        });
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var aulas = await client.GetFromJsonAsync<List<AulaHttpDto>>("/api/aulas");
        Assert.NotNull(aulas);
        var aulaAgendada = aulas!.FirstOrDefault(a => a.Status == "Agendada");
        Assert.NotNull(aulaAgendada);

        var editResponse = await client.PutAsJsonAsync($"/api/aulas/{aulaAgendada!.Id}", new
        {
            status = "STATUS_INVALIDO"
        });

        Assert.Equal(HttpStatusCode.BadRequest, editResponse.StatusCode);
    }

    [Fact]
    public async Task CancelarAulaRealizada_DeveRetornar409()
    {
        using var client = _factory.CreateClient(new()
        {
            AllowAutoRedirect = false,
            HandleCookies = true,
            BaseAddress = new Uri("https://localhost")
        });

        var loginResponse = await client.PostAsJsonAsync("/auth/login", new
        {
            codigoEscola = "ESC-1",
            email = "comum@learly.com",
            senha = "123456"
        });
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var aulas = await client.GetFromJsonAsync<List<AulaHttpDto>>("/api/aulas");
        Assert.NotNull(aulas);
        var aulaRealizada = aulas!.FirstOrDefault(a => a.Status == "Realizada");
        Assert.NotNull(aulaRealizada);

        var cancelResponse = await client.DeleteAsync($"/api/aulas/{aulaRealizada!.Id}");

        Assert.Equal(HttpStatusCode.Conflict, cancelResponse.StatusCode);
    }

    private sealed class AulaHttpDto
    {
        public int Id { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
