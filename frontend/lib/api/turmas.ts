import { apiRequest } from "@/lib/api/client";
import type { Turma, Matricula, ProgressoCapitulo } from "@/types/turma";
import type { Aluno } from "@/types/aluno";

export async function listarTurmas(filtros?: Record<string, string>): Promise<Turma[]> {
  const params = filtros ? `?${new URLSearchParams(filtros)}` : "";
  return apiRequest<Turma[]>(`/api/turmas${params}`);
}

export async function buscarTurma(id: number): Promise<Turma> {
  return apiRequest<Turma>(`/api/turmas/${id}`);
}

export async function criarTurma(dados: Partial<Turma>): Promise<Turma> {
  return apiRequest<Turma>("/api/turmas", { method: "POST", body: dados });
}

export async function editarTurma(id: number, dados: Partial<Turma>): Promise<Turma> {
  return apiRequest<Turma>(`/api/turmas/${id}`, { method: "PUT", body: dados });
}

export async function listarAlunosDaTurma(turmaId: number): Promise<Aluno[]> {
  return apiRequest<Aluno[]>(`/api/turmas/${turmaId}/alunos`);
}

export async function matricularAluno(turmaId: number, alunoId: number): Promise<Matricula> {
  return apiRequest<Matricula>(`/api/turmas/${turmaId}/matriculas`, {
    method: "POST",
    body: { alunoId },
  });
}

export async function cancelarMatricula(matriculaId: number): Promise<void> {
  await apiRequest<void>(`/api/matriculas/${matriculaId}/cancelar`, { method: "PATCH" });
}

export async function listarProgressoCapitulos(turmaId: number): Promise<ProgressoCapitulo[]> {
  return apiRequest<ProgressoCapitulo[]>(`/api/turmas/${turmaId}/progresso`);
}

export async function marcarCapituloConcluido(turmaId: number, capituloId: number): Promise<void> {
  await apiRequest<void>(`/api/turmas/${turmaId}/progresso/${capituloId}`, { method: "PATCH" });
}
