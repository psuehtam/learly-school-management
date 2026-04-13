using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace Learly.API.Tests;

public sealed class AuthorizationMatrixTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public AuthorizationMatrixTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task UsuarioComum_DeveReceber403_AoCriarEscola()
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

        var createResponse = await client.PostAsJsonAsync("/api/escolas", new
        {
            codigoEscola = "ESC-NEW",
            nomeFantasia = "Nova Escola"
        });

        Assert.Equal(HttpStatusCode.Forbidden, createResponse.StatusCode);
    }

    [Fact]
    public async Task SuperAdmin_DeveConseguirCriarEscola()
    {
        using var client = _factory.CreateClient(new()
        {
            AllowAutoRedirect = false,
            HandleCookies = true,
            BaseAddress = new Uri("https://localhost")
        });

        var loginResponse = await client.PostAsJsonAsync("/auth/login", new
        {
            codigoEscola = (string?)null,
            email = "super@learly.com",
            senha = "123456"
        });
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var createResponse = await client.PostAsJsonAsync("/api/escolas", new
        {
            codigoEscola = "ESC-NOVA",
            nomeFantasia = "Escola Nova"
        });

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
    }
}
