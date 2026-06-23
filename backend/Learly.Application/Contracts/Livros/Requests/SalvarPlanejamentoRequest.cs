using System.ComponentModel.DataAnnotations;

namespace Learly.Application.Contracts.Livros.Requests;

public sealed class SalvarPlanejamentoRequest
{
    [Required]
    [MinLength(1)]
    public required IList<SalvarPlanejamentoDiaRequest> Dias { get; set; }
}

public sealed class SalvarPlanejamentoDiaRequest
{
    public int Ordem { get; set; }

    [Required]
    [MinLength(1)]
    public required IList<SalvarPlanejamentoAlocacaoRequest> Alocacoes { get; set; }
}

public sealed class SalvarPlanejamentoAlocacaoRequest
{
    [Range(1, int.MaxValue)]
    public int CapituloId { get; set; }

    [Range(1, int.MaxValue)]
    public int MinutosAlocados { get; set; }

    public int Ordem { get; set; }
}
