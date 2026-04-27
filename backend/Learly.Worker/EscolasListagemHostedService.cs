using Learly.Application.Services.Common;
using Learly.Application.Services.Escolas;

namespace Learly.Worker;

/// <summary>
/// Exemplo de tarefa em segundo plano: usa apenas serviços da camada Application (sem DbContext/repositórios).
/// </summary>
public sealed class EscolasListagemHostedService(
    IServiceScopeFactory scopeFactory,
    IConfiguration configuration,
    ILogger<EscolasListagemHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var intervalMinutes = Math.Max(1, configuration.GetValue("Worker:ListagemEscolasIntervalMinutes", 60));
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken).ConfigureAwait(false);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var escolas = scope.ServiceProvider.GetRequiredService<IEscolasService>();
                var resultado = await escolas.ListarAsync(AppUserContext.SystemJob, stoppingToken).ConfigureAwait(false);
                logger.LogInformation(
                    "Worker: listagem de escolas concluida ({Count} itens).",
                    resultado.Itens.Count);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Worker: falha ao executar listagem periodica de escolas.");
            }

            await Task.Delay(TimeSpan.FromMinutes(intervalMinutes), stoppingToken).ConfigureAwait(false);
        }
    }
}
