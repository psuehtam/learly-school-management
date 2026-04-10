import type { User } from "@/lib/api/types";
import type { PermissaoNome } from "@/types/permissao";
import { SCHOOL_MENU, buildRoutePermissions } from "@/lib/menu-config";
import { resolveLandingFromUser } from "@/lib/landing-page";

/**
 * Fonte única: as permissões de rota são derivadas do menu-config.
 * Se adicionar um item no menu, a proteção de rota acompanha automaticamente.
 */
const ROUTE_PERMISSIONS: Record<string, PermissaoNome[]> = buildRoutePermissions(SCHOOL_MENU);

function getRequiredPermissions(pathname: string): PermissaoNome[] | null {
  for (const [prefix, perms] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return perms;
    }
  }
  return null;
}

/**
 * Verifica se o usuário pode acessar a rota.
 * - Super Admin: só /super-admin.
 * - Usuário de escola: verifica se tem pelo menos uma das permissões.
 * - Rota não mapeada: acesso permitido.
 */
export function canAccessRoute(user: User, pathname: string): boolean {
  const isSuperPath = pathname === "/super-admin" || pathname.startsWith("/super-admin/");

  if (user.isSuperAdmin) return isSuperPath;
  if (isSuperPath) return false;

  const required = getRequiredPermissions(pathname);
  if (!required || required.length === 0) return true;

  return required.some((p) => user.permissions.includes(p));
}

/**
 * Rota "home" correta baseada nas permissões do usuário.
 * Usada para redirecionar quando acesso é negado.
 */
export function getHomeRoute(user: User): string {
  return resolveLandingFromUser(user);
}
