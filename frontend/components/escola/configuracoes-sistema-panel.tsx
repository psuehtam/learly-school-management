"use client";

import { useCallback, useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  atualizarConfiguracoesEscola,
  obterConfiguracoesEscola,
  type EscolaConfiguracoesDto,
  type MetricaAula,
} from "@/lib/api/minha-escola";
import { hasPermission } from "@/lib/permissions";
import type { User } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { horasMinutosParaMinutos, minutosParaInputHHMM } from "@/lib/tempo/minutos";

const INPUT =
  "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/20 disabled:cursor-not-allowed disabled:bg-zinc-100";

export function ConfiguracoesSistemaPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<EscolaConfiguracoesDto>({
    minAlunosTurma: 3,
    maxAlunosTurma: null,
    metricaAula: "POR_DIA",
    duracaoAulaMinutos: 120,
  });
  const [duracaoInput, setDuracaoInput] = useState("2:00");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const podeEditar = user ? hasPermission(user, "GERENCIAR_CONFIGURACOES_SISTEMA") : false;

  useEffect(() => {
    void getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await obterConfiguracoesEscola();
      setConfig(data);
      setDuracaoInput(minutosParaInputHHMM(data.duracaoAulaMinutos));
    } catch (e) {
      setErro(getApiErrorMessage(e, "Não foi possível carregar as configurações."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function salvar() {
    if (!podeEditar) return;
    setSalvando(true);
    setErro(null);
    setSucesso(false);
    try {
      const min = Number(config.minAlunosTurma);
      const maxRaw = config.maxAlunosTurma;
      const max = maxRaw === null || maxRaw === undefined || String(maxRaw).trim() === "" ? null : Number(maxRaw);
      if (!Number.isFinite(min) || min < 1) {
        setErro("Mínimo de alunos por turma deve ser ao menos 1.");
        return;
      }
      if (max != null && (!Number.isFinite(max) || max < min)) {
        setErro("Máximo de alunos não pode ser menor que o mínimo.");
        return;
      }

      const duracaoMinutos = horasMinutosParaMinutos(duracaoInput);
      if (duracaoMinutos === null || duracaoMinutos < 15 || duracaoMinutos > 480) {
        setErro("Duração da aula deve estar entre 15 minutos e 8 horas (formato H:MM).");
        return;
      }

      const atualizado = await atualizarConfiguracoesEscola({
        minAlunosTurma: min,
        maxAlunosTurma: max,
        metricaAula: config.metricaAula,
        duracaoAulaMinutos: duracaoMinutos,
      });
      setConfig(atualizado);
      setDuracaoInput(minutosParaInputHHMM(atualizado.duracaoAulaMinutos));
      setSucesso(true);
    } catch (e) {
      setErro(getApiErrorMessage(e, "Não foi possível salvar."));
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Carregando configurações…</p>;
  }

  return (
    <div className="flex max-w-lg flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      {erro ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{erro}</div> : null}
      {sucesso ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Configurações salvas com sucesso.
        </div>
      ) : null}

      {/* Turmas */}
      <div>
        <h2 className="text-base font-semibold text-zinc-900">Turmas</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Define quantos alunos uma turma precisa para ser ativada e o limite máximo de matrículas.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Mínimo de alunos por turma</label>
            <input
              type="number"
              min={1}
              disabled={!podeEditar}
              value={config.minAlunosTurma}
              onChange={(e) => setConfig((c) => ({ ...c, minAlunosTurma: Number(e.target.value) }))}
              className={INPUT}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Máximo de alunos por turma</label>
            <input
              type="number"
              min={1}
              disabled={!podeEditar}
              placeholder="Sem limite"
              value={config.maxAlunosTurma ?? ""}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  maxAlunosTurma: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              className={INPUT}
            />
            <p className="mt-1 text-xs text-zinc-500">Deixe vazio para não limitar.</p>
          </div>
        </div>
      </div>

      <hr className="border-zinc-100" />

      {/* Configuração de Aulas */}
      <div>
        <h2 className="text-base font-semibold text-zinc-900">Métrica de Duração de Aulas</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Define como as durações dos capítulos dos livros são medidas e como o planejamento é dividido em dias de aula.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50">
            <input
              type="radio"
              name="metricaAula"
              value="POR_DIA"
              disabled={!podeEditar}
              checked={config.metricaAula === "POR_DIA"}
              onChange={() => setConfig((c) => ({ ...c, metricaAula: "POR_DIA" as MetricaAula }))}
              className="mt-0.5"
            />
            <div>
              <span className="text-sm font-medium text-zinc-800">Aula por Dia</span>
              <p className="text-xs text-zinc-500">
                1 dia letivo = 1 aula. A duração dos capítulos é informada em dias inteiros.
              </p>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50">
            <input
              type="radio"
              name="metricaAula"
              value="POR_HORA"
              disabled={!podeEditar}
              checked={config.metricaAula === "POR_HORA"}
              onChange={() => setConfig((c) => ({ ...c, metricaAula: "POR_HORA" as MetricaAula }))}
              className="mt-0.5"
            />
            <div>
              <span className="text-sm font-medium text-zinc-800">Aula por Hora</span>
              <p className="text-xs text-zinc-500">
                A duração dos capítulos é informada em horas e minutos. Uma aula contém a carga horária definida abaixo.
              </p>
            </div>
          </label>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Carga horária de 1 dia de aula
          </label>
          <input
            type="text"
            placeholder="ex.: 2:00"
            disabled={!podeEditar}
            value={duracaoInput}
            onChange={(e) => setDuracaoInput(e.target.value)}
            className={INPUT + " max-w-[140px]"}
          />
          <p className="mt-1 text-xs text-zinc-500">
            Formato H:MM (ex.: 2:00 = 2 horas, 1:30 = 1h 30min). Mínimo: 0:15.
          </p>
        </div>
      </div>

      {podeEditar ? (
        <div className="flex justify-end">
          <Button type="button" onClick={() => void salvar()} disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar configurações"}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          Somente quem tem permissão de gerenciar configurações do sistema pode editar.
        </p>
      )}
    </div>
  );
}
