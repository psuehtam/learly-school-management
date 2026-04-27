namespace Learly.Application.Contracts.Usuarios.Requests;

public sealed class CriarUsuarioParaMinhaEscolaRequest
{
    public string NomeCompleto { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Senha { get; set; } = string.Empty;

    public int PerfilId { get; set; }
}
