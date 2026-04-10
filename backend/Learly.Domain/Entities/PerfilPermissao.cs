using System.ComponentModel.DataAnnotations.Schema;

namespace Learly.Domain.Entities
{
    [Table("perfil_permissoes")]
    public class PerfilPermissao
    {
        [Column("perfil_id")]
        public int PerfilId { get; set; }

        [Column("permissao_id")]
        public int PermissaoId { get; set; }
    }
}