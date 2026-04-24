using Learly.Domain.Entities;
using Learly.Domain.Interfaces.Repositories;
using Learly.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Learly.Infrastructure.Repositories;

internal sealed class UsuarioRepository(LearlyDbContext db) : RepositoryBase<Usuario, int>(db), IUsuarioRepository
{
    public async Task<Usuario?> ObterPorEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalized = email.Trim().ToLowerInvariant();
        return await Db.Usuarios.FirstOrDefaultAsync(u => u.Email == normalized, cancellationToken);
    }

    public async Task<bool> ExisteComEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalized = email.Trim().ToLowerInvariant();
        return await Db.Usuarios.AnyAsync(u => u.Email.ToLower() == normalized, cancellationToken);
    }

    public async Task<bool> ExisteComEmailExcetoIdAsync(
        string email,
        int usuarioIdIgnorado,
        CancellationToken cancellationToken = default)
    {
        var normalized = email.Trim().ToLowerInvariant();
        return await Db.Usuarios.AnyAsync(
            u => u.Id != usuarioIdIgnorado && u.Email.ToLower() == normalized,
            cancellationToken);
    }

    public async Task<IReadOnlyList<Usuario>> ListarPorEscolaAsync(
        int escolaId,
        CancellationToken cancellationToken = default)
    {
        return await Db.Usuarios.AsNoTracking()
            .Where(u => u.EscolaId == escolaId)
            .OrderBy(u => u.NomeCompleto)
            .ThenBy(u => u.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<Usuario?> ObterPorIdEEscolaAsync(
        int usuarioId,
        int escolaId,
        CancellationToken cancellationToken = default)
    {
        return await Db.Usuarios.FirstOrDefaultAsync(
            u => u.Id == usuarioId && u.EscolaId == escolaId,
            cancellationToken);
    }

    public async Task<bool> ProfessorAtivoNaEscolaAsync(
        int usuarioId,
        int escolaId,
        CancellationToken cancellationToken = default)
    {
        return await Db.Usuarios.AsNoTracking()
            .Where(u => u.Id == usuarioId && u.EscolaId == escolaId && u.Status == Usuario.Estados.Ativo)
            .Join(
                Db.Perfis.AsNoTracking(),
                u => new { u.PerfilId, u.EscolaId },
                p => new { PerfilId = p.Id, p.EscolaId },
                (_, p) => p.Nome)
            .AnyAsync(nome => string.Equals(nome, "Professor", StringComparison.OrdinalIgnoreCase), cancellationToken);
    }
}
