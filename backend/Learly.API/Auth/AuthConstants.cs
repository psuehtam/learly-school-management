namespace Learly.API.Auth;

/// <summary>
/// Escola técnica reservada no banco (FK) para o perfil Super Admin.
/// No JWT e nas APIs o super admin é exposto sem <c>codigoEscola</c> (escopo global).
/// </summary>
public static class AuthConstants
{
    public const string SystemSchoolCode = "SYSTEM";
    public const string SuperAdminProfileName = "Super Admin";
    public const string AccessTokenCookieName = "learly_access_token";

    public static bool IsSystemSuperAdmin(string? escolaCodigo, string perfilNome) =>
        string.Equals(escolaCodigo, SystemSchoolCode, StringComparison.OrdinalIgnoreCase)
        && string.Equals(perfilNome, SuperAdminProfileName, StringComparison.OrdinalIgnoreCase);
}
