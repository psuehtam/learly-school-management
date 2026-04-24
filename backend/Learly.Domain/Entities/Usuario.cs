using System.Text.RegularExpressions;
using Learly.Domain.Exceptions;

namespace Learly.Domain.Entities;

public sealed class Usuario
{
    public static class Estados
    {
        public const string Ativo = "Ativo";
        public const string Inativo = "Inativo";
    }

    /// <summary>
    /// Cria um usuario novo ja com status <see cref="Estados.Ativo"/>; <paramref name="senhaHash"/> deve ser o hash persistido (ex.: BCrypt).
    /// </summary>
    public static Usuario CriarNovo(int escolaId, int perfilId, string nomeCompleto, string email, string senhaHash)
    {
        if (escolaId <= 0)
            throw new DomainException("EscolaId invalido.");

        if (perfilId <= 0)
            throw new DomainException("PerfilId invalido.");

        return new Usuario
        {
            EscolaId = escolaId,
            PerfilId = perfilId,
            NomeCompleto = nomeCompleto,
            Email = email,
            Senha = senhaHash,
            Status = Estados.Ativo
        };
    }

    public int Id { get; internal set; }

    public int EscolaId { get; internal set; }

    private string _nomeCompleto = string.Empty;

    public string NomeCompleto
    {
        get => _nomeCompleto;
        internal set => _nomeCompleto = ValidarNomeCompleto(value);
    }

    private string _email = string.Empty;

    public string Email
    {
        get => _email;
        internal set => _email = ValidarEmail(value);
    }

    private string _senha = string.Empty;

    public string Senha
    {
        get => _senha;
        internal set => _senha = ValidarSenhaArmazenada(value);
    }

    public int PerfilId { get; internal set; }

    private string _status = Estados.Ativo;

    public string Status
    {
        get => _status;
        internal set => _status = ValidarStatus(value);
    }

    public void Desativar()
    {
        Status = Estados.Inativo;
    }

    public void Reativar()
    {
        Status = Estados.Ativo;
    }

    public void AlterarIdentificacao(string nomeCompleto, string email)
    {
        NomeCompleto = nomeCompleto;
        Email = email;
    }

    public void AlterarPerfil(int perfilId)
    {
        if (perfilId <= 0)
            throw new DomainException("PerfilId invalido.");

        PerfilId = perfilId;
    }

    private static string ValidarNomeCompleto(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Nome completo e obrigatorio.");

        return value.Trim();
    }

    private static string ValidarEmail(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Email e obrigatorio.");

        var trimmed = value.Trim();
        if (!Regex.IsMatch(trimmed, @"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.IgnoreCase))
            throw new DomainException("Email em formato invalido.");

        return trimmed.ToLowerInvariant();
    }

    private static string ValidarSenhaArmazenada(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Senha (hash) e obrigatoria.");

        return value;
    }

    private static string ValidarStatus(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Status do usuario e obrigatorio.");

        var s = value.Trim();
        if (!string.Equals(s, Estados.Ativo, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(s, Estados.Inativo, StringComparison.OrdinalIgnoreCase))
        {
            throw new DomainException("Status do usuario deve ser Ativo ou Inativo.");
        }

        return string.Equals(s, Estados.Inativo, StringComparison.OrdinalIgnoreCase) ? Estados.Inativo : Estados.Ativo;
    }
}
