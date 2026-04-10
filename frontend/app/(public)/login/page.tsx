"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { saveToken } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api/client";
import { login } from "@/lib/api/auth";
import { resolvePostLoginTarget } from "@/lib/post-login-redirect";
import type { User } from "@/lib/api/types";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [codigoEscola, setCodigoEscola] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  function extractPermissions(raw: unknown): string[] {
    if (!raw || typeof raw !== "object") return [];
    const data = raw as { permissions?: unknown; permissoes?: unknown };
    const p1 = Array.isArray(data.permissions) ? data.permissions : [];
    const p2 = Array.isArray(data.permissoes) ? data.permissoes : [];
    return [...p1, ...p2].filter((x): x is string => typeof x === "string");
  }

  function buildUserFromLogin(raw: unknown): User {
    const data = (raw && typeof raw === "object" ? raw : {}) as {
      userId?: unknown;
      id?: unknown;
      nome?: unknown;
      perfil?: unknown;
      role?: unknown;
      email?: unknown;
      isSuperAdmin?: unknown;
    };

    const rawId = typeof data.userId === "number" ? data.userId : typeof data.id === "number" ? data.id : null;
    const role =
      typeof data.perfil === "string" ? data.perfil :
      typeof data.role === "string" ? data.role :
      "Usuario";

    return {
      id: rawId,
      nome: typeof data.nome === "string" ? data.nome : "Usuario",
      role,
      permissions: extractPermissions(raw),
      email: typeof data.email === "string" ? data.email : undefined,
      isSuperAdmin: data.isSuperAdmin === true || data.isSuperAdmin === "true",
    };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensagem("");

    try {
      const dados = await login({
        codigoEscola: codigoEscola.trim() || null,
        email,
        senha: password,
      });
      const token: string | undefined = dados?.token;
      const user = buildUserFromLogin(dados?.usuario);
      const isSuperAdmin = Boolean(user.isSuperAdmin);

      if (!token) {
        setMensagem("Token nao retornado pelo servidor.");
        return;
      }

      saveToken(token, { isSuperAdmin });

      const next = searchParams.get("next");
      const target = resolvePostLoginTarget(user, next);

      router.replace(target);
    } catch (erro) {
      console.error(erro);
      setMensagem(getApiErrorMessage(erro, "Erro ao conectar com o servidor."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-100">
      <div className="flex flex-col items-center mb-6">
        <Image src="/images/Logo.svg" alt="Learly" width={100} height={100} />
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl px-10 py-9 w-full max-w-sm shadow-sm">
        <h1 className="text-center text-xl font-semibold text-zinc-900 mb-7">
          Sign in
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-zinc-600 font-medium">
              Codigo da Escola
            </label>
            
            <input
              type="text"
              value={codigoEscola}
              onChange={(e) => setCodigoEscola(e.target.value.toUpperCase())}
              className="h-10 border border-zinc-300 rounded-md px-3 text-sm text-zinc-900 outline-none focus:border-[#4a6d8c] focus:ring-2 focus:ring-[#4a6d8c]/20 transition uppercase placeholder:normal-case"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-zinc-600 font-medium">Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-10 border border-zinc-300 rounded-md px-3 text-sm text-zinc-900 outline-none focus:border-[#4a6d8c] focus:ring-2 focus:ring-[#4a6d8c]/20 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-sm text-zinc-600 font-medium">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 transition"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="h-10 border border-zinc-300 rounded-md px-3 text-sm text-zinc-900 outline-none focus:border-[#4a6d8c] focus:ring-2 focus:ring-[#4a6d8c]/20 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 h-11 bg-[#4a6d8c] hover:bg-[#3d5c78] text-white text-sm font-medium rounded-lg transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Log in"
            )}
          </button>

          {mensagem && (
            <div className="mt-2 text-center text-sm font-medium text-red-500">
              {mensagem}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}

function LoginFallback() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-100">
      <div className="flex flex-col items-center mb-6">
        <Image src="/images/Logo.svg" alt="Learly" width={100} height={100} />
      </div>
      <div className="h-48 w-full max-w-sm rounded-xl bg-white border border-zinc-200 shadow-sm animate-pulse" />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
