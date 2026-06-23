using Learly.Domain.Exceptions;

namespace Learly.Domain.Entities;

/// <summary>
/// Matrícula escolar: vínculo do aluno à escola; turma pode ser definida depois (aguardando sala).
/// </summary>
public sealed class Matricula
{
    public static class Grupos
    {
        public const string Inativos = "inativos";
        public static readonly IReadOnlyList<string> StatusInativos =
            [Estados.Cancelado, Estados.Trancado, Estados.Concluido];
    }

    public static class Estados
    {
        public const string EmEspera = "Em Espera";
        public const string Ativo = "Ativo";
        public const string Concluido = "Concluido";
        public const string Trancado = "Trancado";
        public const string Cancelado = "Cancelado";

        public static bool IsValid(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return false;

            var s = value.Trim();
            return s.Equals(EmEspera, StringComparison.Ordinal)
                   || s.Equals(Ativo, StringComparison.Ordinal)
                   || s.Equals(Concluido, StringComparison.Ordinal)
                   || s.Equals(Trancado, StringComparison.Ordinal)
                   || s.Equals(Cancelado, StringComparison.Ordinal);
        }

        public static string Normalize(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new DomainException("Status da matricula e obrigatorio.");

            var s = value.Trim();
            if (s.Equals(EmEspera, StringComparison.OrdinalIgnoreCase)) return EmEspera;
            if (s.Equals(Ativo, StringComparison.OrdinalIgnoreCase)) return Ativo;
            if (s.Equals(Concluido, StringComparison.OrdinalIgnoreCase)) return Concluido;
            if (s.Equals(Trancado, StringComparison.OrdinalIgnoreCase)) return Trancado;
            if (s.Equals(Cancelado, StringComparison.OrdinalIgnoreCase)) return Cancelado;

            throw new DomainException("Status da matricula invalido.");
        }
    }

    public int Id { get; internal set; }

    public int EscolaId { get; internal set; }

    public int AlunoId { get; internal set; }

    /// <summary>Null enquanto o aluno aguarda definição de turma/sala.</summary>
    public int? TurmaId { get; internal set; }

    public DateOnly DataMatricula { get; internal set; }

    private string _status = Estados.EmEspera;

    public string Status
    {
        get => _status;
        internal set => _status = Estados.Normalize(value);
    }

    public DateTime DataCriacao { get; internal set; }

    public DateTime DataAtualizacao { get; internal set; }
}
