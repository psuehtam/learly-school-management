using Learly.Application.Contracts.Escolas;
using Learly.Application.Contracts.Escolas.Requests;
using Learly.Application.Contracts.Escolas.Responses;
using Learly.Application.Services.Common;
using Learly.Domain.Entities;
using Learly.Domain.Exceptions;
using Learly.Domain.Interfaces.Persistence;
using Learly.Domain.Interfaces.Repositories;
using Learly.Domain.Interfaces.Services;
using MapsterMapper;

namespace Learly.Application.Services.Escolas;

public sealed class EscolasService : IEscolasService
{
    private const string AdminPerfilNome = "Administrador";
    private const string PermissaoExcluirDasPadroesAdmin = "GERENCIAR_ESCOLAS";
    private static readonly string[] PerfisPadrao = ["Administrador", "Professor", "Comercial", "Secretaria", "Financeiro", "Coordenador"];
    private static readonly HashSet<string> ExtensoesLogoPermitidas = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };
    private const long TamanhoMaximoLogoBytes = 2 * 1024 * 1024;

    private readonly IEscolaRepository _escolas;
    private readonly IUsuarioRepository _usuarios;
    private readonly IPerfilRepository _perfis;
    private readonly IPermissaoRepository _permissoes;
    private readonly IPerfilPermissaoRepository _perfilPermissoes;
    private readonly ITemplatePermissoesRepository _templatePermissoes;
    private readonly IArquivoStorageService _arquivoStorage;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public EscolasService(
        IEscolaRepository escolas,
        IUsuarioRepository usuarios,
        IPerfilRepository perfis,
        IPermissaoRepository permissoes,
        IPerfilPermissaoRepository perfilPermissoes,
        ITemplatePermissoesRepository templatePermissoes,
        IArquivoStorageService arquivoStorage,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _escolas = escolas;
        _usuarios = usuarios;
        _perfis = perfis;
        _permissoes = permissoes;
        _perfilPermissoes = perfilPermissoes;
        _templatePermissoes = templatePermissoes;
        _arquivoStorage = arquivoStorage;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<EscolasListagemResultado> ListarAsync(
        AppUserContext userContext,
        CancellationToken cancellationToken = default)
    {
        if (!userContext.IsSuperAdmin && string.IsNullOrWhiteSpace(userContext.CodigoEscola))
        {
            return new EscolasListagemResultado([], ContextoTenantInvalido: true);
        }

        IReadOnlyList<Escola> entidades = userContext.IsSuperAdmin
            ? await _escolas.ListarAtivasNaoSistemaOrdenadasPorCodigoAsync(cancellationToken)
            : await _escolas.ListarAtivasPorCodigoEscolaAsync(userContext.CodigoEscola!, cancellationToken);

        var itens = entidades.Select(e => _mapper.Map<EscolaListItemResponse>(e)).ToList();
        return new EscolasListagemResultado(itens, ContextoTenantInvalido: false);
    }

    public async Task<EscolaCriacaoResultado> CriarAsync(CriarEscolaRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.CodigoEscola) || string.IsNullOrWhiteSpace(request.NomeFantasia))
        {
            return new EscolaCriacaoResultado(false, null, "CodigoEscola e NomeFantasia sao obrigatorios.", EscolaCriacaoFalha.Validacao);
        }

        if (string.IsNullOrWhiteSpace(request.AdminEmail) || string.IsNullOrWhiteSpace(request.AdminPassword))
        {
            return new EscolaCriacaoResultado(false, null, "AdminEmail e AdminPassword sao obrigatorios.", EscolaCriacaoFalha.Validacao);
        }

        if (!SenhaValida(request.AdminPassword))
        {
            return new EscolaCriacaoResultado(false, null, "AdminPassword deve ter ao menos 8 caracteres, com letra maiuscula, minuscula e numero.", EscolaCriacaoFalha.Validacao);
        }

        var codigo = request.CodigoEscola.Trim().ToUpperInvariant();
        if (string.Equals(codigo, "SYSTEM", StringComparison.OrdinalIgnoreCase))
        {
            return new EscolaCriacaoResultado(false, null, "Codigo reservado ao sistema.", EscolaCriacaoFalha.CodigoReservado);
        }

        if (await _escolas.ExisteComCodigoAsync(codigo, cancellationToken))
        {
            return new EscolaCriacaoResultado(false, null, "Ja existe escola com este codigo.", EscolaCriacaoFalha.CodigoDuplicado);
        }

        var adminEmail = request.AdminEmail.Trim().ToLowerInvariant();
        if (await _usuarios.ExisteComEmailAsync(adminEmail, cancellationToken))
        {
            return new EscolaCriacaoResultado(false, null, "Ja existe usuario com este email.", EscolaCriacaoFalha.EmailDuplicado);
        }

        Escola? entidade = null;
        await _unitOfWork.ExecuteInTransactionAsync(
            async () =>
            {
                entidade = await CriarEscolaEUsuarioAdminAsync(request, codigo, adminEmail, cancellationToken);
            },
            cancellationToken);

        if (entidade is null)
        {
            return new EscolaCriacaoResultado(false, null, "Falha ao criar escola.", EscolaCriacaoFalha.ErroInterno);
        }

        var dto = _mapper.Map<EscolaListItemResponse>(entidade);
        return new EscolaCriacaoResultado(true, dto, null, EscolaCriacaoFalha.Nenhuma);
    }

    public async Task<MinhaEscolaConsultaResultado> ObterMinhaEscolaAsync(
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var escola = await ObterEscolaRastreadaDoUsuarioAsync(uc, cancellationToken);
        if (escola is null)
        {
            return new MinhaEscolaConsultaResultado(false, null, "Acesso negado.", MinhaEscolaFalha.AcessoNegado);
        }

        return new MinhaEscolaConsultaResultado(true, MapearMinhaEscola(escola), null, MinhaEscolaFalha.Nenhuma);
    }

    public async Task<MinhaEscolaAtualizacaoResultado> AtualizarMinhaEscolaAsync(
        AtualizarMinhaEscolaRequest request,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var escola = await ObterEscolaRastreadaDoUsuarioAsync(uc, cancellationToken);
        if (escola is null)
        {
            return new MinhaEscolaAtualizacaoResultado(false, null, "Acesso negado.", MinhaEscolaFalha.AcessoNegado);
        }

        if (string.IsNullOrWhiteSpace(request.NomeFantasia))
        {
            return new MinhaEscolaAtualizacaoResultado(false, null, "Nome fantasia e obrigatorio.", MinhaEscolaFalha.Validacao);
        }

        try
        {
            escola.AlterarDadosCadastrais(
                request.NomeFantasia.Trim(),
                request.RazaoSocial,
                request.Cnpj);
            escola.AlterarEndereco(
                request.Cep,
                request.Logradouro,
                request.Numero,
                request.Complemento,
                request.Bairro,
                request.Cidade,
                request.Uf);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (DomainException ex)
        {
            return new MinhaEscolaAtualizacaoResultado(false, null, ex.Message, MinhaEscolaFalha.Validacao);
        }

        return new MinhaEscolaAtualizacaoResultado(true, MapearMinhaEscola(escola), null, MinhaEscolaFalha.Nenhuma);
    }

    public async Task<EscolaConfiguracoesConsultaResultado> ObterConfiguracoesAsync(
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterEscolaIdDoUsuarioAsync(uc, cancellationToken);
        if (!escolaId.HasValue)
        {
            return new EscolaConfiguracoesConsultaResultado(false, null, "Acesso negado.", MinhaEscolaFalha.AcessoNegado);
        }

        var escola = await _escolas.ObterPorIdAsync(escolaId.Value, cancellationToken);
        if (escola is null)
        {
            return new EscolaConfiguracoesConsultaResultado(false, null, "Escola nao encontrada.", MinhaEscolaFalha.NaoEncontrado);
        }

        return new EscolaConfiguracoesConsultaResultado(
            true,
            MapearConfiguracoes(escola),
            null,
            MinhaEscolaFalha.Nenhuma);
    }

    public async Task<EscolaConfiguracoesAtualizacaoResultado> AtualizarConfiguracoesAsync(
        AtualizarEscolaConfiguracoesRequest request,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var escola = await ObterEscolaRastreadaDoUsuarioAsync(uc, cancellationToken);
        if (escola is null)
        {
            return new EscolaConfiguracoesAtualizacaoResultado(false, null, "Acesso negado.", MinhaEscolaFalha.AcessoNegado);
        }

        try
        {
            escola.AlterarConfiguracoesTurma(request.MinAlunosTurma, request.MaxAlunosTurma);
            escola.AlterarConfiguracoesAula(request.MetricaAula, request.DuracaoAulaMinutos);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (DomainException ex)
        {
            return new EscolaConfiguracoesAtualizacaoResultado(false, null, ex.Message, MinhaEscolaFalha.Validacao);
        }

        return new EscolaConfiguracoesAtualizacaoResultado(
            true,
            MapearConfiguracoes(escola),
            null,
            MinhaEscolaFalha.Nenhuma);
    }

    public async Task<EscolaLogoUploadResultado> EnviarLogoAsync(
        Stream conteudo,
        string nomeArquivo,
        string contentType,
        long tamanhoBytes,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var escola = await ObterEscolaRastreadaDoUsuarioAsync(uc, cancellationToken);
        if (escola is null)
        {
            return new EscolaLogoUploadResultado(false, "Acesso negado.", MinhaEscolaFalha.AcessoNegado);
        }

        if (tamanhoBytes <= 0 || tamanhoBytes > TamanhoMaximoLogoBytes)
        {
            return new EscolaLogoUploadResultado(false, "Logo deve ter entre 1 byte e 2 MB.", MinhaEscolaFalha.Validacao);
        }

        var ext = Path.GetExtension(nomeArquivo);
        if (string.IsNullOrWhiteSpace(ext) || !ExtensoesLogoPermitidas.Contains(ext))
        {
            return new EscolaLogoUploadResultado(false, "Formato nao permitido. Use JPG, PNG ou WEBP.", MinhaEscolaFalha.Validacao);
        }

        var caminhoRelativo = $"escolas/{escola.Id}/logo{ext.ToLowerInvariant()}";
        if (!string.IsNullOrWhiteSpace(escola.LogoCaminho))
        {
            await _arquivoStorage.RemoverAsync(escola.LogoCaminho, cancellationToken);
        }

        await _arquivoStorage.SalvarAsync(caminhoRelativo, conteudo, cancellationToken);
        escola.DefinirLogo(caminhoRelativo);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new EscolaLogoUploadResultado(true, null, MinhaEscolaFalha.Nenhuma);
    }

    public async Task<EscolaLogoArquivoResultado> ObterLogoAsync(
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterEscolaIdDoUsuarioAsync(uc, cancellationToken);
        if (!escolaId.HasValue)
        {
            return new EscolaLogoArquivoResultado(false, null, null, "Acesso negado.", MinhaEscolaFalha.AcessoNegado);
        }

        var escola = await _escolas.ObterPorIdAsync(escolaId.Value, cancellationToken);
        if (escola is null || string.IsNullOrWhiteSpace(escola.LogoCaminho))
        {
            return new EscolaLogoArquivoResultado(false, null, null, "Logo nao encontrada.", MinhaEscolaFalha.NaoEncontrado);
        }

        var stream = await _arquivoStorage.AbrirLeituraAsync(escola.LogoCaminho, cancellationToken);
        if (stream is null)
        {
            return new EscolaLogoArquivoResultado(false, null, null, "Logo nao encontrada.", MinhaEscolaFalha.NaoEncontrado);
        }

        var contentType = ResolverContentTypeLogo(escola.LogoCaminho);
        return new EscolaLogoArquivoResultado(true, stream, contentType, null, MinhaEscolaFalha.Nenhuma);
    }

    private async Task<int?> ObterEscolaIdDoUsuarioAsync(AppUserContext uc, CancellationToken ct)
    {
        if (uc.IsSuperAdmin || string.IsNullOrWhiteSpace(uc.CodigoEscola))
            return null;

        return await _escolas.ObterIdAtivaPorCodigoEscolaAsync(uc.CodigoEscola, ct);
    }

    private async Task<Escola?> ObterEscolaRastreadaDoUsuarioAsync(AppUserContext uc, CancellationToken ct)
    {
        var escolaId = await ObterEscolaIdDoUsuarioAsync(uc, ct);
        if (!escolaId.HasValue)
            return null;

        return await _escolas.ObterRastreadaPorIdAsync(escolaId.Value, ct);
    }

    private static MinhaEscolaResponse MapearMinhaEscola(Escola escola) =>
        new(
            escola.Id,
            escola.CodigoEscola,
            escola.NomeFantasia,
            escola.RazaoSocial,
            escola.Cnpj,
            escola.Cep,
            escola.Logradouro,
            escola.Numero,
            escola.Complemento,
            escola.Bairro,
            escola.Cidade,
            escola.Uf,
            !string.IsNullOrWhiteSpace(escola.LogoCaminho));

    private static EscolaConfiguracoesResponse MapearConfiguracoes(Escola escola) =>
        new(escola.MinAlunosTurma, escola.MaxAlunosTurma, escola.MetricaAula, escola.DuracaoAulaMinutos);

    private static string ResolverContentTypeLogo(string caminho)
    {
        var ext = Path.GetExtension(caminho).ToLowerInvariant();
        return ext switch
        {
            ".png" => "image/png",
            ".webp" => "image/webp",
            ".jpg" or ".jpeg" => "image/jpeg",
            _ => "application/octet-stream"
        };
    }

    private async Task<Escola> CriarEscolaEUsuarioAdminAsync(
        CriarEscolaRequest request,
        string codigoEscola,
        string adminEmail,
        CancellationToken cancellationToken)
    {
        var entidade = new Escola
        {
            CodigoEscola = codigoEscola,
            NomeFantasia = request.NomeFantasia.Trim(),
            RazaoSocial = string.IsNullOrWhiteSpace(request.RazaoSocial) ? null : request.RazaoSocial.Trim(),
            Cnpj = string.IsNullOrWhiteSpace(request.Cnpj) ? null : request.Cnpj.Trim(),
            Status = Escola.Estados.Ativo
        };

        _escolas.Adicionar(entidade);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var perfisCriados = PerfisPadrao.Select(nome => new Perfil
        {
            EscolaId = entidade.Id,
            Nome = nome,
            Status = Perfil.Estados.Ativo
        }).ToList();
        foreach (var perfil in perfisCriados)
        {
            _perfis.Adicionar(perfil);
        }
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        var perfilAdmin = perfisCriados.First(p => string.Equals(p.Nome, AdminPerfilNome, StringComparison.OrdinalIgnoreCase));

        var permissoesPorPerfil = await _templatePermissoes.ObterPermissoesDeTemplateAsync(cancellationToken);
        var nomesPermissaoNecessarias = permissoesPorPerfil.Values
            .SelectMany(x => x)
            .Append("GERENCIAR_ESCOLAS")
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        var permissaoIdPorNome = await _permissoes.ObterIdsPorNomesAsync(nomesPermissaoNecessarias, cancellationToken);
        if (permissaoIdPorNome.Count > 0)
        {
            var vinculos = new List<PerfilPermissao>();
            foreach (var perfil in perfisCriados)
            {
                if (!permissoesPorPerfil.TryGetValue(perfil.Nome, out var nomesPerfil))
                {
                    continue;
                }

                foreach (var nomePermissao in nomesPerfil)
                {
                    if (!permissaoIdPorNome.TryGetValue(nomePermissao, out var permissaoId))
                    {
                        continue;
                    }

                    vinculos.Add(new PerfilPermissao
                    {
                        PerfilId = perfil.Id,
                        PermissaoId = permissaoId
                    });
                }
            }

            // Mantém super-admin fora do escopo padrão dos tenants.
            if (permissaoIdPorNome.TryGetValue(PermissaoExcluirDasPadroesAdmin, out var gerenciarEscolasId))
            {
                vinculos.RemoveAll(v => v.PermissaoId == gerenciarEscolasId);
            }

            _perfilPermissoes.AdicionarVarios(vinculos);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        var adminNome = string.IsNullOrWhiteSpace(request.AdminNomeCompleto)
            ? $"Administrador {entidade.NomeFantasia}"
            : request.AdminNomeCompleto.Trim();
        var admin = new Usuario
        {
            EscolaId = entidade.Id,
            PerfilId = perfilAdmin.Id,
            NomeCompleto = adminNome,
            Email = adminEmail,
            Senha = BCrypt.Net.BCrypt.HashPassword(request.AdminPassword),
            Status = Usuario.Estados.Ativo
        };
        _usuarios.Adicionar(admin);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return entidade;
    }

    private static bool SenhaValida(string password)
    {
        if (password.Length < 8) return false;

        var hasUpper = password.Any(char.IsUpper);
        var hasLower = password.Any(char.IsLower);
        var hasDigit = password.Any(char.IsDigit);
        return hasUpper && hasLower && hasDigit;
    }
}
