"use client";

import { useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type TipoEvento = "aula" | "sem_aula" | "feriado" | "recesso";

interface DiaEvento {
  data: string; // "YYYY-MM-DD"
  tipo: TipoEvento;
}

// ─── Config de eventos ────────────────────────────────────────────────────────
const eventos: Record<TipoEvento, { label: string; cor: string; corDia: string; descricao: string }> = {
  aula:     { label: "Aula",     cor: "border-zinc-300 text-zinc-700 bg-white",           corDia: "",                                    descricao: "Dia normal de aula" },
  sem_aula: { label: "Sem Aula", cor: "border-amber-400 text-amber-700 bg-amber-50",      corDia: "bg-amber-100 text-amber-800",          descricao: "Cancela aulas nesse dia" },
  feriado:  { label: "Feriado",  cor: "border-red-400 text-red-700 bg-red-50",            corDia: "bg-red-100 text-red-800",              descricao: "Cancela aulas e justifica ausência" },
  recesso:  { label: "Recesso",  cor: "border-blue-400 text-blue-700 bg-blue-50",         corDia: "bg-blue-100 text-blue-800",            descricao: "Cancela aulas (férias escolares)" },
};

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatarData(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function diasNoMes(ano: number, mes: number): number {
  return new Date(ano, mes + 1, 0).getDate();
}

function primeiroDiaSemana(ano: number, mes: number): number {
  return new Date(ano, mes, 1).getDay();
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function CalendarioPage() {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoEvento>("sem_aula");
  const [diasMarcados, setDiasMarcados] = useState<DiaEvento[]>([]);
  const [alteracoesPendentes, setAlteracoesPendentes] = useState(false);

  const totalDias = diasNoMes(ano, mes);
  const offset = primeiroDiaSemana(ano, mes);

  function getDiaMarcado(data: string): DiaEvento | undefined {
    return diasMarcados.find((d) => d.data === data);
  }

  function clicarDia(dia: number) {
    const data = formatarData(ano, mes, dia);
    const existente = getDiaMarcado(data);

    if (existente) {
      if (existente.tipo === tipoSelecionado) {
        // Clicou no mesmo tipo → remove (volta para Aula)
        setDiasMarcados((prev) => prev.filter((d) => d.data !== data));
      } else {
        // Troca o tipo
        setDiasMarcados((prev) => prev.map((d) => d.data === data ? { ...d, tipo: tipoSelecionado } : d));
      }
    } else {
      if (tipoSelecionado === "aula") return; // Aula é o padrão, não precisa marcar
      setDiasMarcados((prev) => [...prev, { data, tipo: tipoSelecionado }]);
    }
    setAlteracoesPendentes(true);
  }

  function aplicarAlteracoes() {
    // TODO: enviar diasMarcados para a API
    setAlteracoesPendentes(false);
    alert("Alterações salvas! (conectar com API)");
  }

  function mesAnterior() {
    if (mes === 0) { setMes(11); setAno(ano - 1); }
    else setMes(mes - 1);
  }

  function proximoMes() {
    if (mes === 11) { setMes(0); setAno(ano + 1); }
    else setMes(mes + 1);
  }

  // Dias do mês atual com eventos
  const diasDoMes = Array.from({ length: totalDias }, (_, i) => i + 1);
  const celulas = [...Array(offset).fill(null), ...diasDoMes];

  // Resumo do mês
  const resumoMes = {
    sem_aula: diasMarcados.filter((d) => d.data.startsWith(`${ano}-${String(mes + 1).padStart(2, "0")}`) && d.tipo === "sem_aula").length,
    feriado:  diasMarcados.filter((d) => d.data.startsWith(`${ano}-${String(mes + 1).padStart(2, "0")}`) && d.tipo === "feriado").length,
    recesso:  diasMarcados.filter((d) => d.data.startsWith(`${ano}-${String(mes + 1).padStart(2, "0")}`) && d.tipo === "recesso").length,
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Topo */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Calendário Geral</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Gerencie o calendário letivo da escola</p>
        </div>
        {alteracoesPendentes && (
          <button
            onClick={aplicarAlteracoes}
            className="flex items-center gap-2 h-9 px-4 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Aplicar alterações
          </button>
        )}
      </div>

      <div className="flex gap-6 items-start">

        {/* Calendário */}
        <div className="flex-1 bg-white border border-zinc-200 rounded-xl overflow-hidden">

          {/* Navegação do mês */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <button onClick={mesAnterior} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors text-zinc-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span className="font-semibold text-zinc-900">{MESES[mes]} {ano}</span>
            <button onClick={proximoMes} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors text-zinc-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          {/* Grid */}
          <div className="px-4 py-4">
            {/* Cabeçalho dias da semana */}
            <div className="grid grid-cols-7 mb-2">
              {DIAS_SEMANA.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-zinc-400 py-1">{d}</div>
              ))}
            </div>

            {/* Dias */}
            <div className="grid grid-cols-7 gap-1">
              {celulas.map((dia, i) => {
                if (!dia) return <div key={`empty-${i}`} />;
                const data = formatarData(ano, mes, dia);
                const marcado = getDiaMarcado(data);
                const isHoje = data === formatarData(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
                const corDia = marcado ? eventos[marcado.tipo].corDia : "";

                return (
                  <button
                    key={data}
                    onClick={() => clicarDia(dia)}
                    className={`
                      relative aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                      ${corDia || "hover:bg-zinc-100 text-zinc-700"}
                      ${isHoje && !marcado ? "ring-2 ring-[#1F2A35] ring-offset-1" : ""}
                    `}
                  >
                    {dia}
                    {isHoje && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1F2A35]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legenda resumo do mês */}
          <div className="px-6 py-3 border-t border-zinc-100 flex gap-4">
            {resumoMes.sem_aula > 0 && (
              <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full">{resumoMes.sem_aula} sem aula</span>
            )}
            {resumoMes.feriado > 0 && (
              <span className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded-full">{resumoMes.feriado} feriado{resumoMes.feriado !== 1 ? "s" : ""}</span>
            )}
            {resumoMes.recesso > 0 && (
              <span className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-full">{resumoMes.recesso} recesso{resumoMes.recesso !== 1 ? "s" : ""}</span>
            )}
            {resumoMes.sem_aula === 0 && resumoMes.feriado === 0 && resumoMes.recesso === 0 && (
              <span className="text-xs text-zinc-400">Nenhum evento marcado neste mês</span>
            )}
          </div>
        </div>

        {/* Painel lateral */}
        <div className="w-64 flex flex-col gap-4">

          {/* Seletor de tipo */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Tipo de evento</p>
            <div className="flex flex-col gap-2">
              {(Object.keys(eventos) as TipoEvento[]).map((tipo) => {
                const ev = eventos[tipo];
                const ativo = tipoSelecionado === tipo;
                return (
                  <button
                    key={tipo}
                    onClick={() => setTipoSelecionado(tipo)}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                      ativo ? ev.cor + " ring-2 ring-offset-1 " + (
                        tipo === "sem_aula" ? "ring-amber-400" :
                        tipo === "feriado"  ? "ring-red-400"   :
                        tipo === "recesso"  ? "ring-blue-400"  : "ring-zinc-400"
                      ) : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ${
                      tipo === "aula"     ? "bg-zinc-300" :
                      tipo === "sem_aula" ? "bg-amber-400" :
                      tipo === "feriado"  ? "bg-red-400"   : "bg-blue-400"
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{ev.label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{ev.descricao}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Instruções */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Como usar</p>
            <ol className="flex flex-col gap-1.5 text-xs text-zinc-500">
              <li className="flex gap-2"><span className="font-semibold text-zinc-700">1.</span> Selecione o tipo de evento ao lado</li>
              <li className="flex gap-2"><span className="font-semibold text-zinc-700">2.</span> Clique nos dias do calendário para marcar</li>
              <li className="flex gap-2"><span className="font-semibold text-zinc-700">3.</span> Clique novamente para remover a marcação</li>
              <li className="flex gap-2"><span className="font-semibold text-zinc-700">4.</span> Clique em "Aplicar alterações" para salvar</li>
            </ol>
          </div>

        </div>
      </div>
    </div>
  );
}
