import { apiRequest } from "@/lib/api/client";

export interface Reposicao {
  id: number;
  escolaId: number;
  aulaOriginalId: number;
  alunoId: number;
  professorId: number;
  dataReposicao: string;
  horarioInicio: string;
  horarioFim: string;
  status: "Agendada" | "Realizada" | "Cancelada";
}

export async function listarReposicoes(
  filtros?: Record<string, string>,
): Promise<Reposicao[]> {
  const params = filtros ? `?${new URLSearchParams(filtros)}` : "";
  return apiRequest<Reposicao[]>(`/api/reposicoes${params}`);
}

export async function agendarReposicao(dados: Partial<Reposicao>): Promise<Reposicao> {
  return apiRequest<Reposicao>("/api/reposicoes", { method: "POST", body: dados });
}

export async function realizarReposicao(id: number): Promise<void> {
  await apiRequest<void>(`/api/reposicoes/${id}/realizar`, { method: "PATCH" });
}

export async function cancelarReposicao(id: number): Promise<void> {
  await apiRequest<void>(`/api/reposicoes/${id}/cancelar`, { method: "PATCH" });
}
