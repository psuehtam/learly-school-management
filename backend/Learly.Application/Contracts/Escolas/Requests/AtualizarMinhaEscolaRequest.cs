namespace Learly.Application.Contracts.Escolas.Requests;

public sealed class AtualizarMinhaEscolaRequest
{
    public string NomeFantasia { get; set; } = string.Empty;
    public string? RazaoSocial { get; set; }
    public string? Cnpj { get; set; }
    public string? Cep { get; set; }
    public string? Logradouro { get; set; }
    public string? Numero { get; set; }
    public string? Complemento { get; set; }
    public string? Bairro { get; set; }
    public string? Cidade { get; set; }
    public string? Uf { get; set; }
}

public sealed class AtualizarEscolaConfiguracoesRequest
{
    public int MinAlunosTurma { get; set; }
    public int? MaxAlunosTurma { get; set; }
    public string MetricaAula { get; set; } = "POR_DIA";
    public int DuracaoAulaMinutos { get; set; } = 120;
}
