import { apiRequest } from "@/lib/api/client";
import type { Livro, Capitulo } from "@/types/turma";

export async function listarLivros(): Promise<Livro[]> {
  return apiRequest<Livro[]>("/api/livros");
}

export async function buscarLivro(id: number): Promise<Livro> {
  return apiRequest<Livro>(`/api/livros/${id}`);
}

export async function criarLivro(dados: Partial<Livro>): Promise<Livro> {
  return apiRequest<Livro>("/api/livros", { method: "POST", body: dados });
}

export async function editarLivro(id: number, dados: Partial<Livro>): Promise<Livro> {
  return apiRequest<Livro>(`/api/livros/${id}`, { method: "PUT", body: dados });
}

export async function listarCapitulos(livroId: number): Promise<Capitulo[]> {
  return apiRequest<Capitulo[]>(`/api/livros/${livroId}/capitulos`);
}

export async function criarCapitulo(livroId: number, dados: Partial<Capitulo>): Promise<Capitulo> {
  return apiRequest<Capitulo>(`/api/livros/${livroId}/capitulos`, {
    method: "POST",
    body: dados,
  });
}

export async function editarCapitulo(id: number, dados: Partial<Capitulo>): Promise<Capitulo> {
  return apiRequest<Capitulo>(`/api/capitulos/${id}`, { method: "PUT", body: dados });
}
