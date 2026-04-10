"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Professor { id: number; nome: string; avatarCor: string; }

interface AulaAgenda {
  id: number; professorId: number; turmaId: number; turmaNome: string;
  horarioInicio: string; horarioFim: string; alunos: string[];
  capitulo: string; remanejada: boolean; observacao?: string;
}

// ─── Mock de Dados ────────────────────────────────────────────────────────────
const professoresMock: Professor[] = [
  { id: 1, nome: "Carlos Mendes", avatarCor: "bg-blue-600" },
  { id: 2, nome: "Ana Paula Silva", avatarCor: "bg-purple-600" },
  { id: 3, nome: "Felipe Santos", avatarCor: "bg-emerald-600" },
];

const aulasMock: AulaAgenda[] = [
  { id: 101, professorId: 1, turmaId: 1, turmaNome: "Book 1 / Seg 14:00", horarioInicio: "14:00", horarioFim: "15:30", alunos: ["Ronald Xavier", "Pedro Henrique"], capitulo: "Lesson 2", remanejada: false },
  { id: 103, professorId: 2, turmaId: 3, turmaNome: "Book 2 / Seg 14:30", horarioInicio: "14:30", horarioFim: "16:00", alunos: ["Alice Massari", "Beatriz Souza"], capitulo: "Lesson 5", remanejada: false },
];

// 👇 MOCK DO CALENDÁRIO (Que virá do Banco de Dados) 👇
const feriadosMock = [
  { data: "2026-02-16", nome: "Carnaval", tipo: "feriado", cor: "bg-red-50 text-red-700 border-red-200" },
  { data: "2026-07-15", nome: "Recesso de Inverno", tipo: "recesso", cor: "bg-blue-50 text-blue-700 border-blue-200" }
];

const HORAS_DIA = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

function calcularTop(horario: string) {
  const [h, m] = horario.split(":").map(Number);
  return ((h - 8) * 60 + m) * (80 / 60); 
}

function calcularHeight(inicio: string, fim: string) {
  const [h1, m1] = inicio.split(":").map(Number);
  const [h2, m2] = fim.split(":").map(Number);
  return ((h2 * 60 + m2) - (h1 * 60 + m1)) * (80 / 60);
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function AgendaGlobalPage() {
  const [dataSelecionada, setDataSelecionada] = useState("2026-03-23"); // Segunda-feira normal
  const [busca, setBusca] = useState("");
  const [aulaAberta, setAulaAberta] = useState<AulaAgenda | null>(null);

  // Verifica se o dia selecionado é um feriado/recesso
  const eventoHoje = feriadosMock.find(f => f.data === dataSelecionada);

  const termoBusca = busca.toLowerCase();
  function verificaDestaque(aula: AulaAgenda) {
    if (!termoBusca) return true;
    return aula.turmaNome.toLowerCase().includes(termoBusca) || aula.capitulo.toLowerCase().includes(termoBusca);
  }

  return (
    <>
      <div className="flex flex-col gap-6 h-full">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Agenda Global</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Visão de acompanhamento das aulas do dia.</p>
          </div>

          <div className="flex gap-3">
            {/* O SEGREDO ESTÁ AQUI: TESTE COLOCAR "2026-02-16" NESSE CALENDÁRIO */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Dia Letivo</label>
              <div className="flex items-center bg-white border border-zinc-300 rounded-lg h-9 overflow-hidden shadow-sm">
                <input type="date" value={dataSelecionada} onChange={(e) => setDataSelecionada(e.target.value)} className="h-full px-3 text-sm font-medium text-zinc-800 outline-none w-36" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Destacar Aula</label>
              <input type="text" placeholder="Aluno, turma..." value={busca} onChange={e => setBusca(e.target.value)} className="h-9 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition w-64 shadow-sm" />
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white border border-zinc-200 rounded-xl overflow-auto shadow-sm relative flex">
          
          {/* 👇 RENDERIZAÇÃO CONDICIONAL: SE FOR FERIADO, BLOQUEIA A AGENDA 👇 */}
          {eventoHoje ? (
            <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center ${eventoHoje.cor} bg-opacity-10 backdrop-blur-[2px]`}>
              <svg className="mb-4 opacity-80" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
              <h2 className="text-2xl font-bold uppercase tracking-widest">{eventoHoje.nome}</h2>
              <p className="font-medium mt-2">Não há aulas agendadas para este dia.</p>
              <p className="text-xs mt-1 opacity-70">O bloqueio foi configurado no Calendário Geral da escola.</p>
            </div>
          ) : null}

          {/* GRID NORMAL DA AGENDA (Fica atrás do aviso se for feriado) */}
          <div className="w-16 shrink-0 bg-zinc-50 border-r border-zinc-200 sticky left-0 z-20 flex flex-col pt-12 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
            {HORAS_DIA.map(h => (
              <div key={h} className="h-[80px] relative">
                <span className="absolute -top-2.5 w-full text-center text-xs font-bold text-zinc-400">{h.toString().padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>

          <div className="flex flex-1 min-w-max relative pb-10">
            <div className="absolute inset-0 pt-12 z-0 pointer-events-none flex flex-col">
              {HORAS_DIA.map(h => <div key={h} className="h-[80px] border-t border-zinc-100 w-full" />)}
            </div>

            {professoresMock.map((prof, index) => {
              const aulasDesteProf = aulasMock.filter(a => a.professorId === prof.id);
              return (
                <div key={prof.id} className={`flex-1 min-w-[220px] relative ${index !== professoresMock.length - 1 ? 'border-r border-zinc-100' : ''}`}>
                  <div className="h-12 bg-white border-b border-zinc-200 sticky top-0 z-10 flex items-center justify-center gap-2 shadow-sm">
                    <span className={`w-2.5 h-2.5 rounded-full ${prof.avatarCor}`}></span>
                    <span className="text-sm font-bold text-zinc-800">{prof.nome}</span>
                  </div>
                  <div className="relative pt-12">
                    {aulasDesteProf.map(aula => {
                      const top = calcularTop(aula.horarioInicio);
                      const height = calcularHeight(aula.horarioInicio, aula.horarioFim);
                      const temDestaque = verificaDestaque(aula);
                      return (
                        <div key={aula.id} style={{ top: `${top}px`, height: `${height}px` }} className={`absolute left-1 right-1 rounded-lg p-2.5 border cursor-pointer overflow-hidden transition-all duration-200 ${temDestaque ? 'opacity-100 hover:shadow-md z-10' : 'opacity-30 grayscale hover:opacity-50'} bg-blue-50 border-blue-200`}>
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${prof.avatarCor}`}></div>
                          <div className="flex flex-col h-full ml-1 justify-between">
                            <div>
                              <h4 className="text-xs font-bold leading-tight text-blue-900">{aula.turmaNome}</h4>
                              <p className="text-[10px] font-medium mt-0.5 text-blue-700">{aula.horarioInicio} - {aula.horarioFim}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </>
  );
}