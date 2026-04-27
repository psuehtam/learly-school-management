namespace Learly.Domain.Exceptions;

/// <summary>
/// Erro de regra de negócio ou invariante do domínio.
/// </summary>
public sealed class DomainException : Exception
{
    public DomainException(string message) : base(message)
    {
    }

    public DomainException(string message, Exception innerException) : base(message, innerException)
    {
    }
}
