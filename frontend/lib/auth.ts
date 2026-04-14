export const AUTH_SESSION_KEY = "auth_session";
const SESSION_INFO_KEY = "session_info";

export type SessionInfo = {
  nome: string;
  perfil: string;
  email: string;
  initials: string;
  isSuperAdmin: boolean;
};

function computeInitials(nome: string): string {
  const parts = nome.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return nome.slice(0, 2).toUpperCase();
}

export function hasSessionCookie(): boolean {
  if (typeof window === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim() === `${AUTH_SESSION_KEY}=1`);
}

/** Marca sessão na origem do Next (proxy / hasSessionCookie). Chamar após login bem-sucedido. */
export function setSessionFlagCookie(expiresAtUtc?: string): void {
  if (typeof window === "undefined") return;
  let maxAge = 60 * 60 * 24 * 7;
  if (expiresAtUtc) {
    const t = Date.parse(expiresAtUtc);
    if (!Number.isNaN(t)) {
      const sec = Math.max(60, Math.floor((t - Date.now()) / 1000));
      maxAge = sec;
    }
  }
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_SESSION_KEY}=1; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

export function isAuthenticated(): boolean {
  return hasSessionCookie();
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_INFO_KEY);
  document.cookie = `${AUTH_SESSION_KEY}=; path=/; max-age=0`;
}

export function syncAuthScopeFromServer(): void {
  // Mantido para retrocompatibilidade de chamadas.
}

export function saveSessionInfo(input: {
  nome?: string;
  perfil?: string;
  email?: string;
  isSuperAdmin?: boolean;
}): void {
  if (typeof window === "undefined") return;
  const nome = input.nome?.trim() || "Usuario";
  const info: SessionInfo = {
    nome,
    perfil: input.perfil?.trim() || "Usuario",
    email: input.email?.trim() || "",
    isSuperAdmin: Boolean(input.isSuperAdmin),
    initials: computeInitials(nome),
  };
  localStorage.setItem(SESSION_INFO_KEY, JSON.stringify(info));
}

export function getSessionInfo(): SessionInfo | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_INFO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionInfo;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // ignora para garantir limpeza client-side mesmo sem backend
  }
  clearToken();
  if (typeof window !== "undefined") {
    window.location.assign("/login");
  }
}

export function perfilToMenuKey(perfil: string): string {
  return perfil.trim().toLowerCase().replace(/\s+/g, "");
}
