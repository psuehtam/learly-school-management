using Learly.Domain.Exceptions;

namespace Learly.Domain.Entities;

public sealed class Aula
{
    public static class Estados
    {
        public const string Agendada = "Agendada";
        public const string Realizada = "Realizada";
        public const string Cancelada = "Cancelada";
    }

    public int Id { get; internal set; }

    public int EscolaId { get; internal set; }

    public int TurmaId { get; internal set; }

    public int? CapituloId { get; internal set; }

    public int ProfessorId { get; internal set; }

    private int _numeroAula;

    public int NumeroAula
    {
        get => _numeroAula;
        internal set => _numeroAula = ValidarNumeroAula(value);
    }

    public DateOnly DataAula { get; internal set; }

    private TimeOnly _horarioInicio;

    public TimeOnly HorarioInicio
    {
        get => _horarioInicio;
        internal set => _horarioInicio = value;
    }

    private TimeOnly _horarioFim;

    public TimeOnly HorarioFim
    {
        get => _horarioFim;
        internal set => _horarioFim = value;
    }

    private string? _conteudoDado;

    public string? ConteudoDado
    {
        get => _conteudoDado;
        internal set => _conteudoDado = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private string _tipoAula = "Normal";

    public string TipoAula
    {
        get => _tipoAula;
        internal set => _tipoAula = ValidarTipoAula(value);
    }

    private string _status = Estados.Agendada;

    public string Status
    {
        get => _status;
        internal set => _status = ValidarStatus(value);
    }

    public void ValidarHorarios()
    {
        if (HorarioFim <= HorarioInicio)
            throw new DomainException("Horario fim deve ser maior que horario inicio.");
    }

    public bool PodeTransicionarPara(string proximoStatus)
    {
        var atual = Status.Trim();
        var proximo = proximoStatus.Trim();
        if (string.Equals(atual, proximo, StringComparison.OrdinalIgnoreCase))
            return true;

        return atual.ToLowerInvariant() switch
        {
            "agendada" => string.Equals(proximo, Estados.Realizada, StringComparison.OrdinalIgnoreCase)
                          || string.Equals(proximo, Estados.Cancelada, StringComparison.OrdinalIgnoreCase),
            "realizada" => false,
            "cancelada" => false,
            _ => false
        };
    }

    public void TransicionarStatus(string proximoStatus)
    {
        var normalized = ValidarStatus(proximoStatus);
        if (!PodeTransicionarPara(normalized))
            throw new DomainException("Transicao de status da aula nao e permitida.");

        Status = normalized;
    }

    public void Cancelar()
    {
        TransicionarStatus(Estados.Cancelada);
    }

    public void Reagendar(DateOnly novaData, TimeOnly novoInicio, TimeOnly novoFim)
    {
        DataAula = novaData;
        HorarioInicio = novoInicio;
        HorarioFim = novoFim;
        ValidarHorarios();
    }

    private static int ValidarNumeroAula(int value)
    {
        if (value <= 0)
            throw new DomainException("Numero da aula deve ser maior que zero.");

        return value;
    }

    private static string ValidarTipoAula(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Tipo da aula e obrigatorio.");

        return value.Trim();
    }

    private static string ValidarStatus(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Status da aula e obrigatorio.");

        var s = value.Trim();
        if (!string.Equals(s, Estados.Agendada, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(s, Estados.Realizada, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(s, Estados.Cancelada, StringComparison.OrdinalIgnoreCase))
        {
            throw new DomainException("Status da aula invalido.");
        }

        if (string.Equals(s, Estados.Agendada, StringComparison.OrdinalIgnoreCase)) return Estados.Agendada;
        if (string.Equals(s, Estados.Realizada, StringComparison.OrdinalIgnoreCase)) return Estados.Realizada;
        return Estados.Cancelada;
    }
}
