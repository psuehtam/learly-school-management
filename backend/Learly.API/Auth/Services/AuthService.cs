using Learly.API.Auth;
using Learly.API.Auth.Repositories;

namespace Learly.API.Auth.Services;

public interface IAuthService
{
    Task<AuthResult> LoginAsync(LoginRequestDto request);
}

public sealed class AuthService : IAuthService
{
    private readonly IAuthRepository _authRepository;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IWebHostEnvironment _environment;

    public AuthService(
        IAuthRepository authRepository,
        IJwtTokenService jwtTokenService,
        IWebHostEnvironment environment)
    {
        _authRepository = authRepository;
        _jwtTokenService = jwtTokenService;
        _environment = environment;
    }

    public async Task<AuthResult> LoginAsync(LoginRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Senha))
        {
            return AuthResult.Fail("Email e senha sao obrigatorios.");
        }

        var loginContext = await _authRepository.GetLoginContextAsync(request.Email, request.CodigoEscola);
        if (loginContext is null)
        {
            return AuthResult.Fail("Credenciais invalidas.");
        }

        var usuario = loginContext.Usuario;
        var isBcryptHash = usuario.Senha.StartsWith("$2", StringComparison.Ordinal);
        if (!isBcryptHash && !_environment.IsDevelopment())
        {
            return AuthResult.Fail("Conta com senha legada. Solicite redefinicao de senha.");
        }

        var senhaValida = isBcryptHash
            ? BCrypt.Net.BCrypt.Verify(request.Senha, usuario.Senha)
            : usuario.Senha == request.Senha;

        if (!senhaValida)
        {
            return AuthResult.Fail("Credenciais invalidas.");
        }

        // Migra senha legada para hash BCrypt quando necessário.
        if (!isBcryptHash)
        {
            var hash = BCrypt.Net.BCrypt.HashPassword(request.Senha);
            await _authRepository.UpdateSenhaAsync(usuario, hash);
        }

        var permissoes = await _authRepository.GetPermissoesAsync(usuario.Id, usuario.PerfilId);
        var isSuperAdmin = AuthConstants.IsSystemSuperAdmin(
            loginContext.Escola.CodigoEscola,
            loginContext.Perfil.Nome);

        var userDto = new LoginUserDto
        {
            UserId = usuario.Id,
            Nome = usuario.NomeCompleto,
            Email = usuario.Email,
            Perfil = loginContext.Perfil.Nome,
            CodigoEscola = isSuperAdmin ? null : loginContext.Escola.CodigoEscola,
            IsSuperAdmin = isSuperAdmin,
            Permissoes = permissoes
        };

        var (token, expiresAtUtc) = _jwtTokenService.GenerateToken(userDto);
        var response = new LoginResponseDto
        {
            ExpiraEmUtc = expiresAtUtc,
            Usuario = userDto
        };

        return AuthResult.Ok(token, response);
    }
}
