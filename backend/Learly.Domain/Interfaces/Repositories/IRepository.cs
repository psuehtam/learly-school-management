namespace Learly.Domain.Interfaces.Repositories;

/// <summary>
/// Contrato genérico de persistência para agregados/entidades raiz.
/// A implementação concreta fica na camada de infraestrutura (Etapa posterior).
/// </summary>
public interface IRepository<TEntity, in TKey>
    where TEntity : class
{
    Task<TEntity?> ObterPorIdAsync(TKey id, CancellationToken cancellationToken = default);

    void Adicionar(TEntity entidade);

    void Remover(TEntity entidade);
}
