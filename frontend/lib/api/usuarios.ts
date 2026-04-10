import { apiRequest } from "@/lib/api/client";
import type { Usuario, Perfil } from "@/types/usuario";

export async function listarUsuarios(): Promise<Usuario[]> {
  return apiRequest<Usuario[]>("/api/usuarios");
}

export async function buscarUsuario(id: number): Promise<Usuario> {
  return apiRequest<Usuario>(`/api/usuarios/${id}`);
}

export async function criarUsuario(dados: Partial<Usuario> & { senha: string }): Promise<Usuario> {
  return apiRequest<Usuario>("/api/usuarios", { method: "POST", body: dados });
}

export async function editarUsuario(id: number, dados: Partial<Usuario>): Promise<Usuario> {
  return apiRequest<Usuario>(`/api/usuarios/${id}`, { method: "PUT", body: dados });
}

export async function inativarUsuario(id: number): Promise<void> {
  await apiRequest<void>(`/api/usuarios/${id}/inativar`, { method: "PATCH" });
}

export async function listarPerfis(): Promise<Perfil[]> {
  return apiRequest<Perfil[]>("/api/perfis");
}

export async function listarPermissoes(): Promise<{ id: number; nome: string; descricao: string }[]> {
  return apiRequest<{ id: number; nome: string; descricao: string }[]>("/api/permissoes");
}

export async function atribuirPermissao(usuarioId: number, permissaoId: number): Promise<void> {
  await apiRequest<void>(`/api/usuarios/${usuarioId}/permissoes`, {
    method: "POST",
    body: { permissaoId },
  });
}

export async function revogarPermissao(usuarioId: number, permissaoId: number): Promise<void> {
  await apiRequest<void>(`/api/usuarios/${usuarioId}/permissoes/${permissaoId}`, {
    method: "DELETE",
  });
}
