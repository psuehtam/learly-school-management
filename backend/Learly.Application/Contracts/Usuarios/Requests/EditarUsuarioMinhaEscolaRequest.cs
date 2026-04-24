namespace Learly.Application.Contracts.Usuarios.Requests;

public sealed class EditarUsuarioMinhaEscolaRequest
{
    public string NomeCompleto { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public int PerfilId { get; set; }

    public string Status { get; set; } = string.Empty;
}
