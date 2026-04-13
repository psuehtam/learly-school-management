"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { clearToken, hasSessionCookie, saveSessionInfo } from "@/lib/auth";
import { resolveLandingFromUser } from "@/lib/landing-page";

/** Raiz: resolve landing dinâmica a partir das permissões efetivas do usuário. */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function run() {
      if (!hasSessionCookie()) {
        router.replace("/login");
        return;
      }
      try {
        const user = await getCurrentUser();
        saveSessionInfo({
          nome: user.nome,
          perfil: user.role,
          email: user.email,
          isSuperAdmin: Boolean(user.isSuperAdmin),
        });
        router.replace(resolveLandingFromUser(user));
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return;
        clearToken();
        router.replace("/login");
      }
    }
    void run();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-500 text-sm">
      Redirecionando...
    </main>
  );
}
