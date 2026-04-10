import { apiRequest } from "@/lib/api/client";
import type { PreAluno, Contrato, ContratoTemplate } from "@/types/comercial";
import type { Aluno } from "@/types/aluno";

export async function listarPreAlunos(filtros?: Record<string, string>): Promise<PreAluno[]> {
  const params = filtros ? `?${new URLSearchParams(filtros)}` : "";
  return apiRequest<PreAluno[]>(`/api/pre-alunos${params}`);
}

export async function buscarPreAluno(id: number): Promise<PreAluno> {
  return apiRequest<PreAluno>(`/api/pre-alunos/${id}`);
}

export async function criarPreAluno(dados: Partial<PreAluno>): Promise<PreAluno> {
  return apiRequest<PreAluno>("/api/pre-alunos", { method: "POST", body: dados });
}

export async function editarPreAluno(id: number, dados: Partial<PreAluno>): Promise<PreAluno> {
  return apiRequest<PreAluno>(`/api/pre-alunos/${id}`, { method: "PUT", body: dados });
}

export async function cancelarPreAluno(id: number): Promise<void> {
  await apiRequest<void>(`/api/pre-alunos/${id}/cancelar`, { method: "PATCH" });
}

export async function aprovarMatricula(preAlunoId: number): Promise<void> {
  await apiRequest<void>(`/api/pre-alunos/${preAlunoId}/aprovar`, { method: "PATCH" });
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

export async function listarContratos(preAlunoId: number): Promise<Contrato[]> {
  return apiRequest<Contrato[]>(`/api/pre-alunos/${preAlunoId}/contratos`);
}

export async function gerarContrato(preAlunoId: number): Promise<Contrato> {
  return apiRequest<Contrato>(`/api/pre-alunos/${preAlunoId}/contratos`, { method: "POST" });
}

export async function buscarTemplateAtivo(): Promise<ContratoTemplate> {
  return apiRequest<ContratoTemplate>("/api/contratos/template-ativo");
}
