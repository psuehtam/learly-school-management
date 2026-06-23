using Learly.Application.Contracts.Escolas.Responses;

namespace Learly.Application.Contracts.Escolas;

public enum MinhaEscolaFalha
{
    Nenhuma,
    Validacao,
    AcessoNegado,
    NaoEncontrado
}

public sealed record MinhaEscolaConsultaResultado(
    bool Ok,
    MinhaEscolaResponse? Escola,
    string? Mensagem,
    MinhaEscolaFalha Falha);

public sealed record MinhaEscolaAtualizacaoResultado(
    bool Ok,
    MinhaEscolaResponse? Escola,
    string? Mensagem,
    MinhaEscolaFalha Falha);

public sealed record EscolaConfiguracoesConsultaResultado(
    bool Ok,
    EscolaConfiguracoesResponse? Configuracoes,
    string? Mensagem,
    MinhaEscolaFalha Falha);

public sealed record EscolaConfiguracoesAtualizacaoResultado(
    bool Ok,
    EscolaConfiguracoesResponse? Configuracoes,
    string? Mensagem,
    MinhaEscolaFalha Falha);

public sealed record EscolaLogoUploadResultado(
    bool Ok,
    string? Mensagem,
    MinhaEscolaFalha Falha);

public sealed record EscolaLogoArquivoResultado(
    bool Ok,
    Stream? Conteudo,
    string? ContentType,
    string? Mensagem,
    MinhaEscolaFalha Falha);
