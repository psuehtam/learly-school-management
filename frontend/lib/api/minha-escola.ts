import { apiRequest } from "@/lib/api/client";

export type MinhaEscolaDto = {
  id: number;
  codigoEscola: string;
  nomeFantasia: string;
  razaoSocial?: string | null;
  cnpj?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  temLogo: boolean;
};

export type MetricaAula = "POR_DIA" | "POR_HORA";

export type EscolaConfiguracoesDto = {
  minAlunosTurma: number;
  maxAlunosTurma?: number | null;
  metricaAula: MetricaAula;
  duracaoAulaMinutos: number;
};

export type AtualizarMinhaEscolaPayload = {
  nomeFantasia: string;
  razaoSocial?: string;
  cnpj?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
};

export type AtualizarEscolaConfiguracoesPayload = {
  minAlunosTurma: number;
  maxAlunosTurma?: number | null;
  metricaAula: MetricaAula;
  duracaoAulaMinutos: number;
};

export async function obterMinhaEscola(): Promise<MinhaEscolaDto> {
  return apiRequest<MinhaEscolaDto>("/api/minha-escola");
}

export async function atualizarMinhaEscola(payload: AtualizarMinhaEscolaPayload): Promise<MinhaEscolaDto> {
  return apiRequest<MinhaEscolaDto>("/api/minha-escola", { method: "PUT", body: payload });
}

export async function obterConfiguracoesEscola(): Promise<EscolaConfiguracoesDto> {
  return apiRequest<EscolaConfiguracoesDto>("/api/minha-escola/configuracoes");
}

export async function obterConfiguracoesEscolaConsultaTurmas(): Promise<EscolaConfiguracoesDto> {
  return apiRequest<EscolaConfiguracoesDto>("/api/minha-escola/configuracoes/consulta-turmas");
}

export async function atualizarConfiguracoesEscola(
  payload: AtualizarEscolaConfiguracoesPayload,
): Promise<EscolaConfiguracoesDto> {
  return apiRequest<EscolaConfiguracoesDto>("/api/minha-escola/configuracoes", {
    method: "PUT",
    body: payload,
  });
}

export async function enviarLogoEscola(arquivo: File): Promise<void> {
  const form = new FormData();
  form.append("arquivo", arquivo);
  await apiRequest<void>("/api/minha-escola/logo", { method: "POST", body: form });
}

/** URL autenticada via cookie de sessão (img src com credentials). */
export function urlLogoMinhaEscola(): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  return `${base}/api/minha-escola/logo`;
}
