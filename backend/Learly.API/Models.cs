namespace Learly.API;

public record LoginRequest(string CodigoEscola, string Email, string Senha);

public record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
