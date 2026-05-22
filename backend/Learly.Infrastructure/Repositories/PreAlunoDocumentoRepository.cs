using Learly.Domain.Entities;
using Learly.Domain.Interfaces.Repositories;
using Learly.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Learly.Infrastructure.Repositories;

internal sealed class PreAlunoDocumentoRepository(LearlyDbContext db) : IPreAlunoDocumentoRepository
{
    private DbSet<PreAlunoDocumento> Set => db.Set<PreAlunoDocumento>();

    public async Task<IReadOnlyList<PreAlunoDocumento>> ListarPorPreAlunoAsync(
        int preAlunoId,
        int escolaId,
        CancellationToken cancellationToken = default)
    {
        var lista = await Set.AsNoTracking()
            .Where(d => d.PreAlunoId == preAlunoId && d.EscolaId == escolaId)
            .OrderBy(d => d.TipoCodigo)
            .ToListAsync(cancellationToken);

        return lista;
    }

    public Task<PreAlunoDocumento?> ObterPorPreAlunoETipoAsync(
        int preAlunoId,
        int escolaId,
        string tipoCodigo,
        CancellationToken cancellationToken = default)
    {
        return Set.FirstOrDefaultAsync(
            d => d.PreAlunoId == preAlunoId && d.EscolaId == escolaId && d.TipoCodigo == tipoCodigo,
            cancellationToken);
    }

    public Task<PreAlunoDocumento?> ObterPorIdAsync(
        int id,
        int preAlunoId,
        int escolaId,
        CancellationToken cancellationToken = default)
    {
        return Set.FirstOrDefaultAsync(
            d => d.Id == id && d.PreAlunoId == preAlunoId && d.EscolaId == escolaId,
            cancellationToken);
    }

    public void Adicionar(PreAlunoDocumento documento) => Set.Add(documento);

    public void Remover(PreAlunoDocumento documento) => Set.Remove(documento);
}
