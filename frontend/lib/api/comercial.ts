import { apiRequest } from "@/lib/api/client";
import type {
  PreAlunoListItem,
  ContratoGerado,
  ContratoTemplate,
  ContratoVariavel,
  ContratoGeradoData,
  CriarContratoTemplatePayload,
  EditarContratoTemplatePayload,
  GerarContratoPayload,
  LivroInteresseOpcao,
  CriarPreAlunoPayload,
  PreAlunoDetalhe,
} from "@/types/comercial";
import type { Aluno } from "@/types/aluno";

export async function listarLivrosInteressePreAluno(): Promise<LivroInteresseOpcao[]> {
  return apiRequest<LivroInteresseOpcao[]>("/api/pre-alunos/livros-interesse");
}

export async function listarPreAlunos(filtros?: Record<string, string>): Promise<PreAlunoListItem[]> {
  const params = filtros ? `?${new URLSearchParams(filtros)}` : "";
  return apiRequest<PreAlunoListItem[]>(`/api/pre-alunos${params}`);
}

export async function buscarPreAluno(id: number): Promise<PreAlunoDetalhe> {
  return apiRequest<PreAlunoDetalhe>(`/api/pre-alunos/${id}`);
}

function limparDatasOpcionaisPreAluno(dados: CriarPreAlunoPayload): CriarPreAlunoPayload {
  const out = { ...dados };
  for (const k of ["responsavelDataNascimento", "responsavelRgExpedicao"] as const) {
    const v = out[k];
    if (v === "" || v == null) delete out[k];
  }
  return out;
}

export async function criarPreAluno(dados: CriarPreAlunoPayload): Promise<{ id: number }> {
  return apiRequest<{ id: number }>("/api/pre-alunos", {
    method: "POST",
    body: limparDatasOpcionaisPreAluno(dados),
  });
}

export async function editarPreAluno(id: number, dados: CriarPreAlunoPayload): Promise<void> {
  await apiRequest<void>(`/api/pre-alunos/${id}`, {
    method: "PUT",
    body: limparDatasOpcionaisPreAluno(dados),
  });
}

export async function cancelarPreAluno(id: number): Promise<void> {
  await apiRequest<void>(`/api/pre-alunos/${id}/cancelar`, { method: "PATCH" });
}

export async function submeterPreAlunoParaAprovacao(id: number): Promise<void> {
  await apiRequest<void>(`/api/pre-alunos/${id}/submeter-aprovacao`, { method: "PATCH" });
}

export interface AprovarPreAlunoPayload {
  eProprioResponsavel: boolean;
  sexo: string;
  dataIngresso: string;
  cpf?: string | null;
  cep: string;
  tipoLogradouro: string;
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  municipio: string;
  alunoTelefone?: string | null;
  responsavelNome?: string | null;
  responsavelSobrenome?: string | null;
  responsavelCpf?: string | null;
  responsavelSexo?: string | null;
  responsavelTelefone?: string | null;
  responsavelCep?: string | null;
  responsavelTipoLogradouro?: string | null;
  responsavelLogradouro?: string | null;
  responsavelNumero?: string | null;
  responsavelComplemento?: string | null;
  responsavelBairro?: string | null;
  responsavelMunicipio?: string | null;
  corRaca?: string | null;
  estadoCivil?: string | null;
  profissao?: string | null;
  registroEscolar?: string | null;
  nacionalidade?: string | null;
  dataEntradaPais?: string | null;
  naturalidadeCidade?: string | null;
  naturalidadeEstado?: string | null;
  rgNumero?: string | null;
  rgExpedicao?: string | null;
  rgOrgao?: string | null;
}

export interface AprovarPreAlunoResponse {
  alunoId: number;
  matriculaId: number;
}

export interface ResponsavelDadosSugeridos {
  nome: string;
  sobrenome: string;
  cpfCnpj: string;
  telefone: string | null;
  sexo: string | null;
  grauParentesco: string | null;
  estadoCivil: string | null;
  corRaca: string | null;
  nacionalidade: string | null;
  dataNascimento: string | null;
  naturalidadeCidade: string | null;
  naturalidadeEstado: string | null;
  rgNumero: string | null;
  rgExpedicao: string | null;
  rgOrgao: string | null;
  cep: string | null;
  tipoLogradouro: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
}

export interface PrepararConversaoPreAluno {
  preAlunoId: number;
  nomeAluno: string;
  sobrenomeAluno: string;
  dataNascimentoAluno: string;
  eProprioResponsavelSugerido: boolean;
  alunoCpfSugerido: string | null;
  telefoneAluno: string | null;
  responsavelCpfCnpj: string;
  responsavelNomeCompleto: string;
  responsavel: ResponsavelDadosSugeridos;
  usaTransporteVan: boolean;
  transporteCep: string | null;
  transporteLogradouro: string | null;
  transporteNumero: string | null;
  transporteComplemento: string | null;
  transporteBairro: string | null;
  transporteCidade: string | null;
  transporteUf: string | null;
  camposObrigatoriosFaltantes: string[];
  documentos: import("@/config/preAlunoDocumentos").PreAlunoDocumentoItem[];
}

export async function prepararConversaoPreAluno(preAlunoId: number): Promise<PrepararConversaoPreAluno> {
  return apiRequest<PrepararConversaoPreAluno>(`/api/pre-alunos/${preAlunoId}/preparar-conversao`);
}

export async function listarDocumentosPreAluno(preAlunoId: number): Promise<import("@/config/preAlunoDocumentos").PreAlunoDocumentoItem[]> {
  return apiRequest(`/api/pre-alunos/${preAlunoId}/documentos`);
}

export async function uploadDocumentoPreAluno(
  preAlunoId: number,
  tipoCodigo: string,
  arquivo: File,
  nomeExibicao?: string,
): Promise<import("@/config/preAlunoDocumentos").PreAlunoDocumentoItem> {
  const form = new FormData();
  form.append("tipoCodigo", tipoCodigo);
  form.append("arquivo", arquivo);
  if (nomeExibicao) form.append("nomeExibicao", nomeExibicao);

  return apiRequest(`/api/pre-alunos/${preAlunoId}/documentos`, {
    method: "POST",
    body: form,
  });
}

export function urlDocumentoPreAluno(preAlunoId: number, urlDownload: string): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  const path = urlDownload.startsWith("/") ? urlDownload : `/${urlDownload}`;
  return `${base}${path}`;
}

export async function aprovarMatricula(
  preAlunoId: number,
  dados: AprovarPreAlunoPayload,
): Promise<AprovarPreAlunoResponse> {
  return apiRequest<AprovarPreAlunoResponse>(`/api/pre-alunos/${preAlunoId}/aprovar`, {
    method: "PATCH",
    body: dados,
  });
}

export async function reprovarMatricula(preAlunoId: number, motivo: string): Promise<void> {
  await apiRequest<void>(`/api/pre-alunos/${preAlunoId}/reprovar`, {
    method: "PATCH",
    body: { motivo },
  });
}

export async function finalizarMatricula(preAlunoId: number): Promise<Aluno> {
  return apiRequest<Aluno>(`/api/pre-alunos/${preAlunoId}/finalizar`, { method: "POST" });
}

// ──────────────── Templates de Contrato ────────────────

export async function listarContratoTemplates(): Promise<ContratoTemplate[]> {
  return apiRequest<ContratoTemplate[]>("/api/contratos/templates");
}

export async function buscarContratoTemplateAtivo(): Promise<ContratoTemplate> {
  return apiRequest<ContratoTemplate>("/api/contratos/templates/ativo");
}

export async function buscarContratoTemplate(id: number): Promise<ContratoTemplate> {
  return apiRequest<ContratoTemplate>(`/api/contratos/templates/${id}`);
}

export async function criarContratoTemplate(dados: CriarContratoTemplatePayload): Promise<void> {
  await apiRequest<void>("/api/contratos/templates", { method: "POST", body: dados });
}

export async function editarContratoTemplate(id: number, dados: EditarContratoTemplatePayload): Promise<void> {
  await apiRequest<void>(`/api/contratos/templates/${id}`, { method: "PUT", body: dados });
}

export async function ativarContratoTemplate(id: number): Promise<void> {
  await apiRequest<void>(`/api/contratos/templates/${id}/ativar`, { method: "PATCH" });
}

export async function inativarContratoTemplate(id: number): Promise<void> {
  await apiRequest<void>(`/api/contratos/templates/${id}/inativar`, { method: "PATCH" });
}

export async function listarVariaveisContrato(): Promise<ContratoVariavel[]> {
  return apiRequest<ContratoVariavel[]>("/api/contratos/templates/variaveis");
}

// ──────────────── Contratos Gerados ────────────────

export async function listarContratosGerados(): Promise<ContratoGerado[]> {
  return apiRequest<ContratoGerado[]>("/api/contratos/gerados");
}

export async function listarContratosGeradosPorPreAluno(preAlunoId: number): Promise<ContratoGerado[]> {
  return apiRequest<ContratoGerado[]>(`/api/contratos/gerados/pre-aluno/${preAlunoId}`);
}

export async function gerarContrato(dados: GerarContratoPayload): Promise<ContratoGeradoData> {
  return apiRequest<ContratoGeradoData>("/api/contratos/gerar", { method: "POST", body: dados });
}
