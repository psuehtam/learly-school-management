"use client";

import { useState, type ChangeEvent } from "react";
import Link from "next/link";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type StatusMatricula = "ativo" | "inativo";

interface Anexo {
  id: number;
  tipo: string;
  nomeArquivo: string;
  data: string;
}

interface ValorSemestre {
  semestre: number;
  mensalidade: string;
  material: string;
}

interface Matricula {
  id: number;
  nomeAluno: string;
  cpfAluno: string;
  rgAluno: string;
  dataNascimento: string;
  telefoneAluno: string;
  emailAluno: string;
  
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;

  maiorDeIdade: boolean;
  nomeResponsavel: string;
  cpfResponsavel: string;
  telefoneResponsavel: string;

  turma: string;
  status: StatusMatricula;
  dataIngresso: string;
  statusFinanceiro: "em_dia" | "pendente" | "atrasado";

  tempoContrato: number;
  valoresDiferentes: boolean;
  valorMensalidade: string;
  valorMaterial: string;
  valores: ValorSemestre[];

  anexos: Anexo[];
}

interface PendenciaComercial extends Matricula {
  vendedor: string;
  dataEnvio: string;
}

// ─── Dados mock ───────────────────────────────────────────────────────────────
const matriculasMockIniciais: Matricula[] = [
  { 
    id: 1, nomeAluno: "Alice Massari Soares", cpfAluno: "123.456.789-00", rgAluno: "11.111.111-1", dataNascimento: "15/08/2010", telefoneAluno: "(11) 99999-1111", emailAluno: "alice@email.com", cep: "01000-000", logradouro: "Rua A", numero: "12", bairro: "Centro", cidade: "São Paulo",
    maiorDeIdade: false, nomeResponsavel: "Tullaine Massari", cpfResponsavel: "987.654.321-00", telefoneResponsavel: "(11) 98888-2222", 
    turma: "Book 2 / Qua 14:30", status: "ativo", dataIngresso: "01/02/2024", statusFinanceiro: "em_dia", tempoContrato: 12, valoresDiferentes: false, valorMensalidade: "250,00", valorMaterial: "300,00", valores: [], anexos: []
  },
  { 
    id: 2, nomeAluno: "Ronald Xavier de Abreu", cpfAluno: "234.567.890-00", rgAluno: "22.222.222-2", dataNascimento: "25/02/2008", telefoneAluno: "(41) 99949-0460", emailAluno: "ronald@email.com", cep: "81000-000", logradouro: "Rua B", numero: "34", bairro: "Capão Raso", cidade: "Curitiba",
    maiorDeIdade: false, nomeResponsavel: "Carlos de Abreu", cpfResponsavel: "876.543.210-00", telefoneResponsavel: "(41) 99949-0460", 
    turma: "Book 1 / Seg 14:00", status: "ativo", dataIngresso: "01/02/2023", statusFinanceiro: "atrasado", tempoContrato: 24, valoresDiferentes: false, valorMensalidade: "230,00", valorMaterial: "300,00", valores: [], anexos: []
  }
];

const pendenciasMockIniciais: PendenciaComercial[] = [
  {
    id: 99, nomeAluno: "Lucas Mendes", cpfAluno: "444.555.666-77", rgAluno: "44.555.666-7", dataNascimento: "10/10/1995", telefoneAluno: "(31) 98888-7777", emailAluno: "lucas.mendes@email.com", cep: "30000-000", logradouro: "Av. Afonso Pena", numero: "1500", bairro: "Centro", cidade: "Belo Horizonte",
    maiorDeIdade: true, nomeResponsavel: "Lucas Mendes", cpfResponsavel: "444.555.666-77", telefoneResponsavel: "(31) 98888-7777",
    turma: "—", status: "inativo", dataIngresso: "—", statusFinanceiro: "pendente", tempoContrato: 12, valoresDiferentes: false, valorMensalidade: "260,00", valorMaterial: "200,00", valores: [],
    anexos: [
      { id: 1, tipo: "Contrato Assinado", nomeArquivo: "contrato_lucas.pdf", data: "24/03/2026" },
      { id: 2, tipo: "Comprovante de Pagamento (Matrícula)", nomeArquivo: "pix_comprovante.jpg", data: "24/03/2026" }
    ],
    vendedor: "Rafael Comercial", dataEnvio: "24/03/2026"
  }
];

const TIPOS_ANEXO = ["Contrato Assinado", "Comprovante de Pagamento (Matrícula)", "Ficha de Inscrição", "Conversa de WhatsApp", "Documento Pessoal (RG/CPF)", "Outros"];

const financeiroColors = { em_dia: "bg-green-50 text-green-700", pendente: "bg-amber-50 text-amber-700", atrasado: "bg-red-50 text-red-600" };
const financeiroLabel = { em_dia: "Em dia", pendente: "Pendente", atrasado: "Atrasado" };

// ─── Componentes Auxiliares ───────────────────────────────────────────────────
interface CampoProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

function Campo({ label, className, ...props }: CampoProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-medium text-zinc-700">{label}</label>
      <input 
        {...props}
        className={`h-10 w-full border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition disabled:bg-zinc-50 disabled:text-zinc-500 ${className || ''}`} 
      />
    </div>
  );
}

// ─── Modal Visualizador de Anexos ─────────────────────────────────────────────
function ModalVisualizadorAnexo({ anexo, onClose }: { anexo: Anexo, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="bg-zinc-100 w-full max-w-4xl h-[90vh] rounded-xl flex flex-col overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-200 bg-white">
          <div>
            <h3 className="font-bold text-zinc-900 text-lg">{anexo.nomeArquivo}</h3>
            <p className="text-sm text-zinc-500">{anexo.tipo} • {anexo.data}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          {/* Simulação visual de um documento aberto */}
          <div className="bg-white w-full max-w-2xl h-full shadow-md flex flex-col items-center justify-center border border-zinc-300 relative overflow-hidden">
            <div className="absolute top-0 w-full h-8 bg-zinc-200/50 flex items-center px-4 border-b border-zinc-200">
               <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400"/><div className="w-3 h-3 rounded-full bg-amber-400"/><div className="w-3 h-3 rounded-full bg-green-400"/></div>
            </div>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-zinc-300 mb-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <p className="text-zinc-400 font-medium tracking-wide uppercase text-sm">Visualização do Ficheiro</p>
            <p className="text-zinc-400 text-xs mt-1">{anexo.nomeArquivo}</p>
          </div>
        </div>
        <div className="bg-white px-6 py-4 border-t border-zinc-200 flex justify-end gap-3">
           <button className="h-9 px-4 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors flex items-center gap-2">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
             Descarregar Original
           </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Nova/Editar Matrícula ──────────────────────────────────────────────
interface ModalMatriculaProps {
  matricula: Matricula | null; // Se null, é criação direta
  isPendencia?: boolean; // Se true, o modal está analisando algo do comercial
  onClose: () => void;
  onSave: (m: Matricula) => void;
  onDevolver?: (motivo: string) => void;
  onGerarContrato?: (m: Matricula) => void; // 👉 NOVO: Adicionado onGerarContrato
}

function createNovaMatricula(): Matricula {
  const d = new Date();
  return {
    id: d.getTime(),
    nomeAluno: "",
    cpfAluno: "",
    rgAluno: "",
    dataNascimento: "",
    telefoneAluno: "",
    emailAluno: "",
    cep: "",
    logradouro: "",
    numero: "",
    bairro: "",
    cidade: "",
    maiorDeIdade: false,
    nomeResponsavel: "",
    cpfResponsavel: "",
    telefoneResponsavel: "",
    turma: "—",
    status: "ativo",
    dataIngresso: d.toLocaleDateString("pt-BR"),
    statusFinanceiro: "em_dia",
    tempoContrato: 0,
    valoresDiferentes: false,
    valorMensalidade: "",
    valorMaterial: "",
    valores: [],
    anexos: [],
  };
}

function ModalMatricula({ matricula, isPendencia = false, onClose, onSave, onDevolver, onGerarContrato }: ModalMatriculaProps) {
  const isEdit = !!matricula && !isPendencia;
  
  const [form, setForm] = useState<Matricula>(() => matricula ?? createNovaMatricula());

  const [abaAtual, setAbaAtual] = useState<"dados" | "valores" | "anexos">("dados");
  
  // Estado para devolução ao comercial
  const [devolvendo, setDevolvendo] = useState(false);
  const [motivoDevolucao, setMotivoDevolucao] = useState("");

  // Upload
  const [tipoAnexoSelecionado, setTipoAnexoSelecionado] = useState(TIPOS_ANEXO[0]);
  const [arquivoUpload, setArquivoUpload] = useState<File | null>(null);

  // 👉 NOVO: Estado para visualização de anexo
  const [anexoVisualizando, setAnexoVisualizando] = useState<Anexo | null>(null);

  function handleUpload() {
    if (!arquivoUpload) return;
    const novoAnexo: Anexo = { id: Date.now(), tipo: tipoAnexoSelecionado, nomeArquivo: arquivoUpload.name, data: new Date().toLocaleDateString('pt-BR') };
    setForm(prev => ({ ...prev, anexos: [novoAnexo, ...prev.anexos] }));
    setArquivoUpload(null);
  }

  function removerAnexo(id: number) {
    setForm(prev => ({ ...prev, anexos: prev.anexos.filter(a => a.id !== id) }));
  }

  function handleTempoChange(meses: number) {
    const numSemestres = meses / 6;
    setForm(prev => {
      const novosValores = [...prev.valores];
      if (numSemestres > novosValores.length) {
        for (let i = novosValores.length; i < numSemestres; i++) {
          novosValores.push({ semestre: i + 1, mensalidade: prev.valorMensalidade, material: prev.valorMaterial });
        }
      } else if (numSemestres < novosValores.length) {
        novosValores.splice(numSemestres);
      }
      return { ...prev, tempoContrato: meses, valores: novosValores };
    });
  }

  function handleValorSemestreChange(index: number, campo: keyof ValorSemestre, valor: string) {
    setForm(prev => {
      const novosValores = [...prev.valores];
      novosValores[index] = { ...novosValores[index], [campo]: valor };
      return { ...prev, valores: novosValores };
    });
  }

  const titulo = isPendencia ? "Análise de Matrícula (Enviada pelo Comercial)" : (isEdit ? "Editar Matrícula" : "Nova Matrícula");

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 flex flex-col max-h-[95vh]">
          <div className="flex flex-col border-b border-zinc-200 sticky top-0 bg-white rounded-t-xl z-10">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">{titulo}</h2>
                {isPendencia && <p className="text-xs text-amber-600 font-bold mt-0.5 flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Verifique os anexos e confirme os dados antes de aprovar.</p>}
              </div>
              <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            
            <div className="flex px-6 gap-6 border-t border-zinc-100">
              <button onClick={() => setAbaAtual("dados")} className={`py-3 text-sm font-medium border-b-2 transition-colors ${abaAtual === "dados" ? "border-[#1F2A35] text-[#1F2A35]" : "border-transparent text-zinc-500 hover:text-zinc-700"}`}>
                1. Dados do Aluno & Contato
              </button>
              <button onClick={() => setAbaAtual("valores")} className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${abaAtual === "valores" ? "border-[#1F2A35] text-[#1F2A35]" : "border-transparent text-zinc-500 hover:text-zinc-700"}`}>
                2. Valores & Turma
              </button>
              <button onClick={() => setAbaAtual("anexos")} className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${abaAtual === "anexos" ? "border-green-600 text-green-700" : "border-transparent text-zinc-500 hover:text-zinc-700"}`}>
                3. Anexos e Documentos
                {form.anexos.length > 0 && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full">{form.anexos.length}</span>}
              </button>
            </div>
          </div>
          
          <div className="p-6 flex flex-col gap-5 overflow-y-auto bg-zinc-50/30">
            
            {abaAtual === "dados" && (
              <div className="flex flex-col gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="flex items-center gap-3 cursor-pointer w-fit">
                    <input type="checkbox" checked={form.maiorDeIdade} onChange={(e) => setForm({...form, maiorDeIdade: e.target.checked})} className="w-5 h-5 rounded border-blue-300 accent-blue-600" />
                    <div>
                      <span className="text-sm font-semibold text-blue-900 block">Aluno é maior de idade (18+ anos)</span>
                      <span className="text-xs text-blue-700">Se marcado, os dados do responsável financeiro não serão exigidos.</span>
                    </div>
                  </label>
                </div>

                <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-zinc-800 mb-4 border-b border-zinc-100 pb-2">Informações do Aluno</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <Campo label="Nome Completo *" value={form.nomeAluno} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({...form, nomeAluno: e.target.value})} />
                    <Campo label="E-mail" type="email" value={form.emailAluno} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({...form, emailAluno: e.target.value})} />
                    <Campo label="Telefone / WhatsApp *" value={form.telefoneAluno} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({...form, telefoneAluno: e.target.value})} />
                    <Campo label="Data Nascimento *" type="date" value={form.dataNascimento} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({...form, dataNascimento: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Campo label="CPF *" value={form.cpfAluno} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({...form, cpfAluno: e.target.value})} placeholder="000.000.000-00" />
                    <Campo label="RG" value={form.rgAluno} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({...form, rgAluno: e.target.value})} placeholder="00.000.000-0" />
                  </div>
                </div>

                <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-zinc-800 mb-4 border-b border-zinc-100 pb-2">Endereço Residencial</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2 md:col-span-1"><Campo label="CEP *" value={form.cep} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({...form, cep: e.target.value})} placeholder="00000-000" /></div>
                    <div className="col-span-2 md:col-span-3"><Campo label="Logradouro *" value={form.logradouro} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({...form, logradouro: e.target.value})} placeholder="Rua, Avenida..." /></div>
                    <div className="col-span-1"><Campo label="Número *" value={form.numero} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({...form, numero: e.target.value})} placeholder="123" /></div>
                    <div className="col-span-1 md:col-span-1"><Campo label="Bairro *" value={form.bairro} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({...form, bairro: e.target.value})} placeholder="Centro" /></div>
                    <div className="col-span-2"><Campo label="Cidade *" value={form.cidade} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({...form, cidade: e.target.value})} placeholder="São Paulo - SP" /></div>
                  </div>
                </div>

                {!form.maiorDeIdade && (
                  <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-amber-800 mb-4 border-b border-zinc-100 pb-2">Dados do Responsável Financeiro</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Campo label="Nome do Responsável *" value={form.nomeResponsavel} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({...form, nomeResponsavel: e.target.value})} />
                      <Campo label="CPF do Responsável *" value={form.cpfResponsavel} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({...form, cpfResponsavel: e.target.value})} placeholder="000.000.000-00" />
                      <Campo label="Telefone do Responsável *" value={form.telefoneResponsavel} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({...form, telefoneResponsavel: e.target.value})} placeholder="(00) 00000-0000" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {abaAtual === "valores" && (
              <div className="flex flex-col gap-6">
                <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-zinc-800 mb-4 border-b border-zinc-100 pb-2">Dados do Sistema (Matrícula)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Campo label="Data de Ingresso *" type="date" value={form.dataIngresso.split('/').reverse().join('-')} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({...form, dataIngresso: e.target.value.split('-').reverse().join('/')})} />
                    <div className="flex flex-col gap-1.5 w-full">
                      <label className="text-sm font-medium text-zinc-700">Turma Inicial</label>
                      <select value={form.turma} onChange={(e) => setForm({...form, turma: e.target.value})} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] bg-white">
                        <option value="—">Sem turma (A definir depois)</option>
                        <option value="Book 1 / Seg 14:00">Book 1 / Seg 14:00</option>
                        <option value="Book 2 / Qua 18:30">Book 2 / Qua 18:30</option>
                        <option value="Book 3 / Sex 09:00">Book 3 / Sex 09:00</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-green-800 mb-4 border-b border-zinc-100 pb-2">Duração e Valores Acordados</h3>
                  <div className="flex flex-col gap-1.5 w-1/2 mb-4">
                    <label className="text-sm font-medium text-zinc-700">Tempo de Contrato *</label>
                    <select value={form.tempoContrato} onChange={(e) => handleTempoChange(Number(e.target.value))} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] bg-white">
                      <option value={0}>Selecione...</option>
                      {[6, 12, 18, 24, 30, 36, 42, 48].map(m => <option key={m} value={m}>{m} meses ({m/6} semestre{m/6 > 1 ? 's' : ''})</option>)}
                    </select>
                  </div>

                  {form.tempoContrato > 0 && (
                    <div className="flex flex-col gap-4 mt-4 border-t border-zinc-100 pt-4">
                      {form.tempoContrato > 6 && (
                        <label className="flex items-center gap-2 cursor-pointer w-fit">
                          <input type="checkbox" checked={form.valoresDiferentes} onChange={(e) => setForm({...form, valoresDiferentes: e.target.checked})} className="w-4 h-4 rounded border-zinc-300 accent-blue-600" />
                          <span className="text-sm font-medium text-zinc-800">Aplicar valores diferentes para cada semestre</span>
                        </label>
                      )}

                      {!form.valoresDiferentes ? (
                        <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                          <Campo label="Mensalidade Padrão (R$) *" value={form.valorMensalidade} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({...form, valorMensalidade: e.target.value})} placeholder="Ex: 250,00" />
                          <Campo label="Material Padrão (R$)" value={form.valorMaterial} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({...form, valorMaterial: e.target.value})} placeholder="Ex: 300,00" />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide">Valores por semestre</p>
                          {form.valores.map((v, i) => (
                            <div key={i} className="flex gap-4 items-center bg-zinc-50 p-4 rounded-lg border border-zinc-200 shadow-sm">
                              <span className="text-sm font-bold text-[#1F2A35] uppercase w-28 whitespace-nowrap">{i + 1}º Semestre</span>
                              <div className="grid grid-cols-2 gap-4 flex-1">
                                <Campo label="Mensalidade (R$) *" value={v.mensalidade} onChange={(e: ChangeEvent<HTMLInputElement>) => handleValorSemestreChange(i, 'mensalidade', e.target.value)} placeholder="Ex: 250,00" />
                                <Campo label="Material (R$)" value={v.material} onChange={(e: ChangeEvent<HTMLInputElement>) => handleValorSemestreChange(i, 'material', e.target.value)} placeholder="Ex: 300,00" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {abaAtual === "anexos" && (
              <div className="flex flex-col gap-6">
                
                {/* 👇 NOVO: Botão de Gerar Contrato na Secretaria 👇 */}
                <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Gerar Contrato Oficial (PDF)</h3>
                    <p className="text-xs text-zinc-500 mt-1">Imprima o contrato para o aluno assinar presencialmente ou guarde em PDF.</p>
                  </div>
                  <button 
                    onClick={() => {
                      if(!form.cpfAluno || !form.logradouro) {
                        alert("Preencha o CPF e o Endereço nas abas anteriores antes de gerar o PDF.");
                      } else if (onGerarContrato) {
                        onGerarContrato(form);
                      }
                    }} 
                    className="h-10 px-5 bg-white border border-[#1F2A35] text-[#1F2A35] font-bold rounded-lg hover:bg-zinc-50 transition-colors flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    Gerar Contrato
                  </button>
                </div>

                <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-zinc-800 mb-4 border-b border-zinc-100 pb-2">Anexos Atuais</h3>
                  
                  <div className="flex gap-3 items-end mb-6 bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Tipo de Documento</label>
                      <select value={tipoAnexoSelecionado} onChange={(e) => setTipoAnexoSelecionado(e.target.value)} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] bg-white">
                        {TIPOS_ANEXO.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Ficheiro</label>
                      <input type="file" onChange={(e) => setArquivoUpload(e.target.files?.[0] || null)} className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors border border-zinc-300 rounded-lg p-1.5" />
                    </div>
                    <button disabled={!arquivoUpload} onClick={handleUpload} className="h-10 px-4 bg-[#1F2A35] text-white font-bold text-sm rounded-lg hover:bg-[#2d3d4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Anexar</button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {form.anexos.length === 0 ? (
                      <div className="text-center py-6 text-sm text-zinc-400 border border-dashed border-zinc-300 rounded-lg">Nenhum documento anexado.</div>
                    ) : (
                      form.anexos.map(anexo => (
                        <div key={anexo.id} className="flex items-center justify-between p-3 border border-zinc-200 rounded-lg bg-white shadow-sm">
                          <div className="flex items-center gap-3">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                            <div>
                              <p className="text-sm font-bold text-zinc-800">{anexo.tipo}</p>
                              <p className="text-xs text-zinc-500">{anexo.nomeArquivo} • {anexo.data}</p>
                            </div>
                          </div>
                          <div className="flex gap-4 items-center">
                            {/* 👇 NOVO: Botão Ver que chama o visualizador 👇 */}
                            <button onClick={() => setAnexoVisualizando(anexo)} className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase flex items-center gap-1">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              Ver
                            </button>
                            <button onClick={() => removerAnexo(anexo.id)} className="text-red-500 hover:text-red-700 text-xs font-bold uppercase">Remover</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          <div className="flex justify-between items-center px-6 py-4 border-t border-zinc-200 bg-white rounded-b-xl">
            {/* Ações de Devolução (Se for Análise) */}
            {isPendencia ? (
              devolvendo ? (
                <div className="flex-1 flex gap-2 items-center bg-red-50 p-2 rounded-lg border border-red-200 mr-4">
                  <input type="text" placeholder="Motivo da devolução..." value={motivoDevolucao} onChange={e => setMotivoDevolucao(e.target.value)} className="h-9 flex-1 px-3 rounded border border-red-300 text-sm outline-none focus:border-red-500" />
                  <button onClick={() => setDevolvendo(false)} className="h-9 px-3 text-xs font-bold text-zinc-600 hover:bg-red-100 rounded">Cancelar</button>
                  <button disabled={!motivoDevolucao.trim()} onClick={() => { if (onDevolver) onDevolver(motivoDevolucao); onClose(); }} className="h-9 px-4 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50">Confirmar Devolução</button>
                </div>
              ) : (
                <button onClick={() => setDevolvendo(true)} className="h-10 px-4 text-sm font-bold text-red-600 bg-white border-2 border-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Devolver ao Comercial
                </button>
              )
            ) : (
              <button onClick={onClose} className="h-10 px-4 text-sm font-medium text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">Cancelar</button>
            )}
            
            {!devolvendo && (
              <button onClick={() => { onSave(form); onClose(); }} className="h-10 px-6 text-sm font-bold text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors shadow-md">
                {isPendencia ? "Aprovar e Efetivar Matrícula" : "Salvar Matrícula"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Renderiza o Visualizador de Anexos por cima do modal atual */}
      {anexoVisualizando && (
        <ModalVisualizadorAnexo 
          anexo={anexoVisualizando} 
          onClose={() => setAnexoVisualizando(null)} 
        />
      )}
    </>
  );
}

// ─── Modal Gerar Contrato Oficial (PDF) ───────────────────────────────────────
function ModalContrato({ matricula, onClose }: { matricula: Matricula, onClose: () => void }) {
  const dataAtual = new Date().toLocaleDateString('pt-BR');

  const nomeContratante = matricula.maiorDeIdade ? matricula.nomeAluno : matricula.nomeResponsavel;
  const cpfContratante = matricula.maiorDeIdade ? matricula.cpfAluno : matricula.cpfResponsavel;
  const telefoneContratante = matricula.maiorDeIdade ? matricula.telefoneAluno : matricula.telefoneResponsavel;
  
  const enderecoCompleto = `${matricula.logradouro}, ${matricula.numero} - ${matricula.bairro}, ${matricula.cidade} - CEP: ${matricula.cep}`;
  const nomeCurso = matricula.turma && matricula.turma !== "—" ? matricula.turma : "Curso de Idiomas (Turma a definir)";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 print:bg-white print:items-start">
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 shadow-md print:hidden">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      <div className="bg-white rounded-lg shadow-xl print:shadow-none w-full max-w-4xl mx-4 print:mx-0 flex flex-col p-12 border border-zinc-300 print:border-none h-[95vh] overflow-y-auto print:h-auto print:overflow-visible">
        
        <div className="text-center mb-10 border-b-2 border-zinc-800 pb-6">
          <h1 className="text-2xl font-bold text-zinc-900 uppercase tracking-widest">Contrato de Prestação de Serviços Educacionais</h1>
          <p className="text-sm font-medium text-zinc-600 mt-2">LEARLY IDIOMAS - CNPJ: 12.345.678/0001-90</p>
        </div>

        <div className="text-sm leading-relaxed text-zinc-800 space-y-6 font-[Georgia,serif] text-justify">
          <p>Pelo presente instrumento particular, de um lado <strong>LEARLY IDIOMAS</strong>, doravante denominada simplesmente CONTRATADA, e de outro lado o(a) CONTRATANTE e responsável financeiro:</p>
          
          <div className="bg-zinc-50 border border-zinc-200 p-4 rounded text-sm my-4">
            <p><strong>Nome:</strong> {nomeContratante.toUpperCase() || "____________________________________________"}</p>
            <p><strong>CPF:</strong> {cpfContratante || "_________________"} | <strong>Telefone:</strong> {telefoneContratante || "_________________"}</p>
            <p><strong>Endereço:</strong> {matricula.logradouro ? enderecoCompleto.toUpperCase() : "________________________________________________________________________"}</p>
            {!matricula.maiorDeIdade && (
              <p className="mt-2 text-zinc-600 border-t border-zinc-200 pt-2">
                <strong>Atuando como responsável educacional pelo aluno(a):</strong> {matricula.nomeAluno.toUpperCase()}
              </p>
            )}
          </div>

          <p>têm entre si justo e acordado o presente Contrato de Prestação de Serviços Educacionais, que se regerá pelas cláusulas seguintes:</p>

          <p><strong>CLÁUSULA PRIMEIRA - DO OBJETO:</strong> O objeto deste contrato é a prestação de serviços educacionais no ensino de idiomas, referente ao curso/nível <strong>{nomeCurso.toUpperCase()}</strong>.</p>
          
          <p>
            <strong>CLÁUSULA SEGUNDA - DOS VALORES E MATRÍCULA:</strong> O presente contrato tem duração estipulada de <strong>{matricula.tempoContrato || "___"} meses</strong>. O CONTRATANTE obriga-se a pagar à CONTRATADA os valores referentes à prestação dos serviços educacionais e material didático, conforme acordado abaixo:
          </p>

          {!matricula.valoresDiferentes ? (
            <div className="my-4 bg-zinc-50 p-4 border border-zinc-200 rounded">
              <p><strong>Mensalidade Padrão:</strong> R$ {matricula.valorMensalidade || "0,00"}</p>
              {matricula.valorMaterial && <p className="mt-1"><strong>Material Didático:</strong> R$ {matricula.valorMaterial}</p>}
            </div>
          ) : (
            <ul className="list-none pl-4 space-y-2 my-4 bg-zinc-50 p-4 border border-zinc-200 rounded">
              {matricula.valores.map((v) => (
                <li key={v.semestre}>
                  <strong>{v.semestre}º Semestre:</strong> Mensalidade de R$ {v.mensalidade} {v.material ? ` | Material Didático: R$ ${v.material}` : ""}
                </li>
              ))}
            </ul>
          )}
          
          <p>A matrícula oficial e as cobranças financeiras definitivas serão geradas e validadas pela Secretaria Acadêmica da instituição após a assinatura deste instrumento.</p>
          <p><strong>CLÁUSULA TERCEIRA - DA FREQUÊNCIA:</strong> Para aprovação e emissão de certificado, o aluno deverá apresentar frequência mínima de 75% (setenta e cinco por cento) das aulas ministradas no semestre correspondente.</p>
          <p>E, por estarem de inteiro e comum acordo, as partes assinam o presente contrato em 2 (duas) vias de igual teor e forma.</p>
        </div>

        <div className="mt-20 flex flex-col items-center text-sm text-zinc-800 font-[Georgia,serif]">
          <p className="mb-16">São Paulo - SP, {dataAtual}</p>
          
          <div className="flex w-full justify-between px-10">
            <div className="flex flex-col items-center w-72 text-center font-sans">
              <div className="w-full border-b border-zinc-800 mb-2"></div>
              <p className="font-bold uppercase text-xs truncate w-full">{nomeContratante || "CONTRATANTE"}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">CPF: {cpfContratante || "Não informado"}</p>
            </div>
            
            <div className="flex flex-col items-center w-72 text-center font-sans">
              <div className="w-full border-b border-zinc-800 mb-2"></div>
              <p className="font-bold uppercase text-xs">LEARLY IDIOMAS</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">CONTRATADA</p>
            </div>
          </div>
        </div>

        <div className="mt-16 flex justify-center print:hidden">
          <button onClick={() => window.print()} className="h-10 px-8 font-bold text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors flex items-center gap-2 uppercase text-sm tracking-wider shadow-md">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Imprimir Contrato
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function SecretariaPage() {
  const [matriculas, setMatriculas] = useState<Matricula[]>(matriculasMockIniciais);
  const [pendencias, setPendencias] = useState<PendenciaComercial[]>(pendenciasMockIniciais);
  
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusMatricula | "todos">("todos");
  
  const [fluxoAberto, setFluxoAberto] = useState(false);
  const [matriculaEditando, setMatriculaEditando] = useState<Matricula | null>(null);
  const [analisandoPendencia, setAnalisandoPendencia] = useState<PendenciaComercial | null>(null);
  
  // 👉 Estado para abrir o Contrato
  const [matriculaContrato, setMatriculaContrato] = useState<Matricula | null>(null);

  const matriculasFiltradas = matriculas.filter((m) => {
    const buscaOk = m.nomeAluno.toLowerCase().includes(busca.toLowerCase()) || m.cpfAluno.includes(busca);
    const statusOk = filtroStatus === "todos" || m.status === filtroStatus;
    return buscaOk && statusOk;
  });

  function salvarMatricula(dados: Matricula) {
    if (matriculaEditando) {
      setMatriculas(prev => prev.map(m => m.id === dados.id ? dados : m));
    } else {
      setMatriculas(prev => [{ ...dados, id: Date.now(), status: "ativo" }, ...prev]);
    }
    setFluxoAberto(false);
    setMatriculaEditando(null);
  }

  function aprovarPendencia(dados: Matricula) {
    setMatriculas(prev => [{ ...dados, id: Date.now(), status: "ativo" }, ...prev]);
    setPendencias(prev => prev.filter(p => p.id !== analisandoPendencia?.id));
    alert("Matrícula efetivada com sucesso! O contrato e os valores já estão no sistema.");
  }

  function devolverPendencia(motivo: string) {
    alert(`O pré-aluno ${analisandoPendencia?.nomeAluno} foi devolvido ao Comercial.\nMotivo registrado: "${motivo}"`);
    setPendencias(prev => prev.filter(p => p.id !== analisandoPendencia?.id));
  }

  return (
    <>
      <div className="flex flex-col gap-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Secretaria</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Gestão de Alunos e Aprovação de Matrículas</p>
          </div>
          <button onClick={() => setFluxoAberto(true)}
            className="flex items-center gap-2 h-9 px-4 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova Matrícula Direta
          </button>
        </div>

        {pendencias.length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-amber-100/50 px-5 py-3 border-b border-amber-200 flex justify-between items-center">
              <div className="flex items-center gap-2 text-amber-800">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <h2 className="text-sm font-bold uppercase tracking-wide">Fila de Aprovação (Vendas)</h2>
              </div>
              <span className="bg-amber-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">{pendencias.length} pendentes</span>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {pendencias.map(pend => (
                <div key={pend.id} className="bg-white border border-amber-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                      {pend.nomeAluno}
                      {pend.anexos.length > 0 && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{pend.anexos.length} anexos</span>}
                    </span>
                    <span className="text-xs text-zinc-500">Enviado por: <strong>{pend.vendedor}</strong> em {pend.dataEnvio}</span>
                  </div>
                  <button 
                    onClick={() => setAnalisandoPendencia(pend)}
                    className="h-9 px-5 bg-amber-500 text-white font-bold text-sm rounded hover:bg-amber-600 transition-colors shadow-sm"
                  >
                    Analisar Documentos
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-4">
          <input type="text" placeholder="Buscar por nome ou CPF..."
            value={busca} onChange={(e) => setBusca(e.target.value)}
            className="h-9 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition w-96" />
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as StatusMatricula | "todos")}
            className="h-9 border border-zinc-300 rounded-lg px-3 text-sm text-zinc-700 outline-none focus:border-[#1F2A35] transition bg-white">
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="text-left px-4 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Aluno / CPF</th>
                <th className="text-left px-4 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Telefone</th>
                <th className="text-left px-4 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Turma</th>
                <th className="text-left px-4 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Status</th>
                <th className="text-left px-4 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Financeiro</th>
                <th className="px-4 py-3 text-right font-bold text-zinc-500 uppercase tracking-wide text-xs">Opções</th>
              </tr>
            </thead>
            <tbody>
              {matriculasFiltradas.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-zinc-400">Nenhuma matrícula encontrada</td></tr>
              ) : (
                matriculasFiltradas.map((m, i) => (
                  <tr key={m.id} className={`border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${i === matriculasFiltradas.length - 1 ? "border-b-0" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1F2A35] flex items-center justify-center text-white text-xs font-semibold shrink-0">{m.nomeAluno.charAt(0)}</div>
                        <div>
                          <p className="font-bold text-zinc-900">{m.nomeAluno}</p>
                          <p className="text-xs text-zinc-500">{m.cpfAluno}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 font-medium">{m.telefoneAluno}</td>
                    <td className="px-4 py-3 text-zinc-600">{m.turma}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${m.status === "ativo" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {m.status === "ativo" ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${financeiroColors[m.statusFinanceiro]}`}>
                        {financeiroLabel[m.statusFinanceiro]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setMatriculaEditando(m)} className="h-8 px-3 text-xs font-bold text-zinc-600 border border-zinc-200 rounded hover:bg-zinc-100 transition-colors">Editar</button>
                        <Link href={`/financeiro/${m.id}`} className="h-8 px-3 text-xs font-bold text-zinc-600 border border-zinc-200 rounded hover:bg-zinc-100 transition-colors flex items-center">Financeiro</Link>
                        <Link href={`/alunos/${m.id}`} className="h-8 px-3 text-xs font-bold text-blue-700 border border-blue-200 bg-blue-50 rounded hover:bg-blue-100 transition-colors flex items-center">Perfil</Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {fluxoAberto && (
        <ModalMatricula matricula={null} onClose={() => setFluxoAberto(false)} onSave={salvarMatricula} onGerarContrato={(m) => setMatriculaContrato(m)} />
      )}

      {matriculaEditando && (
        <ModalMatricula matricula={matriculaEditando} onClose={() => setMatriculaEditando(null)} onSave={salvarMatricula} onGerarContrato={(m) => setMatriculaContrato(m)} />
      )}

      {analisandoPendencia && (
        <ModalMatricula 
          matricula={analisandoPendencia} 
          isPendencia={true} 
          onClose={() => setAnalisandoPendencia(null)} 
          onSave={aprovarPendencia} 
          onDevolver={devolverPendencia}
          onGerarContrato={(m) => setMatriculaContrato(m)}
        />
      )}

      {/* Abre o contrato (PDF) da Secretaria */}
      {matriculaContrato && (
        <ModalContrato matricula={matriculaContrato} onClose={() => setMatriculaContrato(null)} />
      )}
    </>
  );
}