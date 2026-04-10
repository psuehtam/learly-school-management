"use client";

import { useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type StatusReposicao = "pendente" | "agendada" | "concluida" | "cancelada";

interface Reposicao {
  id: number;
  nomeAluno: string;
  turmaOriginal: string;
  licaoPerdida: string;
  dataFalta: string;
  status: StatusReposicao;
  
  // Dados do Agendamento (Preenchidos depois)
  dataReposicao?: string;
  horarioReposicao?: string;
  professorReposicao?: string;
}

// ─── Mock de Dados ────────────────────────────────────────────────────────────
const reposicoesMockIniciais: Reposicao[] = [
  {
    id: 1, nomeAluno: "Ronald Xavier de Abreu", turmaOriginal: "Book 1 / Seg 14:00", licaoPerdida: "Lesson 2 - Daily Routine", dataFalta: "23/03/2026", status: "pendente"
  },
  {
    id: 2, nomeAluno: "Pedro Henrique Costa", turmaOriginal: "Book 2 / Qua 18:30", licaoPerdida: "Lesson 5 - Past Continuous", dataFalta: "25/03/2026", status: "pendente"
  },
  {
    id: 3, nomeAluno: "Julia Ferreira Lima", turmaOriginal: "Book 3 / Sex 09:00", licaoPerdida: "Lesson 1 - Present Perfect", dataFalta: "20/03/2026", status: "agendada",
    dataReposicao: "28/03/2026", horarioReposicao: "10:00", professorReposicao: "Carlos Mendes"
  },
  {
    id: 4, nomeAluno: "Alice Massari Soares", turmaOriginal: "Book 2 / Qua 14:30", licaoPerdida: "Lesson 3 - Future Tense", dataFalta: "11/03/2026", status: "concluida",
    dataReposicao: "14/03/2026", horarioReposicao: "15:00", professorReposicao: "Ana Paula Silva"
  }
];

const STATUS_CONFIG: Record<StatusReposicao, { label: string; bg: string; text: string }> = {
  pendente:  { label: "Aguardando Agendamento", bg: "bg-red-100", text: "text-red-700" },
  agendada:  { label: "Agendada",               bg: "bg-amber-100", text: "text-amber-700" },
  concluida: { label: "Concluída",              bg: "bg-green-100", text: "text-green-700" },
  cancelada: { label: "Cancelada / Faltou",     bg: "bg-zinc-200",  text: "text-zinc-600" },
};

// ─── Modal de Agendamento ─────────────────────────────────────────────────────
function ModalAgendar({ reposicao, onClose, onSave }: { reposicao: Reposicao, onClose: () => void, onSave: (r: Reposicao) => void }) {
  const [data, setData] = useState(reposicao.dataReposicao?.split('/').reverse().join('-') || "");
  const [horario, setHorario] = useState(reposicao.horarioReposicao || "");
  const [professor, setProfessor] = useState(reposicao.professorReposicao || "");

  function handleSave() {
    onSave({
      ...reposicao,
      status: "agendada",
      dataReposicao: data.split('-').reverse().join('/'),
      horarioReposicao: horario,
      professorReposicao: professor
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Agendar Reposição</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{reposicao.nomeAluno}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        
        <div className="p-6 flex flex-col gap-4">
          <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 text-sm flex flex-col gap-2">
            <div className="flex justify-between"><span className="text-zinc-500 font-medium">Faltou no dia:</span> <span className="font-bold text-red-600">{reposicao.dataFalta}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500 font-medium">Turma:</span> <span className="font-bold text-zinc-800">{reposicao.turmaOriginal}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500 font-medium">Lição Perdida:</span> <span className="font-bold text-zinc-800">{reposicao.licaoPerdida}</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Data da Reposição *</label>
              <input type="date" value={data} onChange={e => setData(e.target.value)} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Horário *</label>
              <input type="time" value={horario} onChange={e => setHorario(e.target.value)} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35]" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Professor Responsável *</label>
            <select value={professor} onChange={e => setProfessor(e.target.value)} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] bg-white">
              <option value="">Selecione um professor...</option>
              <option value="Carlos Mendes">Carlos Mendes</option>
              <option value="Ana Paula Silva">Ana Paula Silva</option>
              <option value="Felipe Santos">Felipe Santos</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50 rounded-b-xl">
          <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-zinc-600 border border-zinc-300 bg-white rounded-lg hover:bg-zinc-50 transition-colors">Cancelar</button>
          <button disabled={!data || !horario || !professor} onClick={handleSave} className="h-9 px-4 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Confirmar Agendamento</button>
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function ReposicoesPage() {
  const [reposicoes, setReposicoes] = useState<Reposicao[]>(reposicoesMockIniciais);
  const [abaAtual, setAbaAtual] = useState<"pendentes" | "agendadas" | "historico">("pendentes");
  const [busca, setBusca] = useState("");
  
  const [reposicaoAgendando, setReposicaoAgendando] = useState<Reposicao | null>(null);

  // Filtros por aba
  const reposicoesFiltradas = reposicoes.filter(r => {
    const matchBusca = r.nomeAluno.toLowerCase().includes(busca.toLowerCase()) || r.turmaOriginal.toLowerCase().includes(busca.toLowerCase());
    
    if (abaAtual === "pendentes") return matchBusca && r.status === "pendente";
    if (abaAtual === "agendadas") return matchBusca && r.status === "agendada";
    return matchBusca && (r.status === "concluida" || r.status === "cancelada");
  });

  function salvarAgendamento(repAtualizada: Reposicao) {
    setReposicoes(prev => prev.map(r => r.id === repAtualizada.id ? repAtualizada : r));
    setReposicaoAgendando(null);
  }

  function alterarStatus(id: number, novoStatus: StatusReposicao) {
    if (novoStatus === "cancelada" && !confirm("Tem certeza que deseja cancelar esta reposição?")) return;
    setReposicoes(prev => prev.map(r => r.id === id ? { ...r, status: novoStatus } : r));
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Reposição de Aulas</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Gerencie os alunos faltosos e agende reposições.</p>
          </div>
          <div className="text-sm font-medium text-zinc-500 flex gap-4 bg-white px-4 py-2 rounded-lg border border-zinc-200 shadow-sm">
             <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span>{reposicoes.filter(r => r.status === "pendente").length} Pendentes</span>
             <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span>{reposicoes.filter(r => r.status === "agendada").length} Agendadas</span>
          </div>
        </div>

        {/* Abas e Busca */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200">
          <div className="flex gap-1">
            <button onClick={() => setAbaAtual("pendentes")} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${abaAtual === "pendentes" ? "border-red-600 text-red-600" : "border-transparent text-zinc-500 hover:text-zinc-700"}`}>
              Aguardando Agendamento
            </button>
            <button onClick={() => setAbaAtual("agendadas")} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${abaAtual === "agendadas" ? "border-amber-600 text-amber-600" : "border-transparent text-zinc-500 hover:text-zinc-700"}`}>
              Reposições Agendadas
            </button>
            <button onClick={() => setAbaAtual("historico")} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${abaAtual === "historico" ? "border-[#1F2A35] text-[#1F2A35]" : "border-transparent text-zinc-500 hover:text-zinc-700"}`}>
              Histórico
            </button>
          </div>
          <div className="relative pb-2 sm:pb-0">
            <input type="text" placeholder="Buscar aluno ou turma..." value={busca} onChange={e => setBusca(e.target.value)} className="h-9 border border-zinc-300 rounded-lg pl-3 pr-10 text-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition w-full sm:w-72" />
            <svg className="absolute right-3 top-[calc(50%-4px)] sm:top-1/2 -translate-y-1/2 text-zinc-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
        </div>

        {/* Tabela de Reposições */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="text-left px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Aluno</th>
                <th className="text-left px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Falta / Lição</th>
                {abaAtual !== "pendentes" && <th className="text-left px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Agendamento</th>}
                <th className="text-left px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Status</th>
                <th className="text-right px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs w-48">Ações</th>
              </tr>
            </thead>
            <tbody>
              {reposicoesFiltradas.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-zinc-400 font-medium">Nenhum registro encontrado nesta aba.</td></tr>
              ) : (
                reposicoesFiltradas.map((rep, i) => (
                  <tr key={rep.id} className={`border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${i === reposicoesFiltradas.length - 1 ? "border-b-0" : ""}`}>
                    
                    <td className="px-5 py-4">
                      <p className="font-bold text-zinc-900">{rep.nomeAluno}</p>
                      <p className="text-xs text-zinc-500">{rep.turmaOriginal}</p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-red-600">{rep.dataFalta}</p>
                      <p className="text-xs text-zinc-600">{rep.licaoPerdida}</p>
                    </td>

                    {abaAtual !== "pendentes" && (
                      <td className="px-5 py-4">
                        {rep.dataReposicao ? (
                          <>
                            <p className="font-bold text-zinc-800">{rep.dataReposicao} às {rep.horarioReposicao}</p>
                            <p className="text-xs text-zinc-500">Prof: {rep.professorReposicao}</p>
                          </>
                        ) : (
                          <span className="text-zinc-400 text-xs">—</span>
                        )}
                      </td>
                    )}

                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded border text-[11px] font-bold uppercase tracking-wide ${STATUS_CONFIG[rep.status].bg} ${STATUS_CONFIG[rep.status].text}`}>
                        {STATUS_CONFIG[rep.status].label}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        
                        {/* Ações para Pendentes */}
                        {rep.status === "pendente" && (
                          <>
                            <button onClick={() => alterarStatus(rep.id, "cancelada")} className="h-8 px-3 text-xs font-bold text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200 rounded transition-colors">Ignorar</button>
                            <button onClick={() => setReposicaoAgendando(rep)} className="h-8 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-sm">Agendar</button>
                          </>
                        )}

                        {/* Ações para Agendadas */}
                        {rep.status === "agendada" && (
                          <>
                            <button onClick={() => alterarStatus(rep.id, "cancelada")} className="h-8 px-3 text-xs font-bold text-red-600 hover:bg-red-50 rounded transition-colors">Cancelar</button>
                            <button onClick={() => setReposicaoAgendando(rep)} className="h-8 px-3 text-xs font-bold text-zinc-600 border border-zinc-200 hover:bg-zinc-100 rounded transition-colors">Reagendar</button>
                            <button onClick={() => alterarStatus(rep.id, "concluida")} className="h-8 px-4 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded transition-colors shadow-sm">Dar Baixa</button>
                          </>
                        )}

                        {/* Ações para Histórico */}
                        {(rep.status === "concluida" || rep.status === "cancelada") && (
                           <button onClick={() => alterarStatus(rep.id, "pendente")} className="h-8 px-3 text-xs font-bold text-zinc-500 border border-zinc-200 hover:bg-zinc-100 rounded transition-colors">Reabrir</button>
                        )}

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal Render */}
      {reposicaoAgendando && (
        <ModalAgendar reposicao={reposicaoAgendando} onClose={() => setReposicaoAgendando(null)} onSave={salvarAgendamento} />
      )}
    </>
  );
}