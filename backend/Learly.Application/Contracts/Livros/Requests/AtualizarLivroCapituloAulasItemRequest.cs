using System.ComponentModel.DataAnnotations;

namespace Learly.Application.Contracts.Livros.Requests;

public sealed class AtualizarLivroCapituloItemRequest
{
    [Range(1, int.MaxValue)]
    public int CapituloId { get; set; }

    /// <summary>Duração do capítulo em minutos inteiros.</summary>
    [Range(1, int.MaxValue)]
    public int DuracaoMinutos { get; set; }
}
