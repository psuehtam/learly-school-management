using Learly.Domain.Exceptions;

namespace Learly.Domain.Entities;

public sealed class PerfilPermissao
{
    private int _perfilId;

    public int PerfilId
    {
        get => _perfilId;
        internal set => _perfilId = ValidarId(value, nameof(PerfilId));
    }

    private int _permissaoId;

    public int PermissaoId
    {
        get => _permissaoId;
        internal set => _permissaoId = ValidarId(value, nameof(PermissaoId));
    }

    private static int ValidarId(int value, string nomeCampo)
    {
        if (value <= 0)
            throw new DomainException($"{nomeCampo} deve ser maior que zero.");

        return value;
    }
}
