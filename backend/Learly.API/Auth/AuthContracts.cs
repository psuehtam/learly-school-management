namespace Learly.API.Auth;

public sealed class LoginRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
    public string? CodigoEscola { get; set; }
}

public sealed class LoginUserDto
{
    public int UserId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Perfil { get; set; } = string.Empty;

    /// <summary>Null para Super Admin (escopo global). Demais usuários: código da escola.</summary>
    public string? CodigoEscola { get; set; }

    public bool IsSuperAdmin { get; set; }

    public IReadOnlyList<string> Permissoes { get; set; } = [];
}

public sealed class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiraEmUtc { get; set; }
    public LoginUserDto Usuario { get; set; } = new();
}

public sealed class AuthResult
{
    public bool Success { get; init; }
    public string? Error { get; init; }
    public LoginResponseDto? Data { get; init; }

    public static AuthResult Ok(LoginResponseDto data) => new() { Success = true, Data = data };
    public static AuthResult Fail(string error) => new() { Success = false, Error = error };
}
