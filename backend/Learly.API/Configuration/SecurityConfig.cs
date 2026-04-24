using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Learly.API.Auth;
using Learly.API.Auth.Filters;
using Learly.API.Auth.Repositories;
using Learly.API.Auth.Services;

namespace Learly.API.Configuration;

public static class SecurityConfig
{
    public static WebApplicationBuilder AddApiSecurity(this WebApplicationBuilder builder)
    {
        var jwtKey = builder.Configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(jwtKey) &&
            string.Equals(builder.Environment.EnvironmentName, "Testing", StringComparison.OrdinalIgnoreCase))
        {
            jwtKey = "TEST_ONLY_SUPER_SECRET_KEY_WITH_AT_LEAST_32_CHARS";
        }

        if (string.IsNullOrWhiteSpace(jwtKey))
        {
            throw new Exception("Jwt:Key não configurado.");
        }

        if (!string.Equals(builder.Environment.EnvironmentName, "Testing", StringComparison.OrdinalIgnoreCase) &&
            jwtKey.Length < 32)
        {
            throw new Exception("Jwt:Key precisa ter no mínimo 32 caracteres.");
        }

        var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "LearlyAPI";
        var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "LearlyClient";

        builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));

        builder.Services.AddScoped<EscolaListagemAuthorizeFilter>();
        builder.Services.AddScoped<IAuthRepository, AuthRepository>();
        builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
        builder.Services.AddScoped<IAuthService, AuthService>();

        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        if (string.IsNullOrWhiteSpace(context.Token) &&
                            context.Request.Cookies.TryGetValue(AuthConstants.AccessTokenCookieName, out var tokenFromCookie))
                        {
                            context.Token = tokenFromCookie;
                        }

                        return Task.CompletedTask;
                    },
                    OnTokenValidated = context =>
                    {
                        PermissionJwtClaims.ExpandCompressedPermissions(context.Principal);
                        return Task.CompletedTask;
                    }
                };
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                    ValidateIssuer = true,
                    ValidIssuer = jwtIssuer,
                    ValidateAudience = true,
                    ValidAudience = jwtAudience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(1)
                };
            });

        builder.Services.AddAuthorization(options =>
        {
            var permissionPolicies = new[]
            {
                // Dashboard e agenda
                "VISUALIZAR_DASHBOARD_GERAL",
                "VISUALIZAR_DASHBOARD_FINANCEIRO",
                "VISUALIZAR_DASHBOARD_ACADEMICO",
                "VISUALIZAR_AGENDA_GLOBAL",

                // Comercial / pré-alunos
                "CRIAR_PRE_ALUNO",
                "VISUALIZAR_PRE_ALUNO",
                "EDITAR_PRE_ALUNO",
                "CANCELAR_PRE_ALUNO",
                "GERAR_CONTRATO",
                "VISUALIZAR_CONTRATO",
                "EDITAR_TEMPLATE_CONTRATO",
                "CRIAR_TEMPLATE_CONTRATO",
                "VISUALIZAR_TEMPLATE_CONTRATO",

                // Matrícula e secretaria
                "FINALIZAR_MATRICULA",
                "APROVAR_MATRICULA",
                "REPROVAR_MATRICULA",
                "CRIAR_MATRICULA",
                "VISUALIZAR_MATRICULA",
                "EDITAR_MATRICULA",
                "CANCELAR_MATRICULA",
                "DEVOLVER_MATRICULA_COMERCIAL",
                "REMOVER_ANEXO_MATRICULA",

                // Usuários e permissões
                "CRIAR_USUARIO",
                "VISUALIZAR_USUARIO",
                "EDITAR_USUARIO",
                "INATIVAR_USUARIO",
                "GERENCIAR_PERMISSOES_USUARIO",
                "VISUALIZAR_PERFIL",
                "CRIAR_PERFIL",
                "EDITAR_PERFIL",
                "VISUALIZAR_RESPONSAVEL",
                "CRIAR_RESPONSAVEL",
                "EDITAR_RESPONSAVEL",
                "INATIVAR_RESPONSAVEL",
                "CRIAR_FILIACAO",
                "EDITAR_FILIACAO",
                "INATIVAR_TEMPLATE_CONTRATO",

                // Alunos
                "CRIAR_ALUNO",
                "VISUALIZAR_ALUNO",
                "EDITAR_ALUNO",
                "INATIVAR_ALUNO",
                "TRANCAR_ALUNO",
                "VISUALIZAR_HISTORICO_ALUNO",
                "ANEXAR_DOCUMENTO_ALUNO",
                "INATIVAR_DOCUMENTO_ALUNO",
                "EXCLUIR_DOCUMENTO_ALUNO",
                "JUSTIFICAR_FALTA_ALUNO",

                // Turmas
                "CRIAR_TURMA",
                "VISUALIZAR_TURMA",
                "EDITAR_TURMA",
                "AGENDAR_TURMA",
                "INATIVAR_TURMA",
                "CONCLUIR_TURMA",
                "CANCELAR_TURMA",
                "VINCULAR_ALUNO_TURMA",
                "DESVINCULAR_ALUNO_TURMA",
                "REMANEJAR_ALUNO",
                "EDITAR_DIAS_TURMA",

                // Aulas e professor
                "VISUALIZAR_AULA",
                "CRIAR_AULA",
                "EDITAR_AULA",
                "CANCELAR_AULA",
                "REALIZAR_AULA",
                "REGISTRAR_CONTEUDO_AULA",
                "REALIZAR_CHAMADA",
                "VISUALIZAR_PRESENCA",
                "EDITAR_PRESENCA",
                "LANCAR_HOMEWORK",
                "VISUALIZAR_HOMEWORK",
                "EDITAR_HOMEWORK",
                "LANCAR_AVALIACAO",
                "VISUALIZAR_AVALIACAO",
                "EDITAR_AVALIACAO",
                "CRIAR_OCORRENCIA_ACADEMICA",
                "CRIAR_OCORRENCIA_ADMINISTRATIVA",
                "VISUALIZAR_OCORRENCIA",
                "EDITAR_OCORRENCIA",

                // Reposições
                "CRIAR_REPOSICAO",
                "VISUALIZAR_REPOSICAO",
                "EDITAR_REPOSICAO",
                "CANCELAR_REPOSICAO",
                "REALIZAR_REPOSICAO",

                // Livros e capítulos
                "CRIAR_LIVRO",
                "VISUALIZAR_LIVRO",
                "EDITAR_LIVRO",
                "INATIVAR_LIVRO",
                "CRIAR_CAPITULO",
                "EDITAR_CAPITULO",
                "VISUALIZAR_CAPITULO",
                "INATIVAR_CAPITULO",
                "MARCAR_CAPITULO_CONCLUIDO",
                "VISUALIZAR_PROGRESSO_CAPITULO",

                // Calendário
                "GERENCIAR_CALENDARIO",
                "VISUALIZAR_CALENDARIO",
                "EDITAR_EVENTO_CALENDARIO",
                "EXCLUIR_EVENTO_CALENDARIO",

                // Financeiro
                "CRIAR_PARCELA",
                "VISUALIZAR_PARCELA",
                "EDITAR_PARCELA",
                "BAIXA_PARCELA",
                "ESTORNAR_PARCELA",
                "INATIVAR_PARCELA",
                "GERAR_CARNE_ESCOLAR",
                "GERAR_RECIBO",
                "VISUALIZAR_HISTORICO_PARCELA",
                "VISUALIZAR_MOVIMENTACAO_FINANCEIRA",
                "CRIAR_CONTA_BANCARIA",
                "EDITAR_CONTA_BANCARIA",
                "VISUALIZAR_CONTA_BANCARIA",
                "INATIVAR_CONTA_BANCARIA",
                "CRIAR_CATEGORIA_FINANCEIRA",
                "EDITAR_CATEGORIA_FINANCEIRA",
                "VISUALIZAR_CATEGORIA_FINANCEIRA",
                "INATIVAR_CATEGORIA_FINANCEIRA",

                // Super admin
                "GERENCIAR_ESCOLAS",
                "VISUALIZAR_ESCOLAS",

                // Arquivos de turma
                "CRIAR_PASTA_ARQUIVO_TURMA",
                "EDITAR_PASTA_ARQUIVO_TURMA",
                "INATIVAR_PASTA_ARQUIVO_TURMA",
                "UPLOAD_ARQUIVO_TURMA",
                "VISUALIZAR_ARQUIVO_TURMA",
                "EDITAR_ARQUIVO_TURMA",
                "INATIVAR_ARQUIVO_TURMA",

                // Agenda pessoal
                "CRIAR_COMPROMISSO",
                "VISUALIZAR_COMPROMISSOS",
                "EDITAR_COMPROMISSO",
                "EXCLUIR_COMPROMISSO",
                "VISUALIZAR_COMPROMISSOS_OUTROS",
                "ADICIONAR_PARTICIPANTE_COMPROMISSO",
                "CONFIRMAR_COMPROMISSO",
                "RECUSAR_COMPROMISSO",

                // Relatórios, logs e avançadas
                "VISUALIZAR_RELATORIO_FREQUENCIA",
                "VISUALIZAR_RELATORIO_NOTAS",
                "VISUALIZAR_RELATORIO_TURMAS",
                "VISUALIZAR_RELATORIO_ALUNOS",
                "VISUALIZAR_RELATORIO_FINANCEIRO",
                "VISUALIZAR_RELATORIO_INADIMPLENCIA",
                "VISUALIZAR_RELATORIO_RECEITAS",
                "VISUALIZAR_LOGS_AUDITORIA",
                "EXPORTAR_LOGS",
                "VISUALIZAR_LOGS_USUARIO",
                "GERENCIAR_CONFIGURACOES_SISTEMA",
                "GERENCIAR_BACKUP",
                "VISUALIZAR_METRICAS_SISTEMA",
                "IMPORTAR_ALUNOS",
                "EXPORTAR_ALUNOS",
                "IMPORTAR_FINANCEIRO",
                "EXPORTAR_FINANCEIRO"
            };

            foreach (var policyName in permissionPolicies)
            {
                options.AddPolicy(policyName, policy => policy.RequireClaim("permissions", policyName));
            }

            options.AddPolicy("SuperAdminOnly", policy =>
                policy.RequireClaim("isSuperAdmin", "true"));

            options.AddPolicy("ADMIN", policy => policy.RequireAssertion(context =>
                string.Equals(context.User.FindFirst("isSuperAdmin")?.Value, "true", StringComparison.OrdinalIgnoreCase) ||
                context.User.IsInRole("Administrador") || context.User.IsInRole("Super Admin") ||
                context.User.HasClaim("permissions", "CRIAR_USUARIO") ||
                context.User.HasClaim("permissions", "EDITAR_USUARIO") ||
                context.User.HasClaim("permissions", "INATIVAR_USUARIO") ||
                context.User.HasClaim("permissions", "GERENCIAR_ESCOLAS") ||
                context.User.HasClaim("permissions", "GERENCIAR_PERMISSOES_USUARIO")
            ));
        });

        return builder;
    }
}
