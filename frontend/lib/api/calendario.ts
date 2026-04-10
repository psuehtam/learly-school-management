import { apiRequest } from "@/lib/api/client";

export interface EventoCalendario {
  id: number;
  escolaId: number;
  titulo: string;
  descricao?: string;
  dataInicio: string;
  dataFim?: string;
  tipo: string;
}

export async function listarEventos(mes: number, ano: number): Promise<EventoCalendario[]> {
  return apiRequest<EventoCalendario[]>(`/api/calendario?mes=${mes}&ano=${ano}`);
}

export async function criarEvento(dados: Partial<EventoCalendario>): Promise<EventoCalendario> {
  return apiRequest<EventoCalendario>("/api/calendario", { method: "POST", body: dados });
}

export async function editarEvento(
  id: number,
  dados: Partial<EventoCalendario>,
): Promise<EventoCalendario> {
  return apiRequest<EventoCalendario>(`/api/calendario/${id}`, { method: "PUT", body: dados });
}

export async function deletarEvento(id: number): Promise<void> {
  await apiRequest<void>(`/api/calendario/${id}`, { method: "DELETE" });
}
