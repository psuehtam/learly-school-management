namespace Learly.Application.Contracts.Usuarios.Responses;

public sealed record UsuarioMinhaEscolaListItemResponse(
    int Id,
    string NomeCompleto,
    string Email,
    int PerfilId,
    string PerfilNome,
    string Status);
