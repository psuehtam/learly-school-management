"use client";

import type { ReactNode } from "react";
import type { User } from "@/lib/api/types";
import type { PermissaoNome } from "@/types/permissao";
import { hasAnyPermission, hasRole } from "@/lib/permissions";

interface RequirePermissionProps {
  user: User | null | undefined;
  /** Pelo menos uma dessas permissões (OR). */
  permissao?: PermissaoNome;
  /** Pelo menos uma dessas permissões (OR). */
  permissoes?: PermissaoNome[];
  /** Pelo menos um desses roles (OR, case-insensitive). */
  roles?: string[];
  /** Renderiza se a condição NÃO for atendida. */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Renderiza children somente se o usuário tiver a permissão/role requerida.
 * Se `permissoes` e `roles` forem ambos informados, basta um deles bater (OR).
 */
export function RequirePermission({
  user,
  permissao,
  permissoes,
  roles,
  fallback = null,
  children,
}: RequirePermissionProps) {
  if (!user) return <>{fallback}</>;

  const allPerms = [
    ...(permissao ? [permissao] : []),
    ...(permissoes ?? []),
  ];

  const permOk = allPerms.length > 0 ? hasAnyPermission(user, allPerms) : false;
  const roleOk = roles && roles.length > 0 ? roles.some((r) => hasRole(user, r)) : false;
  const noConstraint = allPerms.length === 0 && (!roles || roles.length === 0);

  if (noConstraint || permOk || roleOk) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
