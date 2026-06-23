using System.Data;
using System.Data.Common;
using Learly.Domain.Entities;
using Learly.Domain.Interfaces.Repositories;
using Learly.Domain.ReadModels;
using Learly.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Learly.Infrastructure.Repositories;

internal sealed class MatriculaRepository(LearlyDbContext db) : RepositoryBase<Matricula, int>(db), IMatriculaRepository
{
    public Task<Matricula?> ObterPorIdEEscolaAsync(int matriculaId, int escolaId, CancellationToken cancellationToken = default)
    {
        return Db.Matriculas
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == matriculaId && m.EscolaId == escolaId, cancellationToken);
    }

    public Task<Matricula?> ObterRastreadaPorIdEEscolaAsync(int matriculaId, int escolaId, CancellationToken cancellationToken = default)
    {
        return Db.Matriculas
            .FirstOrDefaultAsync(m => m.Id == matriculaId && m.EscolaId == escolaId, cancellationToken);
    }

    public async Task<IReadOnlyList<Matricula>> ListarRastreadasPorIdsEEscolaAsync(
        int escolaId,
        IEnumerable<int> matriculaIds,
        CancellationToken cancellationToken = default)
    {
        var ids = matriculaIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            return [];
        }

        return await Db.Matriculas
            .Where(m => m.EscolaId == escolaId && ids.Contains(m.Id))
            .ToListAsync(cancellationToken);
    }

    public Task<bool> ExisteAlunoNaEscolaAsync(int alunoId, int escolaId, CancellationToken cancellationToken = default)
    {
        const string sql = "SELECT COUNT(1) FROM alunos WHERE id = @alunoId AND escola_id = @escolaId";
        return ExecutarExistsSqlAsync(sql, (cmd) =>
        {
            AddParameter(cmd, "@alunoId", alunoId);
            AddParameter(cmd, "@escolaId", escolaId);
        }, cancellationToken);
    }

    public Task<bool> ExisteDuplicidadeAsync(int escolaId, int alunoId, int? turmaId, CancellationToken cancellationToken = default)
    {
        return Db.Matriculas.AsNoTracking().AnyAsync(
            m => m.EscolaId == escolaId
                 && m.AlunoId == alunoId
                 && m.TurmaId == turmaId
                 && (m.Status == Matricula.Estados.Ativo || m.Status == Matricula.Estados.EmEspera),
            cancellationToken);
    }

    public Task<bool> ExisteMatriculaEmEsperaSemTurmaAsync(int escolaId, int alunoId, CancellationToken cancellationToken = default)
    {
        return Db.Matriculas.AsNoTracking().AnyAsync(
            m => m.EscolaId == escolaId
                 && m.AlunoId == alunoId
                 && m.TurmaId == null
                 && m.Status == Matricula.Estados.EmEspera,
            cancellationToken);
    }

    public Task<Matricula?> ObterEmEsperaSemTurmaRastreadaAsync(
        int escolaId,
        int alunoId,
        CancellationToken cancellationToken = default)
    {
        return Db.Matriculas.FirstOrDefaultAsync(
            m => m.EscolaId == escolaId
                 && m.AlunoId == alunoId
                 && m.TurmaId == null
                 && m.Status == Matricula.Estados.EmEspera,
            cancellationToken);
    }

    public async Task<HashSet<int>> ListarAlunoIdsComMatriculaAtivaEmTurmaAsync(
        int escolaId,
        CancellationToken cancellationToken = default)
    {
        var ids = await Db.Matriculas.AsNoTracking()
            .Where(m => m.EscolaId == escolaId
                        && m.Status == Matricula.Estados.Ativo
                        && m.TurmaId != null)
            .Select(m => m.AlunoId)
            .Distinct()
            .ToListAsync(cancellationToken);

        return ids.ToHashSet();
    }

    public async Task<MatriculaTurmaAtivaInfo?> ObterOutraTurmaAtivaDoAlunoAsync(
        int escolaId,
        int alunoId,
        int? ignorarMatriculaId = null,
        CancellationToken cancellationToken = default)
    {
        var query =
            from m in Db.Matriculas.AsNoTracking()
            join t in Db.Turmas.AsNoTracking() on m.TurmaId equals t.Id
            where m.EscolaId == escolaId
                  && m.AlunoId == alunoId
                  && m.Status == Matricula.Estados.Ativo
                  && m.TurmaId != null
                  && (t.Status == Turma.Estados.EmAndamento || t.Status == Turma.Estados.EmEspera)
                  && (ignorarMatriculaId == null || m.Id != ignorarMatriculaId)
            select new MatriculaTurmaAtivaInfo(m.Id, t.Id, t.Nome);

        return await query.FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<int> EncerrarMatriculasAtivasDaTurmaAsync(
        int escolaId,
        int turmaId,
        string novoStatus,
        CancellationToken cancellationToken = default)
    {
        var statusNorm = Matricula.Estados.Normalize(novoStatus);
        var agora = DateTime.UtcNow;
        var matriculas = await Db.Matriculas
            .Where(m => m.EscolaId == escolaId
                        && m.TurmaId == turmaId
                        && m.Status == Matricula.Estados.Ativo)
            .ToListAsync(cancellationToken);

        foreach (var m in matriculas)
        {
            m.Status = statusNorm;
            m.DataAtualizacao = agora;
        }

        return matriculas.Count;
    }

    public async Task<IReadOnlyList<MatriculaListagemItem>> ListarPorEscolaComFiltrosAsync(
        int escolaId,
        string? status,
        int? alunoId,
        int? turmaId,
        IReadOnlyList<string>? statusesIn = null,
        CancellationToken cancellationToken = default)
    {
        var matriculas = Db.Matriculas
            .AsNoTracking()
            .Where(m => m.EscolaId == escolaId);

        if (statusesIn is { Count: > 0 })
        {
            var lista = statusesIn.ToList();
            matriculas = matriculas.Where(m => lista.Contains(m.Status));
        }
        else if (!string.IsNullOrWhiteSpace(status))
        {
            matriculas = matriculas.Where(m => m.Status == status);
        }

        if (alunoId.HasValue)
        {
            matriculas = matriculas.Where(m => m.AlunoId == alunoId.Value);
        }

        if (turmaId.HasValue)
        {
            matriculas = matriculas.Where(m => m.TurmaId == turmaId.Value);
        }

        var query =
            from m in matriculas
            join a in Db.Alunos.AsNoTracking()
                on new { m.AlunoId, m.EscolaId } equals new { AlunoId = a.Id, EscolaId = a.EscolaId }
            join t in Db.Turmas.AsNoTracking()
                on new { TurmaId = m.TurmaId, m.EscolaId } equals new { TurmaId = (int?)t.Id, EscolaId = t.EscolaId } into turmas
            from t in turmas.DefaultIfEmpty()
            orderby m.DataMatricula descending, m.Id
            select new MatriculaListagemItem(
                m.Id,
                m.EscolaId,
                m.AlunoId,
                (a.Nome.Trim() + " " + a.Sobrenome.Trim()).Trim(),
                m.TurmaId,
                t != null ? t.Nome : null,
                m.DataMatricula,
                m.Status,
                m.DataCriacao,
                m.DataAtualizacao);

        return await query.ToListAsync(cancellationToken);
    }

    private async Task<bool> ExecutarExistsSqlAsync(string sql, Action<DbCommand> configurar, CancellationToken cancellationToken)
    {
        var connection = Db.Database.GetDbConnection();
        var shouldClose = connection.State == ConnectionState.Closed;

        if (shouldClose)
        {
            await connection.OpenAsync(cancellationToken);
        }

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = sql;
            configurar(command);

            var scalar = await command.ExecuteScalarAsync(cancellationToken);
            var total = scalar is null || scalar == DBNull.Value ? 0 : Convert.ToInt32(scalar);
            return total > 0;
        }
        finally
        {
            if (shouldClose)
            {
                await connection.CloseAsync();
            }
        }
    }

    private static void AddParameter(DbCommand command, string name, object value)
    {
        var p = command.CreateParameter();
        p.ParameterName = name;
        p.Value = value;
        command.Parameters.Add(p);
    }
}
