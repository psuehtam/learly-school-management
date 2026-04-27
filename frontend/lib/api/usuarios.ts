import { apiRequest } from "@/lib/api/client";

export type UsuarioMinhaEscola = {
  id: number;
  nomeCompleto: string;
  email: string;
  perfilId: number;
  perfilNome: string;
  status: "Ativo" | "Inativo";
};

export type PerfilMinhaEscola = {
  id: number;
  nome: string;
  status: "Ativo" | "Inativo";
};

export type CriarUsuarioMinhaEscolaPayload = {
  nomeCompleto: string;
  email: string;
  senha: string;
  perfilId: number;
};

export type EditarUsuarioMinhaEscolaPayload = {
  nomeCompleto: string;
  email: string;
  perfilId: number;
  status: "Ativo" | "Inativo";
};

export async function listarUsuariosMinhaEscola(): Promise<UsuarioMinhaEscola[]> {
  return apiRequest<UsuarioMinhaEscola[]>("/api/usuarios/minha-escola");
}

export async function listarPerfisMinhaEscola(): Promise<PerfilMinhaEscola[]> {
  return apiRequest<PerfilMinhaEscola[]>("/api/usuarios/minha-escola/perfis");
}

export async function criarUsuarioMinhaEscola(
  dados: CriarUsuarioMinhaEscolaPayload,
): Promise<{ id: number }> {
  return apiRequest<{ id: number }>("/api/usuarios/minha-escola", {
    method: "POST",
    body: dados,
  });
}

export async function editarUsuarioMinhaEscola(
  usuarioId: number,
  dados: EditarUsuarioMinhaEscolaPayload,
): Promise<void> {
  await apiRequest<void>(`/api/usuarios/minha-escola/${usuarioId}`, {
    method: "PUT",
    body: dados,
  });
}
