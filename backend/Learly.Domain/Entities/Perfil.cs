using Learly.Domain.Exceptions;

namespace Learly.Domain.Entities;

public sealed class Perfil
{
    public static class Estados
    {
        public const string Ativo = "Ativo";
        public const string Inativo = "Inativo";
    }

    public int Id { get; internal set; }

    public int EscolaId { get; internal set; }

    private string _nome = string.Empty;

    public string Nome
    {
        get => _nome;
        internal set => _nome = ValidarNome(value);
    }

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

    public void Renomear(string novoNome)
    {
        Nome = novoNome;
    }

    private static string ValidarNome(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Nome do perfil e obrigatorio.");

        return value.Trim();
    }

    private static string ValidarStatus(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Status do perfil e obrigatorio.");

        var s = value.Trim();
        if (!string.Equals(s, Estados.Ativo, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(s, Estados.Inativo, StringComparison.OrdinalIgnoreCase))
        {
            throw new DomainException("Status do perfil deve ser Ativo ou Inativo.");
        }

        return string.Equals(s, Estados.Inativo, StringComparison.OrdinalIgnoreCase) ? Estados.Inativo : Estados.Ativo;
    }
}
