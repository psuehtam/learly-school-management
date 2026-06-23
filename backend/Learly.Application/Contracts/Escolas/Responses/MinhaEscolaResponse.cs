namespace Learly.Application.Contracts.Escolas.Responses;

public sealed record MinhaEscolaResponse(
    int Id,
    string CodigoEscola,
    string NomeFantasia,
    string? RazaoSocial,
    string? Cnpj,
    string? Cep,
    string? Logradouro,
    string? Numero,
    string? Complemento,
    string? Bairro,
    string? Cidade,
    string? Uf,
    bool TemLogo);

public sealed record EscolaConfiguracoesResponse(
    int MinAlunosTurma,
    int? MaxAlunosTurma,
    string MetricaAula,
    int DuracaoAulaMinutos);
