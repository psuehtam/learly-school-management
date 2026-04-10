import type { User } from "@/lib/api/types";
import { resolveLandingFromUser } from "@/lib/landing-page";
import { canAccessRoute } from "@/lib/route-access";

/**
 * Garante que `next` seja apenas URL interna segura.
 * Bloqueia open redirect (http://, https://, //dominio, javascript:, etc).
 */
export function isSafeInternalNext(next: string | null | undefined): next is string {
  if (!next) return false;
  if (!next.startsWith("/")) return false;
  if (next.startsWith("//")) return false;
  if (next.includes("://")) return false;
  if (next.toLowerCase().startsWith("/javascript:")) return false;
  return true;
}

/** Extrai pathname de um next interno (mantém /foo de /foo?x=1#h). */
function getPathnameFromNext(next: string): string {
  try {
    const url = new URL(next, "http://localhost");
    return url.pathname || "/";
  } catch {
    return next.split("?")[0]?.split("#")[0] || "/";
  }
}

/**
 * Resolve redirecionamento pós-login:
 * 1) usa `next` se for seguro e autorizado;
 * 2) caso contrário, cai no landing dinâmico por permissões;
 * 3) sem rota válida, landing retorna /unauthorized.
 */
export function resolvePostLoginTarget(user: User, next: string | null): string {
  if (isSafeInternalNext(next)) {
    const pathname = getPathnameFromNext(next);
    if (canAccessRoute(user, pathname)) {
      return next;
    }
  }
  return resolveLandingFromUser(user);
}

