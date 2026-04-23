using Learly.Domain.Exceptions;

namespace Learly.Domain.Entities;

public sealed class UsuarioPermissao
{
    private int _usuarioId;

    public int UsuarioId
    {
        get => _usuarioId;
        internal set => _usuarioId = ValidarId(value, nameof(UsuarioId));
    }

    private int _permissaoId;

    public int PermissaoId
    {
        get => _permissaoId;
        internal set => _permissaoId = ValidarId(value, nameof(PermissaoId));
    }

    public int? ConcedidoPorUsuarioId { get; internal set; }

    private DateTime _dataConcessao;

    public DateTime DataConcessao
    {
        get => _dataConcessao;
        internal set => _dataConcessao = NormalizarDataUtc(value);
    }

    public static UsuarioPermissao Conceder(int usuarioId, int permissaoId, int? concedidoPorUsuarioId, DateTime? quando = null)
    {
        return new UsuarioPermissao
        {
            UsuarioId = usuarioId,
            PermissaoId = permissaoId,
            ConcedidoPorUsuarioId = concedidoPorUsuarioId,
            DataConcessao = quando ?? DateTime.UtcNow
        };
    }

    private static int ValidarId(int value, string nomeCampo)
    {
        if (value <= 0)
            throw new DomainException($"{nomeCampo} deve ser maior que zero.");

        return value;
    }

    private static DateTime NormalizarDataUtc(DateTime value)
    {
        if (value == default)
            throw new DomainException("Data da concessao e obrigatoria.");

        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }
}
