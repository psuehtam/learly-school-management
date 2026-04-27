using Learly.Domain.Entities;
using Learly.Domain.Interfaces.Repositories;
using Learly.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Learly.Infrastructure.Repositories;

internal sealed class AulaRepository(LearlyDbContext db) : RepositoryBase<Aula, int>(db), IAulaRepository
{
    public async Task<IReadOnlyList<Aula>> ListarPorTurmaAsync(int turmaId, CancellationToken cancellationToken = default)
    {
        return await Db.Aulas
            .AsNoTracking()
            .Where(a => a.TurmaId == turmaId)
            .OrderByDescending(a => a.DataAula)
            .ThenBy(a => a.HorarioInicio)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Aula>> ListarPorEscolaEFiltroProfessorAsync(
        int escolaId,
        int? filtrarProfessorId,
        CancellationToken cancellationToken = default)
    {
        var query = Db.Aulas.AsNoTracking().Where(a => a.EscolaId == escolaId);
        if (filtrarProfessorId.HasValue)
        {
            query = query.Where(a => a.ProfessorId == filtrarProfessorId.Value);
        }

        return await query
            .OrderByDescending(a => a.DataAula)
            .ThenBy(a => a.HorarioInicio)
            .ToListAsync(cancellationToken);
    }

    public async Task<Aula?> ObterSemRastreioPorIdEEscolaAsync(
        int id,
        int escolaId,
        int? filtrarProfessorId,
        CancellationToken cancellationToken = default)
    {
        var query = Db.Aulas.AsNoTracking().Where(a => a.Id == id && a.EscolaId == escolaId);
        if (filtrarProfessorId.HasValue)
        {
            query = query.Where(a => a.ProfessorId == filtrarProfessorId.Value);
        }

        return await query.FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<Aula?> ObterRastreadaPorIdEEscolaAsync(
        int id,
        int escolaId,
        CancellationToken cancellationToken = default)
    {
        return await Db.Aulas
            .Where(a => a.Id == id && a.EscolaId == escolaId)
            .FirstOrDefaultAsync(cancellationToken);
    }
}
