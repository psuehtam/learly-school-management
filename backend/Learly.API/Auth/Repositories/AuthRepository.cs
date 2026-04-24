using Learly.API.Auth;
using Learly.Domain.Entities;
using Learly.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Learly.API.Auth.Repositories;

public interface IAuthRepository
{
    Task<LoginContext?> GetLoginContextAsync(string email, string? codigoEscola);
    Task<IReadOnlyList<string>> GetPermissoesAsync(int usuarioId, int perfilId);
    Task<bool> GarantirPermissoesPadraoPerfilAsync(int perfilId, string nomePerfil);
    Task UpdateSenhaAsync(Usuario usuario, string senhaHash);
}

public sealed class AuthRepository : IAuthRepository
{
    private static readonly IReadOnlyDictionary<string, string[]> PermissoesPadraoPorPerfil =
        new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            ["Administrador"] =
            [
                "CRIAR_USUARIO", "VISUALIZAR_USUARIO", "EDITAR_USUARIO", "INATIVAR_USUARIO",
                "GERENCIAR_PERMISSOES_USUARIO", "VISUALIZAR_TURMA", "VISUALIZAR_AULA",
                "VISUALIZAR_MATRICULA", "VISUALIZAR_PRE_ALUNO", "VISUALIZAR_PARCELA",
                "VISUALIZAR_ALUNO", "VISUALIZAR_REPOSICAO", "VISUALIZAR_LIVRO",
                "VISUALIZAR_CALENDARIO", "VISUALIZAR_DASHBOARD_GERAL", "VISUALIZAR_AGENDA_GLOBAL",
            ],
            ["Professor"] = ["VISUALIZAR_AULA", "VISUALIZAR_TURMA", "VISUALIZAR_CALENDARIO", "VISUALIZAR_COMPROMISSOS"],
            ["Comercial"] = ["VISUALIZAR_PRE_ALUNO", "CRIAR_PRE_ALUNO", "VISUALIZAR_COMPROMISSOS", "CRIAR_COMPROMISSO"],
            ["Secretaria"] = ["VISUALIZAR_MATRICULA", "CRIAR_MATRICULA", "VISUALIZAR_ALUNO", "VISUALIZAR_COMPROMISSOS"],
            ["Financeiro"] = ["VISUALIZAR_PARCELA", "VISUALIZAR_MOVIMENTACAO_FINANCEIRA", "VISUALIZAR_COMPROMISSOS"],
            ["Coordenador"] = ["VISUALIZAR_TURMA", "VISUALIZAR_AULA", "VISUALIZAR_REPOSICAO", "VISUALIZAR_DASHBOARD_GERAL", "VISUALIZAR_COMPROMISSOS"],
        };

    private readonly LearlyDbContext _db;

    public AuthRepository(LearlyDbContext db)
    {
        _db = db;
    }

    public async Task<LoginContext?> GetLoginContextAsync(string email, string? codigoEscola)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(codigoEscola))
        {
            return await GetSuperAdminLoginWithoutSchoolCodeAsync(normalizedEmail);
        }

        var normalizedCodigo = codigoEscola.Trim().ToUpperInvariant();
        var query = _db.Usuarios
            .Where(u => u.Email.ToLower() == normalizedEmail && u.Status == "Ativo");

        query = query.Where(u => _db.Escolas.Any(e =>
            e.Id == u.EscolaId &&
            e.CodigoEscola == normalizedCodigo &&
            e.Status == "Ativo"));

        var usuario = await query.FirstOrDefaultAsync();
        if (usuario is null)
        {
            return null;
        }

        return await BuildLoginContextAsync(usuario);
    }

    /// <summary>
    /// Apenas usuário Super Admin (escola SYSTEM) pode autenticar sem informar código da escola.
    /// </summary>
    private async Task<LoginContext?> GetSuperAdminLoginWithoutSchoolCodeAsync(string normalizedEmail)
    {
        var usuario = await _db.Usuarios
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail && u.Status == "Ativo");

        if (usuario is null)
        {
            return null;
        }

        var ctx = await BuildLoginContextAsync(usuario);
        if (ctx is null)
        {
            return null;
        }

        if (!AuthConstants.IsSystemSuperAdmin(ctx.Escola.CodigoEscola, ctx.Perfil.Nome))
        {
            return null;
        }

        return ctx;
    }

    private async Task<LoginContext?> BuildLoginContextAsync(Usuario usuario)
    {
        var perfil = await _db.Perfis
            .FirstOrDefaultAsync(p => p.Id == usuario.PerfilId && p.EscolaId == usuario.EscolaId && p.Status == "Ativo");

        if (perfil is null)
        {
            return null;
        }

        var escola = await _db.Escolas
            .FirstOrDefaultAsync(e => e.Id == usuario.EscolaId && e.Status == "Ativo");

        if (escola is null)
        {
            return null;
        }

        return new LoginContext(usuario, perfil, escola);
    }

    public async Task<IReadOnlyList<string>> GetPermissoesAsync(int usuarioId, int perfilId)
    {
        var permissoesPerfil = await _db.PerfilPermissoes
            .Where(pp => pp.PerfilId == perfilId)
            .Join(_db.Permissoes, pp => pp.PermissaoId, p => p.Id, (_, p) => p.Nome)
            .ToListAsync();

        var permissoesUsuario = await _db.UsuarioPermissoes
            .Where(up => up.UsuarioId == usuarioId)
            .Join(_db.Permissoes, up => up.PermissaoId, p => p.Id, (_, p) => p.Nome)
            .ToListAsync();

        return permissoesPerfil.Concat(permissoesUsuario).Distinct().ToList();
    }

    public async Task<bool> GarantirPermissoesPadraoPerfilAsync(int perfilId, string nomePerfil)
    {
        if (!PermissoesPadraoPorPerfil.TryGetValue(nomePerfil, out var nomesPermissao))
        {
            return false;
        }

        var nomesPermissaoLista = nomesPermissao
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Select(n => n.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        if (nomesPermissaoLista.Count == 0)
        {
            return false;
        }

        var idsPermissao = await _db.Permissoes
            .Where(p => nomesPermissaoLista.Contains(p.Nome))
            .Select(p => p.Id)
            .ToListAsync();
        if (idsPermissao.Count == 0)
        {
            return false;
        }

        var idsExistentes = await _db.PerfilPermissoes
            .Where(pp => pp.PerfilId == perfilId)
            .Select(pp => pp.PermissaoId)
            .ToListAsync();

        var idsFaltantes = idsPermissao
            .Distinct()
            .Except(idsExistentes)
            .ToList();
        if (idsFaltantes.Count == 0)
        {
            return false;
        }

        var vinculos = idsFaltantes.Select(id => new PerfilPermissao
        {
            PerfilId = perfilId,
            PermissaoId = id
        });
        _db.PerfilPermissoes.AddRange(vinculos);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task UpdateSenhaAsync(Usuario usuario, string senhaHash)
    {
        usuario.Senha = senhaHash;
        await _db.SaveChangesAsync();
    }
}

public sealed record LoginContext(Usuario Usuario, Perfil Perfil, Escola Escola);
