namespace Learly.API.Auth;

public class JwtOptions
{
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = "LearlyAPI";
    public string Audience { get; set; } = "LearlyClient";
    public int ExpireMinutes { get; set; } = 60;
}
