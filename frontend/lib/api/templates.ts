import { apiRequest } from "@/lib/api/client";

export type PerfilTemplate = {
  id: number;
  nome: string;
};

export type PermissaoCatalogoItem = {
  id: number;
  nome: string;
  descricao?: string | null;
};

export type PermissaoModuloGrupo = {
  modulo: string;
  moduloRotulo: string;
  permissoes: PermissaoCatalogoItem[];
};

export type PerfilTemplatePermissoes = {
  perfilTemplateId: number;
  nome: string;
  permissaoIds: number[];
};

export async function getPerfis(): Promise<PerfilTemplate[]> {
  return apiRequest<PerfilTemplate[]>("/api/templates/perfis");
}

export async function getPermissoesAgrupadas(): Promise<PermissaoModuloGrupo[]> {
  return apiRequest<PermissaoModuloGrupo[]>("/api/templates/permissoes");
}

export async function getPermissoesDoPerfil(perfilTemplateId: number): Promise<PerfilTemplatePermissoes> {
  return apiRequest<PerfilTemplatePermissoes>(
    `/api/templates/perfis/${perfilTemplateId}/permissoes`,
  );
}

export async function salvarPermissoes(
  perfilTemplateId: number,
  permissoesIds: number[],
): Promise<void> {
  await apiRequest<null>(`/api/templates/perfis/${perfilTemplateId}/permissoes`, {
    method: "POST",
    body: { perfilTemplateId, permissoesIds },
  });
}
