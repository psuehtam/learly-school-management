import { apiRequest } from "@/lib/api/client";

export type LivroCapituloEscolaDto = {
  id: number;
  nome: string;
  duracaoMinutos: number;
  status: string;
};

/** Catálogo de livros/níveis da escola. */
export type LivroEscolaDto = {
  id: number;
  nome: string;
  status: "Ativo" | "Inativo";
  quantidadeCapitulos: number;
  totalDuracaoMinutos: number;
  /** Preenchido no GET por id; ausente ou `null` na listagem. */
  capitulos?: LivroCapituloEscolaDto[] | null;
};

export type CriarLivroEscolaPayload = {
  nome: string;
  capitulos: { nome?: string; duracaoMinutos: number }[];
};

export type AtualizarLivroEscolaPayload = {
  nome?: string;
  status?: "Ativo" | "Inativo";
  capitulosAulas?: { capituloId: number; duracaoMinutos: number }[];
  capitulosNovos?: { nome?: string; duracaoMinutos: number }[];
};

// ── Planejamento ──────────────────────────────────────────────────────────────

export type PlanejamentoAlocacaoDto = {
  id: number;
  capituloId: number;
  capituloNome: string;
  minutosAlocados: number;
  ordem: number;
};

export type PlanejamentoDiaDto = {
  id: number;
  ordem: number;
  minutosUsados: number;
  alocacoes: PlanejamentoAlocacaoDto[];
};

export type LivroPlanejamentoDto = {
  livroId: number;
  livroNome: string;
  duracaoAulaMinutos: number;
  dias: PlanejamentoDiaDto[];
};

export type SalvarPlanejamentoPayload = {
  dias: {
    ordem: number;
    alocacoes: { capituloId: number; minutosAlocados: number; ordem: number }[];
  }[];
};

export async function listarLivrosEscola(): Promise<LivroEscolaDto[]> {
  return apiRequest<LivroEscolaDto[]>("/api/livros");
}

export async function obterLivroEscola(id: number): Promise<LivroEscolaDto> {
  return apiRequest<LivroEscolaDto>(`/api/livros/${id}`);
}

export async function criarLivroEscola(payload: CriarLivroEscolaPayload): Promise<LivroEscolaDto> {
  return apiRequest<LivroEscolaDto>("/api/livros", { method: "POST", body: payload });
}

export async function atualizarLivroEscola(id: number, payload: AtualizarLivroEscolaPayload): Promise<LivroEscolaDto> {
  return apiRequest<LivroEscolaDto>(`/api/livros/${id}`, { method: "PATCH", body: payload });
}

export async function obterPlanejamentoLivro(id: number): Promise<LivroPlanejamentoDto> {
  return apiRequest<LivroPlanejamentoDto>(`/api/livros/${id}/planejamento`);
}

export async function salvarPlanejamentoLivro(
  id: number,
  payload: SalvarPlanejamentoPayload,
): Promise<LivroPlanejamentoDto> {
  return apiRequest<LivroPlanejamentoDto>(`/api/livros/${id}/planejamento`, {
    method: "PUT",
    body: payload,
  });
}
