using Learly.Application.Contracts.Usuarios.Requests;
using Learly.Application.Contracts.Usuarios.Responses;
using Learly.Application.Services.Common;

namespace Learly.Application.Services.Usuarios;

public interface IUsuariosService
{
    Task<CriarUsuarioResponse> CriarParaMinhaEscolaAsync(
        AppUserContext userContext,
        CriarUsuarioParaMinhaEscolaRequest request,
        CancellationToken cancellationToken = default);
}
