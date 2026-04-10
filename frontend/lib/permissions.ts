import type { User } from "@/lib/api/types";
import type { PermissaoNome } from "@/types/permissao";

export function hasRole(user: User | null | undefined, role: string): boolean {
  if (!user) return false;
  return user.role.toLowerCase().replace(/\s+/g, "") === role.toLowerCase().replace(/\s+/g, "");
}

export function hasPermission(user: User | null | undefined, permission: PermissaoNome | string): boolean {
  if (!user) return false;
  return user.permissions.includes(permission);
}

export function hasAnyPermission(user: User | null | undefined, permissions: (PermissaoNome | string)[]): boolean {
  if (!user || permissions.length === 0) return false;
  return permissions.some((p) => user.permissions.includes(p));
}

export function hasAllPermissions(user: User | null | undefined, permissions: (PermissaoNome | string)[]): boolean {
  if (!user || permissions.length === 0) return false;
  return permissions.every((p) => user.permissions.includes(p));
}

export function isSuperAdmin(user: User | null | undefined): boolean {
  return Boolean(user?.isSuperAdmin);
}

export function isAdminEscola(user: User | null | undefined): boolean {
  return hasRole(user, "Administrador");
}

export function isProfessor(user: User | null | undefined): boolean {
  return hasRole(user, "Professor");
}

export function isSecretaria(user: User | null | undefined): boolean {
  return hasRole(user, "Secretaria");
}

export function isComercial(user: User | null | undefined): boolean {
  return hasRole(user, "Comercial");
}

export function isCoordenador(user: User | null | undefined): boolean {
  return hasRole(user, "Coordenador");
}
