using Learly.Domain.Entities;
using Learly.Domain.ReadModels;

namespace Learly.Domain.Interfaces.Repositories;

public interface IAlunoRepository : IRepository<Aluno, int>
{
    Task<IReadOnlyList<AlunoListagemItem>> ListarPorEscolaAsync(
        int escolaId,
        string? status,
        string? busca,
        int limite,
        CancellationToken cancellationToken = default);

    Task<Aluno?> ObterPorIdEEscolaAsync(int alunoId, int escolaId, CancellationToken cancellationToken = default);

    Task<string?> ObterTelefonePrincipalAsync(
        int escolaId,
        string entidade,
        int entidadeId,
        CancellationToken cancellationToken = default);

    Task<Responsavel?> ObterResponsavelPorIdEEscolaAsync(
        int responsavelId,
        int escolaId,
        CancellationToken cancellationToken = default);

    Task<ResponsavelDadosItem?> ObterResponsavelDadosAsync(
        int responsavelId,
        int escolaId,
        CancellationToken cancellationToken = default);

    Task<bool> ExisteCpfNaEscolaAsync(int escolaId, string cpf, CancellationToken cancellationToken = default);
    Task<bool> ExisteResponsavelNaEscolaAsync(int escolaId, int responsavelId, CancellationToken cancellationToken = default);
    Task<int?> ObterResponsavelIdPorCpfAsync(int escolaId, string cpfCnpj, CancellationToken cancellationToken = default);
    Task<int> CriarResponsavelFisicoAsync(
        int escolaId,
        string cpf,
        string nome,
        string sobrenome,
        string sexo,
        string cep,
        string tipoLogradouro,
        string logradouro,
        string numero,
        string? complemento,
        string bairro,
        string municipio,
        CancellationToken cancellationToken = default);

    /// <summary>Cria responsável apenas com dados mínimos (funil comercial / pré-aluno).</summary>
    Task<int> CriarResponsavelMinimoAsync(
        int escolaId,
        string tipoPessoa,
        string cpfCnpj,
        string nome,
        string sobrenome,
        CancellationToken cancellationToken = default);

    /// <summary>Insere em contatos_telefone (entidade: aluno ou responsavel, conforme o banco).</summary>
    Task InserirContatoTelefoneAsync(
        int escolaId,
        string entidade,
        int entidadeId,
        string tipo,
        string numero,
        bool principal,
        CancellationToken cancellationToken = default);

    /// <summary>Atualiza colunas opcionais do responsável (apenas campos informados).</summary>
    Task AtualizarResponsavelOpcionaisAsync(
        int escolaId,
        int responsavelId,
        string? sexo,
        string? grauParentesco,
        string? estadoCivil,
        string? corRaca,
        string? nacionalidade,
        DateOnly? dataNascimento,
        string? naturalidadeCidade,
        string? naturalidadeEstado,
        string? rgNumero,
        DateOnly? rgExpedicao,
        string? rgOrgao,
        CancellationToken cancellationToken = default);
}
