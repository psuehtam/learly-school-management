using Learly.Domain.Entities;
using Learly.Domain.Interfaces.Repositories;
using Learly.Domain.ReadModels;
using Learly.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Learly.Infrastructure.Repositories;

internal sealed class LivroCatalogoRepository(LearlyDbContext db) : ILivroCatalogoRepository
{
    public async Task<IReadOnlyList<LivroListagemItem>> ListarAtivosPorEscolaAsync(
        int escolaId,
        CancellationToken cancellationToken = default)
    {
        return await db.Livros.AsNoTracking()
            .Where(l => l.EscolaId == escolaId && l.Status == "Ativo")
            .OrderBy(l => l.Nome)
            .Select(l => new LivroListagemItem(
                l.Id,
                l.Nome,
                l.Status,
                l.Capitulos.Count,
                l.Capitulos.Sum(c => (int?)c.DuracaoMinutos) ?? 0))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<LivroListagemItem>> ListarTodosPorEscolaAsync(
        int escolaId,
        CancellationToken cancellationToken = default)
    {
        return await db.Livros.AsNoTracking()
            .Where(l => l.EscolaId == escolaId)
            .OrderBy(l => l.Nome)
            .Select(l => new LivroListagemItem(
                l.Id,
                l.Nome,
                l.Status,
                l.Capitulos.Count,
                l.Capitulos.Sum(c => (int?)c.DuracaoMinutos) ?? 0))
            .ToListAsync(cancellationToken);
    }

    public Task<Livro?> ObterPorIdEscolaAsync(int livroId, int escolaId, CancellationToken cancellationToken = default)
    {
        return db.Livros.AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == livroId && l.EscolaId == escolaId, cancellationToken);
    }

    public Task<Livro?> ObterPorIdEscolaComCapitulosAsync(int livroId, int escolaId, CancellationToken cancellationToken = default)
    {
        return db.Livros.AsNoTracking()
            .Include(l => l.Capitulos)
            .FirstOrDefaultAsync(l => l.Id == livroId && l.EscolaId == escolaId, cancellationToken);
    }

    public Task<Livro?> ObterRastreadoPorIdEscolaAsync(int livroId, int escolaId, CancellationToken cancellationToken = default)
    {
        return db.Livros.FirstOrDefaultAsync(l => l.Id == livroId && l.EscolaId == escolaId, cancellationToken);
    }

    public Task<Livro?> ObterRastreadoPorIdEscolaComCapitulosAsync(int livroId, int escolaId, CancellationToken cancellationToken = default)
    {
        return db.Livros
            .Include(l => l.Capitulos)
            .FirstOrDefaultAsync(l => l.Id == livroId && l.EscolaId == escolaId, cancellationToken);
    }

    public Task<bool> ExisteNomeEmEscolaAsync(
        int escolaId,
        string nomeTrimmed,
        int? excluirLivroId,
        CancellationToken cancellationToken = default)
    {
        var q = db.Livros.Where(l => l.EscolaId == escolaId && l.Nome == nomeTrimmed);
        if (excluirLivroId.HasValue)
            q = q.Where(l => l.Id != excluirLivroId.Value);

        return q.AnyAsync(cancellationToken);
    }

    public async Task<(int QuantidadeCapitulos, int TotalDuracaoMinutos)> ObterTotaisCapitulosPorLivroAsync(
        int livroId,
        int escolaId,
        CancellationToken cancellationToken = default)
    {
        var q = db.Capitulos.AsNoTracking().Where(c => c.LivroId == livroId && c.EscolaId == escolaId);
        var count = await q.CountAsync(cancellationToken);
        if (count == 0)
            return (0, 0);

        var sum = await q.SumAsync(c => c.DuracaoMinutos, cancellationToken);
        return (count, sum);
    }

    public void Adicionar(Livro livro) => db.Livros.Add(livro);
}
