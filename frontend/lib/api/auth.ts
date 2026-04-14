import { apiRequest } from "@/lib/api/client";
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
  usuario: LoginUserPayload;
  /** ISO UTC — expiração do JWT / cookies */
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
  const id = data.userId ?? data.id ?? null;
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
