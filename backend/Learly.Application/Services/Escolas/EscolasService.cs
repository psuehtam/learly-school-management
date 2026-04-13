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
}

public interface IEscolasService
{
    Task<IReadOnlyList<EscolaListItemDto>> ListarAsync(AppUserContext userContext, CancellationToken ct);
    Task<(bool Success, string? Error, EscolaListItemDto? Escola)> CriarAsync(CriarEscolaInput input, CancellationToken ct);
}

public sealed class EscolasService : IEscolasService
{
    private readonly LearlyDbContext _db;

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

        var codigo = input.CodigoEscola.Trim().ToUpperInvariant();
        if (string.Equals(codigo, "SYSTEM", StringComparison.OrdinalIgnoreCase))
        {
            return (false, "Codigo reservado ao sistema.", null);
        }

        if (await _db.Escolas.AnyAsync(e => e.CodigoEscola == codigo, ct))
        {
            return (false, "Ja existe escola com este codigo.", null);
        }

        var entidade = new Escola
        {
            CodigoEscola = codigo,
            NomeFantasia = input.NomeFantasia.Trim(),
            RazaoSocial = string.IsNullOrWhiteSpace(input.RazaoSocial) ? null : input.RazaoSocial.Trim(),
            Cnpj = string.IsNullOrWhiteSpace(input.Cnpj) ? null : input.Cnpj.Trim(),
            Status = "Ativo"
        };

        _db.Escolas.Add(entidade);
        await _db.SaveChangesAsync(ct);
        var dto = new EscolaListItemDto(entidade.Id, entidade.CodigoEscola, entidade.NomeFantasia, entidade.Status);
        return (true, null, dto);
    }
}
