import { apiRequest } from "@/lib/api/client";

export type DataReferenciaResponse = {
  dataHoje: string;
};

export async function obterDataReferenciaServidor(): Promise<DataReferenciaResponse> {
  return apiRequest<DataReferenciaResponse>("/api/sistema/data-referencia");
}
