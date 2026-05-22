namespace Learly.Domain.ReadModels;

/// <summary>Dados do responsável vinculado ao pré-aluno (cadastro + telefone).</summary>
public sealed record ResponsavelDadosItem(
    int Id,
    string Nome,
    string Sobrenome,
    string CpfCnpj,
    string? Sexo,
    string? GrauParentesco,
    string? EstadoCivil,
    string? CorRaca,
    string? Nacionalidade,
    DateOnly? DataNascimento,
    string? NaturalidadeCidade,
    string? NaturalidadeEstado,
    string? RgNumero,
    DateOnly? RgExpedicao,
    string? RgOrgao,
    string? Cep,
    string? TipoLogradouro,
    string? Logradouro,
    string? Numero,
    string? Complemento,
    string? Bairro,
    string? Municipio,
    string? Telefone);
