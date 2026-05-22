namespace Learly.Application.Contracts.PreAlunos.Requests;

public sealed class CriarPreAlunoRequest
{
    /// <summary>Permitido somente quando o pré-aluno tiver 18 anos ou mais; menor de idade deve ter outro responsável.</summary>
    public bool EProprioResponsavel { get; init; }

    /// <summary>CPF com 11 dígitos obrigatório quando <see cref="EProprioResponsavel"/> é verdadeiro.</summary>
    public string? AlunoCpf { get; init; }

    public string ResponsavelTipoPessoa { get; init; } = "Fisica";
    public string ResponsavelCpfCnpj { get; init; } = string.Empty;
    public string ResponsavelNome { get; init; } = string.Empty;
    public string ResponsavelSobrenome { get; init; } = string.Empty;
    public string ResponsavelTelefone { get; init; } = string.Empty;

    public string? ResponsavelSexo { get; init; }
    public string? ResponsavelGrauParentesco { get; init; }
    public string? ResponsavelEstadoCivil { get; init; }
    public string? ResponsavelCorRaca { get; init; }
    public string? ResponsavelNacionalidade { get; init; }
    public string? ResponsavelDataNascimento { get; init; }
    public string? ResponsavelNaturalidadeCidade { get; init; }
    public string? ResponsavelNaturalidadeEstado { get; init; }
    public string? ResponsavelRgNumero { get; init; }
    public string? ResponsavelRgExpedicao { get; init; }
    public string? ResponsavelRgOrgao { get; init; }

    public string Nome { get; init; } = string.Empty;
    public string Sobrenome { get; init; } = string.Empty;
    public DateOnly DataNascimento { get; init; }
    public string? TelefoneAluno { get; init; }
    public int LivroInteresseId { get; init; }

    /// <summary>Texto livre ou padrão (ex.: <c>12 meses</c>).</summary>
    public string TipoContrato { get; init; } = string.Empty;
    public decimal ValorMensalidade { get; init; }

    /// <summary>Opcional.</summary>
    public string? FormaPagamento { get; init; }

    public decimal ValorMatricula { get; init; }

    /// <summary>Obrigatório quando <see cref="ValorMatricula"/> &gt; 0.</summary>
    public string? FormaPagamentoMatricula { get; init; }

    /// <summary>Valor total do material/livro (0 = gratuito).</summary>
    public decimal? ValorMaterial { get; init; }

    /// <summary>Indicação, leads, etc.</summary>
    public string OrigemCaptacao { get; init; } = string.Empty;

    public bool UsaTransporteVan { get; init; }
    public string? TransporteCep { get; init; }
    public string? TransporteLogradouro { get; init; }
    public string? TransporteNumero { get; init; }
    public string? TransporteComplemento { get; init; }
    public string? TransporteBairro { get; init; }
    public string? TransporteCidade { get; init; }
    public string? TransporteUf { get; init; }

    public string? ObservacoesComerciais { get; init; }
}
