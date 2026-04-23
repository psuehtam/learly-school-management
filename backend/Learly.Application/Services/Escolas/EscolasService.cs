using Learly.Application.Contracts.Escolas;
using Learly.Application.Contracts.Escolas.Requests;
using Learly.Application.Contracts.Escolas.Responses;
using Learly.Application.Services.Common;
using Learly.Domain.Entities;
using Learly.Domain.Interfaces.Persistence;
using Learly.Domain.Interfaces.Repositories;
using MapsterMapper;

namespace Learly.Application.Services.Escolas;

public sealed class EscolasService : IEscolasService
{
    private const string AdminPerfilNome = "Administrador";
    private const string PermissaoExcluirDasPadroesAdmin = "GERENCIAR_ESCOLAS";

    private readonly IEscolaRepository _escolas;
    private readonly IUsuarioRepository _usuarios;
    private readonly IPerfilRepository _perfis;
    private readonly IPermissaoRepository _permissoes;
    private readonly IPerfilPermissaoRepository _perfilPermissoes;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public EscolasService(
        IEscolaRepository escolas,
        IUsuarioRepository usuarios,
        IPerfilRepository perfis,
        IPermissaoRepository permissoes,
        IPerfilPermissaoRepository perfilPermissoes,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _escolas = escolas;
        _usuarios = usuarios;
        _perfis = perfis;
        _permissoes = permissoes;
        _perfilPermissoes = perfilPermissoes;
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

        var perfilAdmin = new Perfil
        {
            EscolaId = entidade.Id,
            Nome = AdminPerfilNome,
            Status = Perfil.Estados.Ativo
        };
        _perfis.Adicionar(perfilAdmin);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var permissoesPadraoAdmin = await _permissoes.ObterIdsOndeNomeDiferenteDeAsync(
            PermissaoExcluirDasPadroesAdmin,
            cancellationToken);
        if (permissoesPadraoAdmin.Count > 0)
        {
            var vinculos = permissoesPadraoAdmin.Select(permissaoId => new PerfilPermissao
            {
                PerfilId = perfilAdmin.Id,
                PermissaoId = permissaoId
            });
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
