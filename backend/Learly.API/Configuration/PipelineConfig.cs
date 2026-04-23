using System.Security.Claims;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.AspNetCore.Mvc;
using Learly.Domain.Exceptions;

namespace Learly.API.Configuration;

public static class PipelineConfig
{
    public static WebApplication UseApiPipeline(this WebApplication app)
    {
        var env = app.Environment;

        app.UseExceptionHandler(exceptionApp =>
        {
            exceptionApp.Run(async context =>
            {
                var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
                if (exception is DomainException domainEx)
                {
                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                    context.Response.ContentType = "application/problem+json";
                    await context.Response.WriteAsJsonAsync(new ProblemDetails
                    {
                        Title = "Regra de negocio",
                        Detail = domainEx.Message,
                        Status = StatusCodes.Status400BadRequest
                    });
                    return;
                }

                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                context.Response.ContentType = "application/problem+json";
                await context.Response.WriteAsJsonAsync(new ProblemDetails
                {
                    Title = "Erro interno",
                    Detail = env.IsDevelopment() ? exception?.Message : "Ocorreu um erro inesperado.",
                    Status = StatusCodes.Status500InternalServerError
                });
            });
        });

        app.UseForwardedHeaders();
        app.UseHttpsRedirection();
        app.UseCors("AllowAll");
        app.UseRateLimiter();
        app.UseStatusCodePages(async statusCodeContext =>
        {
            var response = statusCodeContext.HttpContext.Response;
            if (response.HasStarted || response.ContentLength is > 0) return;

            var pd = new ProblemDetails
            {
                Title = ReasonPhrases.GetReasonPhrase(response.StatusCode),
                Status = response.StatusCode
            };

            response.ContentType = "application/problem+json";
            await response.WriteAsJsonAsync(pd);
        });

        app.UseRouting();
        app.UseAuthentication();
        app.UseAuthorization();

        if (env.IsDevelopment())
        {
            app.MapOpenApi();
        }

        app.MapControllers();

        app.MapGet("/api/me", [Microsoft.AspNetCore.Authorization.Authorize] (ClaimsPrincipal user) =>
        {
            var userIdStr = user.FindFirst("userId")?.Value ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _ = int.TryParse(userIdStr, out var userId);

            var nome = user.FindFirst(ClaimTypes.Name)?.Value ?? "Desconhecido";
            var perfil = user.FindFirst(ClaimTypes.Role)?.Value ?? "Sem perfil";
            var isSuperAdmin = string.Equals(user.FindFirst("isSuperAdmin")?.Value, "true", StringComparison.OrdinalIgnoreCase);
            var codigoEscola = user.FindFirst("codigoEscola")?.Value;
            var appRole = user.FindFirst("role")?.Value;
            var permissoes = user.FindAll("permissions").Select(c => c.Value).ToArray();

            return Results.Ok(new { userId, nome, perfil, isSuperAdmin, codigoEscola, appRole, permissoes });
        });

        app.MapGet("/api/pre-alunos", [Microsoft.AspNetCore.Authorization.Authorize(Policy = "VISUALIZAR_PRE_ALUNO")] (ClaimsPrincipal user) =>
        {
            if (!IsSchoolUser(user))
            {
                return Results.Forbid();
            }

            return Results.Ok(new { mensagem = "OK: Permissão VISUALIZAR_PRE_ALUNO concedida" });
        });

        app.MapGet("/api/pre-alunos/criar", [Microsoft.AspNetCore.Authorization.Authorize(Policy = "CRIAR_PRE_ALUNO")] (ClaimsPrincipal user) =>
        {
            if (!IsSchoolUser(user))
            {
                return Results.Forbid();
            }

            return Results.Ok(new { mensagem = "OK: Permissão CRIAR_PRE_ALUNO concedida" });
        });

        return app;
    }

    private static bool IsSchoolUser(ClaimsPrincipal user)
    {
        var isSuperAdmin = string.Equals(
            user.FindFirst("isSuperAdmin")?.Value,
            "true",
            StringComparison.OrdinalIgnoreCase);
        var codigoEscola = user.FindFirst("codigoEscola")?.Value;
        return !isSuperAdmin && !string.IsNullOrWhiteSpace(codigoEscola);
    }
}
