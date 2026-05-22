namespace Learly.Application;

/// <summary>Tipos padrão de documentos do pré-aluno. Adicione novos códigos aqui e no front-end.</summary>
public static class PreAlunoDocumentoTipos
{
    public const string Contrato = "contrato";
    public const string ComprovanteMatricula = "comprovante_matricula";
    public const string FichaInscricao = "ficha_inscricao";
    public const string DocumentoAluno = "documento_aluno";

    public static readonly IReadOnlyDictionary<string, string> RotulosPadrao =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [Contrato] = "Contrato",
            [ComprovanteMatricula] = "Comprovante de Matrícula",
            [FichaInscricao] = "Ficha de Inscrição",
            [DocumentoAluno] = "Documento do Aluno",
        };

    public static bool EhTipoConhecido(string? tipoCodigo)
    {
        if (string.IsNullOrWhiteSpace(tipoCodigo))
            return false;

        var codigo = NormalizarCodigo(tipoCodigo);
        return RotulosPadrao.ContainsKey(codigo)
               || codigo.Length is >= 2 and <= 50
                  && codigo.All(c => char.IsAsciiLetterOrDigit(c) || c == '_');
    }

    public static string NormalizarCodigo(string tipoCodigo)
    {
        return tipoCodigo.Trim().ToLowerInvariant();
    }

    public static string ResolverRotulo(string tipoCodigo, string? nomeExibicao)
    {
        var codigo = NormalizarCodigo(tipoCodigo);
        if (!string.IsNullOrWhiteSpace(nomeExibicao))
            return nomeExibicao.Trim();

        return RotulosPadrao.TryGetValue(codigo, out var rotulo) ? rotulo : codigo;
    }
}
