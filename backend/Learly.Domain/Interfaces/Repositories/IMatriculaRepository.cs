using Learly.Domain.Entities;
using Learly.Domain.ReadModels;

namespace Learly.Domain.Interfaces.Repositories;

public interface IMatriculaRepository : IRepository<Matricula, int>
{
    Task<Matricula?> ObterPorIdEEscolaAsync(int matriculaId, int escolaId, CancellationToken cancellationToken = default);
    Task<Matricula?> ObterRastreadaPorIdEEscolaAsync(int matriculaId, int escolaId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Matricula>> ListarRastreadasPorIdsEEscolaAsync(
        int escolaId,
        IEnumerable<int> matriculaIds,
        CancellationToken cancellationToken = default);

    Task<bool> ExisteAlunoNaEscolaAsync(int alunoId, int escolaId, CancellationToken cancellationToken = default);

    Task<bool> ExisteDuplicidadeAsync(int escolaId, int alunoId, int? turmaId, CancellationToken cancellationToken = default);

    Task<bool> ExisteMatriculaEmEsperaSemTurmaAsync(int escolaId, int alunoId, CancellationToken cancellationToken = default);

    Task<Matricula?> ObterEmEsperaSemTurmaRastreadaAsync(
        int escolaId,
        int alunoId,
        CancellationToken cancellationToken = default);

    Task<HashSet<int>> ListarAlunoIdsComMatriculaAtivaEmTurmaAsync(
        int escolaId,
        CancellationToken cancellationToken = default);

    /// <summary>Outra matricula ativa com turma do mesmo aluno (exclui a matricula informada, se houver).</summary>
    Task<MatriculaTurmaAtivaInfo?> ObterOutraTurmaAtivaDoAlunoAsync(
        int escolaId,
        int alunoId,
        int? ignorarMatriculaId = null,
        CancellationToken cancellationToken = default);

    Task<int> EncerrarMatriculasAtivasDaTurmaAsync(
        int escolaId,
        int turmaId,
        string novoStatus,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MatriculaListagemItem>> ListarPorEscolaComFiltrosAsync(
        int escolaId,
        string? status,
        int? alunoId,
        int? turmaId,
        IReadOnlyList<string>? statusesIn = null,
        CancellationToken cancellationToken = default);
}
