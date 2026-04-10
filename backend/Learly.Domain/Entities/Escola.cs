using System.ComponentModel.DataAnnotations.Schema;

namespace Learly.Domain.Entities
{
    [Table("escolas")]
    public class Escola
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("codigo_escola")]
        public string CodigoEscola { get; set; } = string.Empty;

        [Column("nome_fantasia")]
        public string NomeFantasia { get; set; } = string.Empty;

        [Column("razao_social")]
        public string? RazaoSocial { get; set; }

        [Column("cnpj")]
        public string? Cnpj { get; set; }

        [Column("status")]
        public string Status { get; set; } = "Ativo";
    }
}
