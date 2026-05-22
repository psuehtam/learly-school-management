using Microsoft.EntityFrameworkCore;
using Learly.Application;
using Learly.Infrastructure;
using Learly.Infrastructure.Data;
using Learly.API.Configuration;

var builder = WebApplication.CreateBuilder(args);

if (string.Equals(builder.Environment.EnvironmentName, "Testing", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddDbContext<LearlyDbContext>(options =>
        options.UseInMemoryDatabase("learly-tests"));
}
else
{
    builder.Services.AddLearlyDatabase(builder.Configuration);
}

builder.Services.AddLearlyRepositories();
builder.Services.AddLearlyApplication();

builder.AddApiSecurity();
builder.AddApiInfrastructure();

var app = builder.Build();

// Aplica migrações pendentes automaticamente (seguro em desenvolvimento e CI)
if (!app.Environment.IsEnvironment("Testing"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<LearlyDbContext>();

    // O banco pode ter sido criado via setup.sql (sem EF), então __EFMigrationsHistory pode estar
    // vazia. Nesse caso, Migrate() tentaria recriar tabelas que já existem e falharia.
    // Solução: garantir que as migrações já aplicadas via setup.sql estejam registradas,
    // para que Migrate() só execute as novas (ex.: ContratosModule).
    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS `__EFMigrationsHistory` (
            `MigrationId` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
            `ProductVersion` varchar(32) CHARACTER SET utf8mb4 NOT NULL,
            CONSTRAINT `PK___EFMigrationsHistory` PRIMARY KEY (`MigrationId`)
        ) CHARACTER SET=utf8mb4
        """);

    // Migrações já contempladas pelo setup.sql — marcar como aplicadas sem rodar novamente
    (string Id, string Version)[] migracoesPrevias =
    [
        ("20260422234757_InitialCleanArchitecture",                  "10.0.0"),
        ("20260424012952_PerfisPermissoesTemplate",                  "10.0.0"),
        ("20260504121858_MatriculasTurmaOpcionalStatusEmEspera",     "10.0.0"),
        ("20260514000000_ContratosModule",                           "10.0.0"),
        ("20260516120000_ContratosAlignColumns",                     "10.0.0"),
        ("20260521120000_PreAlunoDocumentosModule",                 "10.0.0"),
        ("20260521140000_PreResponsaveisModule",                    "10.0.0"),
    ];

    foreach (var (id, version) in migracoesPrevias)
    {
        db.Database.ExecuteSqlRaw(
            "INSERT IGNORE INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`) VALUES ({0}, {1})",
            id, version);
    }

    db.Database.Migrate();
}

app.UseApiPipeline();
app.Run();

public partial class Program { }
