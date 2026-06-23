using Learly.Domain.Entities;

namespace Learly.Application.Services.Turmas;

/// <summary>Gera datas de aula e distribui dias de planejamento conforme documentação §6.3.4.</summary>
internal static class TurmaAulaGerador
{
    public sealed record AulaPlanejada(
        int CapituloIdPrincipal,
        int NumeroAula,
        DateOnly DataAula,
        int PlanejamentoDiaOrdem);

    public sealed record ResultadoGeracao(
        IReadOnlyList<AulaPlanejada> Aulas,
        DateOnly? DataTerminoPrevista);

    /// <summary>
    /// Gera datas para N dias de planejamento (1 aula por dia), respeitando calendário.
    /// </summary>
    public static ResultadoGeracao GerarPorDiasPlanejamento(
        DateOnly dataInicio,
        IReadOnlyList<int> diasSemana,
        IReadOnlyList<LivroPlanejamentoDia> diasPlanejamento,
        Func<DateOnly, bool> diaSuspendeAula,
        int maxDiasVarredura = 365 * 3)
    {
        if (diasPlanejamento.Count == 0)
            return new ResultadoGeracao([], null);

        var slotsNecessarios = diasPlanejamento.Count;
        var diasSet = new HashSet<int>(diasSemana);
        var datasValidas = new List<DateOnly>(slotsNecessarios);
        var cursor = dataInicio;

        for (var i = 0; i < maxDiasVarredura && datasValidas.Count < slotsNecessarios; i++)
        {
            if (diasSet.Contains((int)cursor.DayOfWeek) && !diaSuspendeAula(cursor))
                datasValidas.Add(cursor);

            cursor = cursor.AddDays(1);
        }

        if (datasValidas.Count < slotsNecessarios)
        {
            throw new InvalidOperationException(
                $"Nao foi possivel alocar {slotsNecessarios} aulas em {maxDiasVarredura} dias (encontradas {datasValidas.Count} datas validas).");
        }

        var aulas = new List<AulaPlanejada>(slotsNecessarios);
        for (var i = 0; i < diasPlanejamento.Count; i++)
        {
            var diaPlan = diasPlanejamento[i];
            var capPrincipalId = diaPlan.Alocacoes
                .OrderBy(a => a.Ordem)
                .FirstOrDefault()?.CapituloId ?? 0;

            aulas.Add(new AulaPlanejada(capPrincipalId, i + 1, datasValidas[i], diaPlan.Ordem));
        }

        var termino = aulas.Count > 0 ? aulas[^1].DataAula : (DateOnly?)null;
        return new ResultadoGeracao(aulas, termino);
    }

    public static string MontarNomeTurma(string livroNome, int codigoSequencial, IReadOnlyList<int> diasSemana, TimeOnly horarioInicio)
    {
        var abrevs = diasSemana
            .Distinct()
            .OrderBy(d => d)
            .Select(DiaSemanaAbrev)
            .Where(s => s.Length > 0);
        var diasStr = string.Join("-", abrevs);
        var cod = codigoSequencial.ToString("00", System.Globalization.CultureInfo.InvariantCulture);
        var hora = horarioInicio.ToString("HH:mm", System.Globalization.CultureInfo.InvariantCulture);
        return $"{livroNome.Trim().ToUpperInvariant()} / {cod} {diasStr} {hora}";
    }

    private static string DiaSemanaAbrev(int dia) => dia switch
    {
        0 => "DOM",
        1 => "SEG",
        2 => "TER",
        3 => "QUA",
        4 => "QUI",
        5 => "SEX",
        6 => "SAB",
        _ => ""
    };
}
