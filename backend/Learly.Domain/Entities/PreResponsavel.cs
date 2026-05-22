namespace Learly.Domain.Entities;

/// <summary>Responsável financeiro em negociação (funil comercial), antes de virar <see cref="Responsavel"/>.</summary>
public sealed class PreResponsavel
{
    public static class Estados
    {
        public const string EmNegociacao = "Em negociacao";
        public const string AguardandoAprovacao = "Aguardando aprovacao";
        public const string Aprovado = "Aprovado";
        public const string Recusado = "Recusado";
        public const string Cancelado = "Cancelado";
        public const string Convertido = "Convertido";
    }

    public int Id { get; internal set; }
    public int EscolaId { get; internal set; }
    public string TipoPessoa { get; internal set; } = "Fisica";
    public string CpfCnpj { get; internal set; } = string.Empty;
    public string Nome { get; internal set; } = string.Empty;
    public string Sobrenome { get; internal set; } = string.Empty;
    public string? Telefone { get; internal set; }
    public string? GrauParentesco { get; internal set; }
    public string? Sexo { get; internal set; }
    public string? EstadoCivil { get; internal set; }
    public DateOnly? DataNascimento { get; internal set; }
    public string? CorRaca { get; internal set; }
    public string? Nacionalidade { get; internal set; }
    public string? NaturalidadeCidade { get; internal set; }
    public string? NaturalidadeEstado { get; internal set; }
    public string? RgNumero { get; internal set; }
    public DateOnly? RgExpedicao { get; internal set; }
    public string? RgOrgao { get; internal set; }
    public string? Cep { get; internal set; }
    public string? TipoLogradouro { get; internal set; }
    public string? Logradouro { get; internal set; }
    public string? Numero { get; internal set; }
    public string? Complemento { get; internal set; }
    public string? Bairro { get; internal set; }
    public string? Municipio { get; internal set; }
    public int? ResponsavelConvertidoId { get; internal set; }
    public string Status { get; internal set; } = Estados.EmNegociacao;
    public DateTime DataCriacao { get; internal set; }
    public DateTime DataAtualizacao { get; internal set; }
}
