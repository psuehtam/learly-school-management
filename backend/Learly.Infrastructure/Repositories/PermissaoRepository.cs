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
        var nomeExcluirNormalizado = nomeExcluir.Trim().ToUpperInvariant();

        return await db.Permissoes.AsNoTracking()
            .Where(p => p.Nome.ToUpper() != nomeExcluirNormalizado)
            .Select(p => p.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyDictionary<string, int>> ObterIdsPorNomesAsync(
        IReadOnlyCollection<string> nomes,
        CancellationToken cancellationToken = default)
    {
        if (nomes.Count == 0)
        {
            return new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        }

        var nomesLimpos = nomes
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Select(n => n.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        if (nomesLimpos.Count == 0)
        {
            return new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        }

        var pares = await db.Permissoes.AsNoTracking()
            .Where(p => nomesLimpos.Contains(p.Nome))
            .Select(p => new { p.Nome, p.Id })
            .ToListAsync(cancellationToken);

        return pares.ToDictionary(x => x.Nome, x => x.Id, StringComparer.OrdinalIgnoreCase);
    }
}
