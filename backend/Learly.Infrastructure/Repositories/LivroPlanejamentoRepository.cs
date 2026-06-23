using Learly.Domain.Entities;
using Learly.Domain.Interfaces.Repositories;
using Learly.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Learly.Infrastructure.Repositories;

internal sealed class LivroPlanejamentoRepository(LearlyDbContext db) : ILivroPlanejamentoRepository
{
    public async Task<IReadOnlyList<LivroPlanejamentoDia>> ObterDiasComAlocacoesAsync(
        int livroId,
        int escolaId,
        CancellationToken cancellationToken = default)
    {
        return await db.LivrosPlanejamentoDias.AsNoTracking()
            .Where(d => d.LivroId == livroId && d.EscolaId == escolaId)
            .Include(d => d.Alocacoes.OrderBy(a => a.Ordem))
                .ThenInclude(a => a.Capitulo)
            .OrderBy(d => d.Ordem)
            .ToListAsync(cancellationToken);
    }

    public async Task RemoverPlanejamentoDoLivroAsync(
        int livroId,
        int escolaId,
        CancellationToken cancellationToken = default)
    {
        var dias = await db.LivrosPlanejamentoDias
            .Where(d => d.LivroId == livroId && d.EscolaId == escolaId)
            .ToListAsync(cancellationToken);

        db.LivrosPlanejamentoDias.RemoveRange(dias);
    }

    public void AdicionarDias(IEnumerable<LivroPlanejamentoDia> dias) =>
        db.LivrosPlanejamentoDias.AddRange(dias);
}
