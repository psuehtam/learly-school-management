"use client";

import { useAuth } from "./use-auth";
import type { PermissaoNome } from "@/types/permissao";

/** Verifica se o usuário logado tem UMA permissão específica. */
export function usePermission(permissao: PermissaoNome): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return user.permissions.includes(permissao);
}

/** Verifica se o usuário tem TODAS as permissões (AND). */
export function usePermissions(permissoes: PermissaoNome[]): boolean {
  const { user } = useAuth();
  if (!user || permissoes.length === 0) return false;
  return permissoes.every((p) => user.permissions.includes(p));
}

/** Verifica se o usuário tem pelo menos UMA das permissões (OR). */
export function useAnyPermission(permissoes: PermissaoNome[]): boolean {
  const { user } = useAuth();
  if (!user || permissoes.length === 0) return false;
  return permissoes.some((p) => user.permissions.includes(p));
}
