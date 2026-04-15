using Learly.Domain.Entities;
using Learly.Application.Services.Common;
using Learly.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Learly.Application.Services.Escolas;

public sealed record EscolaListItemDto(int Id, string CodigoEscola, string NomeFantasia, string Status);

public sealed class CriarEscolaInput
{
    public string CodigoEscola { get; set; } = string.Empty;
    public string NomeFantasia { get; set; } = string.Empty;
    public string? RazaoSocial { get; set; }
    public string? Cnpj { get; set; }
    public string? AdminNomeCompleto { get; set; }
    public string AdminEmail { get; set; } = string.Empty;
    public string AdminPassword { get; set; } = string.Empty;
}

public interface IEscolasService
{
    Task<IReadOnlyList<EscolaListItemDto>> ListarAsync(AppUserContext userContext, CancellationToken ct);
    Task<(bool Success, string? Error, EscolaListItemDto? Escola)> CriarAsync(CriarEscolaInput input, CancellationToken ct);
}

public sealed class EscolasService : IEscolasService
{
    private readonly LearlyDbContext _db;
    private const string AdminPerfilNome = "Administrador";

    public EscolasService(LearlyDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<EscolaListItemDto>> ListarAsync(AppUserContext userContext, CancellationToken ct)
    {
        var query = _db.Escolas.AsNoTracking().Where(e => e.Status == "Ativo");
        if (userContext.IsSuperAdmin)
        {
            return await query
                .Where(e => e.CodigoEscola != "SYSTEM")
                .OrderBy(e => e.CodigoEscola)
                .Select(e => new EscolaListItemDto(e.Id, e.CodigoEscola, e.NomeFantasia, e.Status))
                .ToListAsync(ct);
        }

        if (string.IsNullOrWhiteSpace(userContext.CodigoEscola))
        {
            return [];
        }

        return await query
            .Where(e => e.CodigoEscola == userContext.CodigoEscola)
            .OrderBy(e => e.CodigoEscola)
            .Select(e => new EscolaListItemDto(e.Id, e.CodigoEscola, e.NomeFantasia, e.Status))
            .ToListAsync(ct);
    }

    public async Task<(bool Success, string? Error, EscolaListItemDto? Escola)> CriarAsync(CriarEscolaInput input, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(input.CodigoEscola) || string.IsNullOrWhiteSpace(input.NomeFantasia))
        {
            return (false, "CodigoEscola e NomeFantasia sao obrigatorios.", null);
        }
        if (string.IsNullOrWhiteSpace(input.AdminEmail) || string.IsNullOrWhiteSpace(input.AdminPassword))
        {
            return (false, "AdminEmail e AdminPassword sao obrigatorios.", null);
        }
        if (!IsValidPassword(input.AdminPassword))
        {
            return (false, "AdminPassword deve ter ao menos 8 caracteres, com letra maiuscula, minuscula e numero.", null);
        }

        var codigo = input.CodigoEscola.Trim().ToUpperInvariant();
        if (string.Equals(codigo, "SYSTEM", StringComparison.OrdinalIgnoreCase))
        {
            return (false, "Codigo reservado ao sistema.", null);
        }

        if (await _db.Escolas.AnyAsync(e => e.CodigoEscola == codigo, ct))
        {
            return (false, "Ja existe escola com este codigo.", null);
        }
        var adminEmail = input.AdminEmail.Trim().ToLowerInvariant();
        if (await _db.Usuarios.AnyAsync(u => u.Email.ToLower() == adminEmail, ct))
        {
            return (false, "Ja existe usuario com este email.", null);
        }

        try
        {
            Escola? entidade = null;

            var isInMemoryProvider = string.Equals(
                _db.Database.ProviderName,
                "Microsoft.EntityFrameworkCore.InMemory",
                StringComparison.Ordinal);
            var useTransaction = !isInMemoryProvider;
            if (useTransaction)
            {
                await using var transaction = await _db.Database.BeginTransactionAsync(ct);
                entidade = await CriarEscolaEUsuarioAdminAsync(input, codigo, adminEmail, ct);
                await transaction.CommitAsync(ct);
            }
            else
            {
                entidade = await CriarEscolaEUsuarioAdminAsync(input, codigo, adminEmail, ct);
            }

            var dto = new EscolaListItemDto(entidade.Id, entidade.CodigoEscola, entidade.NomeFantasia, entidade.Status);
            return (true, null, dto);
        }
        catch
        {
            throw;
        }
    }

    private async Task<Escola> CriarEscolaEUsuarioAdminAsync(
        CriarEscolaInput input,
        string codigoEscola,
        string adminEmail,
        CancellationToken ct)
    {
        var entidade = new Escola
        {
            CodigoEscola = codigoEscola,
            NomeFantasia = input.NomeFantasia.Trim(),
            RazaoSocial = string.IsNullOrWhiteSpace(input.RazaoSocial) ? null : input.RazaoSocial.Trim(),
            Cnpj = string.IsNullOrWhiteSpace(input.Cnpj) ? null : input.Cnpj.Trim(),
            Status = "Ativo"
        };

        _db.Escolas.Add(entidade);
        await _db.SaveChangesAsync(ct);

        var perfilAdmin = new Perfil
        {
            EscolaId = entidade.Id,
            Nome = AdminPerfilNome,
            Status = "Ativo"
        };
        _db.Perfis.Add(perfilAdmin);
        await _db.SaveChangesAsync(ct);

        var permissoesPadraoAdmin = await _db.Permissoes.AsNoTracking()
            .Where(p => p.Nome != "GERENCIAR_ESCOLAS")
            .Select(p => p.Id)
            .ToListAsync(ct);
        if (permissoesPadraoAdmin.Count > 0)
        {
            var perfilPermissoes = permissoesPadraoAdmin.Select(permissaoId => new PerfilPermissao
            {
                PerfilId = perfilAdmin.Id,
                PermissaoId = permissaoId
            });
            _db.PerfilPermissoes.AddRange(perfilPermissoes);
        }

        var adminNome = string.IsNullOrWhiteSpace(input.AdminNomeCompleto)
            ? $"Administrador {entidade.NomeFantasia}"
            : input.AdminNomeCompleto.Trim();
        var admin = new Usuario
        {
            EscolaId = entidade.Id,
            PerfilId = perfilAdmin.Id,
            NomeCompleto = adminNome,
            Email = adminEmail,
            Senha = BCrypt.Net.BCrypt.HashPassword(input.AdminPassword),
            Status = "Ativo"
        };
        _db.Usuarios.Add(admin);
        await _db.SaveChangesAsync(ct);

        return entidade;
    }

    private static bool IsValidPassword(string password)
    {
        if (password.Length < 8) return false;

        var hasUpper = password.Any(char.IsUpper);
        var hasLower = password.Any(char.IsLower);
        var hasDigit = password.Any(char.IsDigit);
        return hasUpper && hasLower && hasDigit;
    }
}
