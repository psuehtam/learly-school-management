using Learly.Domain.Interfaces.Services;
using Microsoft.Extensions.Configuration;

namespace Learly.Infrastructure.Services;

internal sealed class LocalArquivoStorageService : IArquivoStorageService
{
    private readonly string _raizUploads;

    public LocalArquivoStorageService(IConfiguration configuration)
    {
        var configurado = configuration["Storage:UploadsPath"];
        _raizUploads = string.IsNullOrWhiteSpace(configurado)
            ? Path.Combine(Directory.GetCurrentDirectory(), "uploads")
            : Path.GetFullPath(configurado);

        Directory.CreateDirectory(_raizUploads);
    }

    public async Task<string> SalvarAsync(
        string caminhoRelativo,
        Stream conteudo,
        CancellationToken cancellationToken = default)
    {
        var caminhoFisico = ObterCaminhoFisico(caminhoRelativo);
        var dir = Path.GetDirectoryName(caminhoFisico);
        if (!string.IsNullOrEmpty(dir))
            Directory.CreateDirectory(dir);

        await using var fs = new FileStream(
            caminhoFisico,
            FileMode.Create,
            FileAccess.Write,
            FileShare.None,
            bufferSize: 81920,
            useAsync: true);

        await conteudo.CopyToAsync(fs, cancellationToken);
        return NormalizarRelativo(caminhoRelativo);
    }

    public Task<Stream?> AbrirLeituraAsync(
        string caminhoRelativo,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var caminhoFisico = ObterCaminhoFisico(caminhoRelativo);
        if (!File.Exists(caminhoFisico))
            return Task.FromResult<Stream?>(null);

        Stream stream = new FileStream(
            caminhoFisico,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: 81920,
            useAsync: true);

        return Task.FromResult<Stream?>(stream);
    }

    public Task RemoverAsync(string caminhoRelativo, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var caminhoFisico = ObterCaminhoFisico(caminhoRelativo);
        if (File.Exists(caminhoFisico))
            File.Delete(caminhoFisico);

        return Task.CompletedTask;
    }

    public string ObterCaminhoFisico(string caminhoRelativo)
    {
        var rel = NormalizarRelativo(caminhoRelativo);
        var combinado = Path.GetFullPath(Path.Combine(_raizUploads, rel));
        var raizFull = Path.GetFullPath(_raizUploads);

        if (!combinado.StartsWith(raizFull, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Caminho de arquivo invalido.");

        return combinado;
    }

    private static string NormalizarRelativo(string caminhoRelativo)
    {
        return caminhoRelativo.Replace('\\', '/').TrimStart('/');
    }
}
