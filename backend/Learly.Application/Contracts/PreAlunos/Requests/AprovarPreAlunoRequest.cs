namespace Learly.Application.Contracts.PreAlunos.Requests;

/// <summary>Dados complementares obrigatórios para converter o pré-aluno em aluno oficial.</summary>
public sealed class AprovarPreAlunoRequest
{
    public bool EProprioResponsavel { get; init; }
    public string Sexo { get; init; } = string.Empty;
    public DateOnly DataIngresso { get; init; }
    public string? Cpf { get; init; }
    public string Cep { get; init; } = string.Empty;
    public string TipoLogradouro { get; init; } = string.Empty;
    public string Logradouro { get; init; } = string.Empty;
    public string Numero { get; init; } = string.Empty;
    public string? Complemento { get; init; }
    public string Bairro { get; init; } = string.Empty;
    public string Municipio { get; init; } = string.Empty;
    public string? AlunoTelefone { get; init; }

    public string? ResponsavelNome { get; init; }
    public string? ResponsavelSobrenome { get; init; }
    public string? ResponsavelCpf { get; init; }
    public string? ResponsavelSexo { get; init; }
    public string? ResponsavelTelefone { get; init; }
    public string? ResponsavelCep { get; init; }
    public string? ResponsavelTipoLogradouro { get; init; }
    public string? ResponsavelLogradouro { get; init; }
    public string? ResponsavelNumero { get; init; }
    public string? ResponsavelComplemento { get; init; }
    public string? ResponsavelBairro { get; init; }
    public string? ResponsavelMunicipio { get; init; }

    public string? CorRaca { get; init; }
    public string? EstadoCivil { get; init; }
    public string? Profissao { get; init; }
    public string? RegistroEscolar { get; init; }
    public string? Nacionalidade { get; init; }
    public DateOnly? DataEntradaPais { get; init; }
    public string? NaturalidadeCidade { get; init; }
    public string? NaturalidadeEstado { get; init; }
    public string? RgNumero { get; init; }
    public DateOnly? RgExpedicao { get; init; }
    public string? RgOrgao { get; init; }
}
