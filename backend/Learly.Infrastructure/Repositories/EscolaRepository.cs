using Learly.Domain.Entities;
using Learly.Domain.Interfaces.Repositories;
using Learly.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Learly.Infrastructure.Repositories;

internal sealed class EscolaRepository(LearlyDbContext db) : RepositoryBase<Escola, int>(db), IEscolaRepository
{
    public async Task<Escola?> ObterPorCodigoAsync(string codigoEscola, CancellationToken cancellationToken = default)
    {
        var codigo = codigoEscola.Trim().ToUpperInvariant();
        return await Db.Escolas.FirstOrDefaultAsync(e => e.CodigoEscola == codigo, cancellationToken);
    }

    public async Task<IReadOnlyList<Escola>> ListarAtivasNaoSistemaOrdenadasPorCodigoAsync(
        CancellationToken cancellationToken = default)
    {
        return await Db.Escolas.AsNoTracking()
            .Where(e => e.Status == Escola.Estados.Ativo && e.CodigoEscola != "SYSTEM")
            .OrderBy(e => e.CodigoEscola)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Escola>> ListarAtivasPorCodigoEscolaAsync(
        string codigoEscola,
        CancellationToken cancellationToken = default)
    {
        return await Db.Escolas.AsNoTracking()
            .Where(e => e.Status == Escola.Estados.Ativo && e.CodigoEscola == codigoEscola)
            .OrderBy(e => e.CodigoEscola)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> ExisteComCodigoAsync(string codigoEscola, CancellationToken cancellationToken = default)
    {
        var codigo = codigoEscola.Trim().ToUpperInvariant();
        return await Db.Escolas.AnyAsync(e => e.CodigoEscola == codigo, cancellationToken);
    }

    public async Task<int?> ObterIdAtivaPorCodigoEscolaAsync(
        string codigoEscola,
        CancellationToken cancellationToken = default)
    {
        return await Db.Escolas.AsNoTracking()
            .Where(e => e.CodigoEscola == codigoEscola && e.Status == Escola.Estados.Ativo)
            .Select(e => (int?)e.Id)
            .FirstOrDefaultAsync(cancellationToken);
    }
}
