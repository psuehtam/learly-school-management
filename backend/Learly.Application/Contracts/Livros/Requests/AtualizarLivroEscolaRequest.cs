namespace Learly.Application.Contracts.Livros.Requests;

/// <summary>Alteração parcial — envie apenas os campos que deseja mudar.</summary>
public sealed class AtualizarLivroEscolaRequest
{
    public string? Nome { get; set; }

    /// <summary><c>Ativo</c> ou <c>Inativo</c>.</summary>
    public string? Status { get; set; }

    /// <summary>Atualiza <c>duracao_minutos</c> por capítulo existente.</summary>
    public IReadOnlyList<AtualizarLivroCapituloItemRequest>? CapitulosAulas { get; set; }

    /// <summary>Novos capítulos no final do livro (respeita limite total de capítulos por livro).</summary>
    public IReadOnlyList<NovoCapituloLivroEscolaItemRequest>? CapitulosNovos { get; set; }
}
