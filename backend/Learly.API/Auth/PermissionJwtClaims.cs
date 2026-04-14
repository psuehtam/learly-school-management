using System.IO.Compression;
using System.Security.Claims;
using System.Text;

namespace Learly.API.Auth;

/// <summary>
/// Dezenas de claims <c>permissions</c> inflam o JWT acima do limite prático do cookie (~4KB),
/// o navegador descarta o cookie e <c>/api/me</c> retorna 401 — perfis “cheios” (Administrador, Coordenador) falham;
/// Professor/Super Admin continuam com token pequeno.
/// Quando há muitas permissões, grava uma única claim comprimida e expande após validar o JWT.
/// </summary>
public static class PermissionJwtClaims
{
    public const string Type = "permissions";

    private const string CompressedPrefix = "gz:";

    /// <summary>Tamanho do texto “a,b,c…” acima do qual preferimos comprimir (margem para o resto do JWT).</summary>
    private const int UncompressedJoinedMaxChars = 2000;

    private const int UncompressedCountMax = 55;

    public static void AddPermissionClaims(List<Claim> claims, IReadOnlyList<string> permissoes)
    {
        if (permissoes.Count == 0) return;

        var joined = string.Join(",", permissoes);
        if (joined.Length <= UncompressedJoinedMaxChars && permissoes.Count <= UncompressedCountMax)
        {
            foreach (var p in permissoes)
                claims.Add(new Claim(Type, p));
            return;
        }

        var utf8 = Encoding.UTF8.GetBytes(joined);
        using var outStream = new MemoryStream();
        using (var gz = new GZipStream(outStream, CompressionLevel.Fastest, leaveOpen: true))
        {
            gz.Write(utf8);
        }

        claims.Add(new Claim(Type, CompressedPrefix + Convert.ToBase64String(outStream.ToArray())));
    }

    public static void ExpandCompressedPermissions(ClaimsPrincipal? principal)
    {
        if (principal?.Identity is not ClaimsIdentity identity) return;

        var permissionClaims = identity.FindAll(Type).ToList();
        if (permissionClaims.Count != 1) return;

        var value = permissionClaims[0].Value;
        if (!value.StartsWith(CompressedPrefix, StringComparison.Ordinal)) return;

        var gzBytes = Convert.FromBase64String(value[CompressedPrefix.Length..]);
        using var inStream = new MemoryStream(gzBytes);
        using var gz = new GZipStream(inStream, CompressionMode.Decompress);
        using var buf = new MemoryStream();
        gz.CopyTo(buf);
        var text = Encoding.UTF8.GetString(buf.ToArray());

        identity.RemoveClaim(permissionClaims[0]);

        foreach (var p in text.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (p.Length > 0)
                identity.AddClaim(new Claim(Type, p));
        }
    }
}
