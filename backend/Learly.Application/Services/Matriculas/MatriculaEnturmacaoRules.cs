using Learly.Domain.Entities;
using Learly.Domain.Interfaces.Repositories;

namespace Learly.Application.Services.Matriculas;

internal readonly record struct MatriculaEnturmacaoValidacao(bool Ok, string? Mensagem = null, int StatusCode = 204)
{
    public static MatriculaEnturmacaoValidacao Sucesso() => new(true, null, 204);

    public static MatriculaEnturmacaoValidacao Falha(string mensagem, int statusCode) =>
        new(false, mensagem, statusCode);
}

internal static class MatriculaEnturmacaoRules
{
    public static MatriculaEnturmacaoValidacao NormalizarMatriculaIds(
        IEnumerable<int>? matriculaIds,
        out IReadOnlyList<int> idsNormalizados)
    {
        idsNormalizados = [];
        if (matriculaIds is null)
        {
            return MatriculaEnturmacaoValidacao.Sucesso();
        }

        var ids = matriculaIds.ToList();
        if (ids.Count == 0)
        {
            return MatriculaEnturmacaoValidacao.Sucesso();
        }

        if (ids.Any(id => id <= 0))
        {
            return MatriculaEnturmacaoValidacao.Falha(
                "MatriculaIds invalidos. Informe apenas ids positivos.",
                400);
        }

        var distintos = ids.Distinct().ToList();
        if (distintos.Count != ids.Count)
        {
            return MatriculaEnturmacaoValidacao.Falha(
                "MatriculaIds duplicados. Selecione cada matricula apenas uma vez.",
                400);
        }

        idsNormalizados = distintos;
        return MatriculaEnturmacaoValidacao.Sucesso();
    }

    public static MatriculaEnturmacaoValidacao ValidarSelecaoUnicaPorAluno(IReadOnlyList<Matricula> matriculas)
    {
        var duplicada = matriculas
            .GroupBy(m => m.AlunoId)
            .FirstOrDefault(g => g.Count() > 1);

        if (duplicada is null)
        {
            return MatriculaEnturmacaoValidacao.Sucesso();
        }

        return MatriculaEnturmacaoValidacao.Falha(
            $"O aluno #{duplicada.Key} foi selecionado mais de uma vez. Escolha apenas uma matricula por aluno.",
            409);
    }

    public static async Task<MatriculaEnturmacaoValidacao> ValidarVinculoAsync(
        IMatriculaRepository matriculasRepository,
        int escolaId,
        Matricula matricula,
        int turmaId,
        CancellationToken cancellationToken = default)
    {
        if (!string.Equals(matricula.Status, Matricula.Estados.EmEspera, StringComparison.OrdinalIgnoreCase)
            || matricula.TurmaId.HasValue)
        {
            return MatriculaEnturmacaoValidacao.Falha(
                "Somente matriculas em espera sem turma podem ser enturmadas.",
                409);
        }

        var existeDuplicidade = await matriculasRepository.ExisteDuplicidadeAsync(
            escolaId,
            matricula.AlunoId,
            turmaId,
            cancellationToken);

        if (existeDuplicidade)
        {
            return MatriculaEnturmacaoValidacao.Falha(
                "Aluno ja possui matricula nessa turma.",
                409);
        }

        var outraTurmaAtiva = await matriculasRepository.ObterOutraTurmaAtivaDoAlunoAsync(
            escolaId,
            matricula.AlunoId,
            matricula.Id,
            cancellationToken);

        if (outraTurmaAtiva is null)
        {
            return MatriculaEnturmacaoValidacao.Sucesso();
        }

        return MatriculaEnturmacaoValidacao.Falha(
            $"O aluno ja esta matriculado na turma \"{outraTurmaAtiva.TurmaNome}\". Cada aluno pode participar de apenas uma turma por vez.",
            409);
    }
}
