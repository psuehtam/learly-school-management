namespace Learly.Application.Contracts.PreAlunos.Responses;

public sealed record PreAlunoListItemResponse(
    int Id,
    string NomeCompletoAluno,
    string NomeCompletoResponsavel,
    DateTime DataCadastro,
    string TipoContrato,
    string Status,
    string NomeLivroInteresse,
    string? TelefoneAluno,
    decimal ValorMensalidade,
    string? FormaPagamento,
    string OrigemCaptacao,
    decimal? ValorMaterial,
    decimal ValorMatricula,
    string? ObservacoesComerciais);
