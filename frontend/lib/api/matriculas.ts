import { apiRequest } from "@/lib/api/client";

export type MatriculaStatus = "Em Espera" | "Ativo" | "Concluido" | "Trancado" | "Cancelado";

export interface MatriculaListItem {
  id: number;
  escolaId: number;
  alunoId: number;
  /** Nome + sobrenome do aluno (preenchido pela API na listagem). */
  alunoNomeCompleto?: string;
  turmaId: number | null;
  /** Nome da turma quando já vinculada. */
  turmaNome?: string | null;
  dataMatricula: string;
  status: MatriculaStatus;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface ListarMatriculasFiltro {
  status?: MatriculaStatus;
  /** "inativos" → Cancelado + Trancado + Concluido */
  grupo?: "inativos";
  alunoId?: number;
  turmaId?: number;
}

/** Normaliza chaves da API (camelCase ou PascalCase) para o tipo usado no app. */
function normalizarItemMatricula(raw: MatriculaListItem): MatriculaListItem {
  const r = raw as MatriculaListItem & {
    AlunoNomeCompleto?: string;
    TurmaNome?: string | null;
  };
  const nomeRaw = raw.alunoNomeCompleto ?? r.AlunoNomeCompleto;
  const nome = typeof nomeRaw === "string" ? nomeRaw.trim() : "";
  const turmaRaw = raw.turmaNome ?? r.TurmaNome;
  const turma =
    turmaRaw === null || turmaRaw === undefined
      ? turmaRaw
      : typeof turmaRaw === "string"
        ? turmaRaw.trim() || null
        : turmaRaw;
  return {
    ...raw,
    alunoNomeCompleto: nome || undefined,
    turmaNome: turma as string | null | undefined,
  };
}

export async function listarMatriculas(filtro?: ListarMatriculasFiltro): Promise<MatriculaListItem[]> {
  const params = new URLSearchParams();

  if (filtro?.grupo) params.set("grupo", filtro.grupo);
  else if (filtro?.status) params.set("status", filtro.status);
  if (typeof filtro?.alunoId === "number") params.set("alunoId", String(filtro.alunoId));
  if (typeof filtro?.turmaId === "number") params.set("turmaId", String(filtro.turmaId));

  const query = params.toString();
  const data = await apiRequest<MatriculaListItem[]>(`/api/matriculas${query ? `?${query}` : ""}`);
  return data.map(normalizarItemMatricula);
}

export async function criarMatricula(payload: {
  alunoId: number;
  turmaId?: number;
  dataMatricula: string;
}): Promise<{ id: number }> {
  return apiRequest<{ id: number }>("/api/matriculas", { method: "POST", body: payload });
}

export async function cancelarMatriculaById(matriculaId: number): Promise<void> {
  await apiRequest<void>(`/api/matriculas/${matriculaId}/cancelar`, { method: "PATCH" });
}

/** Remove o aluno apenas desta turma; o registro fica no histórico e ele pode entrar em outra turma. */
export async function removerAlunoDaTurma(matriculaId: number): Promise<void> {
  await apiRequest<void>(`/api/matriculas/${matriculaId}/remover-da-turma`, { method: "PATCH" });
}

export async function vincularTurmaMatricula(matriculaId: number, turmaId: number): Promise<void> {
  await apiRequest<void>(`/api/matriculas/${matriculaId}/vincular-turma`, {
    method: "PATCH",
    body: { turmaId },
  });
}
