"use client";

import { useCallback, useEffect, useState } from "react";
import { listarTurmas, buscarTurma } from "@/lib/api/turmas";
import type { Turma } from "@/types/turma";

export function useTurmas(filtros?: Record<string, string>) {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    await Promise.resolve();
    setIsLoading(true);
    setError(null);
    try {
      const data = await listarTurmas(filtros);
      setTurmas(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar turmas");
    } finally {
      setIsLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { turmas, isLoading, error, refetch: fetch };
}

export function useTurma(id: number | null) {
  const [turma, setTurma] = useState<Turma | null>(null);
  const [isLoading, setIsLoading] = useState(() => id !== null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    await Promise.resolve();
    if (id === null) {
      setTurma(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await buscarTurma(id);
      setTurma(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar turma");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return { turma, isLoading, error };
}
