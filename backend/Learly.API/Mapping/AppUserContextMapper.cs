using Learly.API.Auth;
using Learly.Application.Services.Common;

namespace Learly.API.Mapping;

public static class AppUserContextMapper
{
    public static AppUserContext From(UserContext uc) => new()
    {
        UserId = uc.UserId,
        Perfil = uc.Perfil,
        CodigoEscola = uc.CodigoEscola,
        IsSuperAdmin = uc.IsSuperAdmin,
        Permissions = uc.Permissions
    };
}
