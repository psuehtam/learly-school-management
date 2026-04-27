namespace Learly.Application.Services.Templates;

/// <summary>
/// Agrupa permissões por um "módulo" derivado do nome (ex.: <c>VISUALIZAR_USUARIO</c> → módulo <c>USUARIO</c>).
/// </summary>
internal static class PermissaoModuloClassifier
{
    private static readonly Dictionary<string, string> RotulosPorModulo = new(StringComparer.OrdinalIgnoreCase)
    {
        ["GERAL"] = "Geral",
        ["USUARIO"] = "Usuarios",
        ["PERFIL"] = "Perfis",
        ["ESCOLAS"] = "Escolas",
        ["PRE_ALUNO"] = "Pre-alunos",
        ["CONTRATO"] = "Contratos",
        ["ALUNO"] = "Alunos",
        ["RESPONSAVEL"] = "Responsaveis",
        ["FILIACAO"] = "Filiacoes",
        ["MATRICULA"] = "Matriculas",
        ["TURMA"] = "Turmas",
        ["AULA"] = "Aulas",
        ["PRESENCA"] = "Presenca",
        ["HOMEWORK"] = "Homework",
        ["AVALIACAO"] = "Avaliacoes",
        ["OCORRENCIA"] = "Ocorrencias",
        ["REPOSICAO"] = "Reposicoes",
        ["LIVRO"] = "Livros",
        ["CAPITULO"] = "Capitulos",
        ["CALENDARIO"] = "Calendario",
        ["COMPROMISSO"] = "Compromissos",
        ["COMPROMISSOS"] = "Compromissos",
        ["ARQUIVO_TURMA"] = "Arquivos de turma",
        ["PARCELA"] = "Parcelas",
        ["MOVIMENTACAO_FINANCEIRA"] = "Movimentacao financeira",
        ["CONTA_BANCARIA"] = "Contas bancarias",
        ["CATEGORIA_FINANCEIRA"] = "Categorias financeiras",
        ["RELATORIO"] = "Relatorios",
        ["DASHBOARD"] = "Dashboards",
        ["LOGS"] = "Auditoria e logs",
        ["CONFIGURACOES"] = "Sistema",
        ["BACKUP"] = "Sistema",
        ["METRICAS"] = "Sistema",
        ["IMPORTAR"] = "Importacao",
        ["EXPORTAR"] = "Exportacao",
    };

    public static string InferirModulo(string nomePermissao)
    {
        if (string.IsNullOrWhiteSpace(nomePermissao))
            return "GERAL";

        var partes = nomePermissao.Split('_', StringSplitOptions.RemoveEmptyEntries);
        if (partes.Length < 2)
            return "GERAL";

        // Ex.: VISUALIZAR_RELATORIO_FREQUENCIA → RELATORIO
        if (partes.Length >= 3 && partes[1] == "RELATORIO")
            return "RELATORIO";

        // Ex.: GERENCIAR_CONFIGURACOES_SISTEMA → CONFIGURACOES
        if (partes.Length >= 3 && partes[1] == "CONFIGURACOES")
            return "CONFIGURACOES";

        if (partes.Length >= 3 && partes[1] == "IMPORTAR")
            return "IMPORTAR";

        if (partes.Length >= 3 && partes[1] == "EXPORTAR")
            return "EXPORTAR";

        if (partes.Length >= 2 && partes[1] == "LOGS")
            return "LOGS";

        if (partes.Length >= 2 && partes[1] == "METRICAS")
            return "METRICAS";

        return partes[1];
    }

    public static string RotuloDoModulo(string modulo)
    {
        if (RotulosPorModulo.TryGetValue(modulo, out var r))
            return r;

        return modulo.Replace('_', ' ');
    }
}
