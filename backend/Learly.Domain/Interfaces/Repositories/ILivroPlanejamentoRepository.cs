using Learly.Domain.Entities;

namespace Learly.Domain.Interfaces.Repositories;

public interface ILivroPlanejamentoRepository
{
    Task<IReadOnlyList<LivroPlanejamentoDia>> ObterDiasComAlocacoesAsync(
        int livroId,
        int escolaId,
        CancellationToken cancellationToken = default);

    Task RemoverPlanejamentoDoLivroAsync(
        int livroId,
        int escolaId,
        CancellationToken cancellationToken = default);

    void AdicionarDias(IEnumerable<LivroPlanejamentoDia> dias);
}
