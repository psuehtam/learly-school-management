"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/api/auth";
import { getToken, logout as doLogout } from "@/lib/auth";
import type { User } from "@/lib/api/types";

type AuthState = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

/**
 * Hook principal de autenticação.
 * Carrega o usuário via GET /api/me e mantém em state.
 */
export function useAuth(): AuthState & { logout: () => void } {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setState({ user: null, isLoading: false, isAuthenticated: false });
      return;
    }

    let cancelled = false;
    getCurrentUser()
      .then((user) => {
        if (!cancelled) {
          setState({ user, isLoading: false, isAuthenticated: true });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ user: null, isLoading: false, isAuthenticated: false });
        }
      });

    return () => { cancelled = true; };
  }, []);

  return { ...state, logout: doLogout };
}
