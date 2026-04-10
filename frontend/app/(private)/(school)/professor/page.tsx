"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Turno = "morning" | "afternoon" | "evening";

interface Aula {
  id: number;
  nomeTurma: string;
  horario: string; // "14:00"
  duracaoMin: number; // duração em minutos
  turno: Turno;
  diaSemana: number; // 0=seg, 1=ter, ...5=sab
  alunos: string[];
  capituloAtual: string;
  capitulosConcluidos: number;
  capitulosPendentes: number;
  dataInicio: string;
  dataTermino: string;
  observacoes: string;
}

// ─── Mock ─────────────────────────────────────────────────────────────────────
const aulasMock: Aula[] = [
  { id: 1, nomeTurma: "BOOK 1 KIDS",   horario: "14:00", duracaoMin: 60, turno: "afternoon", diaSemana: 0, alunos: ["Alice M.", "Ronald X.", "Julia F."],          capituloAtual: "Unit 3", capitulosConcluidos: 2, capitulosPendentes: 8,  dataInicio: "06/01/2025", dataTermino: "15/09/2025", observacoes: "Turma participativa." },
  { id: 2, nomeTurma: "BOOK 2 TEENS",  horario: "18:30", duracaoMin: 60, turno: "evening",   diaSemana: 0, alunos: ["Pedro H.", "Maria C.", "João V.", "Ana L."],  capituloAtual: "Unit 5", capitulosConcluidos: 4, capitulosPendentes: 6,  dataInicio: "08/01/2025", dataTermino: "20/10/2025", observacoes: "" },
  { id: 3, nomeTurma: "BOOK 3 ADULTS", horario: "09:00", duracaoMin: 60, turno: "morning",   diaSemana: 1, alunos: ["Carlos M.", "Fernanda C."],                   capituloAtual: "Unit 7", capitulosConcluidos: 6, capitulosPendentes: 4,  dataInicio: "10/01/2025", dataTermino: "05/11/2025", observacoes: "Bom ritmo." },
  { id: 4, nomeTurma: "BOOK 1 TEENS",  horario: "16:00", duracaoMin: 60, turno: "afternoon", diaSemana: 2, alunos: ["Beatriz L.", "Rafael S.", "Camila N."],       capituloAtual: "Unit 2", capitulosConcluidos: 1, capitulosPendentes: 9,  dataInicio: "15/01/2025", dataTermino: "30/09/2025", observacoes: "" },
  { id: 5, nomeTurma: "BOOK 4 ADULTS", horario: "19:00", duracaoMin: 60, turno: "evening",   diaSemana: 3, alunos: ["Thiago B.", "Isabela R."],                    capituloAtual: "Unit 9", capitulosConcluidos: 8, capitulosPendentes: 2,  dataInicio: "03/02/2025", dataTermino: "10/12/2025", observacoes: "Finalização próxima." },
  { id: 6, nomeTurma: "BOOK 2 KIDS",   horario: "10:00", duracaoMin: 60, turno: "morning",   diaSemana: 4, alunos: ["Sofia M.", "Guilherme P.", "Larissa C."],     capituloAtual: "Unit 4", capitulosConcluidos: 3, capitulosPendentes: 7,  dataInicio: "17/01/2025", dataTermino: "12/11/2025", observacoes: "" },
  { id: 7, nomeTurma: "BOOK 5 TEENS",  horario: "14:30", duracaoMin: 60, turno: "afternoon", diaSemana: 2, alunos: ["Lucas A.", "Mariana D.", "Felipe R."],        capituloAtual: "Unit 6", capitulosConcluidos: 5, capitulosPendentes: 5,  dataInicio: "20/01/2025", dataTermino: "25/11/2025", observacoes: "" },
];

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DIAS_CURTO = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const turnoColors: Record<Turno, { bg: string; text: string; border: string; calBg: string; calText: string }> = {
  morning:   { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200", calBg: "bg-amber-100",  calText: "text-amber-800"  },
  afternoon: { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",  calBg: "bg-blue-100",   calText: "text-blue-800"   },
  evening:   { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200",calBg: "bg-purple-100", calText: "text-purple-800" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function horarioParaMinutos(h: string): number {
  const [hora, min] = h.split(":").map(Number);
  return hora * 60 + min;
}

function getInicioSemana(data: Date): Date {
  const d = new Date(data);
  const dia = d.getDay(); // 0=dom
  const diff = dia === 0 ? -6 : 1 - dia; // ajusta para segunda
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatarData(data: Date): string {
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// ─── Modal de detalhes da aula ────────────────────────────────────────────────
function ModalAula({ aula, onClose }: { aula: Aula; onClose: () => void }) {
  const total = aula.capitulosConcluidos + aula.capitulosPendentes;
  const progresso = Math.round((aula.capitulosConcluidos / total) * 100);
  const c = turnoColors[aula.turno];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-base font-semibold text-zinc-900">{aula.nomeTurma}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border}`}>
              {aula.turno === "morning" ? "Morning" : aula.turno === "afternoon" ? "Afternoon" : "Evening"}
            </span>
            <span className="text-sm text-zinc-500">{aula.horario} · {DIAS[aula.diaSemana]}</span>
          </div>

          {/* Alunos */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Alunos ({aula.alunos.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {aula.alunos.map((a) => (
                <span key={a} className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">{a}</span>
              ))}
            </div>
          </div>

          {/* Progresso */}
          <div>
            <div className="flex justify-between mb-1.5">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Progresso</p>
              <p className="text-xs text-zinc-500">Capítulo atual: <span className="font-medium text-zinc-700">{aula.capituloAtual}</span></p>
            </div>
            <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#1F2A35] rounded-full" style={{ width: `${progresso}%` }} />
            </div>
            <div className="flex justify-between mt-1.5 text-xs">
              <span className="text-green-600">{aula.capitulosConcluidos} concluídos</span>
              <span className="text-zinc-400">{progresso}%</span>
              <span className="text-zinc-400">{aula.capitulosPendentes} pendentes</span>
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-zinc-400">Início</p>
              <p className="font-medium text-zinc-700">{aula.dataInicio}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Término previsto</p>
              <p className="font-medium text-zinc-700">{aula.dataTermino}</p>
            </div>
          </div>

          {aula.observacoes && (
            <p className="text-xs text-zinc-400 italic bg-zinc-50 rounded-lg px-3 py-2">{aula.observacoes}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200">
          <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">Fechar</button>
          <Link href={`/professor/turma/${aula.id}`}
            className="h-9 px-4 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors flex items-center">
            Acessar turma
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ProfessorPage() {
  const hoje = new Date();
  const [semanaBase, setSemanaBase] = useState(getInicioSemana(hoje));
  const [aulaSelecionada, setAulaSelecionada] = useState<Aula | null>(null);
  const [busca, setBusca] = useState("");

  // Datas da semana atual
  const diasSemana = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(semanaBase);
    d.setDate(semanaBase.getDate() + i);
    return d;
  });

  function semanaAnterior() {
    const d = new Date(semanaBase);
    d.setDate(d.getDate() - 7);
    setSemanaBase(d);
  }

  function proximaSemana() {
    const d = new Date(semanaBase);
    d.setDate(d.getDate() + 7);
    setSemanaBase(d);
  }

  function irParaHoje() {
    setSemanaBase(getInicioSemana(hoje));
  }

  function isHoje(data: Date) {
    return data.toDateString() === hoje.toDateString();
  }

  // Horários do calendário (7h às 22h)
  const HORA_INICIO = 7;
  const HORA_FIM = 22;
  const ALTURA_HORA = 60; // px por hora
  const horas = Array.from({ length: HORA_FIM - HORA_INICIO }, (_, i) => HORA_INICIO + i);

  // Filtra aulas pela busca
  const aulasFiltradas = aulasMock.filter((a) => {
    if (!busca) return true;
    const b = busca.toLowerCase();
    return (
      a.nomeTurma.toLowerCase().includes(b) ||
      a.alunos.some((al) => al.toLowerCase().includes(b))
    );
  });

  // Posição vertical da aula no calendário
  function topAula(horario: string): number {
    const minutos = horarioParaMinutos(horario) - HORA_INICIO * 60;
    return (minutos / 60) * ALTURA_HORA;
  }

  function alturaAula(duracaoMin: number): number {
    return (duracaoMin / 60) * ALTURA_HORA - 4;
  }

  const mesAno = semanaBase.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <>
      <div className="flex flex-col gap-4">

        {/* Topo */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Minhas Aulas</h1>
            <p className="text-sm text-zinc-500 mt-0.5 capitalize">{mesAno}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Busca */}
            <div className="relative">
              <input type="text" placeholder="Buscar turma ou aluno..." value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="h-9 border border-zinc-300 rounded-lg pl-3 pr-8 text-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition w-52" />
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>

            {/* Navegação semana */}
            <div className="flex items-center gap-1">
              <button onClick={semanaAnterior}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-300 hover:bg-zinc-50 transition-colors text-zinc-600">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button onClick={irParaHoje}
                className="h-8 px-3 text-xs font-medium border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors text-zinc-600">
                Hoje
              </button>
              <button onClick={proximaSemana}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-300 hover:bg-zinc-50 transition-colors text-zinc-600">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Legenda turnos */}
        <div className="flex gap-4">
          {(["morning", "afternoon", "evening"] as Turno[]).map((t) => {
            const c = turnoColors[t];
            const label = t === "morning" ? "Morning (até 12h)" : t === "afternoon" ? "Afternoon (até 18h)" : "Evening (após 18h)";
            return (
              <span key={t} className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span className={`w-3 h-3 rounded-sm ${c.calBg}`} />
                {label}
              </span>
            );
          })}
        </div>

        {/* Calendário semanal */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">

          {/* Header dos dias */}
          <div className="grid border-b border-zinc-200" style={{ gridTemplateColumns: "56px repeat(6, 1fr)" }}>
            <div className="border-r border-zinc-100" />
            {diasSemana.map((data, i) => (
              <div key={i} className={`px-2 py-3 text-center border-r border-zinc-100 last:border-r-0 ${isHoje(data) ? "bg-[#1F2A35]/5" : ""}`}>
                <p className="text-xs text-zinc-400 font-medium">{DIAS_CURTO[i]}</p>
                <p className={`text-sm font-semibold mt-0.5 ${isHoje(data) ? "text-[#1F2A35]" : "text-zinc-700"}`}>
                  {formatarData(data)}
                </p>
                {isHoje(data) && <div className="w-1.5 h-1.5 rounded-full bg-[#1F2A35] mx-auto mt-1" />}
              </div>
            ))}
          </div>

          {/* Grade de horários */}
          <div className="overflow-y-auto" style={{ maxHeight: "600px" }}>
            <div className="relative grid" style={{ gridTemplateColumns: "56px repeat(6, 1fr)" }}>

              {/* Coluna de horas */}
              <div className="border-r border-zinc-100">
                {horas.map((hora) => (
                  <div key={hora} className="flex items-start justify-end pr-2 border-b border-zinc-50"
                    style={{ height: `${ALTURA_HORA}px` }}>
                    <span className="text-xs text-zinc-300 -translate-y-2">{String(hora).padStart(2, "0")}:00</span>
                  </div>
                ))}
              </div>

              {/* Colunas dos dias */}
              {diasSemana.map((data, diaIdx) => (
                <div key={diaIdx}
                  className={`relative border-r border-zinc-100 last:border-r-0 ${isHoje(data) ? "bg-[#1F2A35]/[0.02]" : ""}`}
                  style={{ height: `${(HORA_FIM - HORA_INICIO) * ALTURA_HORA}px` }}>

                  {/* Linhas de hora */}
                  {horas.map((hora) => (
                    <div key={hora} className="absolute w-full border-b border-zinc-50"
                      style={{ top: `${(hora - HORA_INICIO) * ALTURA_HORA}px` }} />
                  ))}

                  {/* Linha de meia hora */}
                  {horas.map((hora) => (
                    <div key={`half-${hora}`} className="absolute w-full border-b border-zinc-50/50"
                      style={{ top: `${(hora - HORA_INICIO) * ALTURA_HORA + ALTURA_HORA / 2}px`, borderStyle: "dashed" }} />
                  ))}

                  {/* Aulas do dia */}
                  {aulasFiltradas
                    .filter((a) => a.diaSemana === diaIdx)
                    .map((aula) => {
                      const c = turnoColors[aula.turno];
                      const top = topAula(aula.horario);
                      const altura = alturaAula(aula.duracaoMin);
                      return (
                        <button
                          key={aula.id}
                          onClick={() => setAulaSelecionada(aula)}
                          className={`absolute left-1 right-1 rounded-lg px-2 py-1.5 text-left border transition-all hover:brightness-95 hover:shadow-sm ${c.calBg} ${c.calText} ${c.border}`}
                          style={{ top: `${top}px`, height: `${altura}px` }}
                        >
                          <p className="text-xs font-semibold truncate leading-tight">{aula.nomeTurma}</p>
                          <p className="text-xs opacity-70 leading-tight">{aula.horario}</p>
                          {altura > 50 && (
                            <p className="text-xs opacity-60 truncate leading-tight mt-0.5">
                              {aula.alunos.length} alunos
                            </p>
                          )}
                        </button>
                      );
                    })}

                  {/* Linha de agora */}
                  {isHoje(data) && (() => {
                    const agora = new Date();
                    const minAgora = agora.getHours() * 60 + agora.getMinutes();
                    const topAgora = ((minAgora - HORA_INICIO * 60) / 60) * ALTURA_HORA;
                    if (topAgora < 0 || topAgora > (HORA_FIM - HORA_INICIO) * ALTURA_HORA) return null;
                    return (
                      <div className="absolute w-full flex items-center pointer-events-none z-10"
                        style={{ top: `${topAgora}px` }}>
                        <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0" />
                        <div className="flex-1 h-px bg-red-400" />
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Modal de detalhes */}
      {aulaSelecionada && (
        <ModalAula aula={aulaSelecionada} onClose={() => setAulaSelecionada(null)} />
      )}
    </>
  );
}