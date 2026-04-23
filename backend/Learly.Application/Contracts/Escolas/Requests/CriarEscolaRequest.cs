namespace Learly.Application.Contracts.Escolas.Requests;

public sealed class CriarEscolaRequest
{
    public string CodigoEscola { get; set; } = string.Empty;
    public string NomeFantasia { get; set; } = string.Empty;
    public string? RazaoSocial { get; set; }
    public string? Cnpj { get; set; }
    public string? AdminNomeCompleto { get; set; }
    public string AdminEmail { get; set; } = string.Empty;
    public string AdminPassword { get; set; } = string.Empty;
}
