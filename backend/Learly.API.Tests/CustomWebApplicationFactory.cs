using Learly.Domain.Entities;
using Learly.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Learly.API.Tests;

public sealed class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "TEST_ONLY_SUPER_SECRET_KEY_WITH_AT_LEAST_32_CHARS",
                ["Jwt:Issuer"] = "LearlyAPI",
                ["Jwt:Audience"] = "LearlyClient",
                ["Jwt:ExpireMinutes"] = "60"
            });
        });
        builder.ConfigureServices(services =>
        {
            using var scope = services.BuildServiceProvider().CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<LearlyDbContext>();
            db.Database.EnsureDeleted();
            db.Database.EnsureCreated();
            Seed(db);
        });
    }

    private static void Seed(LearlyDbContext db)
    {
        var escolaSistema = new Escola { Id = 1, CodigoEscola = "SYSTEM", NomeFantasia = "System", Status = "Ativo" };
        var escolaTenant = new Escola { Id = 2, CodigoEscola = "ESC-1", NomeFantasia = "Tenant 1", Status = "Ativo" };
        db.Escolas.AddRange(escolaSistema, escolaTenant);

        var perfilSuper = new Perfil { Id = 1, EscolaId = 1, Nome = "Super Admin", Status = "Ativo" };
        var perfilComum = new Perfil { Id = 2, EscolaId = 2, Nome = "Administrador", Status = "Ativo" };
        db.Perfis.AddRange(perfilSuper, perfilComum);

        var pGerenciar = new Permissao { Id = 1, Nome = "GERENCIAR_ESCOLAS" };
        var pVisualizar = new Permissao { Id = 2, Nome = "VISUALIZAR_ESCOLAS" };
        db.Permissoes.AddRange(pGerenciar, pVisualizar);

        db.PerfilPermissoes.Add(new PerfilPermissao { PerfilId = 1, PermissaoId = 1 });
        db.PerfilPermissoes.Add(new PerfilPermissao { PerfilId = 1, PermissaoId = 2 });
        db.PerfilPermissoes.Add(new PerfilPermissao { PerfilId = 2, PermissaoId = 2 });

        db.Usuarios.Add(new Usuario
        {
            Id = 1,
            EscolaId = 1,
            PerfilId = 1,
            NomeCompleto = "Super User",
            Email = "super@learly.com",
            Senha = BCrypt.Net.BCrypt.HashPassword("123456"),
            Status = "Ativo"
        });
        db.Usuarios.Add(new Usuario
        {
            Id = 2,
            EscolaId = 2,
            PerfilId = 2,
            NomeCompleto = "Usuario Comum",
            Email = "comum@learly.com",
            Senha = BCrypt.Net.BCrypt.HashPassword("123456"),
            Status = "Ativo"
        });

        db.SaveChanges();
    }
}
