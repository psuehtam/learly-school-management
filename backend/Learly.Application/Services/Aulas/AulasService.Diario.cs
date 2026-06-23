using Learly.Application.Contracts.Aulas;
using Learly.Application.Contracts.Aulas.Requests;
using Learly.Application.Contracts.Aulas.Responses;
using Learly.Application.Services.Common;
using Learly.Domain.Entities;

namespace Learly.Application.Services.Aulas;

public sealed partial class AulasService
{
    public async Task<IReadOnlyList<PresencaResponse>> ListarPresencasAsync(
        int aulaId,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var ctx = await ObterAulaLeituraAsync(aulaId, uc, cancellationToken);
        if (ctx is null)
        {
            return [];
        }

        var lista = await _presencas.ListarPorAulaAsync(ctx.Value.EscolaId, aulaId, cancellationToken);
        return lista.Select(p => new PresencaResponse
        {
            Id = p.Id,
            AulaId = p.AulaId,
            AlunoId = p.AlunoId,
            StatusPresenca = p.StatusPresenca,
        }).ToList();
    }

    public async Task<AulaOperacaoResultado> RegistrarChamadaAsync(
        int aulaId,
        RegistrarChamadaRequest request,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var ctx = await ObterAulaLeituraAsync(aulaId, uc, cancellationToken);
        if (ctx is null)
        {
            return new AulaOperacaoResultado(false, "Aula nao encontrada.", 404);
        }

        var (escolaId, turmaId) = ctx.Value;
        var alunosTurma = await ObterAlunoIdsAtivosNaTurmaAsync(escolaId, turmaId, cancellationToken);
        if (alunosTurma.Count == 0)
        {
            return new AulaOperacaoResultado(false, "Turma sem alunos ativos.", 400);
        }

        var itensValidos = (request.Presencas ?? [])
            .Where(p => alunosTurma.Contains(p.AlunoId))
            .ToList();

        var alunosNoPayload = itensValidos.Select(p => p.AlunoId).ToHashSet();

        foreach (var item in itensValidos)
        {
            var existente = await _presencas.ObterRastreadaPorAulaAlunoAsync(
                escolaId, aulaId, item.AlunoId, cancellationToken);

            if (existente is not null)
            {
                if (!existente.PodeAlterarPeloProfessor())
                {
                    continue;
                }

                existente.AtualizarStatusProfessor(item.Status);
                continue;
            }

            await _presencas.AdicionarAsync(
                Presenca.Criar(escolaId, aulaId, item.AlunoId, item.Status),
                cancellationToken);
        }

        foreach (var alunoId in alunosTurma.Where(id => !alunosNoPayload.Contains(id)))
        {
            var existente = await _presencas.ObterRastreadaPorAulaAlunoAsync(
                escolaId, aulaId, alunoId, cancellationToken);
            if (existente is null || !existente.PodeAlterarPeloProfessor())
            {
                continue;
            }

            await _presencas.RemoverAsync(existente, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return new AulaOperacaoResultado(true, null, 204);
    }

    public async Task<IReadOnlyList<HomeworkResponse>> ListarHomeworkAsync(
        int aulaId,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var ctx = await ObterAulaLeituraAsync(aulaId, uc, cancellationToken);
        if (ctx is null)
        {
            return [];
        }

        var lista = await _homeworks.ListarPorAulaAsync(ctx.Value.EscolaId, aulaId, cancellationToken);
        return lista.Select(h => new HomeworkResponse
        {
            Id = h.Id,
            AulaId = h.AulaId,
            AlunoId = h.AlunoId,
            Nota = h.Nota,
        }).ToList();
    }

    public async Task<AulaOperacaoResultado> LancarHomeworkAsync(
        int aulaId,
        LancarHomeworkRequest request,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var ctx = await ObterAulaLeituraAsync(aulaId, uc, cancellationToken);
        if (ctx is null)
        {
            return new AulaOperacaoResultado(false, "Aula nao encontrada.", 404);
        }

        var (escolaId, turmaId) = ctx.Value;
        var alunosTurma = await ObterAlunoIdsAtivosNaTurmaAsync(escolaId, turmaId, cancellationToken);

        foreach (var item in request.Notas ?? [])
        {
            if (!alunosTurma.Contains(item.AlunoId))
            {
                continue;
            }

            if (item.Nota is < 0 or > 100)
            {
                return new AulaOperacaoResultado(false, "Nota deve estar entre 0 e 100.", 400);
            }

            var existente = await _homeworks.ObterRastreadoPorAulaAlunoAsync(
                escolaId, aulaId, item.AlunoId, cancellationToken);

            if (!item.Nota.HasValue)
            {
                if (existente is not null)
                {
                    _homeworks.Remover(existente);
                }

                continue;
            }

            if (existente is null)
            {
                await _homeworks.AdicionarAsync(
                    Homework.Criar(escolaId, aulaId, item.AlunoId, item.Nota),
                    cancellationToken);
            }
            else
            {
                existente.AtualizarNota(item.Nota);
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return new AulaOperacaoResultado(true, null, 204);
    }

    private async Task<HashSet<int>> ObterAlunoIdsAtivosNaTurmaAsync(
        int escolaId,
        int turmaId,
        CancellationToken cancellationToken)
    {
        var mats = await _matriculas.ListarPorEscolaComFiltrosAsync(
            escolaId,
            Matricula.Estados.Ativo,
            null,
            turmaId,
            cancellationToken: cancellationToken);
        return mats.Select(m => m.AlunoId).ToHashSet();
    }

    private async Task<(int EscolaId, int TurmaId)?> ObterAulaLeituraAsync(
        int aulaId,
        AppUserContext uc,
        CancellationToken cancellationToken)
    {
        var escolaId = await ObterIdEscolaAtivaPorCodigoAsync(uc.CodigoEscola, cancellationToken);
        if (!escolaId.HasValue)
        {
            return null;
        }

        var filtroProfessor = EhProfessor(uc) ? uc.UserId : (int?)null;
        var aula = await _aulas.ObterSemRastreioPorIdEEscolaAsync(
            aulaId,
            escolaId.Value,
            filtroProfessor,
            cancellationToken);
        if (aula is null)
        {
            return null;
        }

        return (escolaId.Value, aula.TurmaId);
    }
}
