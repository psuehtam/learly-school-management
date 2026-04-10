import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Prefixos de URL que exigem sessão (JWT presente).
 * Route groups como `(private)` não aparecem na URL; aqui usamos o caminho real.
 */
const PRIVATE_PREFIXES = [
  "/dashboard",
  "/agenda",
  "/alunos",
  "/financeiro",
  "/turmas",
  "/reposicoes",
  "/books",
  "/usuarios",
  "/professor",
  "/secretaria",
  "/comercial",
  "/calendario",
  "/unauthorized",
  "/super-admin",
];

/** Rotas do app da escola (tenant). Super Admin não deve usá-las — vai para /super-admin. */
const SCHOOL_PREFIXES = [
  "/dashboard",
  "/agenda",
  "/alunos",
  "/financeiro",
  "/turmas",
  "/reposicoes",
  "/books",
  "/usuarios",
  "/professor",
  "/secretaria",
  "/comercial",
  "/calendario",
];

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isSchoolPath(pathname: string): boolean {
  return SCHOOL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isSuperAdminPath(pathname: string): boolean {
  return pathname === "/super-admin" || pathname.startsWith("/super-admin/");
}

/** Sem validar assinatura — só leitura de roteamento quando `auth_scope` ainda não existe (sessão antiga). */
function resolveScopeFromToken(token: string | undefined): "superadmin" | "school" {
  if (!token) return "school";
  try {
    const parts = token.split(".");
    if (parts.length < 2) return "school";
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const json = atob(padded);
    const payload = JSON.parse(json) as Record<string, unknown>;
    const v = payload.isSuperAdmin;
    if (v === "true" || v === true) return "superadmin";
  } catch {
    /* ignore */
  }
  return "school";
}

/**
 * Intercepta pedidos antes de chegarem às rotas:
 * - rotas privadas sem sessão (`auth_session`) → redireciona para `/login` (com `?next=`);
 * - `/login` com sessão → redireciona para `/super-admin` ou `/` (resolve landing dinâmica);
 * - Super Admin com `auth_scope=superadmin` em rota de escola → `/super-admin`;
 * - usuário de escola em `/super-admin` → `/` (resolve landing dinâmica).
 *
 * Não valida assinatura/expiração do JWT (apenas presença de sessão e escopo).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const session = request.cookies.get("auth_session")?.value;
  const authScopeCookie = request.cookies.get("auth_scope")?.value;
  const scope: "superadmin" | "school" =
    authScopeCookie === "superadmin" || authScopeCookie === "school"
      ? authScopeCookie
      : resolveScopeFromToken(token);
  const hasSession = session === "1" || Boolean(token);

  if (isPrivatePath(pathname) && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && hasSession) {
    const dest = scope === "superadmin" ? "/super-admin" : "/";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (hasSession && scope === "superadmin" && isSchoolPath(pathname)) {
    return NextResponse.redirect(new URL("/super-admin", request.url));
  }

  if (hasSession && scope === "school" && isSuperAdminPath(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|api).*)"],
};
