using Learly.Domain.Exceptions;

namespace Learly.Domain.Entities;

public sealed class Permissao
{
    public int Id { get; internal set; }

    private string _nome = string.Empty;

    public string Nome
    {
        get => _nome;
        internal set => _nome = ValidarNome(value);
    }

    private string? _descricao;

    public string? Descricao
    {
        get => _descricao;
        internal set => _descricao = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public void AtualizarDescricao(string? descricao)
    {
        Descricao = descricao;
    }

    private static string ValidarNome(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Nome da permissao e obrigatorio.");

        var n = value.Trim();
        if (n.Contains(' ', StringComparison.Ordinal))
            throw new DomainException("Nome da permissao nao deve conter espacos (use underscore).");

        return n.ToUpperInvariant();
    }
}
