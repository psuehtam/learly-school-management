import { apiRequest } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import type { User } from "@/lib/api/types";

type LoginRequest = {
  codigoEscola: string | null;
  email: string;
  senha: string;
};

type LoginUserPayload = {
  userId?: number;
  id?: number;
  nome?: string;
  email?: string;
  perfil?: string;
  role?: string;
  permissoes?: string[];
  permissions?: string[];
  isSuperAdmin?: boolean;
};

type LoginResponse = {
  token: string;
  usuario: LoginUserPayload;
  expiraEmUtc?: string;
};

type ApiMePayload = {
  userId?: number;
  id?: number;
  nome?: string;
  perfil?: string;
  role?: string;
  appRole?: string;
  isSuperAdmin?: boolean;
  permissoes?: string[];
  permissions?: string[];
  email?: string;
};

function decodeUserIdFromToken(token: string | null): number | null {
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const json = atob(padded);
    const payload = JSON.parse(json) as Record<string, unknown>;
    const raw = payload.userId ?? payload.sub;
    const num = Number(raw);
    return Number.isFinite(num) ? num : null;
  } catch {
    return null;
  }
}

function normalizePermissions(data: {
  permissoes?: string[];
  permissions?: string[];
}): string[] {
  return data.permissions ?? data.permissoes ?? [];
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: payload,
    skipAuth: true,
  });
}

export async function getCurrentUser(): Promise<User> {
  const data = await apiRequest<ApiMePayload>("/api/me");
  const tokenUserId = decodeUserIdFromToken(getToken());

  const id = data.userId ?? data.id ?? tokenUserId;
  const role = data.perfil ?? data.role ?? data.appRole ?? "Usuario";
  const permissions = normalizePermissions(data);

  return {
    id: id ?? null,
    nome: data.nome ?? "Usuario",
    role,
    permissions,
    email: data.email,
    isSuperAdmin: Boolean(data.isSuperAdmin),
  };
}
