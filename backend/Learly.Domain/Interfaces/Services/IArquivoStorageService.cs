namespace Learly.Domain.Interfaces.Services;

public interface IArquivoStorageService
{
    Task<string> SalvarAsync(
        string caminhoRelativo,
        Stream conteudo,
        CancellationToken cancellationToken = default);

    Task<Stream?> AbrirLeituraAsync(
        string caminhoRelativo,
        CancellationToken cancellationToken = default);

    Task RemoverAsync(string caminhoRelativo, CancellationToken cancellationToken = default);

    string ObterCaminhoFisico(string caminhoRelativo);
}
