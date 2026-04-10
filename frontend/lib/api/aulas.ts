import { apiRequest } from "@/lib/api/client";
import type { Aula, Presenca, Homework, Avaliacao } from "@/types/aula";

export async function listarAulas(filtros?: Record<string, string>): Promise<Aula[]> {
  const params = filtros ? `?${new URLSearchParams(filtros)}` : "";
  return apiRequest<Aula[]>(`/api/aulas${params}`);
}

export async function buscarAula(id: number): Promise<Aula> {
  return apiRequest<Aula>(`/api/aulas/${id}`);
}

export async function criarAula(dados: Partial<Aula>): Promise<{ id: number }> {
  return apiRequest<{ id: number }>("/api/aulas", { method: "POST", body: dados });
}

export async function realizarAula(id: number): Promise<void> {
  await apiRequest<void>(`/api/aulas/${id}/realizar`, { method: "PATCH" });
}

export async function registrarConteudo(id: number, conteudo: string): Promise<void> {
  await apiRequest<void>(`/api/aulas/${id}/conteudo`, {
    method: "PATCH",
    body: { conteudo },
  });
}

export async function cancelarAula(id: number): Promise<void> {
  await apiRequest<void>(`/api/aulas/${id}`, { method: "DELETE" });
}

export async function registrarChamada(
  aulaId: number,
  presencas: { alunoId: number; status: string }[],
): Promise<void> {
  await apiRequest<void>(`/api/aulas/${aulaId}/chamada`, {
    method: "POST",
    body: { presencas },
  });
}

export async function listarPresencas(aulaId: number): Promise<Presenca[]> {
  return apiRequest<Presenca[]>(`/api/aulas/${aulaId}/presencas`);
}

export async function lancarHomework(
  aulaId: number,
  notas: { alunoId: number; nota?: number; observacao?: string }[],
): Promise<void> {
  await apiRequest<void>(`/api/aulas/${aulaId}/homework`, {
    method: "POST",
    body: { notas },
  });
}

export async function listarHomework(aulaId: number): Promise<Homework[]> {
  return apiRequest<Homework[]>(`/api/aulas/${aulaId}/homework`);
}

export async function lancarAvaliacao(
  turmaId: number,
  alunoId: number,
  dados: Partial<Avaliacao>,
): Promise<Avaliacao> {
  return apiRequest<Avaliacao>(`/api/turmas/${turmaId}/avaliacoes`, {
    method: "POST",
    body: { ...dados, alunoId },
  });
}
