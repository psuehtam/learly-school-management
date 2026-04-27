using Learly.API.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Learly.API.Auth.Filters;

/// <summary>
/// Super admin ou permissão VISUALIZAR_ESCOLAS / GERENCIAR_ESCOLAS.
/// </summary>
public sealed class EscolaListagemAuthorizeFilter : IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var uc = context.HttpContext.GetUserContext();
        if (uc.IsSuperAdmin)
        {
            return;
        }

        if (uc.HasPermission("VISUALIZAR_ESCOLAS") || uc.HasPermission("GERENCIAR_ESCOLAS"))
        {
            return;
        }

        context.Result = new ObjectResult(new ProblemDetails
        {
            Title = "Permissao insuficiente",
            Detail = "Permissao necessaria: VISUALIZAR_ESCOLAS ou GERENCIAR_ESCOLAS",
            Status = StatusCodes.Status403Forbidden
        })
        {
            StatusCode = StatusCodes.Status403Forbidden
        };
    }
}
