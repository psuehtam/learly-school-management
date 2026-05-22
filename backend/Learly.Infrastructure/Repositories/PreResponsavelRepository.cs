using System.Data;
using System.Data.Common;
using Learly.Domain.Entities;
using Learly.Domain.Interfaces.Repositories;
using Learly.Domain.ReadModels;
using Learly.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Learly.Infrastructure.Repositories;

internal sealed class PreResponsavelRepository(LearlyDbContext db)
    : RepositoryBase<PreResponsavel, int>(db), IPreResponsavelRepository
{
    public Task<PreResponsavel?> ObterPorIdEEscolaRastreadoAsync(
        int id,
        int escolaId,
        CancellationToken cancellationToken = default)
    {
        return Set.FirstOrDefaultAsync(r => r.Id == id && r.EscolaId == escolaId, cancellationToken);
    }

    public Task<PreResponsavel?> ObterPorIdEEscolaAsync(
        int id,
        int escolaId,
        CancellationToken cancellationToken = default)
    {
        return Set.AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id && r.EscolaId == escolaId, cancellationToken);
    }

    public Task<PreResponsavel?> ObterAtivoPorCpfAsync(
        int escolaId,
        string cpfCnpj,
        CancellationToken cancellationToken = default)
    {
        return Set.FirstOrDefaultAsync(
            r => r.EscolaId == escolaId
                 && r.CpfCnpj == cpfCnpj
                 && r.Status != PreResponsavel.Estados.Convertido,
            cancellationToken);
    }

    public async Task<ResponsavelDadosItem?> ObterDadosAsync(
        int preResponsavelId,
        int escolaId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT id, nome, sobrenome, cpf_cnpj, sexo, grau_parentesco, estado_civil, cor_raca,
                   nacionalidade, data_nascimento, naturalidade_cidade, naturalidade_estado,
                   rg_numero, rg_expedicao, rg_orgao, cep, tipo_logradouro, logradouro, numero,
                   complemento, bairro, municipio, telefone
            FROM pre_responsaveis
            WHERE id = @preResponsavelId AND escola_id = @escolaId
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
            AddParameter(command, "@preResponsavelId", preResponsavelId);
            AddParameter(command, "@escolaId", escolaId);

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
                return null;

            static string? S(DbDataReader r, string col) => r.IsDBNull(r.GetOrdinal(col)) ? null : r.GetString(col);
            static DateOnly? D(DbDataReader r, string col)
            {
                var i = r.GetOrdinal(col);
                return r.IsDBNull(i) ? null : DateOnly.FromDateTime(r.GetDateTime(i));
            }

            var telOrd = reader.GetOrdinal("telefone");
            var tel = reader.IsDBNull(telOrd) ? null : reader.GetString(telOrd);

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

    public async Task AtualizarOpcionaisAsync(
        int escolaId,
        int preResponsavelId,
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
        string? telefone,
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
            AddSet("telefone", "@telefone", telefone);

            if (sets.Count == 0)
                return;

            command.CommandText = $"""
                UPDATE pre_responsaveis
                SET {string.Join(", ", sets)}
                WHERE id = @preResponsavelId AND escola_id = @escolaId
                """;

            AddParameter(command, "@preResponsavelId", preResponsavelId);
            AddParameter(command, "@escolaId", escolaId);
            await command.ExecuteNonQueryAsync(cancellationToken);
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
            command.Transaction = currentTx.GetDbTransaction();
    }
}
