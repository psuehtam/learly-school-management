using Learly.Domain.Entities;

namespace Learly.Domain.Interfaces.Repositories;

public interface ITurmaRepository : IRepository<Turma, int>
{
    Task<IReadOnlyList<Turma>> ListarPorEscolaAsync(int escolaId, CancellationToken cancellationToken = default);

    Task<Turma?> ObterPorIdEEscolaAsync(int turmaId, int escolaId, CancellationToken cancellationToken = default);
}
