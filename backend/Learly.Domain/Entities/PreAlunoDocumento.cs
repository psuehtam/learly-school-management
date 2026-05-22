namespace Learly.Domain.Entities;

/// <summary>Documento anexado a um pré-aluno (tipo extensível via <see cref="TipoCodigo"/>).</summary>
public sealed class PreAlunoDocumento
{
    public int Id { get; internal set; }
    public int EscolaId { get; internal set; }
    public int PreAlunoId { get; internal set; }

    /// <summary>Código estável do tipo (ex.: contrato, comprovante_matricula).</summary>
    public string TipoCodigo { get; internal set; } = string.Empty;

    /// <summary>Rótulo exibido na UI (permite personalização futura).</summary>
    public string NomeExibicao { get; internal set; } = string.Empty;

    public string NomeArquivoOriginal { get; internal set; } = string.Empty;

    /// <summary>Caminho relativo sob a pasta de uploads da aplicação.</summary>
    public string CaminhoRelativo { get; internal set; } = string.Empty;

    public string? ContentType { get; internal set; }
    public long TamanhoBytes { get; internal set; }
    public int EnviadoPorUsuarioId { get; internal set; }
    public DateTime DataUpload { get; internal set; }
}
