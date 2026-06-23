using System.ComponentModel.DataAnnotations;

namespace Learly.Application.Contracts.Livros.Requests;

/// <summary>Novo capítulo ao final de um livro já existente.</summary>
public sealed class NovoCapituloLivroEscolaItemRequest
{
    /// <summary>Se vazio, o sistema gera nome no padrão <c>Capítulo N</c>.</summary>
    [MaxLength(100)]
    public string? Nome { get; set; }

    /// <summary>Duração do capítulo em minutos inteiros.</summary>
    [Range(1, int.MaxValue)]
    public int DuracaoMinutos { get; set; }
}
