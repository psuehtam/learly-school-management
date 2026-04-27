using Learly.Domain.Entities;

namespace Learly.Domain.Interfaces.Repositories;

public interface IUsuarioRepository : IRepository<Usuario, int>
{
    Task<Usuario?> ObterPorEmailAsync(string email, CancellationToken cancellationToken = default);

    Task<bool> ExisteComEmailAsync(string email, CancellationToken cancellationToken = default);

    Task<bool> ExisteComEmailExcetoIdAsync(
        string email,
        int usuarioIdIgnorado,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Usuario>> ListarPorEscolaAsync(
        int escolaId,
        CancellationToken cancellationToken = default);

    Task<Usuario?> ObterPorIdEEscolaAsync(
        int usuarioId,
        int escolaId,
        CancellationToken cancellationToken = default);

    Task<bool> ProfessorAtivoNaEscolaAsync(
        int usuarioId,
        int escolaId,
        CancellationToken cancellationToken = default);
}
