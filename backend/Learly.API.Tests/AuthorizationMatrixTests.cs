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
            nomeFantasia = "Nova Escola",
            adminNomeCompleto = "Admin ESC-NEW",
            adminEmail = "admin-esc-new@learly.com",
            adminPassword = "Admin123"
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
            nomeFantasia = "Escola Nova",
            adminNomeCompleto = "Admin Escola Nova",
            adminEmail = "admin-escola-nova@learly.com",
            adminPassword = "Admin123"
        });

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var loginAdminCriado = await client.PostAsJsonAsync("/auth/login", new
        {
            codigoEscola = "ESC-NOVA",
            email = "admin-escola-nova@learly.com",
            senha = "Admin123"
        });
        Assert.Equal(HttpStatusCode.OK, loginAdminCriado.StatusCode);
    }

    [Fact]
    public async Task SuperAdmin_DeveReceber409_QuandoEmailAdminJaExistir()
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
            codigoEscola = "ESC-DUP-EMAIL",
            nomeFantasia = "Escola Duplicada",
            adminNomeCompleto = "Admin Duplicado",
            adminEmail = "comum@learly.com",
            adminPassword = "Admin123"
        });

        Assert.Equal(HttpStatusCode.Conflict, createResponse.StatusCode);
    }

    [Fact]
    public async Task SuperAdmin_DeveReceber400_QuandoSenhaAdminForFraca()
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
            codigoEscola = "ESC-SENHA-FRACA",
            nomeFantasia = "Escola Senha Fraca",
            adminNomeCompleto = "Admin Fraco",
            adminEmail = "admin-fraco@learly.com",
            adminPassword = "1234567"
        });

        Assert.Equal(HttpStatusCode.BadRequest, createResponse.StatusCode);
    }
}
