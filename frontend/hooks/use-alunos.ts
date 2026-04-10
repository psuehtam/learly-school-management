"use client";

import { useCallback, useEffect, useState } from "react";
import { listarAlunos, buscarAluno } from "@/lib/api/alunos";
import type { Aluno } from "@/types/aluno";

export function useAlunos(filtros?: Record<string, string>) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    listarAlunos(filtros)
      .then(setAlunos)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar alunos"))
      .finally(() => setIsLoading(false));
  }, [filtros]);

  useEffect(() => { fetch(); }, [fetch]);

  return { alunos, isLoading, error, refetch: fetch };
}

export function useAluno(id: number | null) {
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id === null) { setIsLoading(false); return; }
    setIsLoading(true);
    buscarAluno(id)
      .then(setAluno)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar aluno"))
      .finally(() => setIsLoading(false));
  }, [id]);

  return { aluno, isLoading, error };
}
