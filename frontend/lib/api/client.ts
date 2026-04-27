import { clearToken } from "@/lib/auth";
import type { ApiErrorPayload } from "@/lib/api/types";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  skipAuth?: boolean;
};

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) {
    throw new Error(
      "NEXT_PUBLIC_API_URL nao configurada. Defina no .env.local (ex.: http://localhost:5081).",
    );
  }
  return raw.replace(/\/+$/, "");
}

function getCurrentPath(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}`;
}

function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  const next = encodeURIComponent(getCurrentPath());
  window.location.assign(`/login?next=${next}`);
}

function resolveErrorMessage(data: unknown, fallback: string): string {
  if (!data) return fallback;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  const payload = data as ApiErrorPayload;
  return (
    payload.message ||
    payload.error ||
    payload.title ||
    payload.detail ||
    fallback
  );
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const text = await response.text();
    if (!text.trim()) {
      return null;
    }
    return JSON.parse(text) as unknown;
  }

  const text = await response.text();
  return text || null;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Erro ao comunicar com o servidor.",
): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const body =
    options.body == null || isFormData || typeof options.body === "string"
      ? (options.body as BodyInit | undefined)
      : JSON.stringify(options.body);

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body,
    credentials: "include",
  });

  const data = await parseResponseBody(response);

  // Login e rotas públicas usam skipAuth: 401 aqui é credencial inválida — não limpar sessão nem redirecionar.
  if (response.status === 401 && !options.skipAuth) {
    clearToken();
    redirectToLogin();
    throw new ApiError("Sessao expirada. Faca login novamente.", 401, data);
  }

  if (!response.ok) {
    const message = resolveErrorMessage(
      data,
      response.status === 401
        ? "Credenciais invalidas."
        : "Falha ao processar requisicao.",
    );
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}
