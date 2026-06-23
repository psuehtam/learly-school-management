using Learly.Application.Mapping;
using Learly.Application.Services.Alunos;
using Learly.Application.Services.Aulas;
using Learly.Application.Services.Calendario;
using Learly.Application.Services.Compromissos;
using Learly.Application.Services.Dashboard;
using Learly.Application.Services.Contratos;
using Learly.Application.Services.Escolas;
using Learly.Application.Services.HorariosFuncionamento;
using Learly.Application.Services.Livros;
using Learly.Application.Services.Matriculas;
using Learly.Application.Services.PreAlunos;
using Learly.Application.Services.Templates;
using Learly.Application.Services.Turmas;
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

        services.AddScoped<IAlunosService, AlunosService>();
        services.AddScoped<IAlunoPerfilService, AlunoPerfilService>();
        services.AddScoped<IMatriculasService, MatriculasService>();

        services.AddScoped<IPreAlunosService, PreAlunosService>();
        services.AddScoped<ILivroPlanejamentoService, LivroPlanejamentoService>();
        services.AddScoped<ILivrosEscolaService, LivrosEscolaService>();

        services.AddScoped<ICalendarioService, CalendarioService>();
        services.AddScoped<ICompromissosService, CompromissosService>();
        services.AddScoped<IHorariosFuncionamentoService, HorariosFuncionamentoService>();

        services.AddScoped<IUsuariosService, UsuariosService>();
        services.AddScoped<ITemplatesAdminService, TemplatesAdminService>();
        services.AddScoped<IContratosService, ContratosService>();
        services.AddScoped<ITurmasService, TurmasService>();
        services.AddScoped<IDashboardService, DashboardService>();

        return services;
    }
}
