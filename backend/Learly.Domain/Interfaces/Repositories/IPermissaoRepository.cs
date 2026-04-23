namespace Learly.Domain.Interfaces.Repositories;

public interface IPermissaoRepository
{
    Task<IReadOnlyList<int>> ObterIdsOndeNomeDiferenteDeAsync(
        string nomeExcluir,
        CancellationToken cancellationToken = default);
}
