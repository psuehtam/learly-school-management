using Learly.Domain.Entities;
using Learly.Domain.Interfaces.Repositories;
using Learly.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Learly.Infrastructure.Repositories;

internal sealed class PerfilRepository(LearlyDbContext db) : RepositoryBase<Perfil, int>(db), IPerfilRepository
{
    public async Task<Perfil?> ObterPorIdEEscolaAsync(int perfilId, int escolaId, CancellationToken cancellationToken = default)
    {
        return await Db.Perfis.FirstOrDefaultAsync(
            p => p.Id == perfilId && p.EscolaId == escolaId,
            cancellationToken);
    }

    public async Task<Perfil?> ObterPorNomeNaEscolaAsync(int escolaId, string nome, CancellationToken cancellationToken = default)
    {
        var n = nome.Trim();
        return await Db.Perfis.FirstOrDefaultAsync(
            p => p.EscolaId == escolaId && p.Nome.ToLower() == n.ToLower(),
            cancellationToken);
    }

    public async Task<IReadOnlyList<Perfil>> ListarPorEscolaAsync(
        int escolaId,
        CancellationToken cancellationToken = default)
    {
        return await Db.Perfis.AsNoTracking()
            .Where(p => p.EscolaId == escolaId)
            .OrderBy(p => p.Nome)
            .ThenBy(p => p.Id)
            .ToListAsync(cancellationToken);
    }
}
