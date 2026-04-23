using Learly.Domain.Entities;

namespace Learly.Domain.Interfaces.Repositories;

public interface IPerfilRepository : IRepository<Perfil, int>
{
    Task<Perfil?> ObterPorIdEEscolaAsync(int perfilId, int escolaId, CancellationToken cancellationToken = default);

    Task<Perfil?> ObterPorNomeNaEscolaAsync(int escolaId, string nome, CancellationToken cancellationToken = default);
}
