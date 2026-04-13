"use client";

import { useEffect, useState } from "react";
import { getSessionInfo, logout, type SessionInfo } from "@/lib/auth";
import { getCurrentUser } from "@/lib/api/auth";
import type { User } from "@/lib/api/types";
import { SCHOOL_MENU } from "@/lib/menu-config";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";

const perfisLabel: Record<string, string> = {
  professor: "Professor",
  financeiro: "Financeiro",
  coordenador: "Coordenador",
  administrador: "Administrador",
  comercial: "Comercial",
  secretaria: "Secretaria",
};

function formatPerfil(perfil: string): string {
  const key = perfil.trim().toLowerCase().replace(/\s+/g, "");
  return perfisLabel[key] ?? perfil;
}

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionInfo | null>(() => getSessionInfo());
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then((u) => {
        setUser(u);
        setSession(getSessionInfo());
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar menu={SCHOOL_MENU} user={user} onLogout={logout} />
      <div className="flex-1 flex flex-col">
        <Navbar
          userName={session?.nome}
          userRole={session ? formatPerfil(session.perfil) : undefined}
          userInitials={session?.initials}
        />
        <main className="flex-1 p-6 h-[calc(100vh-56px)] overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
