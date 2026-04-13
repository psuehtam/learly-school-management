"use client";

import { useCallback, useEffect, useState } from "react";
import { listarAlunos, buscarAluno } from "@/lib/api/alunos";
import type { Aluno } from "@/types/aluno";

export function useAlunos(filtros?: Record<string, string>) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    await Promise.resolve();
    setIsLoading(true);
    setError(null);
    try {
      const data = await listarAlunos(filtros);
      setAlunos(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar alunos");
    } finally {
      setIsLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { alunos, isLoading, error, refetch: fetch };
}

export function useAluno(id: number | null) {
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [isLoading, setIsLoading] = useState(() => id !== null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    await Promise.resolve();
    if (id === null) {
      setAluno(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await buscarAluno(id);
      setAluno(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar aluno");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return { aluno, isLoading, error };
}
