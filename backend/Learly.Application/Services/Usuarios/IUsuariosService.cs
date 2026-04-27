using Learly.Application.Contracts.Usuarios.Requests;
using Learly.Application.Contracts.Usuarios.Responses;
using Learly.Application.Services.Common;

namespace Learly.Application.Services.Usuarios;

public interface IUsuariosService
{
    Task<IReadOnlyList<UsuarioMinhaEscolaListItemResponse>> ListarMinhaEscolaAsync(
        AppUserContext userContext,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PerfilMinhaEscolaListItemResponse>> ListarPerfisMinhaEscolaAsync(
        AppUserContext userContext,
        CancellationToken cancellationToken = default);

    Task<CriarUsuarioResponse> CriarParaMinhaEscolaAsync(
        AppUserContext userContext,
        CriarUsuarioParaMinhaEscolaRequest request,
        CancellationToken cancellationToken = default);

    Task EditarDaMinhaEscolaAsync(
        int usuarioId,
        AppUserContext userContext,
        EditarUsuarioMinhaEscolaRequest request,
        CancellationToken cancellationToken = default);
}
