using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace Learly.API.Tests;

public sealed class UsuariosControllerIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public UsuariosControllerIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CriarParaMinhaEscola_ComDadosValidos_DeveRetornar201()
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

        var emailNovo = $"novo.usuario.{Guid.NewGuid():N}@learly.com";
        var createResponse = await client.PostAsJsonAsync("/api/usuarios/minha-escola", new
        {
            nomeCompleto = "Novo Colaborador",
            email = emailNovo,
            senha = "SenhaForte1",
            perfilId = CustomWebApplicationFactory.PerfilProfessorTenantId
        });

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var body = await createResponse.Content.ReadFromJsonAsync<CriarUsuarioResponseDto>(jsonOptions);
        Assert.NotNull(body);
        Assert.True(body!.Id > 0);
    }

    [Fact]
    public async Task ListarMinhaEscola_DeveRetornarSomenteUsuariosDoTenant()
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

        var response = await client.GetAsync("/api/usuarios/minha-escola");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var usuarios = await response.Content.ReadFromJsonAsync<List<UsuarioMinhaEscolaItemDto>>(jsonOptions);
        Assert.NotNull(usuarios);
        Assert.NotEmpty(usuarios!);
        Assert.DoesNotContain(usuarios!, u => string.Equals(u.Email, "super@learly.com", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(usuarios!, u => string.Equals(u.Email, "comum@learly.com", StringComparison.OrdinalIgnoreCase));
    }

    private sealed class CriarUsuarioResponseDto
    {
        public int Id { get; set; }
    }

    private sealed class UsuarioMinhaEscolaItemDto
    {
        public int Id { get; set; }
        public string NomeCompleto { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }
}
