using Learly.Application.Contracts.Livros;
using Learly.Application.Contracts.Livros.Requests;
using Learly.Application.Contracts.Livros.Responses;
using Learly.Application.Services.Common;
using Learly.Domain.Entities;
using Learly.Domain.Interfaces.Persistence;
using Learly.Domain.Interfaces.Repositories;

namespace Learly.Application.Services.Livros;

public sealed class LivroPlanejamentoService(
    ILivroCatalogoRepository livros,
    ILivroPlanejamentoRepository planejamento,
    IEscolaRepository escolas,
    IUnitOfWork unitOfWork) : ILivroPlanejamentoService
{
    public async Task GerarRascunhoAsync(int livroId, int escolaId, CancellationToken cancellationToken = default)
    {
        var escola = await escolas.ObterPorIdAsync(escolaId, cancellationToken);
        if (escola is null) return;

        var livro = await livros.ObterPorIdEscolaComCapitulosAsync(livroId, escolaId, cancellationToken);
        if (livro is null) return;

        var capitulos = livro.Capitulos
            .Where(c => c.Status == "Ativo")
            .OrderBy(c => c.Id)
            .ToList();

        if (capitulos.Count == 0) return;

        await planejamento.RemoverPlanejamentoDoLivroAsync(livroId, escolaId, cancellationToken);

        var capacidadeDia = escola.DuracaoAulaMinutos;
        var agora = DateTime.UtcNow;
        var dias = new List<LivroPlanejamentoDia>();
        LivroPlanejamentoDia? diaAtual = null;
        var minutosUsadosNoDia = 0;
        var ordemDia = 1;

        foreach (var cap in capitulos)
        {
            var minutosRestantes = cap.DuracaoMinutos;

            while (minutosRestantes > 0)
            {
                if (diaAtual is null || minutosUsadosNoDia >= capacidadeDia)
                {
                    diaAtual = new LivroPlanejamentoDia
                    {
                        EscolaId = escolaId,
                        LivroId = livroId,
                        Ordem = ordemDia++,
                        DataCriacao = agora,
                        DataAtualizacao = agora
                    };
                    dias.Add(diaAtual);
                    minutosUsadosNoDia = 0;
                }

                var espaco = capacidadeDia - minutosUsadosNoDia;
                var alocar = Math.Min(minutosRestantes, espaco);
                var ordemNoDia = diaAtual.Alocacoes.Count + 1;

                diaAtual.Alocacoes.Add(new LivroPlanejamentoAlocacao
                {
                    EscolaId = escolaId,
                    CapituloId = cap.Id,
                    MinutosAlocados = alocar,
                    Ordem = ordemNoDia,
                    DataCriacao = agora,
                    DataAtualizacao = agora
                });

                minutosUsadosNoDia += alocar;
                minutosRestantes -= alocar;
            }
        }

        planejamento.AdicionarDias(dias);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<LivroPlanejamentoConsultaResultado> ObterPlanejamentoAsync(
        int livroId,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterEscolaIdAsync(uc, cancellationToken);
        if (!escolaId.HasValue)
            return Falha("Acesso negado.", LivrosEscolaFalha.AcessoNegado);

        var livro = await livros.ObterPorIdEscolaAsync(livroId, escolaId.Value, cancellationToken);
        if (livro is null)
            return Falha("Livro nao encontrado.", LivrosEscolaFalha.NaoEncontrado);

        var escola = await escolas.ObterPorIdAsync(escolaId.Value, cancellationToken);
        var dias = await planejamento.ObterDiasComAlocacoesAsync(livroId, escolaId.Value, cancellationToken);

        var response = MapearPlanejamento(livro, escola?.DuracaoAulaMinutos ?? 120, dias);
        return new LivroPlanejamentoConsultaResultado(true, response, null, LivrosEscolaFalha.Nenhuma);
    }

    public async Task<LivroPlanejamentoSalvarResultado> SalvarPlanejamentoAsync(
        int livroId,
        SalvarPlanejamentoRequest body,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterEscolaIdAsync(uc, cancellationToken);
        if (!escolaId.HasValue)
            return FalhaSalvar("Acesso negado.", LivrosEscolaFalha.AcessoNegado);

        var livro = await livros.ObterPorIdEscolaAsync(livroId, escolaId.Value, cancellationToken);
        if (livro is null)
            return FalhaSalvar("Livro nao encontrado.", LivrosEscolaFalha.NaoEncontrado);

        var escola = await escolas.ObterPorIdAsync(escolaId.Value, cancellationToken);
        var capacidadeDia = escola?.DuracaoAulaMinutos ?? 120;

        foreach (var d in body.Dias)
        {
            var total = d.Alocacoes.Sum(a => a.MinutosAlocados);
            if (total > capacidadeDia)
                return FalhaSalvar(
                    $"Dia {d.Ordem} excede a capacidade de {capacidadeDia} minutos ({total} alocados).",
                    LivrosEscolaFalha.Validacao);
        }

        await planejamento.RemoverPlanejamentoDoLivroAsync(livroId, escolaId.Value, cancellationToken);

        var agora = DateTime.UtcNow;
        var diasNovos = body.Dias.Select((d, idx) => new LivroPlanejamentoDia
        {
            EscolaId = escolaId.Value,
            LivroId = livroId,
            Ordem = d.Ordem > 0 ? d.Ordem : idx + 1,
            DataCriacao = agora,
            DataAtualizacao = agora,
            Alocacoes = d.Alocacoes.Select((a, aIdx) => new LivroPlanejamentoAlocacao
            {
                EscolaId = escolaId.Value,
                CapituloId = a.CapituloId,
                MinutosAlocados = a.MinutosAlocados,
                Ordem = a.Ordem > 0 ? a.Ordem : aIdx + 1,
                DataCriacao = agora,
                DataAtualizacao = agora
            }).ToList()
        }).ToList();

        planejamento.AdicionarDias(diasNovos);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        var diasBanco = await planejamento.ObterDiasComAlocacoesAsync(livroId, escolaId.Value, cancellationToken);
        var response = MapearPlanejamento(livro, capacidadeDia, diasBanco);
        return new LivroPlanejamentoSalvarResultado(true, response, null, LivrosEscolaFalha.Nenhuma);
    }

    private static LivroPlanejamentoResponse MapearPlanejamento(
        Livro livro,
        int duracaoAulaMinutos,
        IReadOnlyList<LivroPlanejamentoDia> dias)
    {
        var diasDto = dias.Select(d => new LivroPlanejamentoDiaResponse(
            d.Id,
            d.Ordem,
            d.Alocacoes.Sum(a => a.MinutosAlocados),
            d.Alocacoes.Select(a => new LivroPlanejamentoAlocacaoResponse(
                a.Id,
                a.CapituloId,
                a.Capitulo?.Nome ?? string.Empty,
                a.MinutosAlocados,
                a.Ordem)).ToList()
        )).ToList();

        return new LivroPlanejamentoResponse(livro.Id, livro.Nome, duracaoAulaMinutos, diasDto);
    }

    private async Task<int?> ObterEscolaIdAsync(AppUserContext uc, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(uc.CodigoEscola)) return null;
        return await escolas.ObterIdAtivaPorCodigoEscolaAsync(uc.CodigoEscola.Trim(), cancellationToken);
    }

    private static LivroPlanejamentoConsultaResultado Falha(string msg, LivrosEscolaFalha falha) =>
        new(false, null, msg, falha);

    private static LivroPlanejamentoSalvarResultado FalhaSalvar(string msg, LivrosEscolaFalha falha) =>
        new(false, null, msg, falha);
}
