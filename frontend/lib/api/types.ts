// Tipos genéricos de comunicação com a API.
// Tipos de domínio ficam em @/types/.

export type ApiErrorPayload = {
  message?: string;
  error?: string;
  title?: string;
  detail?: string;
  [key: string]: unknown;
};

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/** Usuário retornado por GET /api/me */
export type User = {
  id: number | null;
  nome: string;
  role: string;
  permissions: string[];
  email?: string;
  isSuperAdmin?: boolean;
  codigoEscola?: string;
};
