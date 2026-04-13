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

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Intercepta pedidos antes de chegarem às rotas:
 * - rotas privadas sem sessão (`auth_session`) → redireciona para `/login` (com `?next=`);
 * - `/login` com sessão → redireciona para `/`.
 * Segurança real de permissões ocorre no backend e na validação de `GET /api/me` no SessionGate.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("auth_session")?.value;
  const hasSession = session === "1";

  if (isPrivatePath(pathname) && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|api).*)"],
};
