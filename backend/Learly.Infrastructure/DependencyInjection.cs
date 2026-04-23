using Learly.Domain.Interfaces.Persistence;
using Learly.Domain.Interfaces.Repositories;
using Learly.Infrastructure.Data;
using Learly.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;

namespace Learly.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Registra <see cref="LearlyDbContext"/> com MySQL via Pomelo, usando <c>ConnectionStrings:DefaultConnection</c>.
    /// </summary>
    /// <exception cref="InvalidOperationException">Quando <c>DefaultConnection</c> está ausente ou em branco.</exception>
    public static IServiceCollection AddLearlyDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("ConnectionStrings:DefaultConnection é obrigatória para registrar o LearlyDbContext.");
        }

        var serverVersion = new MySqlServerVersion(new Version(8, 0, 36));
        services.AddDbContext<LearlyDbContext>(options =>
            options.UseMySql(connectionString, serverVersion));

        return services;
    }

    public static IServiceCollection AddLearlyRepositories(this IServiceCollection services)
    {
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IEscolaRepository, EscolaRepository>();
        services.AddScoped<IUsuarioRepository, UsuarioRepository>();
        services.AddScoped<IAulaRepository, AulaRepository>();
        services.AddScoped<ITurmaRepository, TurmaRepository>();
        services.AddScoped<IPerfilRepository, PerfilRepository>();
        services.AddScoped<IPermissaoRepository, PermissaoRepository>();
        services.AddScoped<IPerfilPermissaoRepository, PerfilPermissaoRepository>();

        return services;
    }
}
