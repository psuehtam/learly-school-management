import { apiRequest } from "@/lib/api/client";
import type {
  Parcela,
  MovimentacaoFinanceira,
  ContaBancaria,
  CategoriaFinanceira,
} from "@/types/financeiro";

export async function listarParcelas(filtros?: Record<string, string>): Promise<Parcela[]> {
  const params = filtros ? `?${new URLSearchParams(filtros)}` : "";
  return apiRequest<Parcela[]>(`/api/parcelas${params}`);
}

export async function buscarParcela(id: number): Promise<Parcela> {
  return apiRequest<Parcela>(`/api/parcelas/${id}`);
}

export async function criarParcela(dados: Partial<Parcela>): Promise<Parcela> {
  return apiRequest<Parcela>("/api/parcelas", { method: "POST", body: dados });
}

export async function darBaixaParcela(
  id: number,
  dados: { dataPagamento: string; valorPago: number; formaPagamento: string },
): Promise<Parcela> {
  return apiRequest<Parcela>(`/api/parcelas/${id}/baixa`, {
    method: "PATCH",
    body: dados,
  });
}

export async function estornarParcela(id: number, motivo: string): Promise<void> {
  await apiRequest<void>(`/api/parcelas/${id}/estornar`, {
    method: "PATCH",
    body: { motivo },
  });
}

export async function listarMovimentacoes(
  filtros?: Record<string, string>,
): Promise<MovimentacaoFinanceira[]> {
  const params = filtros ? `?${new URLSearchParams(filtros)}` : "";
  return apiRequest<MovimentacaoFinanceira[]>(`/api/movimentacoes${params}`);
}

export async function listarContasBancarias(): Promise<ContaBancaria[]> {
  return apiRequest<ContaBancaria[]>("/api/contas-bancarias");
}

export async function listarCategorias(): Promise<CategoriaFinanceira[]> {
  return apiRequest<CategoriaFinanceira[]>("/api/categorias-financeiras");
}
