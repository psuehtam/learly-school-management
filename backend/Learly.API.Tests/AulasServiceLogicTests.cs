using Learly.Application;
using Learly.Application.Contracts.Aulas.Requests;
using Learly.Application.Services.Aulas;
using Learly.Application.Services.Common;
using Learly.Domain.Entities;
using Learly.Infrastructure;
using Learly.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Learly.API.Tests;

public sealed class AulasServiceLogicTests
{
    [Fact]
    public async Task CriarAsync_DeveFalhar_QuandoNumeroAulaForInvalido()
    {
        await using var db = BuildContext();
        SeedBasicSchoolData(db, escolaAtiva: true);
        using var root = BuildServiceProvider(db);
        using var scope = root.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IAulasService>();
        var uc = BuildUserContext(userId: 2, perfil: "Professor");

        var result = await service.CriarAsync(new CriarAulaRequest
        {
            TurmaId = 1,
            NumeroAula = 0,
            DataAula = new DateOnly(2026, 4, 15),
            HorarioInicio = new TimeOnly(8, 0),
            HorarioFim = new TimeOnly(9, 0)
        }, uc, CancellationToken.None);

        Assert.False(result.Ok);
        Assert.Equal("Numero da aula deve ser maior que zero.", result.Mensagem);
    }

    [Fact]
    public async Task CriarAsync_DeveFalhar_QuandoUsuarioLogadoNaoForProfessorESemProfessorId()
    {
        await using var db = BuildContext();
        SeedBasicSchoolData(db, escolaAtiva: true);
        using var root = BuildServiceProvider(db);
        using var scope = root.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IAulasService>();
        var uc = BuildUserContext(userId: 3, perfil: "Administrador");

        var result = await service.CriarAsync(new CriarAulaRequest
        {
            TurmaId = 1,
            NumeroAula = 1,
            DataAula = new DateOnly(2026, 4, 15),
            HorarioInicio = new TimeOnly(8, 0),
            HorarioFim = new TimeOnly(9, 0)
        }, uc, CancellationToken.None);

        Assert.False(result.Ok);
        Assert.Equal("Professor invalido para esta escola.", result.Mensagem);
    }

    [Fact]
    public async Task EditarAsync_DeveRetornar400_QuandoStatusForInvalido()
    {
        await using var db = BuildContext();
        SeedBasicSchoolData(db, escolaAtiva: true);
        SeedAula(db, status: "Agendada", professorId: 2);
        using var root = BuildServiceProvider(db);
        using var scope = root.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IAulasService>();
        var uc = BuildUserContext(userId: 3, perfil: "Administrador");

        var result = await service.EditarAsync(1, new EditarAulaRequest
        {
            Status = "STATUS_QUEBRADO"
        }, uc, CancellationToken.None);

        Assert.False(result.Ok);
        Assert.Equal(400, result.StatusCode);
        Assert.Equal("Status da aula invalido.", result.Mensagem);
    }

    [Fact]
    public async Task CancelarAsync_DeveRetornar409_QuandoTransicaoNaoForPermitida()
    {
        await using var db = BuildContext();
        SeedBasicSchoolData(db, escolaAtiva: true);
        SeedAula(db, status: "Realizada", professorId: 2);
        using var root = BuildServiceProvider(db);
        using var scope = root.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IAulasService>();
        var uc = BuildUserContext(userId: 3, perfil: "Administrador");

        var result = await service.CancelarAsync(1, uc, CancellationToken.None);

        Assert.False(result.Ok);
        Assert.Equal(409, result.StatusCode);
        Assert.Equal("Transicao de status nao permitida.", result.Mensagem);
    }

    [Fact]
    public async Task Professor_NaoDeveEditarNemCancelarAula()
    {
        await using var db = BuildContext();
        SeedBasicSchoolData(db, escolaAtiva: true);
        SeedAula(db, status: "Agendada", professorId: 2);
        using var root = BuildServiceProvider(db);
        using var scope = root.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IAulasService>();
        var ucProfessor = BuildUserContext(userId: 2, perfil: "Professor");

        var editar = await service.EditarAsync(1, new EditarAulaRequest
        {
            Status = "Realizada"
        }, ucProfessor, CancellationToken.None);

        var cancelar = await service.CancelarAsync(1, ucProfessor, CancellationToken.None);

        Assert.False(editar.Ok);
        Assert.Equal(403, editar.StatusCode);
        Assert.Equal("Professor nao pode editar aulas.", editar.Mensagem);

        Assert.False(cancelar.Ok);
        Assert.Equal(403, cancelar.StatusCode);
        Assert.Equal("Professor nao pode cancelar aulas.", cancelar.Mensagem);
    }

    [Fact]
    public async Task ListarAsync_DeveRetornarVazio_QuandoEscolaEstiverInativa()
    {
        await using var db = BuildContext();
        SeedBasicSchoolData(db, escolaAtiva: false);
        SeedAula(db, status: "Agendada", professorId: 2);
        using var root = BuildServiceProvider(db);
        using var scope = root.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IAulasService>();
        var uc = BuildUserContext(userId: 2, perfil: "Professor");

        var result = await service.ListarAsync(uc, CancellationToken.None);

        Assert.Empty(result);
    }

    private static LearlyDbContext BuildContext()
    {
        var options = new DbContextOptionsBuilder<LearlyDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        return new LearlyDbContext(options);
    }

    private static ServiceProvider BuildServiceProvider(LearlyDbContext db)
    {
        var services = new ServiceCollection();
        services.AddSingleton(db);
        services.AddScoped<LearlyDbContext>(_ => db);
        services.AddLearlyRepositories();
        services.AddLearlyApplication();
        return services.BuildServiceProvider();
    }

    private static AppUserContext BuildUserContext(int userId, string perfil)
    {
        return new AppUserContext
        {
            UserId = userId,
            Perfil = perfil,
            CodigoEscola = "ESC-1",
            IsSuperAdmin = false
        };
    }

    private static void SeedBasicSchoolData(LearlyDbContext db, bool escolaAtiva)
    {
        var statusEscola = escolaAtiva ? "Ativo" : "Inativo";
        db.Escolas.Add(new Escola
        {
            Id = 1,
            CodigoEscola = "ESC-1",
            NomeFantasia = "Escola 1",
            Status = statusEscola
        });

        db.Perfis.Add(new Perfil { Id = 1, EscolaId = 1, Nome = "Professor", Status = "Ativo" });
        db.Perfis.Add(new Perfil { Id = 2, EscolaId = 1, Nome = "Administrador", Status = "Ativo" });

        db.Usuarios.Add(new Usuario
        {
            Id = 2,
            EscolaId = 1,
            PerfilId = 1,
            NomeCompleto = "Professor Um",
            Email = "prof@learly.com",
            Senha = "hash",
            Status = "Ativo"
        });

        db.Usuarios.Add(new Usuario
        {
            Id = 3,
            EscolaId = 1,
            PerfilId = 2,
            NomeCompleto = "Admin Um",
            Email = "admin@learly.com",
            Senha = "hash",
            Status = "Ativo"
        });

        db.Turmas.Add(new Turma
        {
            Id = 1,
            EscolaId = 1,
            ProfessorId = 2,
            LivroId = 1,
            Nome = "Turma 1",
            Status = "Ativa"
        });

        db.SaveChanges();
    }

    private static void SeedAula(LearlyDbContext db, string status, int professorId)
    {
        db.Aulas.Add(new Aula
        {
            Id = 1,
            EscolaId = 1,
            TurmaId = 1,
            ProfessorId = professorId,
            NumeroAula = 1,
            DataAula = new DateOnly(2026, 4, 15),
            HorarioInicio = new TimeOnly(8, 0),
            HorarioFim = new TimeOnly(9, 0),
            TipoAula = "Normal",
            Status = status
        });
        db.SaveChanges();
    }
}
