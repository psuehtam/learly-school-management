using Learly.Domain.Entities;

namespace Learly.Domain.Interfaces.Repositories;

public interface IPreAlunoDocumentoRepository
{
    Task<IReadOnlyList<PreAlunoDocumento>> ListarPorPreAlunoAsync(
        int preAlunoId,
        int escolaId,
        CancellationToken cancellationToken = default);

    Task<PreAlunoDocumento?> ObterPorPreAlunoETipoAsync(
        int preAlunoId,
        int escolaId,
        string tipoCodigo,
        CancellationToken cancellationToken = default);

    Task<PreAlunoDocumento?> ObterPorIdAsync(
        int id,
        int preAlunoId,
        int escolaId,
        CancellationToken cancellationToken = default);

    void Adicionar(PreAlunoDocumento documento);
    void Remover(PreAlunoDocumento documento);
}
