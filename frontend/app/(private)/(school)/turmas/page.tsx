"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type StatusTurma = "em_espera" | "em_andamento" | "concluida" | "cancelada" | "inativa";
type Turno = "morning" | "afternoon" | "evening";

interface Turma {
  id: number;
  nome: string;
  livro: string;
  professor: string;
  diaSemana: string; 
  horarioInicio: string;
  horarioFim: string;
  sala: string;
  turno: Turno;
  status: StatusTurma;
  dataInicio: string;
  dataTermino: string;
  totalAlunos: number;
  observacoes?: string;
}

// ─── Dados mock ───────────────────────────────────────────────────────────────
const turmasMock: Turma[] = [
  { id: 1, nome: "BOOK 1 (INGLÊS) B1 KIDS / 01 SEG-QUA 14:00", livro: "Book 1", professor: "Carlos Mendes", diaSemana: "Seg, Qua", horarioInicio: "14:00", horarioFim: "15:30", sala: "Sala 1", turno: "afternoon", status: "em_andamento", dataInicio: "06/01/2025", dataTermino: "15/09/2025", totalAlunos: 5 },
  { id: 2, nome: "BOOK 2 (INGLÊS) B2 TEENS / 02 TER-QUI 18:30", livro: "Book 2", professor: "Ana Paula Silva", diaSemana: "Ter, Qui", horarioInicio: "18:30", horarioFim: "20:00", sala: "Sala 2", turno: "evening", status: "em_andamento", dataInicio: "08/01/2025", dataTermino: "20/10/2025", totalAlunos: 8 },
  { id: 3, nome: "BOOK 3 (INGLÊS) B3 ADULTS / 03 SEX 09:00", livro: "Book 3", professor: "Carlos Mendes", diaSemana: "Sexta", horarioInicio: "09:00", horarioFim: "11:00", sala: "Sala 1", turno: "morning", status: "em_andamento", dataInicio: "10/01/2025", dataTermino: "05/11/2025", totalAlunos: 4 },
  { id: 4, nome: "Turma Book 1 - EM ESPERA", livro: "Book 1", professor: "Ana Paula Silva", diaSemana: "", horarioInicio: "", horarioFim: "", sala: "", turno: "morning", status: "em_espera", dataInicio: "A definir", dataTermino: "A definir", totalAlunos: 3 },
  { id: 5, nome: "Turma Book 2 - EM ESPERA", livro: "Book 2", professor: "Carlos Mendes", diaSemana: "", horarioInicio: "", horarioFim: "", sala: "", turno: "afternoon", status: "em_espera", dataInicio: "A definir", dataTermino: "A definir", totalAlunos: 6 },
  { id: 6, nome: "BOOK 1 (INGLÊS) B1 TEENS / 04 SAB 10:00", livro: "Book 1", professor: "Carlos Mendes", diaSemana: "Sábado", horarioInicio: "10:00", horarioFim: "12:00", sala: "Sala 3", turno: "morning", status: "concluida", dataInicio: "03/03/2024", dataTermino: "10/11/2024", totalAlunos: 5 },
];

const turnoLabel: Record<Turno, string> = { morning: "Morning", afternoon: "Afternoon", evening: "Evening" };
const turnoColors: Record<Turno, string> = { morning: "bg-amber-50 text-amber-700", afternoon: "bg-blue-50 text-blue-700", evening: "bg-purple-50 text-purple-700" };

const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// ─── Modal Nova Turma ─────────────────────────────────────────────────────────
function ModalNovaTurma({ onClose, onSave }: { onClose: () => void, onSave: (t: Partial<Turma>) => void }) {
  const [form, setForm] = useState({ livro: "", professor: "", alunos: "", observacoes: "" });

  function handleSave() {
    if (!form.livro || !form.professor) {
      alert("Professor e Livro são obrigatórios!");
      return;
    }
    
    const nomeProvisorio = `Turma ${form.livro} - EM ESPERA`;
    
    onSave({
      nome: nomeProvisorio,
      livro: form.livro,
      professor: form.professor,
      observacoes: form.observacoes,
      status: "em_espera",
      diaSemana: "", horarioInicio: "", horarioFim: "", sala: "",
      dataInicio: "A definir", dataTermino: "A definir",
      turno: "morning", totalAlunos: form.alunos ? 1 : 0, 
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-base font-semibold text-zinc-900">Criar Nova Turma</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
            A turma será criada com status <strong>Em Espera</strong>. Dias, horários e datas serão definidos no momento do Agendamento. Você poderá adicionar alunos nela enquanto estiver em espera.
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Professor *</label>
            <select value={form.professor} onChange={(e) => setForm({...form, professor: e.target.value})} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm bg-white outline-none focus:border-[#1F2A35]">
              <option value="">Selecione o professor</option>
              <option>Carlos Mendes</option>
              <option>Ana Paula Silva</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Livro *</label>
            <select value={form.livro} onChange={(e) => setForm({...form, livro: e.target.value})} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm bg-white outline-none focus:border-[#1F2A35]">
              <option value="">Selecione o livro</option>
              <option>Book 1</option><option>Book 2</option><option>Book 3</option><option>Book 4</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Alunos pré-matriculados (Opcional)</label>
            <input type="text" placeholder="Buscar alunos para iniciar a lista..." value={form.alunos} onChange={(e) => setForm({...form, alunos: e.target.value})} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35]" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Observações (Opcional)</label>
            <textarea rows={2} placeholder="Anotações internas..." value={form.observacoes} onChange={(e) => setForm({...form, observacoes: e.target.value})} className="border border-zinc-300 rounded-lg p-3 text-sm outline-none focus:border-[#1F2A35] resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50 rounded-b-xl">
          <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-zinc-600 border border-zinc-300 bg-white rounded-lg hover:bg-zinc-50">Cancelar</button>
          <button onClick={handleSave} className="h-9 px-4 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d]">Salvar e Manter em Espera</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Agendar Turma ──────────────────────────────────────────────────────
function ModalAgendarTurma({ turma, onClose, onSave }: { turma: Turma, onClose: () => void, onSave: (t: Turma) => void }) {
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);
  const [dataInicio, setDataInicio] = useState("");
  const [horarioInicio, setHorarioInicio] = useState("");
  const [horarioFim, setHorarioFim] = useState("");
  const [sala, setSala] = useState("");

  function toggleDia(dia: string) {
    setDiasSelecionados(prev => prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]);
  }

  function handleAgendar() {
    if (diasSelecionados.length === 0 || !dataInicio || !horarioInicio || !horarioFim) {
      alert("Preencha os dias da semana, data de início e horários!");
      return;
    }

    const hora = parseInt(horarioInicio.split(":")[0]);
    const turnoConvertido: Turno = hora < 12 ? "morning" : hora < 18 ? "afternoon" : "evening";

    const abreviacao = diasSelecionados.map(d => d.substring(0, 3).toUpperCase()).join("-");
    const codTurma = Math.floor(Math.random() * 10).toString().padStart(2, '0');
    const nomeOficial = `${turma.livro.toUpperCase()} (INGLÊS) / ${codTurma} ${abreviacao} ${horarioInicio}`;

    onSave({
      ...turma,
      status: "em_andamento",
      nome: nomeOficial,
      diaSemana: abreviacao,
      dataInicio: dataInicio.split("-").reverse().join("/"),
      dataTermino: "A calcular...", 
      horarioInicio,
      horarioFim,
      sala,
      turno: turnoConvertido
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Agendar Turma</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{turma.nome}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700">Dias da Semana *</label>
            <div className="flex flex-wrap gap-2">
              {DIAS_SEMANA.map(dia => (
                <button 
                  key={dia} 
                  onClick={() => toggleDia(dia)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${diasSelecionados.includes(dia) ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50'}`}
                >
                  {dia}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Data de Início *</label>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Horário de Início *</label>
              <input type="time" value={horarioInicio} onChange={e => setHorarioInicio(e.target.value)} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Horário de Término *</label>
              <input type="time" value={horarioFim} onChange={e => setHorarioFim(e.target.value)} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35]" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Sala (Opcional)</label>
            <input type="text" placeholder="Ex: Lab 1" value={sala} onChange={e => setSala(e.target.value)} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35]" />
          </div>

        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50 rounded-b-xl">
          <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-zinc-600 border border-zinc-300 bg-white rounded-lg hover:bg-zinc-50">Cancelar</button>
          <button onClick={handleAgendar} className="h-9 px-4 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Confirmar Agendamento
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Card Turma ───────────────────────────────────────────────────────────────
function CardTurma({ turma, onInativar, onAgendar }: { turma: Turma, onInativar: (id: number) => void, onAgendar: (t: Turma) => void }) {
  const isConcluidaOuCancelada = turma.status === "concluida" || turma.status === "cancelada";

  return (
    <div className={`bg-white border border-zinc-200 rounded-xl p-5 flex flex-col gap-4 transition-colors ${isConcluidaOuCancelada ? 'opacity-70 grayscale-[0.5]' : 'hover:border-zinc-300 hover:shadow-sm'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-zinc-900 text-sm leading-snug truncate">{turma.nome}</p>
          <p className="text-xs font-medium text-zinc-500 mt-1 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            {turma.professor}
          </p>
        </div>
        <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${turnoColors[turma.turno]}`}>
          {turnoLabel[turma.turno]}
        </span>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs bg-zinc-50 p-3 rounded-lg border border-zinc-100">
        <div className="flex flex-col gap-0.5"><span className="text-zinc-400 font-medium">Livro</span><span className="text-zinc-800 font-bold">{turma.livro}</span></div>
        <div className="flex flex-col gap-0.5"><span className="text-zinc-400 font-medium">Alunos</span><span className="text-zinc-800 font-bold">{turma.totalAlunos} alunos</span></div>
        
        <div className="flex flex-col gap-0.5 col-span-2 border-t border-zinc-200 pt-2 mt-1">
          <span className="text-zinc-400 font-medium">Cronograma</span>
          <span className="text-zinc-800 font-bold flex items-center gap-1">
            <svg className="text-zinc-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {turma.diaSemana && turma.horarioInicio ? `${turma.diaSemana} • ${turma.horarioInicio} às ${turma.horarioFim}` : "A definir no agendamento"}
          </span>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2 pt-1 border-t border-zinc-100">
        {/* 👇 AQUI: Turma em Espera agora tem o botão para ir adicionar alunos! 👇 */}
        {turma.status === "em_espera" && (
          <>
            <button onClick={() => onAgendar(turma)} className="flex-1 h-9 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              Agendar Dia/Hora
            </button>
            <Link href={`/turmas/${turma.id}`} className="flex-1 flex items-center justify-center h-9 text-xs font-bold text-zinc-700 border border-zinc-300 bg-white rounded-lg hover:bg-zinc-50 transition-colors shadow-sm">
              + Alunos
            </Link>
          </>
        )}
        
        {turma.status === "em_andamento" && (
          <Link href={`/turmas/${turma.id}`} className="flex-1 flex items-center justify-center h-9 text-xs font-bold text-zinc-700 border border-zinc-300 bg-white rounded-lg hover:bg-zinc-50 transition-colors shadow-sm">
            Acessar Turma
          </Link>
        )}

        {isConcluidaOuCancelada && (
          <Link href={`/turmas/${turma.id}`} className="flex-1 flex items-center justify-center h-9 text-xs font-bold text-zinc-500 border border-zinc-200 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors">
            Ver Histórico
          </Link>
        )}
        
        {(turma.status === "em_andamento" || turma.status === "em_espera") && (
          <button onClick={() => onInativar(turma.id)} className="w-10 h-9 flex items-center justify-center text-zinc-400 border border-zinc-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors" title="Inativar Turma">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>(turmasMock);
  const [aba, setAba] = useState<"em_andamento" | "em_espera" | "concluidas" | "inativas">("em_andamento");
  
  const [modalNova, setModalNova] = useState(false);
  const [turmaAgendando, setTurmaAgendando] = useState<Turma | null>(null);

  // Filtros
  const [filtroProfessor, setFiltroProfessor] = useState("todos");
  const [filtroLivro, setFiltroLivro] = useState("todos");

  const turmasFiltradas = turmas.filter((t) => {
    const abaOk =
      aba === "em_andamento" ? t.status === "em_andamento" :
      aba === "em_espera"    ? t.status === "em_espera" :
      aba === "concluidas"   ? t.status === "concluida" : (t.status === "inativa" || t.status === "cancelada");
    
    const profOk  = filtroProfessor === "todos" || t.professor === filtroProfessor;
    const livroOk = filtroLivro     === "todos" || t.livro     === filtroLivro;
    return abaOk && profOk && livroOk;
  });

  const countAndamento = turmas.filter(t => t.status === "em_andamento").length;
  const countEspera    = turmas.filter(t => t.status === "em_espera").length;
  const countConcluidas= turmas.filter(t => t.status === "concluida").length;
  const countInativas  = turmas.filter(t => t.status === "inativa" || t.status === "cancelada").length;

  function inativar(id: number) {
    if(confirm("Tem certeza que deseja inativar esta turma? Ela não aparecerá mais na agenda dos professores.")) {
      setTurmas(prev => prev.map(t => t.id === id ? { ...t, status: "inativa" } : t));
    }
  }

  function criarTurma(dados: Partial<Turma>) {
    const nova: Turma = { ...dados, id: Date.now() } as Turma;
    setTurmas(prev => [nova, ...prev]);
    setModalNova(false);
    setAba("em_espera");
  }

  function confirmarAgendamento(turmaAtualizada: Turma) {
    setTurmas(prev => prev.map(t => t.id === turmaAtualizada.id ? turmaAtualizada : t));
    setTurmaAgendando(null);
    setAba("em_andamento");
  }

  return (
    <>
      <div className="flex flex-col gap-6 h-full">
        {/* Topo */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Planejamento de Turmas</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Crie turmas, faça agendamentos e gerencie o ciclo de vida letivo.</p>
          </div>
          <button onClick={() => setModalNova(true)} className="flex items-center gap-2 h-10 px-5 text-sm font-bold text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova Turma
          </button>
        </div>

        {/* Abas */}
        <div className="flex gap-1 bg-zinc-100 p-1.5 rounded-lg w-fit border border-zinc-200 shadow-inner">
          {([
            { key: "em_andamento", label: "Em Andamento", count: countAndamento },
            { key: "em_espera",    label: "Turmas em Espera", count: countEspera },
            { key: "concluidas",   label: "Concluídas", count: countConcluidas },
            { key: "inativas",     label: "Canceladas / Inativas", count: countInativas },
          ] as const).map(({ key, label, count }) => (
            <button key={key} onClick={() => setAba(key)}
              className={`flex items-center gap-2 h-9 px-4 text-sm font-bold rounded-md transition-all ${
                aba === key ? "bg-white text-[#1F2A35] shadow-sm border border-zinc-200" : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"
              }`}>
              {label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${aba === key ? "bg-blue-100 text-blue-800" : "bg-zinc-200 text-zinc-600"}`}>{count}</span>
            </button>
          ))}
        </div>

        {/* Filtros Básicos */}
        <div className="flex flex-wrap gap-3">
          <select value={filtroProfessor} onChange={(e) => setFiltroProfessor(e.target.value)} className="h-9 border border-zinc-300 rounded-lg px-3 text-sm font-medium text-zinc-700 outline-none focus:border-[#1F2A35] bg-white shadow-sm">
            <option value="todos">Todos os professores</option>
            <option>Carlos Mendes</option><option>Ana Paula Silva</option>
          </select>
          <select value={filtroLivro} onChange={(e) => setFiltroLivro(e.target.value)} className="h-9 border border-zinc-300 rounded-lg px-3 text-sm font-medium text-zinc-700 outline-none focus:border-[#1F2A35] bg-white shadow-sm">
            <option value="todos">Todos os livros</option>
            <option>Book 1</option><option>Book 2</option><option>Book 3</option>
          </select>
        </div>

        {/* Grid de cards */}
        {turmasFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-zinc-50 border border-dashed border-zinc-300 rounded-xl">
            <svg className="text-zinc-300 mb-3" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <p className="text-zinc-500 font-medium">Nenhuma turma encontrada nesta categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-6">
            {turmasFiltradas.map((turma) => (
              <CardTurma key={turma.id} turma={turma} onInativar={inativar} onAgendar={setTurmaAgendando} />
            ))}
          </div>
        )}
      </div>

      {modalNova && <ModalNovaTurma onClose={() => setModalNova(false)} onSave={criarTurma} />}
      {turmaAgendando && <ModalAgendarTurma turma={turmaAgendando} onClose={() => setTurmaAgendando(null)} onSave={confirmarAgendamento} />}
    </>
  );
}