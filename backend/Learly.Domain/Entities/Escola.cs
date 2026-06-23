using System.Text.RegularExpressions;
using Learly.Domain.Exceptions;

namespace Learly.Domain.Entities;

public sealed class Escola
{
    public static class Estados
    {
        public const string Ativo = "Ativo";
        public const string Inativo = "Inativo";
    }

    public static class MetricasAula
    {
        public const string PorDia = "POR_DIA";
        public const string PorHora = "POR_HORA";
    }

    public int Id { get; internal set; }

    private string _codigoEscola = string.Empty;

    public string CodigoEscola
    {
        get => _codigoEscola;
        internal set => _codigoEscola = ValidarCodigoEscola(value);
    }

    private string _nomeFantasia = string.Empty;

    public string NomeFantasia
    {
        get => _nomeFantasia;
        internal set => _nomeFantasia = ValidarNomeFantasia(value);
    }

    private string? _razaoSocial;

    public string? RazaoSocial
    {
        get => _razaoSocial;
        internal set => _razaoSocial = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private string? _cnpj;

    public string? Cnpj
    {
        get => _cnpj;
        internal set => _cnpj = NormalizarCnpjOpcional(value);
    }

    public int MinAlunosTurma { get; internal set; } = 3;

    public int? MaxAlunosTurma { get; internal set; }

    private string _metricaAula = MetricasAula.PorDia;
    public string MetricaAula
    {
        get => _metricaAula;
        internal set => _metricaAula = ValidarMetricaAula(value);
    }

    public int DuracaoAulaMinutos { get; internal set; } = 120;

    private string? _cep;

    public string? Cep
    {
        get => _cep;
        internal set => _cep = NormalizarCepOpcional(value);
    }

    private string? _logradouro;

    public string? Logradouro
    {
        get => _logradouro;
        internal set => _logradouro = NormalizarTextoOpcional(value, 200);
    }

    private string? _numero;

    public string? Numero
    {
        get => _numero;
        internal set => _numero = NormalizarTextoOpcional(value, 20);
    }

    private string? _complemento;

    public string? Complemento
    {
        get => _complemento;
        internal set => _complemento = NormalizarTextoOpcional(value, 100);
    }

    private string? _bairro;

    public string? Bairro
    {
        get => _bairro;
        internal set => _bairro = NormalizarTextoOpcional(value, 100);
    }

    private string? _cidade;

    public string? Cidade
    {
        get => _cidade;
        internal set => _cidade = NormalizarTextoOpcional(value, 100);
    }

    private string? _uf;

    public string? Uf
    {
        get => _uf;
        internal set => _uf = NormalizarUfOpcional(value);
    }

    private string? _logoCaminho;

    public string? LogoCaminho
    {
        get => _logoCaminho;
        internal set => _logoCaminho = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private string _status = Estados.Ativo;

    public string Status
    {
        get => _status;
        internal set => _status = ValidarStatus(value);
    }

    public void Desativar()
    {
        if (string.Equals(Status, Estados.Inativo, StringComparison.OrdinalIgnoreCase))
            return;

        Status = Estados.Inativo;
    }

    public void Reativar()
    {
        Status = Estados.Ativo;
    }

    public void AlterarDadosCadastrais(string nomeFantasia, string? razaoSocial, string? cnpj)
    {
        NomeFantasia = nomeFantasia;
        RazaoSocial = razaoSocial;
        Cnpj = cnpj;
    }

    public void AlterarEndereco(
        string? cep,
        string? logradouro,
        string? numero,
        string? complemento,
        string? bairro,
        string? cidade,
        string? uf)
    {
        Cep = cep;
        Logradouro = logradouro;
        Numero = numero;
        Complemento = complemento;
        Bairro = bairro;
        Cidade = cidade;
        Uf = uf;
    }

    public void AlterarConfiguracoesTurma(int minAlunosTurma, int? maxAlunosTurma)
    {
        if (minAlunosTurma < 1)
            throw new DomainException("Minimo de alunos por turma deve ser ao menos 1.");

        if (maxAlunosTurma.HasValue && maxAlunosTurma.Value < minAlunosTurma)
            throw new DomainException("Maximo de alunos por turma nao pode ser menor que o minimo.");

        MinAlunosTurma = minAlunosTurma;
        MaxAlunosTurma = maxAlunosTurma;
    }

    public void AlterarConfiguracoesAula(string metricaAula, int duracaoAulaMinutos)
    {
        if (duracaoAulaMinutos < 15 || duracaoAulaMinutos > 480)
            throw new DomainException("Duracao da aula deve estar entre 15 e 480 minutos.");

        MetricaAula = metricaAula;
        DuracaoAulaMinutos = duracaoAulaMinutos;
    }

    public void DefinirLogo(string? caminhoRelativo)
    {
        LogoCaminho = caminhoRelativo;
    }

    private static string ValidarMetricaAula(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Metrica de aula e obrigatoria.");

        var v = value.Trim().ToUpperInvariant();
        if (v != MetricasAula.PorDia && v != MetricasAula.PorHora)
            throw new DomainException("Metrica de aula deve ser POR_DIA ou POR_HORA.");

        return v;
    }

    private static string ValidarCodigoEscola(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Codigo da escola e obrigatorio.");

        return value.Trim().ToUpperInvariant();
    }

    private static string ValidarNomeFantasia(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Nome fantasia e obrigatorio.");

        return value.Trim();
    }

    private static string ValidarStatus(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Status da escola e obrigatorio.");

        var s = value.Trim();
        if (!string.Equals(s, Estados.Ativo, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(s, Estados.Inativo, StringComparison.OrdinalIgnoreCase))
        {
            throw new DomainException("Status da escola deve ser Ativo ou Inativo.");
        }

        return string.Equals(s, Estados.Inativo, StringComparison.OrdinalIgnoreCase) ? Estados.Inativo : Estados.Ativo;
    }

    private static string? NormalizarCnpjOpcional(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var digits = Regex.Replace(value, @"\D", "");
        if (digits.Length is not (11 or 14))
            throw new DomainException("CNPJ deve conter 11 ou 14 digitos.");

        return digits;
    }

    private static string? NormalizarCepOpcional(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var digits = Regex.Replace(value, @"\D", "");
        if (digits.Length != 8)
            throw new DomainException("CEP deve conter 8 digitos.");

        return digits;
    }

    private static string? NormalizarTextoOpcional(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var trimmed = value.Trim();
        if (trimmed.Length > maxLength)
            throw new DomainException($"Texto excede o limite de {maxLength} caracteres.");

        return trimmed;
    }

    private static string? NormalizarUfOpcional(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var uf = value.Trim().ToUpperInvariant();
        if (uf.Length != 2)
            throw new DomainException("UF deve conter 2 letras.");

        return uf;
    }
}
