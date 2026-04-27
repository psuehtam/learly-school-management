using Learly.Domain.Exceptions;

namespace Learly.Domain.Entities;

public sealed class Turma
{
    public int Id { get; internal set; }

    public int EscolaId { get; internal set; }

    public int ProfessorId { get; internal set; }

    public int LivroId { get; internal set; }

    private string _nome = string.Empty;

    public string Nome
    {
        get => _nome;
        internal set => _nome = ValidarNome(value);
    }

    private string? _sala;

    public string? Sala
    {
        get => _sala;
        internal set => _sala = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public TimeOnly? Horario { get; internal set; }

    public DateOnly? DataInicio { get; internal set; }

    public DateOnly? DataTerminoPrevista { get; internal set; }

    private string? _observacoes;

    public string? Observacoes
    {
        get => _observacoes;
        internal set => _observacoes = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private string _status = "Em Espera";

    public string Status
    {
        get => _status;
        internal set => _status = ValidarStatus(value);
    }

    public void DefinirPeriodoLetivo(DateOnly? inicio, DateOnly? terminoPrevisto)
    {
        if (inicio is not null && terminoPrevisto is not null && terminoPrevisto < inicio)
            throw new DomainException("Data de termino prevista nao pode ser anterior a data de inicio.");

        DataInicio = inicio;
        DataTerminoPrevista = terminoPrevisto;
    }

    public void AlterarIdentificacao(string nome, string? sala)
    {
        Nome = nome;
        Sala = sala;
    }

    private static string ValidarNome(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Nome da turma e obrigatorio.");

        return value.Trim();
    }

    private static string ValidarStatus(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Status da turma e obrigatorio.");

        return value.Trim();
    }
}
