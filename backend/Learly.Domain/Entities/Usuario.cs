using System.ComponentModel.DataAnnotations.Schema;

namespace Learly.Domain.Entities
{
    // Avisa o EF Core o nome exato da tabela no banco
    [Table("usuarios")] 
    public class Usuario
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("escola_id")]
        public int EscolaId { get; set; }

        [Column("nome_completo")]
        public string NomeCompleto { get; set; } = string.Empty;

        // É aqui que o "lan" vai entrar!
        [Column("email")]
        public string Email { get; set; } = string.Empty;

        [Column("senha")]
        public string Senha { get; set; } = string.Empty;

        [Column("perfil_id")]
        public int PerfilId { get; set; }

        [Column("status")]
        public string Status { get; set; } = "Ativo";
    }
}