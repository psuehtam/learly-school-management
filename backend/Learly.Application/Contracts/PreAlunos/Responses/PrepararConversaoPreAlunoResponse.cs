namespace Learly.Application.Contracts.PreAlunos.Responses;

public sealed record PrepararConversaoPreAlunoResponse(
    int PreAlunoId,
    string NomeAluno,
    string SobrenomeAluno,
    DateOnly DataNascimentoAluno,
    bool EProprioResponsavelSugerido,
    string? AlunoCpfSugerido,
    string? TelefoneAluno,
    string ResponsavelCpfCnpj,
    string ResponsavelNomeCompleto,
    ResponsavelDadosSugeridosResponse Responsavel,
    bool UsaTransporteVan,
    string? TransporteCep,
    string? TransporteLogradouro,
    string? TransporteNumero,
    string? TransporteComplemento,
    string? TransporteBairro,
    string? TransporteCidade,
    string? TransporteUf,
    IReadOnlyList<string> CamposObrigatoriosFaltantes,
    IReadOnlyList<PreAlunoDocumentoResponse> Documentos);
