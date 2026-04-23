using Learly.Domain.Entities;

namespace Learly.Domain.Interfaces.Repositories;

public interface IAulaRepository : IRepository<Aula, int>
{
    Task<IReadOnlyList<Aula>> ListarPorTurmaAsync(int turmaId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Aula>> ListarPorEscolaEFiltroProfessorAsync(
        int escolaId,
        int? filtrarProfessorId,
        CancellationToken cancellationToken = default);

    Task<Aula?> ObterSemRastreioPorIdEEscolaAsync(
        int id,
        int escolaId,
        int? filtrarProfessorId,
        CancellationToken cancellationToken = default);

    Task<Aula?> ObterRastreadaPorIdEEscolaAsync(
        int id,
        int escolaId,
        CancellationToken cancellationToken = default);
}
