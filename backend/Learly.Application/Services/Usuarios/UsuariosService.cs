using Learly.Application.Contracts.Usuarios.Requests;
using Learly.Application.Contracts.Usuarios.Responses;
using Learly.Application.Services.Common;
using Learly.Domain.Entities;
using Learly.Domain.Exceptions;
using Learly.Domain.Interfaces.Persistence;
using Learly.Domain.Interfaces.Repositories;

namespace Learly.Application.Services.Usuarios;

public sealed class UsuariosService : IUsuariosService
{
    private static readonly string[] PerfisPadraoCadastro = ["Administrador", "Professor", "Comercial", "Secretaria", "Financeiro", "Coordenador"];
    private static readonly IReadOnlyDictionary<string, string[]> PermissoesPadraoPorPerfil =
        new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            ["Administrador"] =
            [
                "CRIAR_USUARIO", "VISUALIZAR_USUARIO", "EDITAR_USUARIO", "INATIVAR_USUARIO",
                "GERENCIAR_PERMISSOES_USUARIO", "VISUALIZAR_TURMA", "VISUALIZAR_AULA",
                "VISUALIZAR_MATRICULA", "VISUALIZAR_PRE_ALUNO", "VISUALIZAR_PARCELA",
                "VISUALIZAR_ALUNO", "VISUALIZAR_REPOSICAO", "VISUALIZAR_LIVRO",
                "VISUALIZAR_CALENDARIO", "VISUALIZAR_DASHBOARD_GERAL", "VISUALIZAR_AGENDA_GLOBAL",
            ],
            ["Professor"] = ["VISUALIZAR_AULA", "VISUALIZAR_TURMA", "VISUALIZAR_CALENDARIO", "VISUALIZAR_COMPROMISSOS"],
            ["Comercial"] = ["VISUALIZAR_PRE_ALUNO", "CRIAR_PRE_ALUNO", "VISUALIZAR_COMPROMISSOS", "CRIAR_COMPROMISSO"],
            ["Secretaria"] = ["VISUALIZAR_MATRICULA", "CRIAR_MATRICULA", "VISUALIZAR_ALUNO", "VISUALIZAR_COMPROMISSOS"],
            ["Financeiro"] = ["VISUALIZAR_PARCELA", "VISUALIZAR_MOVIMENTACAO_FINANCEIRA", "VISUALIZAR_COMPROMISSOS"],
            ["Coordenador"] = ["VISUALIZAR_TURMA", "VISUALIZAR_AULA", "VISUALIZAR_REPOSICAO", "VISUALIZAR_DASHBOARD_GERAL", "VISUALIZAR_COMPROMISSOS"],
        };

    private readonly IEscolaRepository _escolas;
    private readonly IPerfilRepository _perfis;
    private readonly IPermissaoRepository _permissoes;
    private readonly IPerfilPermissaoRepository _perfilPermissoes;
    private readonly IUsuarioRepository _usuarios;
    private readonly IUnitOfWork _unitOfWork;

    public UsuariosService(
        IEscolaRepository escolas,
        IPerfilRepository perfis,
        IPermissaoRepository permissoes,
        IPerfilPermissaoRepository perfilPermissoes,
        IUsuarioRepository usuarios,
        IUnitOfWork unitOfWork)
    {
        _escolas = escolas;
        _perfis = perfis;
        _permissoes = permissoes;
        _perfilPermissoes = perfilPermissoes;
        _usuarios = usuarios;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<UsuarioMinhaEscolaListItemResponse>> ListarMinhaEscolaAsync(
        AppUserContext userContext,
        CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterEscolaIdDoContextoAsync(userContext, cancellationToken);
        var usuarios = await _usuarios.ListarPorEscolaAsync(escolaId, cancellationToken);
        var perfis = await _perfis.ListarPorEscolaAsync(escolaId, cancellationToken);
        var perfilPorId = perfis.ToDictionary(p => p.Id, p => p.Nome);

        return usuarios
            .Select(u => new UsuarioMinhaEscolaListItemResponse(
                u.Id,
                u.NomeCompleto,
                u.Email,
                u.PerfilId,
                perfilPorId.GetValueOrDefault(u.PerfilId, "Perfil nao encontrado"),
                u.Status))
            .ToList();
    }

    public async Task<IReadOnlyList<PerfilMinhaEscolaListItemResponse>> ListarPerfisMinhaEscolaAsync(
        AppUserContext userContext,
        CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterEscolaIdDoContextoAsync(userContext, cancellationToken);
        await GarantirPerfisPadraoDaEscolaAsync(escolaId, cancellationToken);
        await GarantirPermissoesPadraoDosPerfisAsync(escolaId, cancellationToken);
        var perfis = await _perfis.ListarPorEscolaAsync(escolaId, cancellationToken);

        return perfis
            .Where(p => string.Equals(p.Status, Perfil.Estados.Ativo, StringComparison.OrdinalIgnoreCase))
            .Select(p => new PerfilMinhaEscolaListItemResponse(p.Id, p.Nome, p.Status))
            .ToList();
    }

    private async Task GarantirPerfisPadraoDaEscolaAsync(int escolaId, CancellationToken cancellationToken)
    {
        var perfis = await _perfis.ListarPorEscolaAsync(escolaId, cancellationToken);
        var nomesExistentes = perfis
            .Select(p => p.Nome)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var faltantes = PerfisPadraoCadastro
            .Where(nome => !nomesExistentes.Contains(nome))
            .ToList();

        if (faltantes.Count == 0)
        {
            return;
        }

        foreach (var nome in faltantes)
        {
            _perfis.Adicionar(new Perfil
            {
                EscolaId = escolaId,
                Nome = nome,
                Status = Perfil.Estados.Ativo
            });
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task GarantirPermissoesPadraoDosPerfisAsync(int escolaId, CancellationToken cancellationToken)
    {
        var perfis = await _perfis.ListarPorEscolaAsync(escolaId, cancellationToken);
        if (perfis.Count == 0)
        {
            return;
        }

        var nomesPermissaoNecessarias = PermissoesPadraoPorPerfil.Values
            .SelectMany(x => x)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        var permissaoIdPorNome = await _permissoes.ObterIdsPorNomesAsync(nomesPermissaoNecessarias, cancellationToken);
        if (permissaoIdPorNome.Count == 0)
        {
            return;
        }

        var perfilIdPorNome = perfis.ToDictionary(p => p.Nome, p => p.Id, StringComparer.OrdinalIgnoreCase);
        foreach (var (perfilNome, nomesPermissao) in PermissoesPadraoPorPerfil)
        {
            if (!perfilIdPorNome.TryGetValue(perfilNome, out var perfilId))
            {
                continue;
            }

            foreach (var nomePermissao in nomesPermissao)
            {
                if (!permissaoIdPorNome.TryGetValue(nomePermissao, out var permissaoId))
                {
                    continue;
                }

                _perfilPermissoes.Adicionar(new PerfilPermissao
                {
                    PerfilId = perfilId,
                    PermissaoId = permissaoId
                });
            }
        }

        try
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex) when (ex.InnerException?.Message.Contains("Duplicate", StringComparison.OrdinalIgnoreCase) == true
            || ex.Message.Contains("duplicate", StringComparison.OrdinalIgnoreCase))
        {
            // Ignora conflitos de chave única ao inserir vínculos já existentes.
        }
    }

    public async Task<CriarUsuarioResponse> CriarParaMinhaEscolaAsync(
        AppUserContext userContext,
        CriarUsuarioParaMinhaEscolaRequest request,
        CancellationToken cancellationToken = default)
    {
        if (userContext.IsSuperAdmin)
            throw new DomainException("Super administrador nao pode usar este fluxo; escola vem do contexto do usuario da escola.");

        if (string.IsNullOrWhiteSpace(userContext.CodigoEscola))
            throw new DomainException("Usuario sem escola vinculada no contexto.");

        if (string.IsNullOrWhiteSpace(request.NomeCompleto) || string.IsNullOrWhiteSpace(request.Email)
            || string.IsNullOrWhiteSpace(request.Senha))
            throw new DomainException("NomeCompleto, Email e Senha sao obrigatorios.");

        if (request.PerfilId <= 0)
            throw new DomainException("PerfilId invalido.");

        if (!SenhaEmTextoPlanoValida(request.Senha))
            throw new DomainException("Senha deve ter ao menos 8 caracteres, com letra maiuscula, minuscula e numero.");

        var escolaId = await ObterEscolaIdDoContextoAsync(userContext, cancellationToken);

        CriarUsuarioResponse? resultado = null;
        await _unitOfWork.ExecuteInTransactionAsync(
            async () =>
            {
                var perfil = await _perfis.ObterPorIdEEscolaAsync(request.PerfilId, escolaId, cancellationToken)
                    .ConfigureAwait(false);
                if (perfil is null)
                    throw new DomainException("Perfil nao pertence a esta escola ou nao existe.");

                if (!string.Equals(perfil.Status, Perfil.Estados.Ativo, StringComparison.OrdinalIgnoreCase))
                    throw new DomainException("Perfil deve estar ativo para vincular a um novo usuario.");

                var emailNormalizado = request.Email.Trim().ToLowerInvariant();
                if (await _usuarios.ExisteComEmailAsync(emailNormalizado, cancellationToken).ConfigureAwait(false))
                    throw new DomainException("Ja existe usuario com este email.");

                var hash = BCrypt.Net.BCrypt.HashPassword(request.Senha);
                var usuario = Usuario.CriarNovo(
                    escolaId,
                    request.PerfilId,
                    request.NomeCompleto.Trim(),
                    emailNormalizado,
                    hash);

                _usuarios.Adicionar(usuario);
                await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
                resultado = new CriarUsuarioResponse(usuario.Id);
            },
            cancellationToken).ConfigureAwait(false);

        return resultado!;
    }

    public async Task EditarDaMinhaEscolaAsync(
        int usuarioId,
        AppUserContext userContext,
        EditarUsuarioMinhaEscolaRequest request,
        CancellationToken cancellationToken = default)
    {
        if (usuarioId <= 0)
            throw new DomainException("UsuarioId invalido.");

        if (string.IsNullOrWhiteSpace(request.NomeCompleto) || string.IsNullOrWhiteSpace(request.Email))
            throw new DomainException("NomeCompleto e Email sao obrigatorios.");

        if (request.PerfilId <= 0)
            throw new DomainException("PerfilId invalido.");

        if (!string.Equals(request.Status, Usuario.Estados.Ativo, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(request.Status, Usuario.Estados.Inativo, StringComparison.OrdinalIgnoreCase))
        {
            throw new DomainException("Status deve ser Ativo ou Inativo.");
        }

        var escolaId = await ObterEscolaIdDoContextoAsync(userContext, cancellationToken);

        await _unitOfWork.ExecuteInTransactionAsync(
            async () =>
            {
                var usuario = await _usuarios.ObterPorIdEEscolaAsync(usuarioId, escolaId, cancellationToken);
                if (usuario is null)
                    throw new DomainException("Usuario nao encontrado na escola do contexto.");

                var perfil = await _perfis.ObterPorIdEEscolaAsync(request.PerfilId, escolaId, cancellationToken);
                if (perfil is null || !string.Equals(perfil.Status, Perfil.Estados.Ativo, StringComparison.OrdinalIgnoreCase))
                    throw new DomainException("Perfil invalido para esta escola.");

                var emailNormalizado = request.Email.Trim().ToLowerInvariant();
                var emailDuplicado = await _usuarios.ExisteComEmailExcetoIdAsync(emailNormalizado, usuario.Id, cancellationToken);
                if (emailDuplicado)
                    throw new DomainException("Ja existe usuario com este email.");

                usuario.AlterarIdentificacao(request.NomeCompleto.Trim(), emailNormalizado);
                usuario.AlterarPerfil(request.PerfilId);
                if (string.Equals(request.Status, Usuario.Estados.Inativo, StringComparison.OrdinalIgnoreCase))
                {
                    usuario.Desativar();
                }
                else
                {
                    usuario.Reativar();
                }

                await _unitOfWork.SaveChangesAsync(cancellationToken);
            },
            cancellationToken);
    }

    private async Task<int> ObterEscolaIdDoContextoAsync(
        AppUserContext userContext,
        CancellationToken cancellationToken)
    {
        if (userContext.IsSuperAdmin)
            throw new DomainException("Super administrador nao pode usar este fluxo; escola vem do contexto do usuario da escola.");

        if (string.IsNullOrWhiteSpace(userContext.CodigoEscola))
            throw new DomainException("Usuario sem escola vinculada no contexto.");

        var codigoEscola = userContext.CodigoEscola.Trim().ToUpperInvariant();
        var escolaId = await _escolas.ObterIdAtivaPorCodigoEscolaAsync(codigoEscola, cancellationToken);
        if (!escolaId.HasValue)
            throw new DomainException("Escola nao encontrada ou inativa para o codigo do contexto.");

        return escolaId.Value;
    }

    private static bool SenhaEmTextoPlanoValida(string password)
    {
        if (password.Length < 8) return false;

        var hasUpper = password.Any(char.IsUpper);
        var hasLower = password.Any(char.IsLower);
        var hasDigit = password.Any(char.IsDigit);
        return hasUpper && hasLower && hasDigit;
    }
}
