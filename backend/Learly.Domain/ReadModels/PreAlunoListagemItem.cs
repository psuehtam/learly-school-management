namespace Learly.Domain.ReadModels;

/// <summary>Item de lista de pré-alunos com dados de apoio vindos do banco (joins).</summary>
public sealed record PreAlunoListagemItem(
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
