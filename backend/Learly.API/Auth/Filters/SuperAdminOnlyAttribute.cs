using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Learly.API.Auth.Filters;

/// <summary>
/// Permite acesso apenas para Super Admin. Usuários de escola recebem 403.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class SuperAdminOnlyAttribute : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var uc = context.HttpContext.GetUserContext();
        if (!uc.IsSuperAdmin)
        {
            context.Result = new ObjectResult(new { message = "Acesso restrito a Super Admin." })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
        }
    }
}
