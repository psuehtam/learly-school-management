"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Presenca = "P" | "F" | "R" | null;

interface Aula {
  id: number;
  data: string;
  numero: number;
  capitulo: string;
}

interface Aluno {
  id: number;
  nome: string;
}

interface OcorrenciaHistorico {
  data: string;
  hora: string;
  descricao: string;
  resolucao: string;
  autor: string;
}

// ─── Mock ─────────────────────────────────────────────────────────────────────
const turma = {
  nome: "BOOK 1 (IDIOMA) B1 KIDS / 01 SEG 14:00",
  livro: "Book 1",
  sala: "Sala 1",
  professor: "Carlos Mendes",
  diaHorario: "Segunda, 14:00",
  dataInicio: "06/01/2025",
  dataTermino: "15/09/2025",
};

const alunosMock: Aluno[] = [
  { id: 1, nome: "Alice Massari Soares"   },
  { id: 2, nome: "Ronald Xavier de Abreu" },
  { id: 3, nome: "Julia Ferreira Lima"    },
  { id: 4, nome: "Pedro Henrique Costa"   },
];

const aulasMockIniciais: Aula[] = [
  { id: 1, data: "06/01/2025", numero: 1, capitulo: "Unit 1" },
  { id: 2, data: "13/01/2025", numero: 2, capitulo: "Unit 1" },
  { id: 3, data: "20/01/2025", numero: 3, capitulo: "Unit 2" },
  { id: 4, data: "27/01/2025", numero: 4, capitulo: "Unit 2" },
  { id: 5, data: "03/02/2025", numero: 5, capitulo: "Unit 3" },
];

const avaliacoesTipos = ["Speaking", "Listening", "Writing", "Class Participation", "Avaliação Final"];

const historicoMock: Record<number, OcorrenciaHistorico[]> = {
  1: [
    { data: "20/01/2025", hora: "14:45", descricao: "Aluna demonstrou dificuldade em pronunciar palavras do Unit 2.", resolucao: "Exercícios extras de pronúncia indicados.", autor: "Carlos Mendes" },
  ],
  2: [],
  3: [
    { data: "03/02/2025", hora: "15:00", descricao: "Participação excelente na aula de hoje.", resolucao: "—", autor: "Carlos Mendes" },
  ],
  4: [],
};

// ─── Modal Histórico do Aluno ─────────────────────────────────────────────────
function ModalHistorico({ aluno, onClose }: { aluno: Aluno; onClose: () => void }) {
  const [novaDesc, setNovaDesc] = useState("");
  const [novaRes, setNovaRes] = useState("");
  const ocorrencias = historicoMock[aluno.id] ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Histórico do aluno</h2>
            <p className="text-xs text-zinc-400 mt-0.5">{aluno.nome}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {ocorrencias.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-4">Nenhuma ocorrência registrada.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {ocorrencias.map((o, i) => (
                <div key={i} className="border border-zinc-200 rounded-lg p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-500">{o.data} às {o.hora}</span>
                    <span className="text-xs text-zinc-400">{o.autor}</span>
                  </div>
                  <p className="text-sm text-zinc-800">{o.descricao}</p>
                  {o.resolucao !== "—" && (
                    <p className="text-xs text-zinc-500 bg-zinc-50 rounded px-2 py-1">
                      <span className="font-medium">Resolução:</span> {o.resolucao}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-zinc-100 pt-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Nova ocorrência</p>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Descrição *</label>
              <textarea value={novaDesc} onChange={(e) => setNovaDesc(e.target.value)}
                placeholder="Descreva a ocorrência..." rows={3}
                className="border border-zinc-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition resize-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Medida / Resolução</label>
              <textarea value={novaRes} onChange={(e) => setNovaRes(e.target.value)}
                placeholder="Medida ou resolução adotada..." rows={2}
                className="border border-zinc-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition resize-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200">
          <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">Fechar</button>
          <button className="h-9 px-4 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors">Registrar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Célula de presença (CORRIGIDA) ───────────────────────────────────────────
function CelulaPresenca({ valor, onChange }: { valor: Presenca; onChange: (v: Presenca) => void }) {
  const cores: Record<string, string> = {
    P: "bg-green-100 text-green-700 border-green-300 shadow-sm",
    F: "bg-red-100 text-red-700 border-red-300 shadow-sm",
    R: "bg-blue-100 text-blue-700 border-blue-300 shadow-sm",
  };

  // Se já for reposto, a célula é bloqueada visual e funcionalmente.
  if (valor === "R") {
    return (
      <div 
        title="Falta reposta via Secretaria"
        className={`w-8 h-8 mx-auto rounded border text-xs font-bold flex items-center justify-center cursor-not-allowed opacity-80 ${cores["R"]}`}
      >
        R
      </div>
    );
  }

  // Se não for "R", o professor só alterna entre Vazio, P e F.
  function ciclar() {
    if (valor === null) onChange("P");
    else if (valor === "P") onChange("F");
    else if (valor === "F") onChange(null);
  }

  return (
    <button onClick={ciclar}
      className={`w-8 h-8 rounded border text-xs font-bold transition-all hover:scale-105 mx-auto ${
        valor ? cores[valor] : "bg-zinc-50 border-zinc-200 text-zinc-400 hover:bg-zinc-100"
      }`}>
      {valor ?? "·"}
    </button>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function TurmaPage() {
  const [aba, setAba] = useState<"presenca" | "homework" | "avaliacoes">("presenca");
  const [alunoHistorico, setAlunoHistorico] = useState<Aluno | null>(null);

  const [aulas, setAulas] = useState<Aula[]>(aulasMockIniciais);

  // Estado de presença: [alunoId][aulaId]
  const [presencas, setPresencas] = useState<Record<string, Presenca>>({
    // 👇 Injetamos um R aqui para você ver como a célula bloqueada se comporta
    "3-1": "R", 
  });

  // Estado de homework: [alunoId][aulaId]
  const [homework, setHomework] = useState<Record<string, string>>({});

  // Estado de avaliações: [alunoId][tipo]
  const [avaliacoes, setAvaliacoes] = useState<Record<string, string>>({});

  function setPresenca(alunoId: number, aulaId: number, valor: Presenca) {
    setPresencas((prev) => ({ ...prev, [`${alunoId}-${aulaId}`]: valor }));
  }

  function setHW(alunoId: number, aulaId: number, valor: string) {
    setHomework((prev) => ({ ...prev, [`${alunoId}-${aulaId}`]: valor }));
  }

  function setAval(alunoId: number, tipo: string, valor: string) {
    setAvaliacoes((prev) => ({ ...prev, [`${alunoId}-${tipo}`]: valor }));
  }

  function mediaHW(alunoId: number): string {
    const notas = aulas.map((a) => parseFloat(homework[`${alunoId}-${a.id}`] || "")).filter((n) => !isNaN(n));
    if (notas.length === 0) return "—";
    return (notas.reduce((acc, n) => acc + n, 0) / notas.length).toFixed(1);
  }

  function mediaAval(alunoId: number): string {
    const notas = avaliacoesTipos.map((t) => parseFloat(avaliacoes[`${alunoId}-${t}`] || "")).filter((n) => !isNaN(n));
    if (notas.length === 0) return "—";
    return (notas.reduce((acc, n) => acc + n, 0) / notas.length).toFixed(1);
  }

  function contarFaltas(alunoId: number): number {
    return aulas.filter((a) => presencas[`${alunoId}-${a.id}`] === "F").length;
  }

  function estenderAula(index: number) {
    if (confirm("Deseja estender o conteúdo desta aula? Isso criará uma aula de continuação logo em seguida e empurrará as datas de todo o resto do cronograma.")) {
      const novasAulas = [...aulas];
      const aulaAtual = novasAulas[index];

      const novaAula: Aula = {
        id: Date.now(),
        data: "", 
        numero: 0, 
        capitulo: aulaAtual.capitulo + " (Cont.)"
      };

      novasAulas.splice(index + 1, 0, novaAula);

      for (let i = index + 1; i < novasAulas.length; i++) {
        novasAulas[i].numero = i + 1;
        
        const dataAnterior = novasAulas[i - 1].data;
        const [d, m, y] = dataAnterior.split('/');
        const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
        dateObj.setDate(dateObj.getDate() + 7);
        
        novasAulas[i].data = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
      }

      setAulas(novasAulas);
    }
  }

  const abas = [
    { key: "presenca",   label: "Controle de Presença" },
    { key: "homework",   label: "Homework"             },
    { key: "avaliacoes", label: "Avaliações"           },
  ] as const;

  return (
    <>
      <div className="flex flex-col gap-6">

        {/* Voltar */}
        <a href="/professor" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors w-fit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Voltar para minhas aulas
        </a>

        {/* Cabeçalho da turma: Estruturado verticalmente */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-lg font-bold text-zinc-900">{turma.nome}</h1>
              <p className="text-sm text-zinc-400 mt-0.5">Apenas visualização — campos não editáveis pelo professor</p>
            </div>
          </div>
          
          <div className="w-full max-w-md bg-zinc-50 rounded-lg border border-zinc-200 overflow-hidden text-sm">
            {[
              { label: "Book", value: turma.livro },
              { label: "Room", value: turma.sala },
              { label: "Teacher", value: turma.professor },
              { label: "Day & Time", value: turma.diaHorario },
              { label: "Start Date", value: turma.dataInicio },
              { label: "End Date", value: turma.dataTermino },
            ].map(({ label, value }, i) => (
              <div key={label} className={`flex border-zinc-200 ${i !== 0 ? "border-t" : ""}`}>
                <div className="w-1/3 bg-zinc-100 px-3 py-2 font-semibold text-zinc-600 border-r border-zinc-200">{label}</div>
                <div className="w-2/3 bg-white px-3 py-2 text-zinc-800 font-medium">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Abas */}
        <div className="flex gap-1 border-b border-zinc-200">
          {abas.map(({ key, label }) => (
            <button key={key} onClick={() => setAba(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                aba === key ? "border-[#1F2A35] text-[#1F2A35]" : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── ABA PRESENÇA ── */}
        {aba === "presenca" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">Clique na célula para alternar: · → P → F → ·</p>
              <button className="h-8 px-3 text-xs font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors">
                Salvar presenças
              </button>
            </div>
            
            <div className="bg-white border border-zinc-200 rounded-xl overflow-x-auto">
              <table className="text-sm w-full">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    <th className="px-4 py-3 font-semibold text-zinc-500 text-center w-16 border-r border-zinc-200">Nº</th>
                    <th className="px-4 py-3 font-semibold text-zinc-500 text-center w-28 border-r border-zinc-200">Data</th>
                    <th className="px-4 py-3 font-semibold text-zinc-500 text-left min-w-[200px] border-r border-zinc-200">Capítulo / Lição</th>
                    
                    {alunosMock.map((aluno) => (
                      <th key={aluno.id} className="px-1 py-3 font-medium text-zinc-500 align-bottom h-40 w-12 min-w-[48px] max-w-[48px] border-r border-zinc-200">
                        <button 
                          onClick={() => setAlunoHistorico(aluno)} 
                          className="hover:text-[#1F2A35] hover:underline transition-colors whitespace-nowrap mx-auto"
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                          title="Ver histórico do aluno"
                        >
                          {aluno.nome}
                        </button>
                      </th>
                    ))}
                    <th className="w-full"></th> 
                  </tr>
                </thead>
                <tbody>
                  {aulas.map((aula, i) => (
                    <tr key={aula.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors group">
                      <td className="px-4 py-2 text-center font-medium text-zinc-500 border-r border-zinc-200">{aula.numero}</td>
                      <td className="px-4 py-2 text-center text-zinc-600 border-r border-zinc-200">{aula.data}</td>
                      
                      <td className="px-4 py-2 text-left text-zinc-700 font-medium border-r border-zinc-200">
                        <div className="flex items-center justify-between gap-2">
                          <span>{aula.capitulo}</span>
                          
                          <button 
                            onClick={() => estenderAula(i)} 
                            title="Conteúdo não finalizado? Dividir e empurrar para próxima aula" 
                            className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-blue-600 transition-all"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 12h14" />
                              <path d="m12 5 7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      
                      {alunosMock.map((aluno) => (
                        <td key={aluno.id} className="px-1 py-2 text-center border-r border-zinc-200">
                          <div className="flex justify-center">
                            <CelulaPresenca
                              valor={presencas[`${aluno.id}-${aula.id}`] ?? null}
                              onChange={(v) => setPresenca(aluno.id, aula.id, v)}
                            />
                          </div>
                        </td>
                      ))}
                      <td className="w-full"></td>
                    </tr>
                  ))}
                  
                  {/* Rodapé: Total de Faltas */}
                  <tr className="bg-zinc-50 border-t border-zinc-200">
                    <td colSpan={3} className="px-4 py-3 text-right font-semibold text-zinc-600 border-r border-zinc-200 uppercase tracking-wide text-xs">
                      Total de Faltas:
                    </td>
                    {alunosMock.map((aluno) => (
                      <td key={aluno.id} className="px-1 py-3 text-center border-r border-zinc-200">
                        <span className={`text-sm font-bold ${contarFaltas(aluno.id) > 0 ? "text-red-600" : "text-zinc-400"}`}>
                          {contarFaltas(aluno.id)}
                        </span>
                      </td>
                    ))}
                    <td className="w-full"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Legenda Atualizada */}
            <div className="flex gap-4 text-xs text-zinc-400 mt-1">
              <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-green-100 border border-green-300 flex items-center justify-center text-green-700 font-bold text-xs">P</span>Presente</span>
              <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-red-100 border border-red-300 flex items-center justify-center text-red-700 font-bold text-xs">F</span>Falta</span>
              <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-700 font-bold text-xs">R</span>Reposição (Automático)</span>
            </div>
          </div>
        )}

        {/* ── ABA HOMEWORK ── */}
        {aba === "homework" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">Lançamento de notas de homework por aula (0 a 100)</p>
              <button className="h-8 px-3 text-xs font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors">
                Salvar notas
              </button>
            </div>
            
            <div className="bg-white border border-zinc-200 rounded-xl overflow-x-auto">
              <table className="text-sm w-full">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    <th className="px-4 py-3 font-semibold text-zinc-500 text-center w-16 border-r border-zinc-200">HW</th>
                    <th className="px-4 py-3 font-semibold text-zinc-500 text-center w-32 border-r border-zinc-200">Data</th>
                    
                    {alunosMock.map((aluno) => (
                      <th key={aluno.id} className="px-1 py-3 font-medium text-zinc-500 align-bottom h-40 w-14 min-w-[56px] max-w-[56px] border-r border-zinc-200">
                        <button 
                          onClick={() => setAlunoHistorico(aluno)} 
                          className="hover:text-[#1F2A35] hover:underline transition-colors whitespace-nowrap mx-auto"
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                          title="Ver histórico do aluno"
                        >
                          {aluno.nome}
                        </button>
                      </th>
                    ))}
                    <th className="w-full"></th> 
                  </tr>
                </thead>
                <tbody>
                  {aulas.map((aula) => (
                    <tr key={aula.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-2 text-center font-medium text-zinc-500 border-r border-zinc-200">{aula.numero}</td>
                      <td className="px-4 py-2 text-center text-zinc-600 border-r border-zinc-200">{aula.data}</td>
                      
                      {alunosMock.map((aluno) => (
                        <td key={aluno.id} className="px-1 py-2 text-center border-r border-zinc-200">
                          <div className="flex justify-center">
                            <input
                              type="number" min="0" max="100"
                              value={homework[`${aluno.id}-${aula.id}`] ?? ""}
                              onChange={(e) => setHW(aluno.id, aula.id, e.target.value)}
                              placeholder="—"
                              className="w-11 h-8 text-center border border-zinc-200 rounded text-xs outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition"
                            />
                          </div>
                        </td>
                      ))}
                      <td className="w-full"></td>
                    </tr>
                  ))}
                  
                  {/* Rodapé: Média de Homework */}
                  <tr className="bg-zinc-50 border-t border-zinc-200">
                    <td colSpan={2} className="px-4 py-3 text-right font-semibold text-zinc-600 border-r border-zinc-200 uppercase tracking-wide text-xs">
                      Média Final:
                    </td>
                    {alunosMock.map((aluno) => (
                      <td key={aluno.id} className="px-1 py-3 text-center border-r border-zinc-200">
                        <span className="text-sm font-bold text-zinc-800">{mediaHW(aluno.id)}</span>
                      </td>
                    ))}
                    <td className="w-full"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ABA AVALIAÇÕES ── */}
        {aba === "avaliacoes" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">5 avaliações fixas por livro (0 a 100)</p>
              <button className="h-8 px-3 text-xs font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors">
                Salvar avaliações
              </button>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl overflow-x-auto">
              <table className="text-sm w-full">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    <th className="text-left px-4 py-3 font-semibold text-zinc-500 min-w-[180px] border-r border-zinc-200">Aluno</th>
                    {avaliacoesTipos.map((t) => (
                      <th key={t} className="px-2 py-3 font-semibold text-zinc-500 text-center min-w-[100px] border-r border-zinc-200">
                        <p className="text-xs uppercase tracking-wide">{t}</p>
                      </th>
                    ))}
                    <th className="px-3 py-3 font-semibold text-zinc-500 text-center border-l border-zinc-200 uppercase tracking-wide text-xs">Média</th>
                    <th className="w-full"></th> 
                  </tr>
                </thead>
                <tbody>
                  {alunosMock.map((aluno, i) => (
                    <tr key={aluno.id} className={`border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${i === alunosMock.length - 1 ? "border-b-0" : ""}`}>
                      <td className="px-4 py-3 border-r border-zinc-200">
                        <button onClick={() => setAlunoHistorico(aluno)}
                          className="font-medium text-zinc-900 hover:text-[#1F2A35] hover:underline transition-colors text-left"
                          title="Ver histórico do aluno">
                          {aluno.nome}
                        </button>
                      </td>
                      {avaliacoesTipos.map((tipo) => (
                        <td key={tipo} className="px-2 py-3 text-center border-r border-zinc-200">
                          <input
                            type="number" min="0" max="100"
                            value={avaliacoes[`${aluno.id}-${tipo}`] ?? ""}
                            onChange={(e) => setAval(aluno.id, tipo, e.target.value)}
                            placeholder="—"
                            className="w-14 h-8 text-center border border-zinc-200 rounded text-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-3 text-center bg-zinc-50 border-l border-zinc-200">
                        <span className="text-sm font-bold text-zinc-800">{mediaAval(aluno.id)}</span>
                      </td>
                      <td className="w-full"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Modal Histórico */}
      {alunoHistorico && (
        <ModalHistorico aluno={alunoHistorico} onClose={() => setAlunoHistorico(null)} />
      )}
    </>
  );
}