namespace Learly.Domain.Interfaces.Persistence;

/// <summary>
/// Unidade de trabalho para persistência (implementação na infraestrutura, ex.: EF Core).
/// </summary>
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Executa a ação dentro de uma transação quando o provedor suporta (ex.: MySQL).
    /// Em bancos em memória para testes, executa sem transação explícita.
    /// </summary>
    Task ExecuteInTransactionAsync(Func<Task> action, CancellationToken cancellationToken = default);
}
