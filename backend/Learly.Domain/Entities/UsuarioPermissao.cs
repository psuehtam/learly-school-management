using System.ComponentModel.DataAnnotations.Schema;

namespace Learly.Domain.Entities
{
    [Table("usuario_permissoes")]
    public class UsuarioPermissao
    {
        [Column("usuario_id")]
        public int UsuarioId { get; set; }

        [Column("permissao_id")]
        public int PermissaoId { get; set; }

        [Column("concedido_por_usuario_id")]
        public int? ConcedidoPorUsuarioId { get; set; }

        [Column("data_concessao")]
        public DateTime DataConcessao { get; set; }
    }
}