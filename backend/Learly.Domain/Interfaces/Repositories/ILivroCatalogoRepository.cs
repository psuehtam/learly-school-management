using Learly.Domain.Entities;
using Learly.Domain.ReadModels;

namespace Learly.Domain.Interfaces.Repositories;

public interface ILivroCatalogoRepository
{
    Task<IReadOnlyList<LivroListagemItem>> ListarAtivosPorEscolaAsync(
        int escolaId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<LivroListagemItem>> ListarTodosPorEscolaAsync(
        int escolaId,
        CancellationToken cancellationToken = default);

    Task<Livro?> ObterPorIdEscolaAsync(int livroId, int escolaId, CancellationToken cancellationToken = default);

    Task<Livro?> ObterPorIdEscolaComCapitulosAsync(int livroId, int escolaId, CancellationToken cancellationToken = default);

    Task<Livro?> ObterRastreadoPorIdEscolaAsync(int livroId, int escolaId, CancellationToken cancellationToken = default);

    Task<Livro?> ObterRastreadoPorIdEscolaComCapitulosAsync(int livroId, int escolaId, CancellationToken cancellationToken = default);

    Task<bool> ExisteNomeEmEscolaAsync(
        int escolaId,
        string nomeTrimmed,
        int? excluirLivroId,
        CancellationToken cancellationToken = default);

    Task<(int QuantidadeCapitulos, int TotalDuracaoMinutos)> ObterTotaisCapitulosPorLivroAsync(
        int livroId,
        int escolaId,
        CancellationToken cancellationToken = default);

    void Adicionar(Livro livro);
}
