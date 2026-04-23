using Learly.Domain.Interfaces.Repositories;
using Learly.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Learly.Infrastructure.Repositories;

internal sealed class PermissaoRepository(LearlyDbContext db) : IPermissaoRepository
{
    public async Task<IReadOnlyList<int>> ObterIdsOndeNomeDiferenteDeAsync(
        string nomeExcluir,
        CancellationToken cancellationToken = default)
    {
        return await db.Permissoes.AsNoTracking()
            .Where(p => !string.Equals(p.Nome, nomeExcluir, StringComparison.OrdinalIgnoreCase))
            .Select(p => p.Id)
            .ToListAsync(cancellationToken);
    }
}
