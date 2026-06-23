using Learly.Application.Contracts.Contratos;
using Learly.Application.Contracts.Contratos.Requests;
using Learly.Application.Contracts.Contratos.Responses;
using Learly.Application.Services.Common;
using Learly.Domain.Entities;
using Learly.Domain.Interfaces.Persistence;
using Learly.Domain.Interfaces.Repositories;

namespace Learly.Application.Services.Contratos;

public sealed class ContratosService : IContratosService
{
    private readonly IContratoTemplateRepository _templates;
    private readonly IContratoGeradoRepository _gerados;
    private readonly IPreAlunoRepository _preAlunos;
    private readonly IEscolaRepository _escolas;
    private readonly IUnitOfWork _unitOfWork;

    public ContratosService(
        IContratoTemplateRepository templates,
        IContratoGeradoRepository gerados,
        IPreAlunoRepository preAlunos,
        IEscolaRepository escolas,
        IUnitOfWork unitOfWork)
    {
        _templates = templates;
        _gerados = gerados;
        _preAlunos = preAlunos;
        _escolas = escolas;
        _unitOfWork = unitOfWork;
    }

    // ──────────────────────────────────────────── templates ──

    public async Task<IReadOnlyList<ContratoTemplateListItemResponse>> ListarTemplatesAsync(
        AppUserContext uc, CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterEscolaIdAsync(uc, cancellationToken);
        if (escolaId is null) return [];

        var lista = await _templates.ListarPorEscolaAsync(escolaId.Value, cancellationToken);
        return lista.Select(MapTemplate).ToList();
    }

    public async Task<ContratoTemplateListItemResponse?> ObterTemplateAtivoAsync(
        AppUserContext uc, CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterEscolaIdAsync(uc, cancellationToken);
        if (escolaId is null) return null;

        var t = await _templates.ObterAtivoAsync(escolaId.Value, cancellationToken);
        return t is null ? null : MapTemplate(t);
    }

    public async Task<ContratoTemplateListItemResponse?> ObterTemplatePorIdAsync(
        int id, AppUserContext uc, CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterEscolaIdAsync(uc, cancellationToken);
        if (escolaId is null) return null;

        var t = await _templates.ObterPorIdEEscolaAsync(id, escolaId.Value, cancellationToken);
        return t is null ? null : MapTemplate(t);
    }

    public async Task<ContratoTemplateOperacaoResultado> CriarTemplateAsync(
        CriarContratoTemplateRequest request, AppUserContext uc, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Nome))
            return Falha("Nome do template é obrigatório.", 400);

        if (string.IsNullOrWhiteSpace(request.ConteudoHtml))
            return Falha("Conteúdo HTML do template é obrigatório.", 400);

        var escolaId = await ObterEscolaIdAsync(uc, cancellationToken);
        if (escolaId is null) return Falha("Escola não encontrada ou inativa.", 403);

        var versao = await _templates.ProximaVersaoAsync(escolaId.Value, cancellationToken);

        if (request.AtivarImediatamente)
            await DesativarTodosAsync(escolaId.Value, cancellationToken);

        var template = new ContratoTemplate
        {
            EscolaId = escolaId.Value,
            Nome = request.Nome.Trim(),
            ConteudoHtml = request.ConteudoHtml,
            Versao = versao,
            Ativo = request.AtivarImediatamente,
            CriadoPorUsuarioId = uc.UserId,
            DataCriacao = DateTime.UtcNow,
        };

        _templates.Adicionar(template);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return new ContratoTemplateOperacaoResultado(true, null, 201);
    }

    public async Task<ContratoTemplateOperacaoResultado> EditarTemplateAsync(
        int id, EditarContratoTemplateRequest request, AppUserContext uc, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Nome))
            return Falha("Nome do template é obrigatório.", 400);

        if (string.IsNullOrWhiteSpace(request.ConteudoHtml))
            return Falha("Conteúdo HTML é obrigatório.", 400);

        var escolaId = await ObterEscolaIdAsync(uc, cancellationToken);
        if (escolaId is null) return Falha("Escola não encontrada ou inativa.", 403);

        var template = await _templates.ObterPorIdEEscolaAsync(id, escolaId.Value, cancellationToken);
        if (template is null) return Falha("Template não encontrado.", 404);

        template.Nome = request.Nome.Trim();
        template.ConteudoHtml = request.ConteudoHtml;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return new ContratoTemplateOperacaoResultado(true, null, 204);
    }

    public async Task<ContratoTemplateOperacaoResultado> AtivarTemplateAsync(
        int id, AppUserContext uc, CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterEscolaIdAsync(uc, cancellationToken);
        if (escolaId is null) return Falha("Escola não encontrada ou inativa.", 403);

        var template = await _templates.ObterPorIdEEscolaAsync(id, escolaId.Value, cancellationToken);
        if (template is null) return Falha("Template não encontrado.", 404);

        await DesativarTodosAsync(escolaId.Value, cancellationToken);
        template.Ativo = true;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return new ContratoTemplateOperacaoResultado(true, null, 204);
    }

    public async Task<ContratoTemplateOperacaoResultado> InativarTemplateAsync(
        int id, AppUserContext uc, CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterEscolaIdAsync(uc, cancellationToken);
        if (escolaId is null) return Falha("Escola não encontrada ou inativa.", 403);

        var template = await _templates.ObterPorIdEEscolaAsync(id, escolaId.Value, cancellationToken);
        if (template is null) return Falha("Template não encontrado.", 404);

        template.Ativo = false;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return new ContratoTemplateOperacaoResultado(true, null, 204);
    }

    public Task<IReadOnlyList<(string Variavel, string Descricao)>> ListarVariaveisAsync()
    {
        IReadOnlyList<(string, string)> lista = ContratoVariaveis.Lista;
        return Task.FromResult(lista);
    }

    // ──────────────────────────────────────────── gerados ──

    public async Task<IReadOnlyList<ContratoGeradoResponse>> ListarContratosGeradosAsync(
        AppUserContext uc, CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterEscolaIdAsync(uc, cancellationToken);
        if (escolaId is null) return [];

        var lista = await _gerados.ListarPorEscolaAsync(escolaId.Value, cancellationToken);
        var templates = await _templates.ListarPorEscolaAsync(escolaId.Value, cancellationToken);
        var nomesPorId = templates.ToDictionary(t => t.Id, t => t.Nome);

        return lista.Select(g => MapGerado(g, nomesPorId)).ToList();
    }

    public async Task<IReadOnlyList<ContratoGeradoResponse>> ListarContratosGeradosPorPreAlunoAsync(
        int preAlunoId, AppUserContext uc, CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterEscolaIdAsync(uc, cancellationToken);
        if (escolaId is null) return [];

        var lista = await _gerados.ListarPorPreAlunoAsync(preAlunoId, escolaId.Value, cancellationToken);
        var templates = await _templates.ListarPorEscolaAsync(escolaId.Value, cancellationToken);
        var nomesPorId = templates.ToDictionary(t => t.Id, t => t.Nome);

        return lista.Select(g => MapGerado(g, nomesPorId)).ToList();
    }

    public async Task<ContratoGeradoOperacaoResultado> GerarContratoAsync(
        GerarContratoRequest request, AppUserContext uc, CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterEscolaIdAsync(uc, cancellationToken);
        if (escolaId is null)
            return new ContratoGeradoOperacaoResultado(false, "Escola não encontrada ou inativa.", 403);

        // Resolve template
        ContratoTemplate? template;
        if (request.TemplateId.HasValue)
        {
            template = await _templates.ObterPorIdEEscolaAsync(request.TemplateId.Value, escolaId.Value, cancellationToken);
            if (template is null)
                return new ContratoGeradoOperacaoResultado(false, "Template de contrato não encontrado.", 404);
            if (!template.Ativo)
                return new ContratoGeradoOperacaoResultado(false, "Template de contrato está inativo.", 422);
        }
        else
        {
            template = await _templates.ObterAtivoAsync(escolaId.Value, cancellationToken);
            if (template is null)
                return new ContratoGeradoOperacaoResultado(
                    false,
                    "Nenhum template de contrato ativo encontrado. Crie e ative um template primeiro.",
                    422);
        }

        // Busca detalhe do pré-aluno (já traz dados do responsável e do livro)
        var detalhe = await _preAlunos.ObterDetalheAsync(request.PreAlunoId, escolaId.Value, cancellationToken);
        if (detalhe is null)
            return new ContratoGeradoOperacaoResultado(false, "Pré-aluno não encontrado nesta escola.", 404);

        // Busca entidade da escola
        var escola = await _escolas.ObterPorCodigoAsync(uc.CodigoEscola!, cancellationToken);
        if (escola is null)
            return new ContratoGeradoOperacaoResultado(false, "Escola não encontrada.", 404);

        // Substitui variáveis usando o read model (sem precisar de repositório de Responsável)
        var conteudoGerado = ContratoVariaveis.SubstituirDetalhe(template.ConteudoHtml, detalhe, escola);

        var gerado = new ContratoGerado
        {
            EscolaId = escolaId.Value,
            PreAlunoId = request.PreAlunoId,
            TemplateId = template.Id,
            ConteudoGeradoHtml = conteudoGerado,
            GeradoPorUsuarioId = uc.UserId,
            DataGeracao = DateTime.UtcNow,
        };

        _gerados.Adicionar(gerado);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ContratoGeradoOperacaoResultado(
            true, null, 201,
            new ContratoGeradoData(gerado.Id, template.Id, template.Nome, conteudoGerado, gerado.DataGeracao));
    }

    // ──────────────────────────────────────────── helpers ──

    private async Task<int?> ObterEscolaIdAsync(AppUserContext uc, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(uc.CodigoEscola)) return null;
        return await _escolas.ObterIdAtivaPorCodigoEscolaAsync(uc.CodigoEscola.Trim(), cancellationToken);
    }

    private async Task DesativarTodosAsync(int escolaId, CancellationToken cancellationToken)
    {
        var lista = await _templates.ListarPorEscolaAsync(escolaId, cancellationToken);
        foreach (var t in lista.Where(t => t.Ativo))
        {
            var tracked = await _templates.ObterPorIdEEscolaAsync(t.Id, escolaId, cancellationToken);
            if (tracked is not null) tracked.Ativo = false;
        }
    }

    private static ContratoTemplateListItemResponse MapTemplate(ContratoTemplate t) =>
        new(t.Id, t.Nome, t.Versao, t.Ativo, t.DataCriacao, t.ConteudoHtml);

    private static ContratoGeradoResponse MapGerado(ContratoGerado g, Dictionary<int, string> nomes) =>
        new(g.Id, g.PreAlunoId, g.TemplateId,
            nomes.GetValueOrDefault(g.TemplateId, "Template removido"),
            g.ConteudoGeradoHtml, g.DataGeracao);

    private static ContratoTemplateOperacaoResultado Falha(string mensagem, int status) =>
        new(false, mensagem, status);
}
