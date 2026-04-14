"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getCurrentUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { clearToken, hasSessionCookie, saveSessionInfo, syncAuthScopeFromServer } from "@/lib/auth";
import { canAccessRoute, getHomeRoute } from "@/lib/route-access";
import type { User } from "@/lib/api/types";

type GateState =
  | { status: "loading" }
  | { status: "ok" }
  | { status: "denied"; user: User };

type Props = { children: ReactNode };

/**
 * Valida sessão no backend (GET /api/me) e verifica permissão da rota.
 * Sem token válido → /login.
 * Sem permissão → mostra "Acesso negado" com redirecionamento.
 */
export function SessionGate({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [gate, setGate] = useState<GateState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!hasSessionCookie()) {
        clearToken();
        const next = encodeURIComponent(`${pathname}${window.location.search}`);
        window.location.assign(`/login?next=${next}`);
        return;
      }

      try {
        const user = await getCurrentUser();
        if (cancelled) return;

        syncAuthScopeFromServer();
        saveSessionInfo({
          nome: user.nome,
          perfil: user.role,
          email: user.email,
          isSuperAdmin: Boolean(user.isSuperAdmin),
        });

        if (!canAccessRoute(user, pathname)) {
          setGate({ status: "denied", user });
          return;
        }

        setGate({ status: "ok" });
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) {
          return;
        }
        clearToken();
        const next = encodeURIComponent(`${pathname}${window.location.search}`);
        window.location.assign(`/login?next=${next}`);
      }
    }

    void Promise.resolve().then(() => {
      if (cancelled) return;
      setGate({ status: "loading" });
      void run();
    });
    return () => { cancelled = true; };
  }, [pathname, router]);

  if (gate.status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-500 text-sm">
        Validando sessao…
      </div>
    );
  }

  if (gate.status === "denied") {
    const home = getHomeRoute(gate.user);
    return <AccessDenied home={home} onNavigate={() => router.replace(home)} />;
  }

  return <>{children}</>;
}

function AccessDenied({ home, onNavigate }: { home: string; onNavigate: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-zinc-200 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-zinc-900 mb-2">
          Acesso negado
        </h1>
        <p className="text-sm text-zinc-500 mb-6">
          Voce nao tem permissao para acessar esta pagina.
          Entre em contato com o administrador caso precise de acesso.
        </p>
        <button
          type="button"
          onClick={onNavigate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F2A35] text-white text-sm font-medium rounded-lg hover:bg-[#2a3a4a] transition-colors cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Voltar para minha area
        </button>
        <p className="text-xs text-zinc-400 mt-4">
          Redirecionando para <span className="font-mono">{home}</span>
        </p>
      </div>
    </div>
  );
}
