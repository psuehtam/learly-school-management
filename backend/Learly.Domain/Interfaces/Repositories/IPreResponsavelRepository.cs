using Learly.Domain.Entities;
using Learly.Domain.ReadModels;

namespace Learly.Domain.Interfaces.Repositories;

public interface IPreResponsavelRepository : IRepository<PreResponsavel, int>
{
    Task<PreResponsavel?> ObterPorIdEEscolaRastreadoAsync(
        int id,
        int escolaId,
        CancellationToken cancellationToken = default);

    Task<PreResponsavel?> ObterPorIdEEscolaAsync(
        int id,
        int escolaId,
        CancellationToken cancellationToken = default);

    /// <summary>Reutiliza pré-responsável ativo (não convertido) pelo CPF/CNPJ na escola.</summary>
    Task<PreResponsavel?> ObterAtivoPorCpfAsync(
        int escolaId,
        string cpfCnpj,
        CancellationToken cancellationToken = default);

    Task<ResponsavelDadosItem?> ObterDadosAsync(
        int preResponsavelId,
        int escolaId,
        CancellationToken cancellationToken = default);

    Task AtualizarOpcionaisAsync(
        int escolaId,
        int preResponsavelId,
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
        string? telefone,
        CancellationToken cancellationToken = default);
}
