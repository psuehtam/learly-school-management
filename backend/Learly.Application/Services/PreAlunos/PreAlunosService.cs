using Learly.Application.Helpers;
using Learly.Application.Contracts.Alunos.Requests;
using Learly.Application.Contracts.PreAlunos;
using Learly.Application.Contracts.PreAlunos.Requests;
using Learly.Application.Contracts.PreAlunos.Responses;
using Learly.Application.Services.Alunos;
using Learly.Application.Contracts.Alunos.Responses;
using Learly.Domain.Interfaces.Services;
using Learly.Application.Services.Common;
using Learly.Domain.Entities;
using Learly.Domain.Interfaces.Persistence;
using Learly.Domain.Interfaces.Repositories;
using Learly.Domain.ReadModels;

namespace Learly.Application.Services.PreAlunos;

public sealed class PreAlunosService : IPreAlunosService
{
    private const long TamanhoMaximoArquivoBytes = 10 * 1024 * 1024;
    private static readonly HashSet<string> ExtensoesPermitidas = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"
    };

    private readonly IPreAlunoRepository _preAlunos;
    private readonly IPreResponsavelRepository _preResponsaveis;
    private readonly IPreAlunoDocumentoRepository _documentos;
    private readonly IAlunoRepository _alunos;
    private readonly IAlunosService _alunosService;
    private readonly ILivroCatalogoRepository _livros;
    private readonly IEscolaRepository _escolas;
    private readonly IArquivoStorageService _arquivoStorage;
    private readonly IUnitOfWork _unitOfWork;

    public PreAlunosService(
        IPreAlunoRepository preAlunos,
        IPreResponsavelRepository preResponsaveis,
        IPreAlunoDocumentoRepository documentos,
        IAlunoRepository alunos,
        IAlunosService alunosService,
        ILivroCatalogoRepository livros,
        IEscolaRepository escolas,
        IArquivoStorageService arquivoStorage,
        IUnitOfWork unitOfWork)
    {
        _preAlunos = preAlunos;
        _preResponsaveis = preResponsaveis;
        _documentos = documentos;
        _alunos = alunos;
        _alunosService = alunosService;
        _livros = livros;
        _escolas = escolas;
        _arquivoStorage = arquivoStorage;
        _unitOfWork = unitOfWork;
    }

    public async Task<PreAlunosCatalogoLivrosResultado> ListarCatalogoLivrosInteresseAsync(
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterIdEscolaAtivaPorCodigoAsync(uc.CodigoEscola, cancellationToken);
        if (!escolaId.HasValue)
        {
            return new PreAlunosCatalogoLivrosResultado(false, [], "Acesso negado.", PreAlunosCatalogoLivrosFalha.AcessoNegado);
        }

        var itens = await _livros.ListarAtivosPorEscolaAsync(escolaId.Value, cancellationToken);
        var list = itens.Select(l => new LivroInteresseOpcaoResponse(l.Id, l.Nome, l.Status)).ToList();

        return new PreAlunosCatalogoLivrosResultado(true, list, null, PreAlunosCatalogoLivrosFalha.Nenhuma);
    }

    public async Task<PreAlunosListagemResultado> ListarAsync(
        ListarPreAlunosQuery query,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterIdEscolaAtivaPorCodigoAsync(uc.CodigoEscola, cancellationToken);
        if (!escolaId.HasValue)
        {
            return new PreAlunosListagemResultado(false, [], "Acesso negado.", PreAlunosListagemFalha.AcessoNegado);
        }

        string? filtroStatus = null;
        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            try
            {
                filtroStatus = PreAluno.Estados.Normalize(query.Status);
            }
            catch
            {
                return new PreAlunosListagemResultado(false, [], "Status de filtro invalido.", PreAlunosListagemFalha.Validacao);
            }
        }

        var rows = await _preAlunos.ListarPorEscolaAsync(escolaId.Value, filtroStatus, cancellationToken);
        var itens = rows.Select(r => new PreAlunoListItemResponse(
            r.Id,
            r.NomeCompletoAluno,
            r.NomeCompletoResponsavel,
            r.DataCadastro,
            r.TipoContrato,
            r.Status,
            r.NomeLivroInteresse,
            r.TelefoneAluno,
            r.ValorMensalidade,
            r.FormaPagamento,
            r.OrigemCaptacao,
            r.ValorMaterial,
            r.ValorMatricula,
            r.ObservacoesComerciais)).ToList();

        return new PreAlunosListagemResultado(true, itens, null, PreAlunosListagemFalha.Nenhuma);
    }

    public async Task<PreAlunoDetalheResultado> ObterPorIdAsync(
        int id,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterIdEscolaAtivaPorCodigoAsync(uc.CodigoEscola, cancellationToken);
        if (!escolaId.HasValue)
        {
            return new PreAlunoDetalheResultado(false, null, "Acesso negado.", PreAlunoDetalheFalha.AcessoNegado);
        }

        var d = await _preAlunos.ObterDetalheAsync(id, escolaId.Value, cancellationToken);
        if (d is null)
        {
            return new PreAlunoDetalheResultado(false, null, "Pre-aluno nao encontrado.", PreAlunoDetalheFalha.NaoEncontrado);
        }

        d = await EnriquecerDetalheComTelefoneResponsavelAsync(d, escolaId.Value, cancellationToken);
        var docs = await ListarDocumentosInternoAsync(d.Id, d.EscolaId, cancellationToken);
        var dadosResp = await _preResponsaveis.ObterDadosAsync(d.PreResponsavelId, escolaId.Value, cancellationToken);
        string nomeResp;
        string sobrenomeResp;
        if (dadosResp is not null)
        {
            nomeResp = dadosResp.Nome.Trim();
            sobrenomeResp = dadosResp.Sobrenome.Trim();
        }
        else
        {
            var parts = d.ResponsavelNomeCompleto.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            nomeResp = parts.Length > 0 ? parts[0] : "";
            sobrenomeResp = parts.Length > 1 ? parts[1] : "";
        }

        var resp = new PreAlunoDetalheResponse(
            d.Id,
            d.EscolaId,
            d.PreResponsavelId,
            d.ResponsavelOficialId,
            d.ResponsavelTipoPessoa,
            d.ResponsavelCpfCnpj,
            nomeResp,
            sobrenomeResp,
            d.ResponsavelNomeCompleto,
            dadosResp?.Sexo,
            dadosResp?.GrauParentesco,
            dadosResp?.EstadoCivil,
            dadosResp?.CorRaca,
            dadosResp?.Nacionalidade,
            dadosResp?.DataNascimento,
            dadosResp?.NaturalidadeCidade,
            dadosResp?.NaturalidadeEstado,
            dadosResp?.RgNumero,
            dadosResp?.RgExpedicao,
            dadosResp?.RgOrgao,
            d.NomeAluno,
            d.SobrenomeAluno,
            d.DataNascimentoAluno,
            d.TelefoneAluno,
            d.LivroInteresseId,
            d.NomeLivroInteresse,
            d.TipoContrato,
            d.ValorMensalidade,
            d.FormaPagamento,
            d.ValorMatricula,
            d.FormaPagamentoMatricula,
            d.ValorMaterial,
            d.OrigemCaptacao,
            d.UsaTransporteVan,
            d.TransporteCep,
            d.TransporteLogradouro,
            d.TransporteNumero,
            d.TransporteComplemento,
            d.TransporteBairro,
            d.TransporteCidade,
            d.TransporteUf,
            d.ObservacoesComerciais,
            d.EProprioResponsavel,
            d.AlunoCpf,
            d.Status,
            d.AlunoId,
            d.CriadoPorUsuarioId,
            d.DataCriacao,
            d.DataAtualizacao,
            docs);

        return new PreAlunoDetalheResultado(true, resp, null, PreAlunoDetalheFalha.Nenhuma);
    }

    public async Task<PreAlunoCriacaoResultado> CriarAsync(
        CriarPreAlunoRequest request,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterIdEscolaAtivaPorCodigoAsync(uc.CodigoEscola, cancellationToken);
        if (!escolaId.HasValue)
        {
            return new PreAlunoCriacaoResultado(false, null, "Acesso negado.", PreAlunoCriacaoFalha.AcessoNegado);
        }

        if (uc.UserId <= 0)
        {
            return new PreAlunoCriacaoResultado(false, null, "Usuario invalido.", PreAlunoCriacaoFalha.Validacao);
        }

        if (string.IsNullOrWhiteSpace(request.Nome) || string.IsNullOrWhiteSpace(request.Sobrenome))
        {
            return new PreAlunoCriacaoResultado(false, null, "Nome e sobrenome do pre-aluno sao obrigatorios.", PreAlunoCriacaoFalha.Validacao);
        }

        if (request.DataNascimento == default)
        {
            return new PreAlunoCriacaoResultado(false, null, "Data de nascimento do pre-aluno e obrigatoria.", PreAlunoCriacaoFalha.Validacao);
        }

        var hojeReferencia = DateOnly.FromDateTime(DateTime.Today);
        if (request.DataNascimento > hojeReferencia)
        {
            return new PreAlunoCriacaoResultado(false, null, "Data de nascimento do pre-aluno invalida.", PreAlunoCriacaoFalha.Validacao);
        }

        var idadeAnos = CalcularIdadeAnos(request.DataNascimento, hojeReferencia);

        if (request.LivroInteresseId <= 0)
        {
            return new PreAlunoCriacaoResultado(false, null, "Livro de interesse invalido.", PreAlunoCriacaoFalha.Validacao);
        }

        var livroOk = await _preAlunos.ExisteLivroAtivoNaEscolaAsync(escolaId.Value, request.LivroInteresseId, cancellationToken);
        if (!livroOk)
        {
            return new PreAlunoCriacaoResultado(false, null, "Livro de interesse nao encontrado ou inativo nesta escola.", PreAlunoCriacaoFalha.Validacao);
        }

        if (request.ValorMensalidade <= 0)
        {
            return new PreAlunoCriacaoResultado(false, null, "Valor da mensalidade deve ser maior que zero.", PreAlunoCriacaoFalha.Validacao);
        }

        decimal? valorMaterialResolvido = request.ValorMaterial;
        if (valorMaterialResolvido is < 0)
        {
            return new PreAlunoCriacaoResultado(false, null, "Valor do material/livro nao pode ser negativo.", PreAlunoCriacaoFalha.Validacao);
        }

        var tipoContrato = request.TipoContrato.Trim();
        if (string.IsNullOrWhiteSpace(tipoContrato) || tipoContrato.Length > 120)
        {
            return new PreAlunoCriacaoResultado(false, null, "Tipo de contrato e obrigatorio (ate 120 caracteres).", PreAlunoCriacaoFalha.Validacao);
        }

        if (request.ValorMatricula < 0)
        {
            return new PreAlunoCriacaoResultado(false, null, "Valor da matricula nao pode ser negativo.", PreAlunoCriacaoFalha.Validacao);
        }

        var formaPgtoMatricula = string.IsNullOrWhiteSpace(request.FormaPagamentoMatricula)
            ? null
            : request.FormaPagamentoMatricula.Trim();
        if (request.ValorMatricula > 0 && string.IsNullOrWhiteSpace(formaPgtoMatricula))
        {
            return new PreAlunoCriacaoResultado(
                false,
                null,
                "Informe a forma de pagamento da matricula quando o valor for maior que zero.",
                PreAlunoCriacaoFalha.Validacao);
        }

        var origem = request.OrigemCaptacao.Trim();
        if (string.IsNullOrWhiteSpace(origem) || origem.Length > 80)
        {
            return new PreAlunoCriacaoResultado(false, null, "Origem de captacao e obrigatoria (ate 80 caracteres).", PreAlunoCriacaoFalha.Validacao);
        }

        if (request.UsaTransporteVan)
        {
            if (string.IsNullOrWhiteSpace(request.TransporteLogradouro) || request.TransporteLogradouro.Trim().Length > 200)
                return new PreAlunoCriacaoResultado(false, null, "Endereco para van: informe logradouro.", PreAlunoCriacaoFalha.Validacao);
            if (string.IsNullOrWhiteSpace(request.TransporteNumero) || request.TransporteNumero.Trim().Length > 20)
                return new PreAlunoCriacaoResultado(false, null, "Endereco para van: informe numero.", PreAlunoCriacaoFalha.Validacao);
            if (string.IsNullOrWhiteSpace(request.TransporteBairro) || request.TransporteBairro.Trim().Length > 100)
                return new PreAlunoCriacaoResultado(false, null, "Endereco para van: informe bairro.", PreAlunoCriacaoFalha.Validacao);
            if (string.IsNullOrWhiteSpace(request.TransporteCidade) || request.TransporteCidade.Trim().Length > 100)
                return new PreAlunoCriacaoResultado(false, null, "Endereco para van: informe cidade.", PreAlunoCriacaoFalha.Validacao);

            var uf = (request.TransporteUf ?? string.Empty).Trim().ToUpperInvariant();
            if (uf.Length != 2)
                return new PreAlunoCriacaoResultado(false, null, "Endereco para van: informe UF com 2 letras.", PreAlunoCriacaoFalha.Validacao);

            var cepVan = SomenteDigitos(request.TransporteCep);
            if (cepVan.Length != 8)
                return new PreAlunoCriacaoResultado(false, null, "Endereco para van: informe CEP com 8 digitos.", PreAlunoCriacaoFalha.Validacao);
        }

        var telAluno = SomenteDigitos(request.TelefoneAluno);
        if (telAluno is { Length: > 0 and < 10 })
        {
            return new PreAlunoCriacaoResultado(false, null, "Telefone do pre-aluno invalido.", PreAlunoCriacaoFalha.Validacao);
        }

        string docResp;
        string tipoResp;
        string nomeResp;
        string sobrenomeResp;
        string telResp;

        if (idadeAnos < 18)
        {
            if (request.EProprioResponsavel)
            {
                return new PreAlunoCriacaoResultado(
                    false,
                    null,
                    "Menores de 18 anos precisam de um responsavel financeiro cadastrado (nao pode ser o proprio aluno).",
                    PreAlunoCriacaoFalha.Validacao);
            }

            var tipoMenorResp = NormalizarTipoPessoa(request.ResponsavelTipoPessoa);
            if (tipoMenorResp is null)
            {
                return new PreAlunoCriacaoResultado(false, null, "Tipo de pessoa do responsavel invalido.", PreAlunoCriacaoFalha.Validacao);
            }

            docResp = SomenteDigitos(request.ResponsavelCpfCnpj);
            if (tipoMenorResp == "Fisica" && docResp.Length != 11)
            {
                return new PreAlunoCriacaoResultado(false, null, "CPF do responsavel deve ter 11 digitos.", PreAlunoCriacaoFalha.Validacao);
            }

            if (tipoMenorResp == "Juridica" && docResp.Length != 14)
            {
                return new PreAlunoCriacaoResultado(false, null, "CNPJ do responsavel deve ter 14 digitos.", PreAlunoCriacaoFalha.Validacao);
            }

            telResp = SomenteDigitos(request.ResponsavelTelefone);
            if (telResp.Length < 10)
            {
                return new PreAlunoCriacaoResultado(false, null, "Telefone do responsavel e obrigatorio (minimo 10 digitos).", PreAlunoCriacaoFalha.Validacao);
            }

            if (string.IsNullOrWhiteSpace(request.ResponsavelNome) || string.IsNullOrWhiteSpace(request.ResponsavelSobrenome))
            {
                return new PreAlunoCriacaoResultado(false, null, "Nome e sobrenome do responsavel sao obrigatorios.", PreAlunoCriacaoFalha.Validacao);
            }

            tipoResp = tipoMenorResp;
            nomeResp = request.ResponsavelNome.Trim();
            sobrenomeResp = request.ResponsavelSobrenome.Trim();
        }
        else
        {
            if (request.EProprioResponsavel)
            {
                docResp = SomenteDigitos(request.AlunoCpf);
                if (docResp.Length != 11)
                {
                    return new PreAlunoCriacaoResultado(
                        false,
                        null,
                        "Informe o CPF do pre-aluno (11 digitos) quando ele for o proprio responsavel financeiro.",
                        PreAlunoCriacaoFalha.Validacao);
                }

                telResp = telAluno;
                if (telResp.Length < 10)
                {
                    return new PreAlunoCriacaoResultado(
                        false,
                        null,
                        "Telefone celular do pre-aluno e obrigatorio quando ele e o proprio responsavel financeiro.",
                        PreAlunoCriacaoFalha.Validacao);
                }

                tipoResp = "Fisica";
                nomeResp = request.Nome.Trim();
                sobrenomeResp = request.Sobrenome.Trim();
            }
            else
            {
                var tipoMaiorResp = NormalizarTipoPessoa(request.ResponsavelTipoPessoa);
                if (tipoMaiorResp is null)
                {
                    return new PreAlunoCriacaoResultado(false, null, "Tipo de pessoa do responsavel invalido.", PreAlunoCriacaoFalha.Validacao);
                }

                docResp = SomenteDigitos(request.ResponsavelCpfCnpj);
                if (tipoMaiorResp == "Fisica" && docResp.Length != 11)
                {
                    return new PreAlunoCriacaoResultado(false, null, "CPF do responsavel deve ter 11 digitos.", PreAlunoCriacaoFalha.Validacao);
                }

                if (tipoMaiorResp == "Juridica" && docResp.Length != 14)
                {
                    return new PreAlunoCriacaoResultado(false, null, "CNPJ do responsavel deve ter 14 digitos.", PreAlunoCriacaoFalha.Validacao);
                }

                telResp = SomenteDigitos(request.ResponsavelTelefone);
                if (telResp.Length < 10)
                {
                    return new PreAlunoCriacaoResultado(false, null, "Telefone do responsavel e obrigatorio (minimo 10 digitos).", PreAlunoCriacaoFalha.Validacao);
                }

                if (string.IsNullOrWhiteSpace(request.ResponsavelNome) || string.IsNullOrWhiteSpace(request.ResponsavelSobrenome))
                {
                    return new PreAlunoCriacaoResultado(false, null, "Nome e sobrenome do responsavel sao obrigatorios.", PreAlunoCriacaoFalha.Validacao);
                }

                tipoResp = tipoMaiorResp;
                nomeResp = request.ResponsavelNome.Trim();
                sobrenomeResp = request.ResponsavelSobrenome.Trim();
            }
        }

        var formaPgtoMensal = string.IsNullOrWhiteSpace(request.FormaPagamento) ? null : request.FormaPagamento.Trim();

        string? transporteCep = null;
        string? transporteLog = null;
        string? transporteNumero = null;
        string? transporteComp = null;
        string? transporteBairro = null;
        string? transporteCidade = null;
        string? transporteUf = null;

        if (request.UsaTransporteVan)
        {
            transporteCep = SomenteDigitos(request.TransporteCep);
            transporteLog = request.TransporteLogradouro!.Trim();
            transporteNumero = request.TransporteNumero!.Trim();
            transporteComp = string.IsNullOrWhiteSpace(request.TransporteComplemento)
                ? null
                : request.TransporteComplemento.Trim();
            transporteBairro = request.TransporteBairro!.Trim();
            transporteCidade = request.TransporteCidade!.Trim();
            transporteUf = (request.TransporteUf ?? string.Empty).Trim().ToUpperInvariant();
        }

        var novoId = 0;

        try
        {
            await _unitOfWork.ExecuteInTransactionAsync(async () =>
            {
                var agora = DateTime.UtcNow;
                var preResponsavel = new PreResponsavel
                {
                    EscolaId = escolaId.Value,
                    TipoPessoa = tipoResp,
                    CpfCnpj = docResp,
                    Nome = nomeResp,
                    Sobrenome = sobrenomeResp,
                    Telefone = telResp.Length >= 10 ? telResp : null,
                    Status = PreResponsavel.Estados.EmNegociacao,
                    DataCriacao = agora,
                    DataAtualizacao = agora
                };

                _preResponsaveis.Adicionar(preResponsavel);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                if (!request.EProprioResponsavel)
                {
                    await _preResponsaveis.AtualizarOpcionaisAsync(
                        escolaId.Value,
                        preResponsavel.Id,
                        string.IsNullOrWhiteSpace(request.ResponsavelSexo) ? null : request.ResponsavelSexo.Trim(),
                        string.IsNullOrWhiteSpace(request.ResponsavelGrauParentesco)
                            ? null
                            : request.ResponsavelGrauParentesco.Trim(),
                        string.IsNullOrWhiteSpace(request.ResponsavelEstadoCivil)
                            ? null
                            : request.ResponsavelEstadoCivil.Trim(),
                        string.IsNullOrWhiteSpace(request.ResponsavelCorRaca) ? null : request.ResponsavelCorRaca.Trim(),
                        string.IsNullOrWhiteSpace(request.ResponsavelNacionalidade)
                            ? null
                            : request.ResponsavelNacionalidade.Trim(),
                        ParseDataOpcional(request.ResponsavelDataNascimento),
                        string.IsNullOrWhiteSpace(request.ResponsavelNaturalidadeCidade)
                            ? null
                            : request.ResponsavelNaturalidadeCidade.Trim(),
                        string.IsNullOrWhiteSpace(request.ResponsavelNaturalidadeEstado)
                            ? null
                            : request.ResponsavelNaturalidadeEstado.Trim().ToUpperInvariant(),
                        string.IsNullOrWhiteSpace(request.ResponsavelRgNumero) ? null : request.ResponsavelRgNumero.Trim(),
                        ParseDataOpcional(request.ResponsavelRgExpedicao),
                        string.IsNullOrWhiteSpace(request.ResponsavelRgOrgao) ? null : request.ResponsavelRgOrgao.Trim(),
                        telResp.Length >= 10 ? telResp : null,
                        cancellationToken);
                }

                var preAluno = new PreAluno
                {
                    EscolaId = escolaId.Value,
                    PreResponsavelId = preResponsavel.Id,
                    Nome = request.Nome.Trim(),
                    Sobrenome = request.Sobrenome.Trim(),
                    DataNascimento = request.DataNascimento,
                    Telefone = telAluno.Length >= 10 ? telAluno : null,
                    LivroInteresseId = request.LivroInteresseId,
                    TipoContrato = tipoContrato,
                    ValorMensalidade = request.ValorMensalidade,
                    FormaPagamento = formaPgtoMensal,
                    ValorMatricula = request.ValorMatricula,
                    FormaPagamentoMatricula = formaPgtoMatricula,
                    ValorMaterial = valorMaterialResolvido,
                    OrigemCaptacao = origem,
                    UsaTransporteVan = request.UsaTransporteVan,
                    TransporteCep = transporteCep,
                    TransporteLogradouro = transporteLog,
                    TransporteNumero = transporteNumero,
                    TransporteComplemento = transporteComp,
                    TransporteBairro = transporteBairro,
                    TransporteCidade = transporteCidade,
                    TransporteUf = transporteUf,
                    ObservacoesComerciais = string.IsNullOrWhiteSpace(request.ObservacoesComerciais)
                        ? null
                        : request.ObservacoesComerciais.Trim(),
                    EProprioResponsavel = request.EProprioResponsavel,
                    AlunoCpf = request.EProprioResponsavel
                        ? (SomenteDigitos(request.AlunoCpf).Length == 11 ? SomenteDigitos(request.AlunoCpf) : null)
                        : null,
                    Status = PreAluno.Estados.EmNegociacao,
                    CriadoPorUsuarioId = uc.UserId,
                    DataCriacao = agora,
                    DataAtualizacao = agora
                };

                _preAlunos.Adicionar(preAluno);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                novoId = preAluno.Id;
            }, cancellationToken);
        }
        catch (Exception ex) when (ContemDuplicateEntry(ex))
        {
            return new PreAlunoCriacaoResultado(false, null, "Ja existe cadastro para este documento nesta escola.", PreAlunoCriacaoFalha.Conflito);
        }

        return new PreAlunoCriacaoResultado(true, novoId, null, PreAlunoCriacaoFalha.Nenhuma);
    }

    public async Task<PreAlunoOperacaoResultado> EditarAsync(
        int id,
        CriarPreAlunoRequest request,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterIdEscolaAtivaPorCodigoAsync(uc.CodigoEscola, cancellationToken);
        if (!escolaId.HasValue)
            return new PreAlunoOperacaoResultado(false, "Acesso negado.", 403);

        var pre = await _preAlunos.ObterPorIdEEscolaRastreadoAsync(id, escolaId.Value, cancellationToken);
        if (pre is null)
            return new PreAlunoOperacaoResultado(false, "Pre-aluno nao encontrado.", 404);

        if (!string.Equals(pre.Status, PreAluno.Estados.EmNegociacao, StringComparison.Ordinal))
        {
            return new PreAlunoOperacaoResultado(
                false,
                "Somente pre-alunos em negociacao podem ser editados.",
                409);
        }

        var hojeReferencia = DateOnly.FromDateTime(DateTime.Today);
        var (okVal, errVal, dados) = PreAlunoCadastroResolver.Resolver(request, hojeReferencia);
        if (!okVal || dados is null)
            return new PreAlunoOperacaoResultado(false, errVal ?? "Dados invalidos.", 400);

        var livroOk = await _preAlunos.ExisteLivroAtivoNaEscolaAsync(escolaId.Value, dados.LivroInteresseId, cancellationToken);
        if (!livroOk)
            return new PreAlunoOperacaoResultado(false, "Livro de interesse nao encontrado ou inativo nesta escola.", 400);

        var preResp = await _preResponsaveis.ObterPorIdEEscolaRastreadoAsync(
            pre.PreResponsavelId,
            escolaId.Value,
            cancellationToken);
        if (preResp is null)
            return new PreAlunoOperacaoResultado(false, "Responsavel do pre-aluno nao encontrado.", 404);

        try
        {
            await _unitOfWork.ExecuteInTransactionAsync(async () =>
            {
                var agora = DateTime.UtcNow;

                preResp.TipoPessoa = dados.TipoResp;
                preResp.CpfCnpj = dados.DocResp;
                preResp.Nome = dados.NomeResp;
                preResp.Sobrenome = dados.SobrenomeResp;
                preResp.Telefone = dados.TelResp.Length >= 10 ? dados.TelResp : null;
                if (!string.Equals(preResp.Status, PreResponsavel.Estados.Convertido, StringComparison.Ordinal))
                    preResp.Status = PreResponsavel.Estados.EmNegociacao;
                preResp.DataAtualizacao = agora;

                if (!request.EProprioResponsavel)
                {
                    await _preResponsaveis.AtualizarOpcionaisAsync(
                        escolaId.Value,
                        preResp.Id,
                        string.IsNullOrWhiteSpace(request.ResponsavelSexo) ? null : request.ResponsavelSexo.Trim(),
                        string.IsNullOrWhiteSpace(request.ResponsavelGrauParentesco)
                            ? null
                            : request.ResponsavelGrauParentesco.Trim(),
                        string.IsNullOrWhiteSpace(request.ResponsavelEstadoCivil)
                            ? null
                            : request.ResponsavelEstadoCivil.Trim(),
                        string.IsNullOrWhiteSpace(request.ResponsavelCorRaca) ? null : request.ResponsavelCorRaca.Trim(),
                        string.IsNullOrWhiteSpace(request.ResponsavelNacionalidade)
                            ? null
                            : request.ResponsavelNacionalidade.Trim(),
                        ParseDataOpcional(request.ResponsavelDataNascimento),
                        string.IsNullOrWhiteSpace(request.ResponsavelNaturalidadeCidade)
                            ? null
                            : request.ResponsavelNaturalidadeCidade.Trim(),
                        string.IsNullOrWhiteSpace(request.ResponsavelNaturalidadeEstado)
                            ? null
                            : request.ResponsavelNaturalidadeEstado.Trim().ToUpperInvariant(),
                        string.IsNullOrWhiteSpace(request.ResponsavelRgNumero) ? null : request.ResponsavelRgNumero.Trim(),
                        ParseDataOpcional(request.ResponsavelRgExpedicao),
                        string.IsNullOrWhiteSpace(request.ResponsavelRgOrgao) ? null : request.ResponsavelRgOrgao.Trim(),
                        dados.TelResp.Length >= 10 ? dados.TelResp : null,
                        cancellationToken);
                }

                pre.Nome = dados.Nome;
                pre.Sobrenome = dados.Sobrenome;
                pre.DataNascimento = dados.DataNascimento;
                pre.Telefone = dados.TelAluno;
                pre.LivroInteresseId = dados.LivroInteresseId;
                pre.TipoContrato = dados.TipoContrato;
                pre.ValorMensalidade = dados.ValorMensalidade;
                pre.FormaPagamento = dados.FormaPagamentoMensal;
                pre.ValorMatricula = dados.ValorMatricula;
                pre.FormaPagamentoMatricula = dados.FormaPagamentoMatricula;
                pre.ValorMaterial = dados.ValorMaterial;
                pre.OrigemCaptacao = dados.OrigemCaptacao;
                pre.UsaTransporteVan = dados.UsaTransporteVan;
                pre.TransporteCep = dados.TransporteCep;
                pre.TransporteLogradouro = dados.TransporteLogradouro;
                pre.TransporteNumero = dados.TransporteNumero;
                pre.TransporteComplemento = dados.TransporteComplemento;
                pre.TransporteBairro = dados.TransporteBairro;
                pre.TransporteCidade = dados.TransporteCidade;
                pre.TransporteUf = dados.TransporteUf;
                pre.ObservacoesComerciais = PreAlunoCadastroResolver.MesclarObservacoesPreservandoRecusa(
                    pre.ObservacoesComerciais,
                    dados.ObservacoesUsuario);
                pre.EProprioResponsavel = dados.EProprioResponsavel;
                pre.AlunoCpf = dados.EProprioResponsavel && dados.AlunoCpf is { Length: 11 }
                    ? dados.AlunoCpf
                    : null;
                pre.DataAtualizacao = agora;

                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }, cancellationToken);
        }
        catch (Exception ex) when (ContemDuplicateEntry(ex))
        {
            return new PreAlunoOperacaoResultado(false, "Ja existe cadastro para este documento nesta escola.", 409);
        }

        return new PreAlunoOperacaoResultado(true, null, 204);
    }

    public async Task<PreAlunoOperacaoResultado> SubmeterParaAprovacaoAsync(
        int id,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterIdEscolaAtivaPorCodigoAsync(uc.CodigoEscola, cancellationToken);
        if (!escolaId.HasValue)
        {
            return new PreAlunoOperacaoResultado(false, "Acesso negado.", 403);
        }

        var pre = await _preAlunos.ObterPorIdEEscolaRastreadoAsync(id, escolaId.Value, cancellationToken);
        if (pre is null)
        {
            return new PreAlunoOperacaoResultado(false, "Pre-aluno nao encontrado.", 404);
        }

        if (!string.Equals(pre.Status, PreAluno.Estados.EmNegociacao, StringComparison.Ordinal))
        {
            return new PreAlunoOperacaoResultado(
                false,
                "Somente pre-alunos em negociacao podem ser enviados para aprovacao.",
                409);
        }

        pre.Status = PreAluno.Estados.AguardandoAprovacao;
        pre.DataAtualizacao = DateTime.UtcNow;

        var preResp = await _preResponsaveis.ObterPorIdEEscolaRastreadoAsync(
            pre.PreResponsavelId,
            escolaId.Value,
            cancellationToken);
        if (preResp is not null)
        {
            preResp.Status = PreResponsavel.Estados.AguardandoAprovacao;
            preResp.DataAtualizacao = DateTime.UtcNow;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new PreAlunoOperacaoResultado(true, null, 204);
    }

    public async Task<PrepararConversaoResultado> PrepararConversaoAsync(
        int id,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterIdEscolaAtivaPorCodigoAsync(uc.CodigoEscola, cancellationToken);
        if (!escolaId.HasValue)
            return new PrepararConversaoResultado(false, null, "Acesso negado.", PrepararConversaoFalha.AcessoNegado);

        var d = await _preAlunos.ObterDetalheAsync(id, escolaId.Value, cancellationToken);
        if (d is null)
            return new PrepararConversaoResultado(false, null, "Pre-aluno nao encontrado.", PrepararConversaoFalha.NaoEncontrado);

        d = await EnriquecerDetalheComTelefoneResponsavelAsync(d, escolaId.Value, cancellationToken);

        if (!string.Equals(d.Status, PreAluno.Estados.AguardandoAprovacao, StringComparison.Ordinal))
        {
            return new PrepararConversaoResultado(
                false,
                null,
                "Somente pre-alunos aguardando aprovacao podem ser convertidos.",
                PrepararConversaoFalha.Validacao);
        }

        var docs = await ListarDocumentosInternoAsync(id, escolaId.Value, cancellationToken);
        var faltantes = ListarCamposObrigatoriosFaltantes(d, request: null);
        var respDados = await _preResponsaveis.ObterDadosAsync(d.PreResponsavelId, escolaId.Value, cancellationToken);
        var responsavelResp = MapearResponsavelSugerido(respDados, d);

        var resp = new PrepararConversaoPreAlunoResponse(
            d.Id,
            d.NomeAluno,
            d.SobrenomeAluno,
            d.DataNascimentoAluno,
            d.EProprioResponsavel,
            d.AlunoCpf,
            d.TelefoneAluno,
            d.ResponsavelCpfCnpj,
            d.ResponsavelNomeCompleto,
            responsavelResp,
            d.UsaTransporteVan,
            d.TransporteCep,
            d.TransporteLogradouro,
            d.TransporteNumero,
            d.TransporteComplemento,
            d.TransporteBairro,
            d.TransporteCidade,
            d.TransporteUf,
            faltantes,
            docs);

        return new PrepararConversaoResultado(true, resp, null, PrepararConversaoFalha.Nenhuma);
    }

    public async Task<PreAlunoAprovacaoResultado> AprovarAsync(
        int id,
        AprovarPreAlunoRequest request,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterIdEscolaAtivaPorCodigoAsync(uc.CodigoEscola, cancellationToken);
        if (!escolaId.HasValue)
            return new PreAlunoAprovacaoResultado(false, null, null, "Acesso negado.", PreAlunoAprovacaoFalha.AcessoNegado);

        var pre = await _preAlunos.ObterPorIdEEscolaRastreadoAsync(id, escolaId.Value, cancellationToken);
        if (pre is null)
            return new PreAlunoAprovacaoResultado(false, null, null, "Pre-aluno nao encontrado.", PreAlunoAprovacaoFalha.NaoEncontrado);

        if (!string.Equals(pre.Status, PreAluno.Estados.AguardandoAprovacao, StringComparison.Ordinal))
        {
            return new PreAlunoAprovacaoResultado(
                false,
                null,
                null,
                "Somente pre-alunos aguardando aprovacao podem receber aceite.",
                PreAlunoAprovacaoFalha.Validacao);
        }

        if (pre.AlunoId.HasValue)
        {
            return new PreAlunoAprovacaoResultado(
                false,
                null,
                null,
                "Este pre-aluno ja foi convertido em aluno.",
                PreAlunoAprovacaoFalha.Conflito);
        }

        var detalhe = await _preAlunos.ObterDetalheAsync(id, escolaId.Value, cancellationToken);
        if (detalhe is null)
            return new PreAlunoAprovacaoResultado(false, null, null, "Pre-aluno nao encontrado.", PreAlunoAprovacaoFalha.NaoEncontrado);

        detalhe = await EnriquecerDetalheComTelefoneResponsavelAsync(detalhe, escolaId.Value, cancellationToken);

        var faltantes = ListarCamposObrigatoriosFaltantes(detalhe, request);
        if (faltantes.Count > 0)
        {
            return new PreAlunoAprovacaoResultado(
                false,
                null,
                null,
                $"Preencha os dados obrigatorios do aluno: {string.Join(", ", faltantes)}.",
                PreAlunoAprovacaoFalha.Validacao);
        }

        var eProprio = request.EProprioResponsavel || detalhe.EProprioResponsavel;

        try
        {
            await ResolverResponsavelOficialAsync(
                pre,
                detalhe,
                request,
                eProprio,
                escolaId.Value,
                cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            return new PreAlunoAprovacaoResultado(false, null, null, ex.Message, PreAlunoAprovacaoFalha.Validacao);
        }

        var criarAluno = MontarCriarAlunoRequest(detalhe, request, eProprio);

        var criacao = await _alunosService.CriarAlunoAsync(criarAluno, uc, cancellationToken);
        if (!criacao.Ok || !criacao.AlunoId.HasValue || !criacao.MatriculaId.HasValue)
        {
            var falha = criacao.Falha switch
            {
                CriarAlunoFalha.Conflito => PreAlunoAprovacaoFalha.Conflito,
                _ => PreAlunoAprovacaoFalha.Validacao
            };
            return new PreAlunoAprovacaoResultado(
                false,
                null,
                null,
                criacao.Mensagem ?? "Falha ao criar aluno a partir do pre-aluno.",
                falha);
        }

        pre.Status = PreAluno.Estados.Matriculado;
        pre.AlunoId = criacao.AlunoId.Value;
        pre.DataAtualizacao = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new PreAlunoAprovacaoResultado(
            true,
            criacao.AlunoId.Value,
            criacao.MatriculaId.Value,
            null,
            PreAlunoAprovacaoFalha.Nenhuma);
    }

    public Task<IReadOnlyList<PreAlunoDocumentoResponse>> ListarDocumentosAsync(
        int preAlunoId,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        return ListarDocumentosComEscolaAsync(preAlunoId, uc, cancellationToken);
    }

    public async Task<PreAlunoDocumentoUploadResultado> UploadDocumentoAsync(
        int preAlunoId,
        string tipoCodigo,
        string? nomeExibicao,
        string nomeArquivoOriginal,
        string? contentType,
        Stream conteudo,
        long tamanhoBytes,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterIdEscolaAtivaPorCodigoAsync(uc.CodigoEscola, cancellationToken);
        if (!escolaId.HasValue)
            return FalhaUpload("Acesso negado.", PreAlunoDocumentoUploadFalha.AcessoNegado);

        if (uc.UserId <= 0)
            return FalhaUpload("Usuario invalido.", PreAlunoDocumentoUploadFalha.Validacao);

        var pre = await _preAlunos.ObterPorIdEEscolaRastreadoAsync(preAlunoId, escolaId.Value, cancellationToken);
        if (pre is null)
            return FalhaUpload("Pre-aluno nao encontrado.", PreAlunoDocumentoUploadFalha.NaoEncontrado);

        if (string.Equals(pre.Status, PreAluno.Estados.Matriculado, StringComparison.Ordinal)
            || string.Equals(pre.Status, PreAluno.Estados.Cancelado, StringComparison.Ordinal))
        {
            return FalhaUpload(
                "Nao e possivel anexar documentos a pre-alunos matriculados ou cancelados.",
                PreAlunoDocumentoUploadFalha.Validacao);
        }

        var codigo = PreAlunoDocumentoTipos.NormalizarCodigo(tipoCodigo);
        if (!PreAlunoDocumentoTipos.EhTipoConhecido(codigo))
            return FalhaUpload("Tipo de documento invalido.", PreAlunoDocumentoUploadFalha.Validacao);

        if (tamanhoBytes <= 0 || tamanhoBytes > TamanhoMaximoArquivoBytes)
            return FalhaUpload("Arquivo deve ter entre 1 byte e 10 MB.", PreAlunoDocumentoUploadFalha.Validacao);

        var ext = Path.GetExtension(nomeArquivoOriginal);
        if (string.IsNullOrWhiteSpace(ext) || !ExtensoesPermitidas.Contains(ext))
        {
            return FalhaUpload(
                "Formato nao permitido. Use PDF, JPG, PNG, DOC ou DOCX.",
                PreAlunoDocumentoUploadFalha.Validacao);
        }

        var rotulo = PreAlunoDocumentoTipos.ResolverRotulo(codigo, nomeExibicao);
        var guid = Guid.NewGuid().ToString("N");
        var caminhoRelativo = $"pre-alunos/{escolaId.Value}/{preAlunoId}/{codigo}_{guid}{ext.ToLowerInvariant()}";

        var existente = await _documentos.ObterPorPreAlunoETipoAsync(
            preAlunoId,
            escolaId.Value,
            codigo,
            cancellationToken);

        if (existente is not null)
        {
            await _arquivoStorage.RemoverAsync(existente.CaminhoRelativo, cancellationToken);
            _documentos.Remover(existente);
        }

        await _arquivoStorage.SalvarAsync(caminhoRelativo, conteudo, cancellationToken);

        var agora = DateTime.UtcNow;
        var doc = new PreAlunoDocumento
        {
            EscolaId = escolaId.Value,
            PreAlunoId = preAlunoId,
            TipoCodigo = codigo,
            NomeExibicao = rotulo,
            NomeArquivoOriginal = nomeArquivoOriginal.Trim(),
            CaminhoRelativo = caminhoRelativo,
            ContentType = string.IsNullOrWhiteSpace(contentType) ? null : contentType.Trim(),
            TamanhoBytes = tamanhoBytes,
            EnviadoPorUsuarioId = uc.UserId,
            DataUpload = agora
        };

        _documentos.Adicionar(doc);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var resp = MapearDocumento(doc, preAlunoId);
        return new PreAlunoDocumentoUploadResultado(true, resp, null, PreAlunoDocumentoUploadFalha.Nenhuma);
    }

    public async Task<(Stream? Stream, string? ContentType, string? NomeArquivo)?> ObterArquivoDocumentoAsync(
        int preAlunoId,
        string tipoCodigo,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterIdEscolaAtivaPorCodigoAsync(uc.CodigoEscola, cancellationToken);
        if (!escolaId.HasValue)
            return null;

        var codigo = PreAlunoDocumentoTipos.NormalizarCodigo(tipoCodigo);
        var doc = await _documentos.ObterPorPreAlunoETipoAsync(preAlunoId, escolaId.Value, codigo, cancellationToken);
        if (doc is null)
            return null;

        var stream = await _arquivoStorage.AbrirLeituraAsync(doc.CaminhoRelativo, cancellationToken);
        if (stream is null)
            return null;

        return (stream, doc.ContentType, doc.NomeArquivoOriginal);
    }

    public async Task<PreAlunoOperacaoResultado> ReprovarAsync(
        int id,
        ReprovarPreAlunoRequest request,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterIdEscolaAtivaPorCodigoAsync(uc.CodigoEscola, cancellationToken);
        if (!escolaId.HasValue)
            return new PreAlunoOperacaoResultado(false, "Acesso negado.", 403);

        var motivo = request.Motivo?.Trim() ?? string.Empty;
        if (motivo.Length < 3)
            return new PreAlunoOperacaoResultado(false, "Informe o motivo da recusa (minimo 3 caracteres).", 400);

        var pre = await _preAlunos.ObterPorIdEEscolaRastreadoAsync(id, escolaId.Value, cancellationToken);
        if (pre is null)
            return new PreAlunoOperacaoResultado(false, "Pre-aluno nao encontrado.", 404);

        if (!string.Equals(pre.Status, PreAluno.Estados.AguardandoAprovacao, StringComparison.Ordinal))
        {
            return new PreAlunoOperacaoResultado(
                false,
                "Somente pre-alunos aguardando aprovacao podem ser recusados.",
                409);
        }

        var obsAnterior = pre.ObservacoesComerciais?.Trim();
        var stamp = DataHoraBrasil.CarimboRecusaIso8601;
        pre.ObservacoesComerciais = string.IsNullOrEmpty(obsAnterior)
            ? $"[Recusado pela secretaria em {stamp}] {motivo}"
            : $"{obsAnterior}\n\n[Recusado pela secretaria em {stamp}] {motivo}";

        pre.Status = PreAluno.Estados.EmNegociacao;
        pre.DataAtualizacao = DateTime.UtcNow;

        var preResp = await _preResponsaveis.ObterPorIdEEscolaRastreadoAsync(
            pre.PreResponsavelId,
            escolaId.Value,
            cancellationToken);
        if (preResp is not null
            && !string.Equals(preResp.Status, PreResponsavel.Estados.Convertido, StringComparison.Ordinal))
        {
            preResp.Status = PreResponsavel.Estados.Recusado;
            preResp.DataAtualizacao = DateTime.UtcNow;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new PreAlunoOperacaoResultado(true, null, 204);
    }

    public async Task<PreAlunoOperacaoResultado> CancelarAsync(
        int id,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterIdEscolaAtivaPorCodigoAsync(uc.CodigoEscola, cancellationToken);
        if (!escolaId.HasValue)
        {
            return new PreAlunoOperacaoResultado(false, "Acesso negado.", 403);
        }

        var pre = await _preAlunos.ObterPorIdEEscolaRastreadoAsync(id, escolaId.Value, cancellationToken);
        if (pre is null)
        {
            return new PreAlunoOperacaoResultado(false, "Pre-aluno nao encontrado.", 404);
        }

        if (string.Equals(pre.Status, PreAluno.Estados.Matriculado, StringComparison.Ordinal))
        {
            return new PreAlunoOperacaoResultado(false, "Pre-aluno ja matriculado nao pode ser cancelado.", 409);
        }

        pre.Status = PreAluno.Estados.Cancelado;
        pre.DataAtualizacao = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new PreAlunoOperacaoResultado(true, null, 204);
    }

    private async Task<int> ResolverResponsavelOficialAsync(
        PreAluno pre,
        PreAlunoDetalheItem detalhe,
        AprovarPreAlunoRequest request,
        bool eProprio,
        int escolaId,
        CancellationToken cancellationToken)
    {
        var preResp = await _preResponsaveis.ObterPorIdEEscolaRastreadoAsync(
            pre.PreResponsavelId,
            escolaId,
            cancellationToken);

        if (preResp is null)
            throw new InvalidOperationException("Pre-responsavel vinculado nao encontrado.");

        if (preResp.ResponsavelConvertidoId is int jaConvertido)
        {
            pre.ResponsavelId = jaConvertido;
            return jaConvertido;
        }

        var cpf = SomenteDigitos(eProprio ? (request.Cpf ?? detalhe.AlunoCpf) : (request.ResponsavelCpf ?? detalhe.ResponsavelCpfCnpj));
        if (cpf.Length != 11)
            throw new InvalidOperationException("CPF do responsavel deve ter 11 digitos.");

        var partesNome = detalhe.ResponsavelNomeCompleto.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        var nome = eProprio
            ? detalhe.NomeAluno.Trim()
            : (request.ResponsavelNome?.Trim() ?? (partesNome.Length > 0 ? partesNome[0] : detalhe.ResponsavelNomeCompleto));
        var sobrenome = eProprio
            ? detalhe.SobrenomeAluno.Trim()
            : (request.ResponsavelSobrenome?.Trim() ?? (partesNome.Length > 1 ? partesNome[1] : string.Empty));

        var tel = SomenteDigitos(eProprio
            ? (request.AlunoTelefone ?? detalhe.TelefoneAluno)
            : (request.ResponsavelTelefone ?? detalhe.ResponsavelTelefone));
        if (tel.Length < 10)
            throw new InvalidOperationException("Telefone do responsavel e obrigatorio (minimo 10 digitos).");

        var cepResp = SomenteDigitos(request.ResponsavelCep);
        var tipoLog = request.ResponsavelTipoLogradouro?.Trim() ?? "Rua";
        var log = request.ResponsavelLogradouro?.Trim() ?? string.Empty;
        var numero = request.ResponsavelNumero?.Trim() ?? string.Empty;
        var bairro = request.ResponsavelBairro?.Trim() ?? string.Empty;
        var municipio = request.ResponsavelMunicipio?.Trim() ?? string.Empty;
        var complemento = string.IsNullOrWhiteSpace(request.ResponsavelComplemento)
            ? null
            : request.ResponsavelComplemento.Trim();
        var sexo = request.ResponsavelSexo?.Trim() ?? preResp.Sexo ?? "Masculino";

        int responsavelId;
        var existente = await _alunos.ObterResponsavelIdPorCpfAsync(escolaId, cpf, cancellationToken);
        if (existente.HasValue)
        {
            responsavelId = existente.Value;
            var telExistente = await _alunos.ObterTelefonePrincipalAsync(
                escolaId,
                "responsavel",
                responsavelId,
                cancellationToken);
            if (string.IsNullOrWhiteSpace(telExistente))
            {
                await _alunos.InserirContatoTelefoneAsync(
                    escolaId,
                    "responsavel",
                    responsavelId,
                    "Celular",
                    tel,
                    principal: true,
                    cancellationToken);
            }

            if (!eProprio)
            {
                await _alunos.AtualizarResponsavelOpcionaisAsync(
                    escolaId,
                    responsavelId,
                    sexo,
                    preResp.GrauParentesco,
                    preResp.EstadoCivil,
                    preResp.CorRaca,
                    preResp.Nacionalidade,
                    preResp.DataNascimento,
                    preResp.NaturalidadeCidade,
                    preResp.NaturalidadeEstado,
                    preResp.RgNumero,
                    preResp.RgExpedicao,
                    preResp.RgOrgao,
                    cancellationToken);
            }
        }
        else if (!eProprio && cepResp.Length >= 8
                 && !string.IsNullOrWhiteSpace(log)
                 && !string.IsNullOrWhiteSpace(numero)
                 && !string.IsNullOrWhiteSpace(bairro)
                 && !string.IsNullOrWhiteSpace(municipio))
        {
            responsavelId = await _alunos.CriarResponsavelFisicoAsync(
                escolaId,
                cpf,
                nome,
                sobrenome,
                sexo,
                cepResp,
                tipoLog,
                log,
                numero,
                complemento,
                bairro,
                municipio,
                cancellationToken);

            await _alunos.InserirContatoTelefoneAsync(
                escolaId,
                "responsavel",
                responsavelId,
                "Celular",
                tel,
                principal: true,
                cancellationToken);
        }
        else
        {
            responsavelId = await _alunos.CriarResponsavelMinimoAsync(
                escolaId,
                "Fisica",
                cpf,
                nome,
                sobrenome,
                cancellationToken);

            await _alunos.InserirContatoTelefoneAsync(
                escolaId,
                "responsavel",
                responsavelId,
                "Celular",
                tel,
                principal: true,
                cancellationToken);

            if (!eProprio && cepResp.Length >= 8)
            {
                await _alunos.AtualizarResponsavelOpcionaisAsync(
                    escolaId,
                    responsavelId,
                    sexo,
                    preResp.GrauParentesco,
                    preResp.EstadoCivil,
                    preResp.CorRaca,
                    preResp.Nacionalidade,
                    preResp.DataNascimento,
                    preResp.NaturalidadeCidade,
                    preResp.NaturalidadeEstado,
                    preResp.RgNumero,
                    preResp.RgExpedicao,
                    preResp.RgOrgao,
                    cancellationToken);
            }
        }

        preResp.ResponsavelConvertidoId = responsavelId;
        preResp.Status = PreResponsavel.Estados.Convertido;
        preResp.DataAtualizacao = DateTime.UtcNow;
        pre.ResponsavelId = responsavelId;

        return responsavelId;
    }

    private Task<int?> ObterIdEscolaAtivaPorCodigoAsync(string? codigoEscola, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(codigoEscola))
            return Task.FromResult<int?>(null);

        return _escolas.ObterIdAtivaPorCodigoEscolaAsync(codigoEscola.Trim(), cancellationToken);
    }

    private static string? NormalizarTipoPessoa(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "Fisica";

        var s = value.Trim();
        if (s.Equals("Fisica", StringComparison.OrdinalIgnoreCase)) return "Fisica";
        if (s.Equals("Juridica", StringComparison.OrdinalIgnoreCase)) return "Juridica";
        return null;
    }

    private static DateOnly? ParseDataOpcional(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;
        return DateOnly.TryParse(value.Trim(), out var data) ? data : null;
    }

    private static string SomenteDigitos(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        return new string(value.Where(char.IsAsciiDigit).ToArray());
    }

    private static int CalcularIdadeAnos(DateOnly dataNascimento, DateOnly hoje)
    {
        var idade = hoje.Year - dataNascimento.Year;
        if (hoje.Month < dataNascimento.Month ||
            (hoje.Month == dataNascimento.Month && hoje.Day < dataNascimento.Day))
        {
            idade--;
        }

        return idade;
    }

    private static bool ContemDuplicateEntry(Exception ex)
    {
        for (var e = ex; e is not null; e = e.InnerException)
        {
            if (e.Message.Contains("Duplicate", StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static ResponsavelDadosSugeridosResponse MapearResponsavelSugerido(
        ResponsavelDadosItem? dados,
        Domain.ReadModels.PreAlunoDetalheItem pre)
    {
        if (dados is not null)
        {
            var telefone = string.IsNullOrWhiteSpace(dados.Telefone) ? pre.ResponsavelTelefone : dados.Telefone;
            return new ResponsavelDadosSugeridosResponse(
                dados.Nome,
                dados.Sobrenome,
                dados.CpfCnpj,
                telefone,
                dados.Sexo,
                dados.GrauParentesco,
                dados.EstadoCivil,
                dados.CorRaca,
                dados.Nacionalidade,
                dados.DataNascimento?.ToString("yyyy-MM-dd"),
                dados.NaturalidadeCidade,
                dados.NaturalidadeEstado,
                dados.RgNumero,
                dados.RgExpedicao?.ToString("yyyy-MM-dd"),
                dados.RgOrgao,
                dados.Cep,
                dados.TipoLogradouro,
                dados.Logradouro,
                dados.Numero,
                dados.Complemento,
                dados.Bairro,
                dados.Municipio);
        }

        var partes = pre.ResponsavelNomeCompleto.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        return new ResponsavelDadosSugeridosResponse(
            partes.Length > 0 ? partes[0] : pre.ResponsavelNomeCompleto,
            partes.Length > 1 ? partes[1] : "",
            pre.ResponsavelCpfCnpj,
            pre.ResponsavelTelefone,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null);
    }

    private async Task<Domain.ReadModels.PreAlunoDetalheItem> EnriquecerDetalheComTelefoneResponsavelAsync(
        Domain.ReadModels.PreAlunoDetalheItem d,
        int escolaId,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(d.ResponsavelTelefone))
            return d;

        var dados = await _preResponsaveis.ObterDadosAsync(d.PreResponsavelId, escolaId, cancellationToken);
        return d with { ResponsavelTelefone = dados?.Telefone };
    }

    private async Task<IReadOnlyList<PreAlunoDocumentoResponse>> ListarDocumentosComEscolaAsync(
        int preAlunoId,
        AppUserContext uc,
        CancellationToken cancellationToken)
    {
        var escolaId = await ObterIdEscolaAtivaPorCodigoAsync(uc.CodigoEscola, cancellationToken);
        if (!escolaId.HasValue)
            return Array.Empty<PreAlunoDocumentoResponse>();

        return await ListarDocumentosInternoAsync(preAlunoId, escolaId.Value, cancellationToken);
    }

    private async Task<IReadOnlyList<PreAlunoDocumentoResponse>> ListarDocumentosInternoAsync(
        int preAlunoId,
        int escolaId,
        CancellationToken cancellationToken)
    {
        var rows = await _documentos.ListarPorPreAlunoAsync(preAlunoId, escolaId, cancellationToken);
        return rows.Select(d => MapearDocumento(d, preAlunoId)).ToList();
    }

    private static PreAlunoDocumentoResponse MapearDocumento(PreAlunoDocumento d, int preAlunoId)
    {
        return new PreAlunoDocumentoResponse(
            d.Id,
            d.TipoCodigo,
            d.NomeExibicao,
            d.NomeArquivoOriginal,
            d.ContentType,
            d.TamanhoBytes,
            d.DataUpload,
            $"/api/pre-alunos/{preAlunoId}/documentos/{d.TipoCodigo}/arquivo");
    }

    private static PreAlunoDocumentoUploadResultado FalhaUpload(
        string mensagem,
        PreAlunoDocumentoUploadFalha falha)
    {
        return new PreAlunoDocumentoUploadResultado(false, null, mensagem, falha);
    }

    private static List<string> ListarCamposObrigatoriosFaltantes(
        Domain.ReadModels.PreAlunoDetalheItem d,
        AprovarPreAlunoRequest? request)
    {
        var faltantes = new List<string>();

        if (request is null)
        {
            faltantes.Add("sexo");
            faltantes.Add("dataIngresso");
            if (!d.UsaTransporteVan)
            {
                faltantes.AddRange(["cep", "tipoLogradouro", "logradouro", "numero", "bairro", "municipio"]);
            }

            if (d.EProprioResponsavel)
            {
                if (string.IsNullOrWhiteSpace(d.AlunoCpf))
                    faltantes.Add("cpf");
                if (string.IsNullOrWhiteSpace(d.TelefoneAluno))
                    faltantes.Add("telefoneAluno");
            }
            else
            {
                faltantes.AddRange([
                    "responsavelNome",
                    "responsavelSobrenome",
                    "responsavelCpf",
                    "responsavelTelefone",
                    "responsavelCep",
                    "responsavelTipoLogradouro",
                    "responsavelLogradouro",
                    "responsavelNumero",
                    "responsavelBairro",
                    "responsavelMunicipio"
                ]);
            }

            return faltantes;
        }

        if (string.IsNullOrWhiteSpace(request.Sexo))
            faltantes.Add("sexo");
        if (request.DataIngresso == default)
            faltantes.Add("dataIngresso");

        var eProprio = request.EProprioResponsavel || d.EProprioResponsavel;
        var cep = request.Cep.Trim();
        var tipoLog = request.TipoLogradouro.Trim();
        var log = request.Logradouro.Trim();
        var num = request.Numero.Trim();
        var bairro = request.Bairro.Trim();
        var municipio = request.Municipio.Trim();

        if (string.IsNullOrWhiteSpace(cep))
            cep = d.UsaTransporteVan ? SomenteDigitos(d.TransporteCep) : string.Empty;
        if (string.IsNullOrWhiteSpace(tipoLog) && d.UsaTransporteVan)
            tipoLog = "Rua";
        if (string.IsNullOrWhiteSpace(log) && d.UsaTransporteVan)
            log = d.TransporteLogradouro?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(num) && d.UsaTransporteVan)
            num = d.TransporteNumero?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(bairro) && d.UsaTransporteVan)
            bairro = d.TransporteBairro?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(municipio) && d.UsaTransporteVan)
            municipio = d.TransporteCidade?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(cep))
            faltantes.Add("cep");
        if (string.IsNullOrWhiteSpace(tipoLog))
            faltantes.Add("tipoLogradouro");
        if (string.IsNullOrWhiteSpace(log))
            faltantes.Add("logradouro");
        if (string.IsNullOrWhiteSpace(num))
            faltantes.Add("numero");
        if (string.IsNullOrWhiteSpace(bairro))
            faltantes.Add("bairro");
        if (string.IsNullOrWhiteSpace(municipio))
            faltantes.Add("municipio");

        if (eProprio)
        {
            var cpf = SomenteDigitos(request.Cpf ?? d.AlunoCpf);
            if (cpf.Length != 11)
                faltantes.Add("cpf");
            var tel = SomenteDigitos(request.AlunoTelefone ?? d.TelefoneAluno);
            if (tel.Length < 10)
                faltantes.Add("telefoneAluno");
        }
        else
        {
            if (string.IsNullOrWhiteSpace(request.ResponsavelNome))
                faltantes.Add("responsavelNome");
            if (string.IsNullOrWhiteSpace(request.ResponsavelSobrenome))
                faltantes.Add("responsavelSobrenome");
            if (SomenteDigitos(request.ResponsavelCpf ?? d.ResponsavelCpfCnpj).Length != 11)
                faltantes.Add("responsavelCpf");
            if (SomenteDigitos(request.ResponsavelTelefone ?? d.ResponsavelTelefone).Length < 10)
                faltantes.Add("responsavelTelefone");
            if (string.IsNullOrWhiteSpace(request.ResponsavelCep))
                faltantes.Add("responsavelCep");
            if (string.IsNullOrWhiteSpace(request.ResponsavelTipoLogradouro))
                faltantes.Add("responsavelTipoLogradouro");
            if (string.IsNullOrWhiteSpace(request.ResponsavelLogradouro))
                faltantes.Add("responsavelLogradouro");
            if (string.IsNullOrWhiteSpace(request.ResponsavelNumero))
                faltantes.Add("responsavelNumero");
            if (string.IsNullOrWhiteSpace(request.ResponsavelBairro))
                faltantes.Add("responsavelBairro");
            if (string.IsNullOrWhiteSpace(request.ResponsavelMunicipio))
                faltantes.Add("responsavelMunicipio");
        }

        return faltantes;
    }

    private static CriarAlunoRequest MontarCriarAlunoRequest(
        Domain.ReadModels.PreAlunoDetalheItem d,
        AprovarPreAlunoRequest request,
        bool eProprio)
    {
        var respPartes = d.ResponsavelNomeCompleto.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        var respNome = respPartes.Length > 0 ? respPartes[0] : d.ResponsavelNomeCompleto;
        var respSobrenome = respPartes.Length > 1 ? respPartes[1] : "";

        var cep = request.Cep.Trim();
        var tipoLog = request.TipoLogradouro.Trim();
        var log = request.Logradouro.Trim();
        var numero = request.Numero.Trim();
        var bairro = request.Bairro.Trim();
        var municipio = request.Municipio.Trim();

        if (d.UsaTransporteVan)
        {
            if (string.IsNullOrWhiteSpace(cep))
                cep = SomenteDigitos(d.TransporteCep);
            if (string.IsNullOrWhiteSpace(tipoLog))
                tipoLog = "Rua";
            if (string.IsNullOrWhiteSpace(log))
                log = d.TransporteLogradouro?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(numero))
                numero = d.TransporteNumero?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(bairro))
                bairro = d.TransporteBairro?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(municipio))
                municipio = d.TransporteCidade?.Trim() ?? string.Empty;
        }

        return new CriarAlunoRequest
        {
            EProprioResponsavel = eProprio,
            Nome = d.NomeAluno,
            Sobrenome = d.SobrenomeAluno,
            Sexo = request.Sexo.Trim(),
            DataNascimento = d.DataNascimentoAluno,
            DataIngresso = request.DataIngresso,
            Cpf = eProprio ? SomenteDigitos(request.Cpf ?? d.AlunoCpf) : null,
            Cep = cep,
            TipoLogradouro = tipoLog,
            Logradouro = log,
            Numero = numero,
            Complemento = string.IsNullOrWhiteSpace(request.Complemento)
                ? d.TransporteComplemento
                : request.Complemento.Trim(),
            Bairro = bairro,
            Municipio = municipio,
            AlunoTelefone = request.AlunoTelefone ?? d.TelefoneAluno,
            ResponsavelNome = eProprio ? null : (request.ResponsavelNome?.Trim() ?? respNome),
            ResponsavelSobrenome = eProprio ? null : (request.ResponsavelSobrenome?.Trim() ?? respSobrenome),
            ResponsavelCpf = eProprio ? null : SomenteDigitos(request.ResponsavelCpf ?? d.ResponsavelCpfCnpj),
            ResponsavelSexo = eProprio ? null : request.ResponsavelSexo,
            ResponsavelTelefone = eProprio ? null : (request.ResponsavelTelefone ?? d.ResponsavelTelefone),
            ResponsavelCep = eProprio ? null : (request.ResponsavelCep?.Trim() ?? cep),
            ResponsavelTipoLogradouro = eProprio ? null : (request.ResponsavelTipoLogradouro?.Trim() ?? tipoLog),
            ResponsavelLogradouro = eProprio ? null : (request.ResponsavelLogradouro?.Trim() ?? log),
            ResponsavelNumero = eProprio ? null : (request.ResponsavelNumero?.Trim() ?? numero),
            ResponsavelComplemento = eProprio ? null : (request.ResponsavelComplemento ?? request.Complemento),
            ResponsavelBairro = eProprio ? null : (request.ResponsavelBairro?.Trim() ?? bairro),
            ResponsavelMunicipio = eProprio ? null : (request.ResponsavelMunicipio?.Trim() ?? municipio),
            CorRaca = string.IsNullOrWhiteSpace(request.CorRaca) ? null : request.CorRaca.Trim(),
            EstadoCivil = string.IsNullOrWhiteSpace(request.EstadoCivil) ? null : request.EstadoCivil.Trim(),
            Profissao = string.IsNullOrWhiteSpace(request.Profissao) ? null : request.Profissao.Trim(),
            RegistroEscolar = string.IsNullOrWhiteSpace(request.RegistroEscolar) ? null : request.RegistroEscolar.Trim(),
            Nacionalidade = string.IsNullOrWhiteSpace(request.Nacionalidade) ? null : request.Nacionalidade.Trim(),
            DataEntradaPais = request.DataEntradaPais,
            NaturalidadeCidade = string.IsNullOrWhiteSpace(request.NaturalidadeCidade)
                ? null
                : request.NaturalidadeCidade.Trim(),
            NaturalidadeEstado = string.IsNullOrWhiteSpace(request.NaturalidadeEstado)
                ? null
                : request.NaturalidadeEstado.Trim().ToUpperInvariant(),
            RgNumero = string.IsNullOrWhiteSpace(request.RgNumero) ? null : request.RgNumero.Trim(),
            RgExpedicao = request.RgExpedicao,
            RgOrgao = string.IsNullOrWhiteSpace(request.RgOrgao) ? null : request.RgOrgao.Trim(),
        };
    }
}
