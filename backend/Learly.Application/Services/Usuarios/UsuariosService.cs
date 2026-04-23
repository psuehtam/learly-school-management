using Learly.Application.Contracts.Usuarios.Requests;
using Learly.Application.Contracts.Usuarios.Responses;
using Learly.Application.Services.Common;
using Learly.Domain.Entities;
using Learly.Domain.Exceptions;
using Learly.Domain.Interfaces.Persistence;
using Learly.Domain.Interfaces.Repositories;

namespace Learly.Application.Services.Usuarios;

public sealed class UsuariosService : IUsuariosService
{
    private readonly IEscolaRepository _escolas;
    private readonly IPerfilRepository _perfis;
    private readonly IUsuarioRepository _usuarios;
    private readonly IUnitOfWork _unitOfWork;

    public UsuariosService(
        IEscolaRepository escolas,
        IPerfilRepository perfis,
        IUsuarioRepository usuarios,
        IUnitOfWork unitOfWork)
    {
        _escolas = escolas;
        _perfis = perfis;
        _usuarios = usuarios;
        _unitOfWork = unitOfWork;
    }

    public async Task<CriarUsuarioResponse> CriarParaMinhaEscolaAsync(
        AppUserContext userContext,
        CriarUsuarioParaMinhaEscolaRequest request,
        CancellationToken cancellationToken = default)
    {
        if (userContext.IsSuperAdmin)
            throw new DomainException("Super administrador nao pode usar este fluxo; escola vem do contexto do usuario da escola.");

        if (string.IsNullOrWhiteSpace(userContext.CodigoEscola))
            throw new DomainException("Usuario sem escola vinculada no contexto.");

        if (string.IsNullOrWhiteSpace(request.NomeCompleto) || string.IsNullOrWhiteSpace(request.Email)
            || string.IsNullOrWhiteSpace(request.Senha))
            throw new DomainException("NomeCompleto, Email e Senha sao obrigatorios.");

        if (request.PerfilId <= 0)
            throw new DomainException("PerfilId invalido.");

        if (!SenhaEmTextoPlanoValida(request.Senha))
            throw new DomainException("Senha deve ter ao menos 8 caracteres, com letra maiuscula, minuscula e numero.");

        var codigoEscola = userContext.CodigoEscola.Trim().ToUpperInvariant();

        CriarUsuarioResponse? resultado = null;
        await _unitOfWork.ExecuteInTransactionAsync(
            async () =>
            {
                var escolaId = await _escolas.ObterIdAtivaPorCodigoEscolaAsync(codigoEscola, cancellationToken)
                    .ConfigureAwait(false);
                if (!escolaId.HasValue)
                    throw new DomainException("Escola nao encontrada ou inativa para o codigo do contexto.");

                var perfil = await _perfis.ObterPorIdEEscolaAsync(request.PerfilId, escolaId.Value, cancellationToken)
                    .ConfigureAwait(false);
                if (perfil is null)
                    throw new DomainException("Perfil nao pertence a esta escola ou nao existe.");

                if (!string.Equals(perfil.Status, Perfil.Estados.Ativo, StringComparison.OrdinalIgnoreCase))
                    throw new DomainException("Perfil deve estar ativo para vincular a um novo usuario.");

                var emailNormalizado = request.Email.Trim().ToLowerInvariant();
                if (await _usuarios.ExisteComEmailAsync(emailNormalizado, cancellationToken).ConfigureAwait(false))
                    throw new DomainException("Ja existe usuario com este email.");

                var hash = BCrypt.Net.BCrypt.HashPassword(request.Senha);
                var usuario = Usuario.CriarNovo(
                    escolaId.Value,
                    request.PerfilId,
                    request.NomeCompleto.Trim(),
                    emailNormalizado,
                    hash);

                _usuarios.Adicionar(usuario);
                await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
                resultado = new CriarUsuarioResponse(usuario.Id);
            },
            cancellationToken).ConfigureAwait(false);

        return resultado!;
    }

    private static bool SenhaEmTextoPlanoValida(string password)
    {
        if (password.Length < 8) return false;

        var hasUpper = password.Any(char.IsUpper);
        var hasLower = password.Any(char.IsLower);
        var hasDigit = password.Any(char.IsDigit);
        return hasUpper && hasLower && hasDigit;
    }
}
