using System.ComponentModel.DataAnnotations;

namespace Learly.Application.Contracts.Livros.Requests;

public sealed class CriarLivroEscolaRequest
{
    [Required]
    [MaxLength(150)]
    public required string Nome { get; set; }

    [Required]
    [MinLength(1)]
    [MaxLength(200)]
    public required IList<CriarCapituloItemRequest> Capitulos { get; set; }
}

public sealed class CriarCapituloItemRequest
{
    /// <summary>Se vazio, o sistema gera nome no padrão <c>Capítulo N</c>.</summary>
    [MaxLength(100)]
    public string? Nome { get; set; }

    /// <summary>Duração do capítulo em minutos inteiros.</summary>
    [Range(1, int.MaxValue)]
    public int DuracaoMinutos { get; set; }
}
