namespace Learly.Domain.Interfaces.Repositories;

public interface IPermissaoRepository
{
    Task<IReadOnlyList<int>> ObterIdsOndeNomeDiferenteDeAsync(
        string nomeExcluir,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyDictionary<string, int>> ObterIdsPorNomesAsync(
        IReadOnlyCollection<string> nomes,
        CancellationToken cancellationToken = default);
}
