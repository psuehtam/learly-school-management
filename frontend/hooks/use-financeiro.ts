"use client";

import { useCallback, useEffect, useState } from "react";
import { listarParcelas } from "@/lib/api/financeiro";
import type { Parcela } from "@/types/financeiro";

export function useParcelas(filtros?: Record<string, string>) {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    await Promise.resolve();
    setIsLoading(true);
    setError(null);
    try {
      const data = await listarParcelas(filtros);
      setParcelas(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar parcelas");
    } finally {
      setIsLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { parcelas, isLoading, error, refetch: fetch };
}
