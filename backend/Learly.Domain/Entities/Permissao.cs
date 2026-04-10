using System.ComponentModel.DataAnnotations.Schema;

namespace Learly.Domain.Entities
{
    [Table("permissoes")]
    public class Permissao
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("nome")]
        public string Nome { get; set; } = string.Empty;

        [Column("descricao")]
        public string? Descricao { get; set; }
    }
}