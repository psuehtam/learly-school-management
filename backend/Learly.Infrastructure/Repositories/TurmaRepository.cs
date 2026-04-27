using Learly.Domain.Entities;
using Learly.Domain.Interfaces.Repositories;
using Learly.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Learly.Infrastructure.Repositories;

internal sealed class TurmaRepository(LearlyDbContext db) : RepositoryBase<Turma, int>(db), ITurmaRepository
{
    public async Task<IReadOnlyList<Turma>> ListarPorEscolaAsync(int escolaId, CancellationToken cancellationToken = default)
    {
        return await Db.Turmas
            .AsNoTracking()
            .Where(t => t.EscolaId == escolaId)
            .OrderBy(t => t.Nome)
            .ToListAsync(cancellationToken);
    }

    public async Task<Turma?> ObterPorIdEEscolaAsync(int turmaId, int escolaId, CancellationToken cancellationToken = default)
    {
        return await Db.Turmas.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == turmaId && t.EscolaId == escolaId, cancellationToken);
    }
}
