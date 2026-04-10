using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Learly.API.Auth.Filters;

/// <summary>
/// Exige que o usuário possua pelo menos uma das permissões listadas (OR).
/// Também bloqueia Super Admin de rotas internas de escola (chame junto com <see cref="SchoolUserOnlyAttribute"/> se quiser).
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public sealed class RequirePermissionAttribute : Attribute, IAuthorizationFilter
{
    private readonly string[] _permissions;

    public RequirePermissionAttribute(params string[] permissions)
    {
        _permissions = permissions;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var uc = context.HttpContext.GetUserContext();

        if (uc.IsSuperAdmin)
        {
            context.Result = new ObjectResult(new { message = "Super Admin nao pode acessar recursos internos de escola." })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
            return;
        }

        if (_permissions.Length == 0) return;

        var has = _permissions.Any(p => uc.HasPermission(p));
        if (!has)
        {
            context.Result = new ObjectResult(new { message = "Permissao insuficiente.", required = _permissions })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
        }
    }
}
