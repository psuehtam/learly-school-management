using System.Text.RegularExpressions;
using Learly.Domain.Exceptions;

namespace Learly.Domain.Entities;

public sealed class Escola
{
    public static class Estados
    {
        public const string Ativo = "Ativo";
        public const string Inativo = "Inativo";
    }

    public int Id { get; internal set; }

    private string _codigoEscola = string.Empty;

    public string CodigoEscola
    {
        get => _codigoEscola;
        internal set => _codigoEscola = ValidarCodigoEscola(value);
    }

    private string _nomeFantasia = string.Empty;

    public string NomeFantasia
    {
        get => _nomeFantasia;
        internal set => _nomeFantasia = ValidarNomeFantasia(value);
    }

    private string? _razaoSocial;

    public string? RazaoSocial
    {
        get => _razaoSocial;
        internal set => _razaoSocial = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private string? _cnpj;

    public string? Cnpj
    {
        get => _cnpj;
        internal set => _cnpj = NormalizarCnpjOpcional(value);
    }

    private string _status = Estados.Ativo;

    public string Status
    {
        get => _status;
        internal set => _status = ValidarStatus(value);
    }

    public void Desativar()
    {
        if (string.Equals(Status, Estados.Inativo, StringComparison.OrdinalIgnoreCase))
            return;

        Status = Estados.Inativo;
    }

    public void Reativar()
    {
        Status = Estados.Ativo;
    }

    public void AlterarDadosCadastrais(string nomeFantasia, string? razaoSocial, string? cnpj)
    {
        NomeFantasia = nomeFantasia;
        RazaoSocial = razaoSocial;
        Cnpj = cnpj;
    }

    private static string ValidarCodigoEscola(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Codigo da escola e obrigatorio.");

        return value.Trim().ToUpperInvariant();
    }

    private static string ValidarNomeFantasia(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Nome fantasia e obrigatorio.");

        return value.Trim();
    }

    private static string ValidarStatus(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Status da escola e obrigatorio.");

        var s = value.Trim();
        if (!string.Equals(s, Estados.Ativo, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(s, Estados.Inativo, StringComparison.OrdinalIgnoreCase))
        {
            throw new DomainException("Status da escola deve ser Ativo ou Inativo.");
        }

        return string.Equals(s, Estados.Inativo, StringComparison.OrdinalIgnoreCase) ? Estados.Inativo : Estados.Ativo;
    }

    private static string? NormalizarCnpjOpcional(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var digits = Regex.Replace(value, @"\D", "");
        if (digits.Length is not (11 or 14))
            throw new DomainException("CNPJ deve conter 11 ou 14 digitos.");

        return digits;
    }
}
