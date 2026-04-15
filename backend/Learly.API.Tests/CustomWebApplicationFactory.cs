using Learly.Domain.Entities;
using Learly.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Learly.API.Tests;

public sealed class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private static readonly InMemoryDatabaseRoot DatabaseRoot = new();
    public static int AulaAgendadaId { get; private set; }
    public static int AulaRealizadaId { get; private set; }

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
            services.RemoveAll(typeof(DbContextOptions<LearlyDbContext>));
            services.AddDbContext<LearlyDbContext>(options =>
                options.UseInMemoryDatabase("learly-tests", DatabaseRoot));

            using var scope = services.BuildServiceProvider().CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<LearlyDbContext>();
            db.Database.EnsureDeleted();
            db.Database.EnsureCreated();
            Seed(db);
        });
    }

    private static void Seed(LearlyDbContext db)
    {
        db.Aulas.RemoveRange(db.Aulas);
        db.Turmas.RemoveRange(db.Turmas);
        db.UsuarioPermissoes.RemoveRange(db.UsuarioPermissoes);
        db.PerfilPermissoes.RemoveRange(db.PerfilPermissoes);
        db.Usuarios.RemoveRange(db.Usuarios);
        db.Permissoes.RemoveRange(db.Permissoes);
        db.Perfis.RemoveRange(db.Perfis);
        db.Escolas.RemoveRange(db.Escolas);
        db.SaveChanges();

        var escolaSistema = new Escola { CodigoEscola = "SYSTEM", NomeFantasia = "System", Status = "Ativo" };
        var escolaTenant = new Escola { CodigoEscola = "ESC-1", NomeFantasia = "Tenant 1", Status = "Ativo" };
        db.Escolas.AddRange(escolaSistema, escolaTenant);
        db.SaveChanges();

        var perfilSuper = new Perfil { EscolaId = escolaSistema.Id, Nome = "Super Admin", Status = "Ativo" };
        var perfilComum = new Perfil { EscolaId = escolaTenant.Id, Nome = "Administrador", Status = "Ativo" };
        var perfilProfessor = new Perfil { EscolaId = escolaTenant.Id, Nome = "Professor", Status = "Ativo" };
        db.Perfis.AddRange(perfilSuper, perfilComum, perfilProfessor);
        db.SaveChanges();

        var pGerenciar = new Permissao { Nome = "GERENCIAR_ESCOLAS" };
        var pVisualizar = new Permissao { Nome = "VISUALIZAR_ESCOLAS" };
        var pVisualizarAula = new Permissao { Nome = "VISUALIZAR_AULA" };
        var pEditarAula = new Permissao { Nome = "EDITAR_AULA" };
        var pCancelarAula = new Permissao { Nome = "CANCELAR_AULA" };
        db.Permissoes.AddRange(pGerenciar, pVisualizar, pVisualizarAula, pEditarAula, pCancelarAula);
        db.SaveChanges();

        db.PerfilPermissoes.Add(new PerfilPermissao { PerfilId = perfilSuper.Id, PermissaoId = pGerenciar.Id });
        db.PerfilPermissoes.Add(new PerfilPermissao { PerfilId = perfilSuper.Id, PermissaoId = pVisualizar.Id });
        db.PerfilPermissoes.Add(new PerfilPermissao { PerfilId = perfilComum.Id, PermissaoId = pVisualizar.Id });
        db.PerfilPermissoes.Add(new PerfilPermissao { PerfilId = perfilComum.Id, PermissaoId = pVisualizarAula.Id });
        db.PerfilPermissoes.Add(new PerfilPermissao { PerfilId = perfilComum.Id, PermissaoId = pEditarAula.Id });
        db.PerfilPermissoes.Add(new PerfilPermissao { PerfilId = perfilComum.Id, PermissaoId = pCancelarAula.Id });
        db.PerfilPermissoes.Add(new PerfilPermissao { PerfilId = perfilProfessor.Id, PermissaoId = pVisualizarAula.Id });

        db.Usuarios.Add(new Usuario
        {
            EscolaId = escolaSistema.Id,
            PerfilId = perfilSuper.Id,
            NomeCompleto = "Super User",
            Email = "super@learly.com",
            Senha = BCrypt.Net.BCrypt.HashPassword("123456"),
            Status = "Ativo"
        });
        db.Usuarios.Add(new Usuario
        {
            EscolaId = escolaTenant.Id,
            PerfilId = perfilComum.Id,
            NomeCompleto = "Usuario Comum",
            Email = "comum@learly.com",
            Senha = BCrypt.Net.BCrypt.HashPassword("123456"),
            Status = "Ativo"
        });
        var professor = new Usuario
        {
            EscolaId = escolaTenant.Id,
            PerfilId = perfilProfessor.Id,
            NomeCompleto = "Professor 1",
            Email = "professor@learly.com",
            Senha = BCrypt.Net.BCrypt.HashPassword("123456"),
            Status = "Ativo"
        };
        db.Usuarios.Add(professor);
        db.SaveChanges();

        var turma = new Turma
        {
            EscolaId = escolaTenant.Id,
            ProfessorId = professor.Id,
            LivroId = 1,
            Nome = "Turma Teste",
            Status = "Ativa"
        };
        db.Turmas.Add(turma);
        db.SaveChanges();

        var aulaAgendada = new Aula
        {
            EscolaId = escolaTenant.Id,
            TurmaId = turma.Id,
            ProfessorId = professor.Id,
            NumeroAula = 1,
            DataAula = new DateOnly(2026, 4, 10),
            HorarioInicio = new TimeOnly(9, 0),
            HorarioFim = new TimeOnly(10, 0),
            TipoAula = "Normal",
            Status = "Agendada"
        };
        db.Aulas.Add(aulaAgendada);

        var aulaRealizada = new Aula
        {
            EscolaId = escolaTenant.Id,
            TurmaId = turma.Id,
            ProfessorId = professor.Id,
            NumeroAula = 2,
            DataAula = new DateOnly(2026, 4, 11),
            HorarioInicio = new TimeOnly(9, 0),
            HorarioFim = new TimeOnly(10, 0),
            TipoAula = "Normal",
            Status = "Realizada"
        };
        db.Aulas.Add(aulaRealizada);

        db.SaveChanges();
        AulaAgendadaId = aulaAgendada.Id;
        AulaRealizadaId = aulaRealizada.Id;
    }
}
