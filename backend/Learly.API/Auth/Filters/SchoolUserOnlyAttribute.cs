using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Learly.API.Auth.Filters;

/// <summary>
/// Bloqueia Super Admin (retorna 403). Só usuários de escola podem acessar.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class SchoolUserOnlyAttribute : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var uc = context.HttpContext.GetUserContext();
        if (uc.IsSuperAdmin)
        {
            context.Result = new ObjectResult(new { message = "Super Admin nao pode acessar recursos internos de escola." })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
        }
        else if (string.IsNullOrWhiteSpace(uc.CodigoEscola))
        {
            context.Result = new ObjectResult(new { message = "Usuario sem escola vinculada." })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
        }
    }
}
