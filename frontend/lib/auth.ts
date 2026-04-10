/**
 * Autenticação no cliente: o JWT fica em localStorage com a chave {@link TOKEN_KEY}.
 * O mesmo valor é espelhado em cookie (mesmo nome) para o middleware na Edge poder
 * verificar apenas a presença do token — localStorage não é enviado ao servidor.
 *
 * {@link AUTH_SCOPE_KEY}: separa Super Admin (global) de usuário de escola (tenant),
 * para o middleware redirecionar cada um para o app certo.
 */

export const TOKEN_KEY = "token";

/** Cookie + localStorage: `superadmin` | `school` */
export const AUTH_SCOPE_KEY = "auth_scope";
/** Cookie curto para middleware validar sessão sem depender do tamanho do JWT. */
export const AUTH_SESSION_KEY = "auth_session";

export type AuthScope = "superadmin" | "school";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24;

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/** Escopo da sessão (após login); útil em componentes client. */
export function getAuthScope(): AuthScope | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(AUTH_SCOPE_KEY);
  return v === "superadmin" || v === "school" ? v : null;
}

export function isSuperAdminSession(): boolean {
  return getAuthScope() === "superadmin";
}

export function isAuthenticated(): boolean {
  const t = getToken();
  return Boolean(t && t.length > 0);
}

/** Grava o JWT e o escopo (Super Admin vs escola) para o middleware e o layout. */
export function saveToken(token: string, options?: { isSuperAdmin?: boolean }): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  const safe = encodeURIComponent(token);
  // Mantém cookie do token por retrocompatibilidade (pode falhar se JWT for muito grande).
  document.cookie = `${TOKEN_KEY}=${safe}; path=/; max-age=${COOKIE_MAX_AGE_SEC}; samesite=lax`;
  // Cookie curto e estável para o middleware permitir rota privada.
  document.cookie = `${AUTH_SESSION_KEY}=1; path=/; max-age=${COOKIE_MAX_AGE_SEC}; samesite=lax`;

  const scope: AuthScope = options?.isSuperAdmin ? "superadmin" : "school";
  localStorage.setItem(AUTH_SCOPE_KEY, scope);
  document.cookie = `${AUTH_SCOPE_KEY}=${scope}; path=/; max-age=${COOKIE_MAX_AGE_SEC}; samesite=lax`;
}

/** Remove token e escopo (ex.: logout). */
export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(AUTH_SCOPE_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
  document.cookie = `${AUTH_SCOPE_KEY}=; path=/; max-age=0`;
  document.cookie = `${AUTH_SESSION_KEY}=; path=/; max-age=0`;
}

/**
 * Atualiza apenas o escopo (superadmin | school) após validação no backend (GET /api/me).
 * Não use para decidir acesso sem token válido.
 */
export function syncAuthScopeFromServer(isSuperAdmin: boolean): void {
  if (typeof window === "undefined") return;
  const scope: AuthScope = isSuperAdmin ? "superadmin" : "school";
  localStorage.setItem(AUTH_SCOPE_KEY, scope);
  document.cookie = `${AUTH_SCOPE_KEY}=${scope}; path=/; max-age=${COOKIE_MAX_AGE_SEC}; samesite=lax`;
}

/** Encerra sessão e envia para o login (navegação completa para o middleware ver cookies limpos). */
export function logout(): void {
  clearToken();
  if (typeof window !== "undefined") {
    window.location.assign("/login");
  }
}

/** Claim padrão do .NET com o nome do perfil (Administrador, Coordenador, …). */
const CLAIM_ROLE_MS =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

export type SessionInfo = {
  nome: string;
  /** Perfil vindo do token (ex.: Administrador, Coordenador). */
  perfil: string;
  email: string;
  initials: string;
  isSuperAdmin: boolean;
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function pickString(
  payload: Record<string, unknown>,
  key: string,
): string | undefined {
  const v = payload[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
}

const CLAIM_EMAIL_MS =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";

/** Perfil humano (Administrador, …): claim longa do .NET ou equivalente no payload. */
function pickPerfilNome(payload: Record<string, unknown>): string {
  const fromMs = pickString(payload, CLAIM_ROLE_MS);
  if (fromMs) return fromMs;

  for (const key of Object.keys(payload)) {
    if (!key.includes("claims/role")) continue;
    const v = pickString(payload, key);
    if (v && v !== "SchoolUser" && v !== "SuperAdmin") return v;
  }

  const shortRole = pickString(payload, "role");
  if (shortRole && shortRole !== "SchoolUser" && shortRole !== "SuperAdmin") {
    return shortRole;
  }

  return "—";
}

/** Lê nome e perfil do JWT (mesmos dados emitidos pelo backend no login). */
export function getSessionInfo(): SessionInfo | null {
  const token = getToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const nome = pickString(payload, "nome")?.trim() || "Usuário";
  const email =
    pickString(payload, "email") ||
    pickString(payload, CLAIM_EMAIL_MS) ||
    "";

  const isSuperAdmin =
    payload.isSuperAdmin === "true" ||
    payload.isSuperAdmin === true ||
    pickString(payload, "role") === "SuperAdmin";

  const perfil = pickPerfilNome(payload);

  const parts = nome.split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : nome.slice(0, 2).toUpperCase();

  return { nome, perfil, email, initials, isSuperAdmin };
}

/** Chave estável para o mapa de menus (`administrador`, `coordenador`, …). */
export function perfilToMenuKey(perfil: string): string {
  return perfil.trim().toLowerCase().replace(/\s+/g, "");
}
