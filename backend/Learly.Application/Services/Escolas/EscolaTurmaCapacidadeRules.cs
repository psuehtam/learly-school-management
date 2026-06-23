using Learly.Domain.Interfaces.Repositories;

namespace Learly.Application.Services.Escolas;

internal static class EscolaTurmaCapacidadeRules
{
    public static async Task<(bool Ok, string? Mensagem)> ValidarVinculoAsync(
        IEscolaRepository escolas,
        ITurmaRepository turmas,
        int escolaId,
        int turmaId,
        int quantidadeNovosVinculos,
        CancellationToken cancellationToken = default)
    {
        if (quantidadeNovosVinculos <= 0)
            return (true, null);

        var escola = await escolas.ObterPorIdAsync(escolaId, cancellationToken);
        var max = escola?.MaxAlunosTurma;
        if (!max.HasValue)
            return (true, null);

        var ativos = await turmas.ContarMatriculasAtivasAsync(turmaId, cancellationToken);
        if (ativos + quantidadeNovosVinculos > max.Value)
        {
            return (false, $"Turma atingiu o limite de {max.Value} alunos (atual: {ativos}).");
        }

        return (true, null);
    }
}
