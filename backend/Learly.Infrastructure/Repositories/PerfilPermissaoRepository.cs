using Learly.Domain.Entities;
using Learly.Domain.Interfaces.Repositories;
using Learly.Infrastructure.Data;

namespace Learly.Infrastructure.Repositories;

internal sealed class PerfilPermissaoRepository(LearlyDbContext db) : IPerfilPermissaoRepository
{
    public void Adicionar(PerfilPermissao entidade) => db.PerfilPermissoes.Add(entidade);

    public void AdicionarVarios(IEnumerable<PerfilPermissao> entidades) => db.PerfilPermissoes.AddRange(entidades);
}
