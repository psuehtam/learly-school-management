"use client";

import { logout } from "@/lib/auth";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-zinc-200 shadow-sm p-8 text-center">
        <h1 className="text-xl font-semibold text-zinc-900 mb-2">Sem permissões de acesso</h1>
        <p className="text-sm text-zinc-500 mb-6">
          Seu usuário foi autenticado, mas não possui acesso a nenhum módulo principal.
          Fale com o administrador para ajustar suas permissões.
        </p>
        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-[#1F2A35] text-white text-sm font-medium rounded-lg hover:bg-[#2a3a4a] transition-colors"
        >
          Ir para login
        </button>
      </div>
    </main>
  );
}

