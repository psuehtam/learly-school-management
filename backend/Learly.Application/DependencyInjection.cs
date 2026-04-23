using Learly.Application.Mapping;
using Learly.Application.Services.Aulas;
using Learly.Application.Services.Escolas;
using Learly.Application.Services.Usuarios;
using Mapster;
using MapsterMapper;
using Microsoft.Extensions.DependencyInjection;

namespace Learly.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddLearlyApplication(this IServiceCollection services)
    {
        var config = TypeAdapterConfig.GlobalSettings;
        new ApplicationMappingRegister().Register(config);
        services.AddSingleton(config);
        services.AddScoped<IMapper, ServiceMapper>();

        services.AddScoped<IEscolasService, EscolasService>();
        services.AddScoped<IAulasService, AulasService>();
        services.AddScoped<IUsuariosService, UsuariosService>();

        return services;
    }
}
