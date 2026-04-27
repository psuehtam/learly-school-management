using Learly.Domain.Interfaces.Repositories;
using Learly.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Learly.Infrastructure.Repositories;

internal abstract class RepositoryBase<TEntity, TKey>(LearlyDbContext db) : IRepository<TEntity, TKey>
    where TEntity : class
{
    protected LearlyDbContext Db { get; } = db;

    protected DbSet<TEntity> Set => Db.Set<TEntity>();

    public virtual Task<TEntity?> ObterPorIdAsync(TKey id, CancellationToken cancellationToken = default) =>
        Set.FindAsync(new object?[] { id! }, cancellationToken).AsTask();

    public void Adicionar(TEntity entidade) => Set.Add(entidade);

    public void Remover(TEntity entidade) => Set.Remove(entidade);
}
