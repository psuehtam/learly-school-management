using Learly.Application.Contracts.Matriculas;
using Learly.Application.Contracts.Matriculas.Requests;
using Learly.Application.Contracts.Matriculas.Responses;
using Learly.Application.Services.Common;
using Learly.Application.Services.Escolas;
using Learly.Domain.Entities;
using Learly.Domain.Interfaces.Persistence;
using Learly.Domain.Interfaces.Repositories;
using Learly.Domain.ReadModels;
using MapsterMapper;

namespace Learly.Application.Services.Matriculas;

public sealed class MatriculasService : IMatriculasService
{
    private static readonly HashSet<string> StatusCancelaveis = new(StringComparer.OrdinalIgnoreCase)
    {
        Matricula.Estados.EmEspera,
        Matricula.Estados.Ativo,
        Matricula.Estados.Trancado
    };

    private readonly IMatriculaRepository _matriculas;
    private readonly IEscolaRepository _escolas;
    private readonly ITurmaRepository _turmas;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public MatriculasService(
        IMatriculaRepository matriculas,
        IEscolaRepository escolas,
        ITurmaRepository turmas,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _matriculas = matriculas;
        _escolas = escolas;
        _turmas = turmas;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<MatriculaListagemResultado> ListarAsync(
        ListarMatriculasQuery filtro,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterIdEscolaAtivaPorCodigoAsync(uc.CodigoEscola, cancellationToken);
        if (!escolaId.HasValue)
        {
            return new MatriculaListagemResultado(false, [], "Acesso negado.", MatriculaListagemFalha.AcessoNegado);
        }

        if (filtro.AlunoId is <= 0)
        {
            return new MatriculaListagemResultado(false, [], "AlunoId invalido.", MatriculaListagemFalha.Validacao);
        }

        if (filtro.TurmaId is <= 0)
        {
            return new MatriculaListagemResultado(false, [], "TurmaId invalido.", MatriculaListagemFalha.Validacao);
        }

        if (EhProfessor(uc) && !filtro.TurmaId.HasValue)
        {
            return new MatriculaListagemResultado(false, [], "Informe a turma.", MatriculaListagemFalha.Validacao);
        }

        IReadOnlyList<string>? statusesIn = null;
        string? statusNormalizado = null;

        var grupoNormalizado = filtro.Grupo?.Trim().ToLowerInvariant();
        if (grupoNormalizado == Matricula.Grupos.Inativos)
        {
            statusesIn = Matricula.Grupos.StatusInativos;
        }
        else if (!string.IsNullOrWhiteSpace(filtro.Status))
        {
            if (!Matricula.Estados.IsValid(filtro.Status))
            {
                return new MatriculaListagemResultado(false, [], "Status invalido.", MatriculaListagemFalha.Validacao);
            }

            statusNormalizado = Matricula.Estados.Normalize(filtro.Status);
        }

        if (filtro.TurmaId.HasValue)
        {
            var turma = await _turmas.ObterPorIdEEscolaAsync(filtro.TurmaId.Value, escolaId.Value, cancellationToken);
            if (turma is null)
            {
                return new MatriculaListagemResultado(false, [], "Turma nao encontrada nesta escola.", MatriculaListagemFalha.Validacao);
            }

            if (EhProfessor(uc) && turma.ProfessorId != uc.UserId)
            {
                return new MatriculaListagemResultado(false, [], "Turma nao encontrada nesta escola.", MatriculaListagemFalha.Validacao);
            }
        }

        if (filtro.AlunoId.HasValue)
        {
            var alunoOk = await _matriculas.ExisteAlunoNaEscolaAsync(filtro.AlunoId.Value, escolaId.Value, cancellationToken);
            if (!alunoOk)
            {
                return new MatriculaListagemResultado(false, [], "Aluno nao encontrado nesta escola.", MatriculaListagemFalha.Validacao);
            }
        }

        var entidades = await _matriculas.ListarPorEscolaComFiltrosAsync(
            escolaId.Value,
            statusNormalizado,
            filtro.AlunoId,
            filtro.TurmaId,
            statusesIn,
            cancellationToken);

        // Mapeamento explicito (Mapster com record + init-only pode omitir AlunoNomeCompleto na serializacao).
        var itens = entidades.Select(MapListItem).ToList();

        if (string.Equals(statusNormalizado, Matricula.Estados.EmEspera, StringComparison.Ordinal))
        {
            var alunosJaEnturmados = await _matriculas.ListarAlunoIdsComMatriculaAtivaEmTurmaAsync(
                escolaId.Value,
                cancellationToken);
            itens = itens
                .Where(m => m.TurmaId is null && !alunosJaEnturmados.Contains(m.AlunoId))
                .ToList();
        }

        return new MatriculaListagemResultado(true, itens, null, MatriculaListagemFalha.Nenhuma);
    }

    public async Task<MatriculaCriacaoResultado> CriarAsync(
        CriarMatriculaRequest request,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        var escolaId = await ObterIdEscolaAtivaPorCodigoAsync(uc.CodigoEscola, cancellationToken);
        if (!escolaId.HasValue)
        {
            return new MatriculaCriacaoResultado(false, null, "Acesso negado.", MatriculaCriacaoFalha.AcessoNegado);
        }

        if (request.AlunoId <= 0)
        {
            return new MatriculaCriacaoResultado(false, null, "AlunoId invalido.", MatriculaCriacaoFalha.Validacao);
        }

        if (request.DataMatricula == default)
        {
            return new MatriculaCriacaoResultado(false, null, "Data da matricula e obrigatoria.", MatriculaCriacaoFalha.Validacao);
        }

        var alunoExisteNaEscola = await _matriculas.ExisteAlunoNaEscolaAsync(request.AlunoId, escolaId.Value, cancellationToken);
        if (!alunoExisteNaEscola)
        {
            return new MatriculaCriacaoResultado(false, null, "Aluno nao encontrado nesta escola.", MatriculaCriacaoFalha.Validacao);
        }

        if (request.TurmaId.HasValue)
        {
            var turma = await _turmas.ObterPorIdEEscolaAsync(request.TurmaId.Value, escolaId.Value, cancellationToken);
            if (turma is null)
            {
                return new MatriculaCriacaoResultado(false, null, "Turma nao encontrada nesta escola.", MatriculaCriacaoFalha.Validacao);
            }

            var msgTurmaUnica = await ValidarUnicaTurmaAtivaAsync(
                escolaId.Value,
                request.AlunoId,
                ignorarMatriculaId: null,
                cancellationToken);
            if (msgTurmaUnica is not null)
            {
                return new MatriculaCriacaoResultado(false, null, msgTurmaUnica, MatriculaCriacaoFalha.Conflito);
            }
        }

        var existeDuplicidade = await _matriculas.ExisteDuplicidadeAsync(
            escolaId.Value,
            request.AlunoId,
            request.TurmaId,
            cancellationToken);

        if (existeDuplicidade)
        {
            return new MatriculaCriacaoResultado(false, null, "Ja existe matricula com os mesmos dados.", MatriculaCriacaoFalha.Conflito);
        }

        if (!request.TurmaId.HasValue)
        {
            var msgTurmaUnicaEspera = await ValidarUnicaTurmaAtivaAsync(
                escolaId.Value,
                request.AlunoId,
                ignorarMatriculaId: null,
                cancellationToken);
            if (msgTurmaUnicaEspera is not null)
            {
                return new MatriculaCriacaoResultado(false, null, msgTurmaUnicaEspera, MatriculaCriacaoFalha.Conflito);
            }

            var jaTemEmEspera = await _matriculas.ExisteMatriculaEmEsperaSemTurmaAsync(
                escolaId.Value,
                request.AlunoId,
                cancellationToken);

            if (jaTemEmEspera)
            {
                return new MatriculaCriacaoResultado(false, null, "Aluno ja possui matricula em espera sem turma definida.", MatriculaCriacaoFalha.Conflito);
            }
        }
        else
        {
            var emEspera = await _matriculas.ObterEmEsperaSemTurmaRastreadaAsync(
                escolaId.Value,
                request.AlunoId,
                cancellationToken);

            if (emEspera is not null)
            {
                var msgTurmaUnicaEspera = await ValidarUnicaTurmaAtivaAsync(
                    escolaId.Value,
                    request.AlunoId,
                    ignorarMatriculaId: emEspera.Id,
                    cancellationToken);
                if (msgTurmaUnicaEspera is not null)
                {
                    return new MatriculaCriacaoResultado(false, null, msgTurmaUnicaEspera, MatriculaCriacaoFalha.Conflito);
                }

                emEspera.TurmaId = request.TurmaId;
                emEspera.Status = Matricula.Estados.Ativo;
                emEspera.DataMatricula = request.DataMatricula;
                emEspera.DataAtualizacao = DateTime.UtcNow;
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                return new MatriculaCriacaoResultado(true, emEspera.Id, null, MatriculaCriacaoFalha.Nenhuma);
            }
        }

        var agoraUtc = DateTime.UtcNow;
        var entidade = new Matricula
        {
            EscolaId = escolaId.Value,
            AlunoId = request.AlunoId,
            TurmaId = request.TurmaId,
            DataMatricula = request.DataMatricula,
            Status = request.TurmaId.HasValue ? Matricula.Estados.Ativo : Matricula.Estados.EmEspera,
            DataCriacao = agoraUtc,
            DataAtualizacao = agoraUtc
        };

        _matriculas.Adicionar(entidade);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new MatriculaCriacaoResultado(true, entidade.Id, null, MatriculaCriacaoFalha.Nenhuma);
    }

    public async Task<MatriculaOperacaoResultado> CancelarAsync(
        int id,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        if (id <= 0)
        {
            return new MatriculaOperacaoResultado(false, "Id de matricula invalido.", 400);
        }

        var escolaId = await ObterIdEscolaAtivaPorCodigoAsync(uc.CodigoEscola, cancellationToken);
        if (!escolaId.HasValue)
        {
            return new MatriculaOperacaoResultado(false, "Acesso negado.", 403);
        }

        var matricula = await _matriculas.ObterRastreadaPorIdEEscolaAsync(id, escolaId.Value, cancellationToken);
        if (matricula is null)
        {
            return new MatriculaOperacaoResultado(false, "Matricula nao encontrada.", 404);
        }

        if (string.Equals(matricula.Status, Matricula.Estados.Cancelado, StringComparison.OrdinalIgnoreCase))
        {
            return new MatriculaOperacaoResultado(false, "Matricula ja esta cancelada.", 409);
        }

        if (matricula.TurmaId.HasValue
            && string.Equals(matricula.Status, Matricula.Estados.Ativo, StringComparison.OrdinalIgnoreCase))
        {
            return new MatriculaOperacaoResultado(
                false,
                "Para retirar o aluno desta turma, use a acao Remover da turma. O aluno permanece ativo na escola.",
                409);
        }

        if (!StatusCancelaveis.Contains(matricula.Status))
        {
            return new MatriculaOperacaoResultado(false, "Status atual nao permite cancelamento.", 409);
        }

        matricula.Status = Matricula.Estados.Cancelado;
        matricula.DataAtualizacao = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return new MatriculaOperacaoResultado(true, null, 204);
    }

    public async Task<MatriculaOperacaoResultado> VincularTurmaAsync(
        int matriculaId,
        VincularTurmaMatriculaRequest request,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        if (matriculaId <= 0)
        {
            return new MatriculaOperacaoResultado(false, "MatriculaId invalido.", 400);
        }

        if (request.TurmaId <= 0)
        {
            return new MatriculaOperacaoResultado(false, "TurmaId invalido.", 400);
        }

        var escolaId = await ObterIdEscolaAtivaPorCodigoAsync(uc.CodigoEscola, cancellationToken);
        if (!escolaId.HasValue)
        {
            return new MatriculaOperacaoResultado(false, "Acesso negado.", 403);
        }

        var matricula = await _matriculas.ObterRastreadaPorIdEEscolaAsync(matriculaId, escolaId.Value, cancellationToken);
        if (matricula is null)
        {
            return new MatriculaOperacaoResultado(false, "Matricula nao encontrada.", 404);
        }

        var turma = await _turmas.ObterPorIdEEscolaAsync(request.TurmaId, escolaId.Value, cancellationToken);
        if (turma is null)
        {
            return new MatriculaOperacaoResultado(false, "Turma nao encontrada nesta escola.", 400);
        }

        var validacaoEnturmacao = await MatriculaEnturmacaoRules.ValidarVinculoAsync(
            _matriculas,
            escolaId.Value,
            matricula,
            request.TurmaId,
            cancellationToken);
        if (!validacaoEnturmacao.Ok)
        {
            return new MatriculaOperacaoResultado(
                false,
                validacaoEnturmacao.Mensagem,
                validacaoEnturmacao.StatusCode);
        }

        var validacaoCapacidade = await EscolaTurmaCapacidadeRules.ValidarVinculoAsync(
            _escolas,
            _turmas,
            escolaId.Value,
            request.TurmaId,
            1,
            cancellationToken);
        if (!validacaoCapacidade.Ok)
        {
            return new MatriculaOperacaoResultado(false, validacaoCapacidade.Mensagem, 409);
        }

        matricula.TurmaId = request.TurmaId;
        matricula.Status = Matricula.Estados.Ativo;
        matricula.DataAtualizacao = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new MatriculaOperacaoResultado(true, null, 204);
    }

    public async Task<MatriculaOperacaoResultado> RemoverDaTurmaAsync(
        int id,
        AppUserContext uc,
        CancellationToken cancellationToken = default)
    {
        if (id <= 0)
        {
            return new MatriculaOperacaoResultado(false, "Id de matricula invalido.", 400);
        }

        var escolaId = await ObterIdEscolaAtivaPorCodigoAsync(uc.CodigoEscola, cancellationToken);
        if (!escolaId.HasValue)
        {
            return new MatriculaOperacaoResultado(false, "Acesso negado.", 403);
        }

        var matricula = await _matriculas.ObterRastreadaPorIdEEscolaAsync(id, escolaId.Value, cancellationToken);
        if (matricula is null)
        {
            return new MatriculaOperacaoResultado(false, "Matricula nao encontrada.", 404);
        }

        if (!matricula.TurmaId.HasValue)
        {
            return new MatriculaOperacaoResultado(false, "Esta matricula nao esta vinculada a uma turma.", 409);
        }

        if (!string.Equals(matricula.Status, Matricula.Estados.Ativo, StringComparison.OrdinalIgnoreCase))
        {
            return new MatriculaOperacaoResultado(false, "Somente alunos ativos na turma podem ser removidos.", 409);
        }

        matricula.Status = Matricula.Estados.Cancelado;
        matricula.DataAtualizacao = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return new MatriculaOperacaoResultado(true, null, 204);
    }

    private async Task<string?> ValidarUnicaTurmaAtivaAsync(
        int escolaId,
        int alunoId,
        int? ignorarMatriculaId,
        CancellationToken cancellationToken)
    {
        var outra = await _matriculas.ObterOutraTurmaAtivaDoAlunoAsync(
            escolaId,
            alunoId,
            ignorarMatriculaId,
            cancellationToken);

        if (outra is null)
        {
            return null;
        }

        return
            $"O aluno ja esta matriculado na turma \"{outra.TurmaNome}\". Cada aluno pode participar de apenas uma turma por vez.";
    }

    private static MatriculaListItemResponse MapListItem(MatriculaListagemItem m) =>
        new()
        {
            Id = m.Id,
            EscolaId = m.EscolaId,
            AlunoId = m.AlunoId,
            AlunoNomeCompleto = m.AlunoNomeCompleto,
            TurmaId = m.TurmaId,
            TurmaNome = m.TurmaNome,
            DataMatricula = m.DataMatricula,
            Status = m.Status,
            DataCriacao = m.DataCriacao,
            DataAtualizacao = m.DataAtualizacao,
        };

    private Task<int?> ObterIdEscolaAtivaPorCodigoAsync(string? codigoEscola, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(codigoEscola))
        {
            return Task.FromResult<int?>(null);
        }

        return _escolas.ObterIdAtivaPorCodigoEscolaAsync(codigoEscola, cancellationToken);
    }

    private static bool EhProfessor(AppUserContext uc) =>
        string.Equals(uc.Perfil, "Professor", StringComparison.OrdinalIgnoreCase);
}
