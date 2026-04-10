"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface TurmaDetalhe {
  id: number;
  nome: string;
  livro: string;
  professor: string;
  diaSemana: string;
  horario: string;
  sala: string;
  turno: "morning" | "afternoon" | "evening";
  status: "ativa" | "em_espera" | "inativa";
  dataInicio: string;
  dataTermino: string;
}

interface AlunoTurma {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  statusFinanceiro: "em_dia" | "pendente" | "atrasado";
  frequencia: number;
  media: number | null;
}

interface AulaMinistrada {
  id: number;
  data: string;
  licao: string;
  conteudo: string;
  frequencia: string;
}

// ─── Mocks ────────────────────────────────────────────────────────────────────
const bancoTurmasMock: Record<string, TurmaDetalhe> = {
  "1": { id: 1, nome: "BOOK 1 (IDIOMA) B1 KIDS / 01 SEG 14:00", livro: "Book 1", professor: "Carlos Mendes", diaSemana: "Segunda", horario: "14:00", sala: "Sala 1", turno: "afternoon", status: "ativa", dataInicio: "2025-01-06", dataTermino: "2025-09-15" },
  "2": { id: 2, nome: "BOOK 2 (IDIOMA) B2 TEENS / 02 QUA 18:30", livro: "Book 2", professor: "Ana Paula Silva", diaSemana: "Quarta", horario: "18:30", sala: "Sala 2", turno: "evening", status: "ativa", dataInicio: "2025-01-08", dataTermino: "2025-10-20" },
};

const alunosMockIniciais: AlunoTurma[] = [
  { id: 128, nome: "ADACIR GODOI", cpf: "913.567.929-87", telefone: "(41) 99949-0460", statusFinanceiro: "em_dia", frequencia: 100, media: 9.5 },
  { id: 2, nome: "RONALD XAVIER DE ABREU", cpf: "234.567.890-00", telefone: "(41) 98888-7777", statusFinanceiro: "atrasado", frequencia: 85, media: 7.0 },
  { id: 3, nome: "JULIA FERREIRA LIMA", cpf: "345.678.901-00", telefone: "(21) 97777-3333", statusFinanceiro: "pendente", frequencia: 92, media: null },
];

const aulasMockIniciais: AulaMinistrada[] = [
  { id: 101, data: "10/03/2026", licao: "Lesson 3", conteudo: "Simple Past (Regular Verbs) - Páginas 22 a 25", frequencia: "100%" },
  { id: 100, data: "03/03/2026", licao: "Lesson 2", conteudo: "Daily Routine vocabulary - Páginas 18 a 21", frequencia: "85%" },
  { id: 99, data: "24/02/2026", licao: "Lesson 1", conteudo: "Introdução e Verb To Be - Páginas 10 a 17", frequencia: "100%" },
];

const financeiroColors = {
  em_dia:   "bg-green-50 text-green-700 border-green-200",
  pendente: "bg-amber-50 text-amber-700 border-amber-200",
  atrasado: "bg-red-50 text-red-700 border-red-200",
};

const financeiroLabel = {
  em_dia:   "Em dia",
  pendente: "Pendente",
  atrasado: "Atrasado",
};

const diasSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// ─── Componentes Auxiliares ───────────────────────────────────────────────────
function LabelValue({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium text-zinc-900">{value || "—"}</span>
    </div>
  );
}

// Formata data YYYY-MM-DD para exibição
function formatarDataVisao(dataIso: string) {
  if (!dataIso || dataIso === "A definir" || dataIso === "—") return dataIso;
  const partes = dataIso.split("-");
  if (partes.length !== 3) return dataIso;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// ─── Modal Editar Turma ───────────────────────────────────────────────────────
function ModalEditarTurma({ turma, onClose, onSave }: { turma: TurmaDetalhe, onClose: () => void, onSave: (t: TurmaDetalhe) => void }) {
  const [form, setForm] = useState<TurmaDetalhe>({ ...turma });

  function handleChange(field: keyof TurmaDetalhe, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    // Atualiza o nome da turma automaticamente se o livro, dia ou horário mudarem
    let novoNome = form.nome;
    if (form.livro && form.diaSemana && form.horario) {
      const diaAbrev = form.diaSemana.substring(0, 3).toUpperCase();
      novoNome = `${form.livro.toUpperCase()} / ${diaAbrev} ${form.horario}`;
    }
    onSave({ ...form, nome: novoNome });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 sticky top-0 bg-white rounded-t-xl z-10">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Editar Dados da Turma</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Atualize informações acadêmicas e de agendamento.</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-5 overflow-y-auto">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Status da Turma</label>
              <select value={form.status} onChange={(e) => handleChange("status", e.target.value)} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition bg-white">
                <option value="ativa">Ativa</option>
                <option value="em_espera">Em Espera</option>
                <option value="inativa">Inativa</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Turno</label>
              <select value={form.turno} onChange={(e) => handleChange("turno", e.target.value)} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition bg-white">
                <option value="morning">Morning (Manhã)</option>
                <option value="afternoon">Afternoon (Tarde)</option>
                <option value="evening">Evening (Noite)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Livro / Nível *</label>
              <select value={form.livro} onChange={(e) => handleChange("livro", e.target.value)} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition bg-white">
                <option value="Book 1">Book 1</option>
                <option value="Book 2">Book 2</option>
                <option value="Book 3">Book 3</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Professor Responsável *</label>
              <select value={form.professor} onChange={(e) => handleChange("professor", e.target.value)} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition bg-white">
                <option value="Carlos Mendes">Carlos Mendes</option>
                <option value="Ana Paula Silva">Ana Paula Silva</option>
                <option value="Sem professor">Sem professor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Dia da Semana</label>
              <select value={form.diaSemana} onChange={(e) => handleChange("diaSemana", e.target.value)} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition bg-white">
                <option value="">A definir</option>
                {diasSemana.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Horário</label>
              <input type="time" value={form.horario} onChange={(e) => handleChange("horario", e.target.value)} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Sala</label>
              <input type="text" placeholder="Ex: Sala 1" value={form.sala} onChange={(e) => handleChange("sala", e.target.value)} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Data de Início</label>
              <input type="date" value={form.dataInicio} onChange={(e) => handleChange("dataInicio", e.target.value)} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Data de Término (Prevista)</label>
              <input type="date" value={form.dataTermino} onChange={(e) => handleChange("dataTermino", e.target.value)} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition" />
            </div>
          </div>
          
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50 rounded-b-xl">
          <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-zinc-600 border border-zinc-300 bg-white rounded-lg hover:bg-zinc-50 transition-colors">Cancelar</button>
          <button onClick={handleSave} className="h-9 px-4 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors">Salvar Alterações</button>
        </div>
      </div>
    </div>
  );
}


// ─── Mock de Alunos Disponíveis (Fora do Componente) ──────────────────────────
const TODOS_ALUNOS_MOCK: AlunoTurma[] = [
  { id: 999, nome: "MARIA EDUARDA SILVA", cpf: "111.222.333-44", telefone: "(11) 95555-4444", statusFinanceiro: "em_dia", frequencia: 0, media: null },
  { id: 998, nome: "PEDRO HENRIQUE SOUZA", cpf: "555.666.777-88", telefone: "(11) 94444-3333", statusFinanceiro: "em_dia", frequencia: 0, media: null },
];

// ─── Modal Vincular Aluno ─────────────────────────────────────────────────────
function ModalVincularAluno({ onClose, onSave }: { onClose: () => void, onSave: (aluno: AlunoTurma) => void }) {
  const [busca, setBusca] = useState("");
  
  // Filtro seguro: O "?." garante que o código não quebre se faltar nome ou CPF
  const alunosDisponiveis = TODOS_ALUNOS_MOCK.filter(a => {
    const termoBusca = busca.toLowerCase();
    const matchNome = a.nome?.toLowerCase().includes(termoBusca);
    const matchCpf = a.cpf?.includes(termoBusca);
    return matchNome || matchCpf;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Vincular Aluno à Turma</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Pesquise pelo nome ou CPF do aluno matriculado.</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          <input 
            type="text" 
            placeholder="Buscar aluno..." 
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition w-full" 
          />

          <div className="flex flex-col gap-2 mt-2 border border-zinc-200 rounded-lg p-2 max-h-64 overflow-y-auto bg-zinc-50">
            {alunosDisponiveis.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">Nenhum aluno encontrado.</p>
            ) : (
              alunosDisponiveis.map(aluno => (
                <div key={aluno.id} className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-lg shadow-sm hover:border-blue-300 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{aluno.nome}</p>
                    <p className="text-xs text-zinc-500">CPF: {aluno.cpf} | Tel: {aluno.telefone}</p>
                  </div>
                  <button 
                    onClick={() => { onSave(aluno); onClose(); }}
                    className="h-8 px-4 text-xs font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Vincular
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200">
          <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">Cancelar / Fechar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function PainelTurmaAdminPage() {
  const params = useParams();
  const turmaId = params.id as string;

  // Pegamos a turma inicial do Mock e colocamos em um state para refletir edições
  const [turmaSelecionada, setTurmaSelecionada] = useState<TurmaDetalhe>(
    bancoTurmasMock[turmaId] || {
      id: 0, nome: "Turma Não Encontrada", livro: "—", professor: "—", diaSemana: "—", horario: "—", sala: "—", turno: "morning", status: "inativa", dataInicio: "—", dataTermino: "—"
    }
  );

  const [abaAtual, setAbaAtual] = useState("Configurações da Turma");
  const [alunos, setAlunos] = useState<AlunoTurma[]>(alunosMockIniciais);
  
  // Modais
  const [modalVincularAberto, setModalVincularAberto] = useState(false);
  const [modalEditarTurmaAberto, setModalEditarTurmaAberto] = useState(false);

  function removerAluno(id: number, nome: string) {
    if(confirm(`Tem certeza que deseja desvincular o aluno(a) ${nome} desta turma? O aluno continuará existindo no sistema.`)) {
      setAlunos(prev => prev.filter(a => a.id !== id));
    }
  }

  function adicionarAluno(novoAluno: AlunoTurma) {
    if (!alunos.find(a => a.id === novoAluno.id)) {
      setAlunos(prev => [...prev, novoAluno]);
    } else {
      alert("Este aluno já está matriculado nesta turma!");
    }
  }

  function salvarEdicaoTurma(dadosEditados: TurmaDetalhe) {
    setTurmaSelecionada(dadosEditados);
    setModalEditarTurmaAberto(false);
  }

  return (
    <>
      <div className="flex flex-col gap-6">

        {/* Voltar e Título */}
        <div>
          <Link href="/turmas" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors w-fit mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Voltar para Turmas
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-zinc-900">Painel da Turma <span className="text-zinc-400 font-normal">| Visão Administrativa</span></h1>
            <span className="text-sm text-zinc-500 bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm">ID: {turmaSelecionada.id}</span>
          </div>
        </div>

        {/* ─── CARD: INFORMAÇÕES DA TURMA ─── */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-zinc-50 border-b border-zinc-200 px-5 py-3 flex justify-between items-center">
            <h2 className="text-sm font-bold text-[#1F2A35]">{turmaSelecionada.nome}</h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
              turmaSelecionada.status === "ativa" ? "bg-green-100 text-green-700" : 
              turmaSelecionada.status === "em_espera" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
            }`}>
              {turmaSelecionada.status.replace("_", " ")}
            </span>
          </div>
          
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8">
            <LabelValue label="Professor" value={turmaSelecionada.professor} />
            <LabelValue label="Livro / Nível" value={turmaSelecionada.livro} />
            <LabelValue label="Dia da Semana" value={turmaSelecionada.diaSemana} />
            <LabelValue label="Horário" value={turmaSelecionada.horario} />
            
            <LabelValue label="Sala" value={turmaSelecionada.sala} />
            <LabelValue label="Início do Semestre" value={formatarDataVisao(turmaSelecionada.dataInicio)} />
            <LabelValue label="Término Previsto" value={formatarDataVisao(turmaSelecionada.dataTermino)} />
            <LabelValue label="Total de Alunos" value={`${alunos.length} alunos vinculados`} />
          </div>
        </div>

        {/* ─── BARRA DE ABAS ─── */}
        <div className="flex gap-1 border-b border-zinc-200">
          {["Alunos Matriculados", "Aulas Ministradas", "Configurações da Turma"].map((aba) => (
            <button 
              key={aba} 
              onClick={() => setAbaAtual(aba)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                abaAtual === aba ? "border-[#1F2A35] text-[#1F2A35]" : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {aba}
            </button>
          ))}
        </div>

        {/* ─── CONTEÚDO DAS ABAS ─── */}
        
        {/* ABA: Alunos Matriculados */}
        {abaAtual === "Alunos Matriculados" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="relative">
                <input type="text" placeholder="Buscar aluno na turma..." className="h-9 border border-zinc-300 rounded-lg pl-3 pr-10 text-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition w-64" />
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <button 
                onClick={() => setModalVincularAberto(true)}
                className="flex items-center gap-2 h-9 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Vincular Aluno
              </button>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="text-left px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Aluno</th>
                    <th className="text-left px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Telefone</th>
                    <th className="text-center px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Freq. Atual</th>
                    <th className="text-center px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Situação Financeira</th>
                    <th className="text-right px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Opções</th>
                  </tr>
                </thead>
                <tbody>
                  {alunos.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-12 text-zinc-400">Nenhum aluno matriculado nesta turma.</td></tr>
                  ) : (
                    alunos.map((a, i) => (
                      <tr key={a.id} className={`border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${i === alunos.length - 1 ? "border-b-0" : ""}`}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#1F2A35] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                              {a.nome.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-zinc-900">{a.nome}</p>
                              <p className="text-xs text-zinc-400">ID: {a.id} | CPF: {a.cpf}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-medium text-zinc-700">{a.telefone}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`font-bold ${a.frequencia >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                            {a.frequencia}%
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-bold uppercase tracking-wide ${financeiroColors[a.statusFinanceiro]}`}>
                            {financeiroLabel[a.statusFinanceiro]}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/alunos/${a.id}`} className="h-8 px-3 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors flex items-center">
                              Ver Perfil
                            </Link>
                            <button onClick={() => removerAluno(a.id, a.nome)} className="h-8 px-3 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors" title="Remover da Turma">
                              Desvincular
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA: Aulas Ministradas */}
        {abaAtual === "Aulas Ministradas" && (
          <div className="flex flex-col gap-4">
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-zinc-50 border-b border-zinc-200 px-5 py-4 flex justify-between items-center">
                <h3 className="text-sm font-bold text-zinc-800">Diário de Classe (Visão Leitura)</h3>
                <span className="text-xs text-zinc-500">O registro é feito pelo Professor.</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white border-b border-zinc-200">
                      <th className="text-left px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs w-32">Data</th>
                      <th className="text-left px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Lição</th>
                      <th className="text-left px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Conteúdo Aplicado</th>
                      <th className="text-center px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs w-32">Presença Geral</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aulasMockIniciais.map((aula, i) => (
                      <tr key={aula.id} className={`border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${i === aulasMockIniciais.length - 1 ? "border-b-0" : ""}`}>
                        <td className="px-5 py-3 font-medium text-zinc-900">{aula.data}</td>
                        <td className="px-5 py-3 text-zinc-700 font-bold">{aula.licao}</td>
                        <td className="px-5 py-3 text-zinc-600">{aula.conteudo}</td>
                        <td className="px-5 py-3 text-center">
                          <span className="inline-flex px-2 py-1 bg-zinc-100 border border-zinc-200 rounded text-xs font-bold text-zinc-700">
                            {aula.frequencia}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ABA: Configurações (EDIÇÃO HABILITADA) */}
        {abaAtual === "Configurações da Turma" && (
          <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center text-zinc-500">
            <svg className="mx-auto h-12 w-12 text-zinc-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-lg font-medium text-zinc-900">Configurações Avançadas</h3>
            <p className="mt-1 text-sm text-zinc-500">Edição de status, alteração de sala ou atualização de professor/horário.</p>
            <div className="mt-6">
              {/* 👇 BOTÃO AGORA CHAMA O MODAL DE EDIÇÃO 👇 */}
              <button 
                onClick={() => setModalEditarTurmaAberto(true)}
                className="inline-flex items-center px-4 py-2 border border-zinc-300 shadow-sm text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1F2A35]"
              >
                Editar Dados da Turma
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Renderização dos Modais */}
      {modalVincularAberto && (
        <ModalVincularAluno onClose={() => setModalVincularAberto(false)} onSave={adicionarAluno} />
      )}

      {modalEditarTurmaAberto && (
        <ModalEditarTurma 
          turma={turmaSelecionada} 
          onClose={() => setModalEditarTurmaAberto(false)} 
          onSave={salvarEdicaoTurma} 
        />
      )}
    </>
  );
}