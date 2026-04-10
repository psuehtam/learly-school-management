"use client";

import { useCallback, useEffect, useState } from "react";
import { listarTurmas, buscarTurma } from "@/lib/api/turmas";
import type { Turma } from "@/types/turma";

export function useTurmas(filtros?: Record<string, string>) {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    listarTurmas(filtros)
      .then(setTurmas)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar turmas"))
      .finally(() => setIsLoading(false));
  }, [filtros]);

  useEffect(() => { fetch(); }, [fetch]);

  return { turmas, isLoading, error, refetch: fetch };
}

export function useTurma(id: number | null) {
  const [turma, setTurma] = useState<Turma | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id === null) { setIsLoading(false); return; }
    setIsLoading(true);
    buscarTurma(id)
      .then(setTurma)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar turma"))
      .finally(() => setIsLoading(false));
  }, [id]);

  return { turma, isLoading, error };
}
