using Learly.Domain.Entities;

namespace Learly.Domain.Interfaces.Repositories;

public interface IEscolaRepository : IRepository<Escola, int>
{
    Task<Escola?> ObterPorCodigoAsync(string codigoEscola, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Escola>> ListarAtivasNaoSistemaOrdenadasPorCodigoAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Escola>> ListarAtivasPorCodigoEscolaAsync(
        string codigoEscola,
        CancellationToken cancellationToken = default);

    Task<bool> ExisteComCodigoAsync(string codigoEscola, CancellationToken cancellationToken = default);

    Task<int?> ObterIdAtivaPorCodigoEscolaAsync(string codigoEscola, CancellationToken cancellationToken = default);
}
