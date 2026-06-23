using Learly.Application.Contracts.Turmas;
using Learly.Application.Contracts.Turmas.Requests;
using Learly.Application.Contracts.Turmas.Responses;
using Learly.Application.Services.Common;
using Learly.Domain.Entities;
using Learly.Domain.Exceptions;

namespace Learly.Application.Services.Turmas;

public sealed partial class TurmasService
{
    public async Task<IReadOnlyList<AvaliacaoTurmaResponse>> ListarAvaliacoesAsync(
        int turmaId,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterEscolaIdAsync(uc, cancellationToken);
        if (!escolaId.HasValue)
        {
            return [];
        }

        if (!await TurmaAcessivelAsync(escolaId.Value, turmaId, uc, cancellationToken))
        {
            return [];
        }

        var lista = await _avaliacoes.ListarPorTurmaAsync(escolaId.Value, turmaId, cancellationToken);
        return lista.Select(MapAvaliacao).ToList();
    }

    public async Task<TurmaOperacaoResultado> SalvarAvaliacoesAsync(
        int turmaId,
        SalvarAvaliacoesTurmaRequest request,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterEscolaIdAsync(uc, cancellationToken);
        if (!escolaId.HasValue)
        {
            return Falha("Acesso negado.", TurmasFalha.AcessoNegado, 403);
        }

        if (!await TurmaAcessivelAsync(escolaId.Value, turmaId, uc, cancellationToken))
        {
            return Falha("Turma nao encontrada.", TurmasFalha.NaoEncontrado, 404);
        }

        var alunosTurma = await ObterAlunoIdsAtivosNaTurmaAsync(escolaId.Value, turmaId, cancellationToken);

        foreach (var item in request.Avaliacoes ?? [])
        {
            if (!alunosTurma.Contains(item.AlunoId))
            {
                continue;
            }

            string tipoNorm;
            try
            {
                tipoNorm = Avaliacao.NormalizarTipo(item.Tipo);
            }
            catch (DomainException ex)
            {
                return Falha(ex.Message, TurmasFalha.Validacao);
            }

            var existente = await _avaliacoes.ObterRastreadaAsync(
                escolaId.Value,
                turmaId,
                item.AlunoId,
                tipoNorm,
                cancellationToken);

            if (existente is null)
            {
                await _avaliacoes.AdicionarAsync(
                    Avaliacao.Criar(escolaId.Value, turmaId, item.AlunoId, tipoNorm, item.Nota),
                    cancellationToken);
            }
            else
            {
                existente.AtualizarNota(item.Nota);
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return new TurmaOperacaoResultado(true, null, null, TurmasFalha.Nenhuma, 204);
    }

    private async Task<bool> TurmaAcessivelAsync(
        int escolaId,
        int turmaId,
        AppUserContext uc,
        CancellationToken cancellationToken)
    {
        var filtroProfessor = FiltroProfessorId(uc);
        var rows = await _turmas.ListarDetalhadoPorEscolaAsync(
            escolaId,
            null,
            filtroProfessor,
            cancellationToken);
        return rows.Any(r => r.Id == turmaId);
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

    private static AvaliacaoTurmaResponse MapAvaliacao(Avaliacao a) =>
        new()
        {
            Id = a.Id,
            TurmaId = a.TurmaId,
            AlunoId = a.AlunoId,
            Tipo = a.TipoAvaliacao,
            Nota = a.Nota,
        };
}
