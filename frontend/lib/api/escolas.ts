import { apiRequest } from "@/lib/api/client";

export type Escola = {
  id: number;
  codigoEscola: string;
  nomeFantasia: string;
  status: "Ativo" | "Inativo" | string;
};

export type CriarEscolaPayload = {
  codigoEscola: string;
  nomeFantasia: string;
  razaoSocial?: string;
  cnpj?: string;
  adminNomeCompleto?: string;
  adminEmail: string;
  adminPassword: string;
};

export async function listarEscolas(): Promise<Escola[]> {
  return apiRequest<Escola[]>("/api/escolas");
}

export async function criarEscola(payload: CriarEscolaPayload): Promise<Escola> {
  return apiRequest<Escola>("/api/escolas", {
    method: "POST",
    body: payload,
  });
}
