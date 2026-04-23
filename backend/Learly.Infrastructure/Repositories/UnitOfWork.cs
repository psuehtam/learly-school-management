using Learly.Domain.Interfaces.Persistence;
using Learly.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Learly.Infrastructure.Repositories;

internal sealed class UnitOfWork(LearlyDbContext db) : IUnitOfWork
{
    private static readonly string InMemoryProviderName = "Microsoft.EntityFrameworkCore.InMemory";

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);

    public async Task ExecuteInTransactionAsync(Func<Task> action, CancellationToken cancellationToken = default)
    {
        if (string.Equals(db.Database.ProviderName, InMemoryProviderName, StringComparison.Ordinal))
        {
            await action();
            return;
        }

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            await action();
            await tx.CommitAsync(cancellationToken);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
