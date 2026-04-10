"use client";

import { useCallback, useEffect, useState } from "react";
import { listarAulas } from "@/lib/api/aulas";
import type { Aula } from "@/types/aula";

export function useAulas(filtros?: Record<string, string>) {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    listarAulas(filtros)
      .then(setAulas)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar aulas"))
      .finally(() => setIsLoading(false));
  }, [filtros]);

  useEffect(() => { fetch(); }, [fetch]);

  return { aulas, isLoading, error, refetch: fetch };
}
