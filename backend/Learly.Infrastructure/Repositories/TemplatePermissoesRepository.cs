using Learly.Domain.Entities;
using Learly.Domain.Interfaces.Repositories;
using Learly.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Learly.Infrastructure.Repositories;

internal sealed class TemplatePermissoesRepository(LearlyDbContext db) : ITemplatePermissoesRepository
{
    public Task<bool> PerfilTemplateExisteAsync(int perfilTemplateId, CancellationToken cancellationToken = default) =>
        db.PerfisTemplate.AsNoTracking().AnyAsync(p => p.Id == perfilTemplateId, cancellationToken);

    public async Task<IReadOnlyList<(int Id, string Nome)>> ListarPerfisTemplateAsync(
        CancellationToken cancellationToken = default)
    {
        var rows = await db.PerfisTemplate.AsNoTracking()
            .OrderBy(p => p.Id)
            .Select(p => new { p.Id, p.Nome })
            .ToListAsync(cancellationToken);
        return rows.Select(r => (r.Id, r.Nome)).ToList();
    }

    public async Task<string?> ObterNomePerfilTemplateAsync(int perfilTemplateId, CancellationToken cancellationToken = default) =>
        await db.PerfisTemplate.AsNoTracking()
            .Where(p => p.Id == perfilTemplateId)
            .Select(p => p.Nome)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyList<int>> ObterPermissaoIdsDoPerfilTemplateAsync(
        int perfilTemplateId,
        CancellationToken cancellationToken = default) =>
        await db.PerfilPermissoesTemplate.AsNoTracking()
            .Where(x => x.PerfilTemplateId == perfilTemplateId)
            .OrderBy(x => x.PermissaoId)
            .Select(x => x.PermissaoId)
            .ToListAsync(cancellationToken);

    public async Task SubstituirVinculosPermissoesAsync(
        int perfilTemplateId,
        IReadOnlyList<int> permissaoIds,
        CancellationToken cancellationToken = default)
    {
        var existentes = await db.PerfilPermissoesTemplate
            .Where(x => x.PerfilTemplateId == perfilTemplateId)
            .ToListAsync(cancellationToken);
        db.PerfilPermissoesTemplate.RemoveRange(existentes);

        var idsDistintos = permissaoIds
            .Where(id => id > 0)
            .Distinct()
            .ToList();
        if (idsDistintos.Count == 0)
        {
            return;
        }

        var idsValidos = await db.Permissoes.AsNoTracking()
            .Where(p => idsDistintos.Contains(p.Id))
            .Select(p => p.Id)
            .ToListAsync(cancellationToken);

        foreach (var permissaoId in idsValidos)
        {
            db.PerfilPermissoesTemplate.Add(new PerfilPermissaoTemplate
            {
                PerfilTemplateId = perfilTemplateId,
                PermissaoId = permissaoId
            });
        }
    }
    public async Task<Dictionary<string, List<string>>> ObterPermissoesDeTemplateAsync(
        CancellationToken cancellationToken = default)
    {
        var comparer = StringComparer.OrdinalIgnoreCase;
        var perfis = await db.PerfisTemplate.AsNoTracking()
            .OrderBy(p => p.Id)
            .ToListAsync(cancellationToken);

        var vinculos = await (
            from ppt in db.PerfilPermissoesTemplate.AsNoTracking()
            join p in db.Permissoes.AsNoTracking() on ppt.PermissaoId equals p.Id
            orderby p.Nome
            select new { ppt.PerfilTemplateId, p.Nome }
        ).ToListAsync(cancellationToken);

        var porPerfilId = vinculos
            .GroupBy(x => x.PerfilTemplateId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.Nome).Distinct(comparer).OrderBy(n => n, comparer).ToList());

        var resultado = new Dictionary<string, List<string>>(comparer);
        foreach (var pt in perfis)
        {
            resultado[pt.Nome] = porPerfilId.TryGetValue(pt.Id, out var nomes)
                ? nomes
                : [];
        }

        return resultado;
    }
}
