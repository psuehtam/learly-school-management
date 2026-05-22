using System.Data;
using System.Data.Common;
using Learly.Domain.Entities;
using Learly.Domain.Interfaces.Repositories;
using Learly.Domain.ReadModels;
using Learly.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Learly.Infrastructure.Repositories;

internal sealed class AlunoRepository(LearlyDbContext db) : RepositoryBase<Aluno, int>(db), IAlunoRepository
{
    public async Task<IReadOnlyList<AlunoListagemItem>> ListarPorEscolaAsync(
        int escolaId,
        string? status,
        string? busca,
        int limite,
        CancellationToken cancellationToken = default)
    {
        var query = Db.Alunos.AsNoTracking().Where(a => a.EscolaId == escolaId);

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(a => a.Status == status.Trim());
        }

        var termo = busca?.Trim();
        if (!string.IsNullOrWhiteSpace(termo))
        {
            var lower = termo.ToLower();
            var digitos = new string(termo.Where(char.IsDigit).ToArray());
            if (digitos.Length >= 3)
            {
                query = query.Where(a =>
                    a.Nome.ToLower().Contains(lower)
                    || a.Sobrenome.ToLower().Contains(lower)
                    || (a.Cpf != null && a.Cpf.Contains(digitos)));
            }
            else
            {
                query = query.Where(a =>
                    a.Nome.ToLower().Contains(lower)
                    || a.Sobrenome.ToLower().Contains(lower));
            }
        }

        var take = limite is > 0 and <= 200 ? limite : 80;
        var rows = await query
            .OrderBy(a => a.Nome)
            .ThenBy(a => a.Sobrenome)
            .Take(take)
            .Select(a => new AlunoListagemItem(
                a.Id,
                a.EscolaId,
                a.Nome,
                a.Sobrenome,
                a.Cpf,
                a.Status))
            .ToListAsync(cancellationToken);

        return rows;
    }

    public Task<Aluno?> ObterPorIdEEscolaAsync(int alunoId, int escolaId, CancellationToken cancellationToken = default)
    {
        return Db.Alunos.AsNoTracking().FirstOrDefaultAsync(a => a.Id == alunoId && a.EscolaId == escolaId, cancellationToken);
    }

    public Task<Responsavel?> ObterResponsavelPorIdEEscolaAsync(
        int responsavelId,
        int escolaId,
        CancellationToken cancellationToken = default)
    {
        return Db.Responsaveis.AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == responsavelId && r.EscolaId == escolaId, cancellationToken);
    }

    public async Task<ResponsavelDadosItem?> ObterResponsavelDadosAsync(
        int responsavelId,
        int escolaId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT id, nome, sobrenome, cpf_cnpj, sexo, grau_parentesco, estado_civil, cor_raca,
                   nacionalidade, data_nascimento, naturalidade_cidade, naturalidade_estado,
                   rg_numero, rg_expedicao, rg_orgao, cep, tipo_logradouro, logradouro, numero,
                   complemento, bairro, municipio
            FROM responsaveis
            WHERE id = @responsavelId AND escola_id = @escolaId
            LIMIT 1
            """;

        var connection = Db.Database.GetDbConnection();
        var shouldClose = connection.State == ConnectionState.Closed;
        if (shouldClose)
            await connection.OpenAsync(cancellationToken);

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = sql;
            SetCurrentTransaction(command);
            AddParameter(command, "@responsavelId", responsavelId);
            AddParameter(command, "@escolaId", escolaId);

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
                return null;

            var tel = await ObterTelefonePrincipalAsync(escolaId, "responsavel", responsavelId, cancellationToken);

            static string? S(DbDataReader r, string col) => r.IsDBNull(r.GetOrdinal(col)) ? null : r.GetString(col);
            static DateOnly? D(DbDataReader r, string col)
            {
                var i = r.GetOrdinal(col);
                return r.IsDBNull(i) ? null : DateOnly.FromDateTime(r.GetDateTime(i));
            }

            return new ResponsavelDadosItem(
                reader.GetInt32(reader.GetOrdinal("id")),
                reader.GetString(reader.GetOrdinal("nome")),
                reader.GetString(reader.GetOrdinal("sobrenome")),
                reader.GetString(reader.GetOrdinal("cpf_cnpj")),
                S(reader, "sexo"),
                S(reader, "grau_parentesco"),
                S(reader, "estado_civil"),
                S(reader, "cor_raca"),
                S(reader, "nacionalidade"),
                D(reader, "data_nascimento"),
                S(reader, "naturalidade_cidade"),
                S(reader, "naturalidade_estado"),
                S(reader, "rg_numero"),
                D(reader, "rg_expedicao"),
                S(reader, "rg_orgao"),
                S(reader, "cep"),
                S(reader, "tipo_logradouro"),
                S(reader, "logradouro"),
                S(reader, "numero"),
                S(reader, "complemento"),
                S(reader, "bairro"),
                S(reader, "municipio"),
                tel);
        }
        finally
        {
            if (shouldClose)
                await connection.CloseAsync();
        }
    }

    public async Task<string?> ObterTelefonePrincipalAsync(
        int escolaId,
        string entidade,
        int entidadeId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT numero FROM contatos_telefone
            WHERE escola_id = @escolaId AND entidade = @entidade AND entidade_id = @entidadeId
            ORDER BY principal DESC, id ASC
            LIMIT 1
            """;

        var connection = Db.Database.GetDbConnection();
        var shouldClose = connection.State == ConnectionState.Closed;

        if (shouldClose)
            await connection.OpenAsync(cancellationToken);

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = sql;
            SetCurrentTransaction(command);
            AddParameter(command, "@escolaId", escolaId);
            AddParameter(command, "@entidade", entidade);
            AddParameter(command, "@entidadeId", entidadeId);

            var scalar = await command.ExecuteScalarAsync(cancellationToken);
            if (scalar is null || scalar == DBNull.Value)
                return null;

            return Convert.ToString(scalar);
        }
        finally
        {
            if (shouldClose)
                await connection.CloseAsync();
        }
    }

    public Task<bool> ExisteCpfNaEscolaAsync(int escolaId, string cpf, CancellationToken cancellationToken = default)
    {
        const string sql = "SELECT COUNT(1) FROM alunos WHERE escola_id = @escolaId AND cpf = @cpf";
        return ExecutarExistsSqlAsync(sql, cmd =>
        {
            AddParameter(cmd, "@escolaId", escolaId);
            AddParameter(cmd, "@cpf", cpf);
        }, cancellationToken);
    }

    public Task<bool> ExisteResponsavelNaEscolaAsync(int escolaId, int responsavelId, CancellationToken cancellationToken = default)
    {
        const string sql = "SELECT COUNT(1) FROM responsaveis WHERE escola_id = @escolaId AND id = @responsavelId";
        return ExecutarExistsSqlAsync(sql, cmd =>
        {
            AddParameter(cmd, "@escolaId", escolaId);
            AddParameter(cmd, "@responsavelId", responsavelId);
        }, cancellationToken);
    }

    public async Task<int?> ObterResponsavelIdPorCpfAsync(int escolaId, string cpfCnpj, CancellationToken cancellationToken = default)
    {
        const string sql = "SELECT id FROM responsaveis WHERE escola_id = @escolaId AND cpf_cnpj = @cpfCnpj LIMIT 1";
        var connection = Db.Database.GetDbConnection();
        var shouldClose = connection.State == ConnectionState.Closed;

        if (shouldClose)
            await connection.OpenAsync(cancellationToken);

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = sql;
            SetCurrentTransaction(command);
            AddParameter(command, "@escolaId", escolaId);
            AddParameter(command, "@cpfCnpj", cpfCnpj);

            var scalar = await command.ExecuteScalarAsync(cancellationToken);
            if (scalar is null || scalar == DBNull.Value) return null;
            return Convert.ToInt32(scalar);
        }
        finally
        {
            if (shouldClose)
                await connection.CloseAsync();
        }
    }

    public async Task<int> CriarResponsavelMinimoAsync(
        int escolaId,
        string tipoPessoa,
        string cpfCnpj,
        string nome,
        string sobrenome,
        CancellationToken cancellationToken = default)
    {
        const string insertSql = """
            INSERT INTO responsaveis
                (escola_id, tipo_pessoa, cpf_cnpj, nome, sobrenome, status)
            VALUES
                (@escolaId, @tipoPessoa, @cpfCnpj, @nome, @sobrenome, 'Ativo');
            """;
        const string lastIdSql = "SELECT LAST_INSERT_ID();";

        var connection = Db.Database.GetDbConnection();
        var shouldClose = connection.State == ConnectionState.Closed;

        if (shouldClose)
            await connection.OpenAsync(cancellationToken);

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = insertSql;
            SetCurrentTransaction(command);
            AddParameter(command, "@escolaId", escolaId);
            AddParameter(command, "@tipoPessoa", tipoPessoa);
            AddParameter(command, "@cpfCnpj", cpfCnpj);
            AddParameter(command, "@nome", nome);
            AddParameter(command, "@sobrenome", sobrenome);
            await command.ExecuteNonQueryAsync(cancellationToken);

            using var commandLastId = connection.CreateCommand();
            commandLastId.CommandText = lastIdSql;
            SetCurrentTransaction(commandLastId);
            var scalar = await commandLastId.ExecuteScalarAsync(cancellationToken);
            return Convert.ToInt32(scalar);
        }
        finally
        {
            if (shouldClose)
                await connection.CloseAsync();
        }
    }

    public async Task<int> CriarResponsavelFisicoAsync(
        int escolaId,
        string cpf,
        string nome,
        string sobrenome,
        string sexo,
        string cep,
        string tipoLogradouro,
        string logradouro,
        string numero,
        string? complemento,
        string bairro,
        string municipio,
        CancellationToken cancellationToken = default)
    {
        const string insertSql = """
            INSERT INTO responsaveis
                (escola_id, tipo_pessoa, cpf_cnpj, nome, sobrenome, sexo, cep, tipo_logradouro, logradouro, numero, complemento, bairro, municipio, status)
            VALUES
                (@escolaId, 'Fisica', @cpf, @nome, @sobrenome, @sexo, @cep, @tipoLogradouro, @logradouro, @numero, @complemento, @bairro, @municipio, 'Ativo');
            """;
        const string lastIdSql = "SELECT LAST_INSERT_ID();";

        var connection = Db.Database.GetDbConnection();
        var shouldClose = connection.State == ConnectionState.Closed;

        if (shouldClose)
            await connection.OpenAsync(cancellationToken);

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = insertSql;
            SetCurrentTransaction(command);
            AddParameter(command, "@escolaId", escolaId);
            AddParameter(command, "@cpf", cpf);
            AddParameter(command, "@nome", nome);
            AddParameter(command, "@sobrenome", sobrenome);
            AddParameter(command, "@sexo", sexo);
            AddParameter(command, "@cep", cep);
            AddParameter(command, "@tipoLogradouro", tipoLogradouro);
            AddParameter(command, "@logradouro", logradouro);
            AddParameter(command, "@numero", numero);
            AddParameter(command, "@complemento", complemento ?? (object)DBNull.Value);
            AddParameter(command, "@bairro", bairro);
            AddParameter(command, "@municipio", municipio);
            await command.ExecuteNonQueryAsync(cancellationToken);

            using var commandLastId = connection.CreateCommand();
            commandLastId.CommandText = lastIdSql;
            SetCurrentTransaction(commandLastId);
            var scalar = await commandLastId.ExecuteScalarAsync(cancellationToken);
            return Convert.ToInt32(scalar);
        }
        finally
        {
            if (shouldClose)
                await connection.CloseAsync();
        }
    }

    public async Task InserirContatoTelefoneAsync(
        int escolaId,
        string entidade,
        int entidadeId,
        string tipo,
        string numero,
        bool principal,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
            INSERT INTO contatos_telefone (escola_id, entidade, entidade_id, tipo, numero, principal)
            VALUES (@escolaId, @entidade, @entidadeId, @tipo, @numero, @principal);
            """;

        var connection = Db.Database.GetDbConnection();
        var shouldClose = connection.State == ConnectionState.Closed;

        if (shouldClose)
            await connection.OpenAsync(cancellationToken);

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = sql;
            SetCurrentTransaction(command);
            AddParameter(command, "@escolaId", escolaId);
            AddParameter(command, "@entidade", entidade);
            AddParameter(command, "@entidadeId", entidadeId);
            AddParameter(command, "@tipo", tipo);
            AddParameter(command, "@numero", numero);
            AddParameter(command, "@principal", principal);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        finally
        {
            if (shouldClose)
                await connection.CloseAsync();
        }
    }

    public async Task AtualizarResponsavelOpcionaisAsync(
        int escolaId,
        int responsavelId,
        string? sexo,
        string? grauParentesco,
        string? estadoCivil,
        string? corRaca,
        string? nacionalidade,
        DateOnly? dataNascimento,
        string? naturalidadeCidade,
        string? naturalidadeEstado,
        string? rgNumero,
        DateOnly? rgExpedicao,
        string? rgOrgao,
        CancellationToken cancellationToken = default)
    {
        var sets = new List<string>();
        var connection = Db.Database.GetDbConnection();
        var shouldClose = connection.State == ConnectionState.Closed;

        if (shouldClose)
            await connection.OpenAsync(cancellationToken);

        try
        {
            using var command = connection.CreateCommand();
            SetCurrentTransaction(command);

            void AddSet(string column, string param, object? value)
            {
                if (value is null || (value is string s && string.IsNullOrWhiteSpace(s)))
                    return;
                sets.Add($"{column} = {param}");
                AddParameter(command, param, value is string str ? str.Trim() : value);
            }

            AddSet("sexo", "@sexo", sexo);
            AddSet("grau_parentesco", "@grauParentesco", grauParentesco);
            AddSet("estado_civil", "@estadoCivil", estadoCivil);
            AddSet("cor_raca", "@corRaca", corRaca);
            AddSet("nacionalidade", "@nacionalidade", nacionalidade);
            if (dataNascimento.HasValue)
            {
                sets.Add("data_nascimento = @dataNascimento");
                AddParameter(command, "@dataNascimento", dataNascimento.Value);
            }

            AddSet("naturalidade_cidade", "@naturalidadeCidade", naturalidadeCidade);
            if (!string.IsNullOrWhiteSpace(naturalidadeEstado))
            {
                sets.Add("naturalidade_estado = @naturalidadeEstado");
                AddParameter(command, "@naturalidadeEstado", naturalidadeEstado.Trim().ToUpperInvariant());
            }

            AddSet("rg_numero", "@rgNumero", rgNumero);
            if (rgExpedicao.HasValue)
            {
                sets.Add("rg_expedicao = @rgExpedicao");
                AddParameter(command, "@rgExpedicao", rgExpedicao.Value);
            }

            AddSet("rg_orgao", "@rgOrgao", rgOrgao);

            if (sets.Count == 0)
                return;

            command.CommandText = $"""
                UPDATE responsaveis
                SET {string.Join(", ", sets)}
                WHERE id = @responsavelId AND escola_id = @escolaId
                """;

            AddParameter(command, "@responsavelId", responsavelId);
            AddParameter(command, "@escolaId", escolaId);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        finally
        {
            if (shouldClose)
                await connection.CloseAsync();
        }
    }

    private async Task<bool> ExecutarExistsSqlAsync(string sql, Action<DbCommand> configurar, CancellationToken cancellationToken)
    {
        var connection = Db.Database.GetDbConnection();
        var shouldClose = connection.State == ConnectionState.Closed;

        if (shouldClose)
            await connection.OpenAsync(cancellationToken);

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = sql;
            configurar(command);

            var scalar = await command.ExecuteScalarAsync(cancellationToken);
            var total = scalar is null || scalar == DBNull.Value ? 0 : Convert.ToInt32(scalar);
            return total > 0;
        }
        finally
        {
            if (shouldClose)
                await connection.CloseAsync();
        }
    }

    private static void AddParameter(DbCommand command, string name, object value)
    {
        var p = command.CreateParameter();
        p.ParameterName = name;
        p.Value = value;
        command.Parameters.Add(p);
    }

    private void SetCurrentTransaction(DbCommand command)
    {
        IDbContextTransaction? currentTx = Db.Database.CurrentTransaction;
        if (currentTx is not null)
        {
            command.Transaction = currentTx.GetDbTransaction();
        }
    }
}
