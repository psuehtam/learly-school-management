import type { ContratoTemplate, CriarPreAlunoPayload, PreAlunoDetalhe } from "@/types/comercial";
import {
  extrairObservacoesComerciaisUsuario,
  extrairUltimaRecusaSecretaria,
  type UltimaRecusaSecretaria,
} from "@/lib/preAlunoRecusa";

export type OpcaoRespAdulto = "proprio" | "outro" | null;

export function resolverTemplateIdPorNome(
  tipoContrato: string,
  templates: ContratoTemplate[],
): number | "" {
  const nome = tipoContrato.trim().toLowerCase();
  if (!nome) return "";
  const t = templates.find((x) => x.nome.trim().toLowerCase() === nome);
  return t?.id ?? "";
}

export function mapDetalheParaFormulario(d: PreAlunoDetalhe): {
  form: CriarPreAlunoPayload;
  templateContratoId: number | "";
  tipoResponsavelAdulto: OpcaoRespAdulto;
  motivoRecusa: UltimaRecusaSecretaria | null;
} {
  const motivoRecusa = extrairUltimaRecusaSecretaria(d.observacoesComerciais);

  let tipoResponsavelAdulto: OpcaoRespAdulto = null;
  if (d.eProprioResponsavel) {
    tipoResponsavelAdulto = "proprio";
  } else if (d.responsavelNome?.trim() || d.responsavelCpfCnpj?.trim()) {
    tipoResponsavelAdulto = "outro";
  }

  const form: CriarPreAlunoPayload = {
    eProprioResponsavel: d.eProprioResponsavel,
    alunoCpf: d.alunoCpf ?? "",
    responsavelTipoPessoa: d.responsavelTipoPessoa || "Fisica",
    responsavelCpfCnpj: d.responsavelCpfCnpj ?? "",
    responsavelNome: d.responsavelNome ?? "",
    responsavelSobrenome: d.responsavelSobrenome ?? "",
    responsavelTelefone: d.responsavelTelefone ?? "",
    responsavelSexo: d.responsavelSexo ?? "",
    responsavelGrauParentesco: d.responsavelGrauParentesco ?? "",
    responsavelEstadoCivil: d.responsavelEstadoCivil ?? "",
    responsavelCorRaca: d.responsavelCorRaca ?? "",
    responsavelNacionalidade: d.responsavelNacionalidade ?? "",
    responsavelDataNascimento: d.responsavelDataNascimento ?? "",
    responsavelNaturalidadeCidade: d.responsavelNaturalidadeCidade ?? "",
    responsavelNaturalidadeEstado: d.responsavelNaturalidadeEstado ?? "",
    responsavelRgNumero: d.responsavelRgNumero ?? "",
    responsavelRgExpedicao: d.responsavelRgExpedicao ?? "",
    responsavelRgOrgao: d.responsavelRgOrgao ?? "",
    nome: d.nomeAluno,
    sobrenome: d.sobrenomeAluno,
    dataNascimento: d.dataNascimentoAluno,
    telefoneAluno: d.telefoneAluno ?? "",
    livroInteresseId: d.livroInteresseId,
    tipoContrato: d.tipoContrato,
    valorMensalidade: d.valorMensalidade,
    formaPagamento: d.formaPagamento ?? "",
    valorMatricula: d.valorMatricula,
    formaPagamentoMatricula: d.formaPagamentoMatricula ?? "",
    valorMaterial: d.valorMaterial ?? 0,
    origemCaptacao: d.origemCaptacao,
    usaTransporteVan: d.usaTransporteVan,
    transporteCep: d.transporteCep ?? "",
    transporteLogradouro: d.transporteLogradouro ?? "",
    transporteNumero: d.transporteNumero ?? "",
    transporteComplemento: d.transporteComplemento ?? "",
    transporteBairro: d.transporteBairro ?? "",
    transporteCidade: d.transporteCidade ?? "",
    transporteUf: d.transporteUf ?? "",
    observacoesComerciais: extrairObservacoesComerciaisUsuario(d.observacoesComerciais),
  };

  return {
    form,
    templateContratoId: "", // preenchido pelo caller com templates
    tipoResponsavelAdulto,
    motivoRecusa,
  };
}
