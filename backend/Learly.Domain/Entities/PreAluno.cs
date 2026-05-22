using Learly.Domain.Exceptions;

namespace Learly.Domain.Entities;

public sealed class PreAluno
{
    public static class Estados
    {
        public const string EmNegociacao = "Em negociacao";
        public const string AguardandoAprovacao = "Aguardando aprovacao";
        public const string Aprovado = "Aprovado";
        public const string Matriculado = "Matriculado";
        public const string Cancelado = "Cancelado";

        public static string Normalize(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new DomainException("Status do pre-aluno e obrigatorio.");

            var s = value.Trim();
            if (s.Equals(EmNegociacao, StringComparison.OrdinalIgnoreCase)) return EmNegociacao;
            if (s.Equals(AguardandoAprovacao, StringComparison.OrdinalIgnoreCase)) return AguardandoAprovacao;
            if (s.Equals(Aprovado, StringComparison.OrdinalIgnoreCase)) return Aprovado;
            if (s.Equals(Matriculado, StringComparison.OrdinalIgnoreCase)) return Matriculado;
            if (s.Equals(Cancelado, StringComparison.OrdinalIgnoreCase)) return Cancelado;

            throw new DomainException("Status do pre-aluno invalido.");
        }
    }

    public int Id { get; internal set; }
    public int EscolaId { get; internal set; }
    public int PreResponsavelId { get; internal set; }
    public int? ResponsavelId { get; internal set; }

    private string _nome = string.Empty;
    public string Nome
    {
        get => _nome;
        internal set => _nome = ValidarObrigatorio(value, "Nome do pre-aluno e obrigatorio.");
    }

    private string _sobrenome = string.Empty;
    public string Sobrenome
    {
        get => _sobrenome;
        internal set => _sobrenome = ValidarObrigatorio(value, "Sobrenome do pre-aluno e obrigatorio.");
    }

    public DateOnly DataNascimento { get; internal set; }
    public string? Telefone { get; internal set; }
    public int LivroInteresseId { get; internal set; }

    private string _tipoContrato = string.Empty;
    public string TipoContrato
    {
        get => _tipoContrato;
        internal set => _tipoContrato = ValidarObrigatorio(value, "Tipo de contrato e obrigatorio.");
    }

    public decimal ValorMensalidade { get; internal set; }

    /// <summary>Forma de pagamento da mensalidade (opcional).</summary>
    public string? FormaPagamento { get; internal set; }

    public decimal ValorMatricula { get; internal set; }

    /// <summary>Forma de pagamento da matrícula quando <see cref="ValorMatricula"/> &gt; 0.</summary>
    public string? FormaPagamentoMatricula { get; internal set; }

    /// <summary>Valor total cobrado pelo material/livro didático (0 = gratuito).</summary>
    public decimal? ValorMaterial { get; internal set; }

    private string _origemCaptacao = string.Empty;
    public string OrigemCaptacao
    {
        get => _origemCaptacao;
        internal set => _origemCaptacao = ValidarObrigatorio(value, "Origem de captacao do pre-aluno e obrigatoria.");
    }

    public bool UsaTransporteVan { get; internal set; }
    public string? TransporteCep { get; internal set; }
    public string? TransporteLogradouro { get; internal set; }
    public string? TransporteNumero { get; internal set; }
    public string? TransporteComplemento { get; internal set; }
    public string? TransporteBairro { get; internal set; }
    public string? TransporteCidade { get; internal set; }
    public string? TransporteUf { get; internal set; }

    public string? ObservacoesComerciais { get; internal set; }

    public bool EProprioResponsavel { get; internal set; }
    public string? AlunoCpf { get; internal set; }

    private string _status = Estados.EmNegociacao;
    public string Status
    {
        get => _status;
        internal set => _status = Estados.Normalize(value);
    }

    public int? AlunoId { get; internal set; }
    public int CriadoPorUsuarioId { get; internal set; }
    public DateTime DataCriacao { get; internal set; }
    public DateTime DataAtualizacao { get; internal set; }

    private static string ValidarObrigatorio(string? value, string message)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException(message);
        return value.Trim();
    }
}
