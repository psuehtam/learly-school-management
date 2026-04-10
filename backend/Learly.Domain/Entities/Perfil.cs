using System.ComponentModel.DataAnnotations.Schema;

namespace Learly.Domain.Entities
{
    [Table("perfis")]
    public class Perfil
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("escola_id")]
        public int EscolaId { get; set; }

        [Column("nome")]
        public string Nome { get; set; } = string.Empty;

        [Column("status")]
        public string Status { get; set; } = "Ativo";
    }
}