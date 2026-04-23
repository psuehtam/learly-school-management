using Learly.Domain.Entities;

namespace Learly.Domain.Interfaces.Repositories;

public interface IPerfilPermissaoRepository
{
    void Adicionar(PerfilPermissao entidade);

    void AdicionarVarios(IEnumerable<PerfilPermissao> entidades);
}
