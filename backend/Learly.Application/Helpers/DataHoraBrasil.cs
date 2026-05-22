using System.Globalization;

namespace Learly.Application.Helpers;

/// <summary>Horário de referência da escola (Brasil) para exibição em textos e carimbos.</summary>
public static class DataHoraBrasil
{
    private static readonly TimeZoneInfo Fuso = ObterFusoBrasil();

    public static DateTime Agora => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Fuso);

    public static string CarimboDdMmYyyyHhMm => Agora.ToString("dd/MM/yyyy HH:mm", CultureInfo.InvariantCulture);

    /// <summary>Carimbo com offset explícito (ex.: 2026-05-21T22:26:00-03:00) para não confundir com UTC.</summary>
    public static string CarimboRecusaIso8601
    {
        get
        {
            var utc = DateTime.UtcNow;
            var local = TimeZoneInfo.ConvertTimeFromUtc(utc, Fuso);
            var offset = Fuso.GetUtcOffset(utc);
            var dto = new DateTimeOffset(local, offset);
            return dto.ToString("yyyy-MM-dd'T'HH:mm:sszzz", CultureInfo.InvariantCulture);
        }
    }

    private static TimeZoneInfo ObterFusoBrasil()
    {
        var id = OperatingSystem.IsWindows()
            ? "E. South America Standard Time"
            : "America/Sao_Paulo";
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(id);
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.CreateCustomTimeZone("BRT", TimeSpan.FromHours(-3), "Brasil", "Brasil");
        }
    }
}
