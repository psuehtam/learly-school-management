"use client";

import { useEffect, useState } from "react";
import { getSessionInfo, logout, type SessionInfo } from "@/lib/auth";
import { getCurrentUser } from "@/lib/api/auth";
import type { User } from "@/lib/api/types";
import { SUPER_ADMIN_MENU } from "@/lib/menu-config";
import { Sidebar } from "@/components/layout/sidebar";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
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
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar
        menu={SUPER_ADMIN_MENU}
        user={user}
        onLogout={logout}
        bgColor="bg-[#0f172a]"
        topSlot={
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/90">
            Super Admin
          </span>
        }
      />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-6 shrink-0 gap-4">
          <p className="text-xs text-zinc-500">
            Painel global — gestão de tenants (escolas)
          </p>
          <div className="flex items-center gap-2 text-sm text-zinc-700 shrink-0">
            <div className="w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center text-white text-xs font-semibold">
              {session?.initials ?? "—"}
            </div>
            <div className="flex flex-col items-end min-w-0">
              <span className="font-medium text-zinc-900 truncate max-w-[180px]">
                {session?.nome ?? "…"}
              </span>
              <span className="text-xs text-zinc-500">Super Admin</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
