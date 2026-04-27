namespace Learly.Application.Contracts.Templates.Responses;

public sealed class PermissaoCatalogoItemResponse
{
    public int Id { get; init; }

    public string Nome { get; init; } = string.Empty;

    public string? Descricao { get; init; }
}
