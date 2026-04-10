"use client";

import { useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type EstagioFunil = "NOVO" | "NEGOCIACAO" | "APROVADO" | "CANCELADO";

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

interface Lead {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  interesse: string;
  estagio: EstagioFunil;
  dataRegistro: string;
  observacoes: string;
  
  // Dados para Contrato / Matrícula
  maiorDeIdade: boolean;
  cpf: string;
  rg: string;
  dataNascimento: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  
  // Responsável (Se menor de idade)
  nomeResponsavel: string;
  cpfResponsavel: string;
  telefoneResponsavel: string;

  // Valores Financeiros Acordados (Dinâmico por Semestre)
  tempoContrato: number; 
  valoresDiferentes: boolean;
  valorMensalidade: string; 
  valorMaterial: string;    
  valores: ValorSemestre[]; 

  // Documentos Anexados
  anexos: Anexo[];

  // 👇 NOVO: Controle de devolução da Secretaria 👇
  devolvidoSecretaria?: boolean;
  motivoDevolucao?: string;
}

// ─── Mock de Dados ────────────────────────────────────────────────────────────
const leadsMockIniciais: Lead[] = [
  { 
    id: 1, nome: "Mariana Costa", telefone: "(11) 98888-1111", email: "mariana@email.com", interesse: "Book 1 (Iniciante)", estagio: "NOVO", dataRegistro: "20/03/2026", observacoes: "Entrou em contato pelo Instagram.",
    maiorDeIdade: true, cpf: "", rg: "", dataNascimento: "", cep: "", logradouro: "", numero: "", bairro: "", cidade: "", nomeResponsavel: "", cpfResponsavel: "", telefoneResponsavel: "", 
    tempoContrato: 0, valoresDiferentes: false, valorMensalidade: "", valorMaterial: "", valores: [], anexos: []
  },
  { 
    id: 4, nome: "João Pedro Alves", telefone: "(31) 95555-4444", email: "jp.alves@email.com", interesse: "Book 2 (Intermediário)", estagio: "APROVADO", dataRegistro: "10/03/2026", observacoes: "Aceitou os valores e os horários.",
    maiorDeIdade: true, cpf: "123.456.789-00", rg: "12.345.678-9", dataNascimento: "15/05/1998", cep: "01000-000", logradouro: "Rua das Flores", numero: "123", bairro: "Centro", cidade: "São Paulo", nomeResponsavel: "João Pedro Alves", cpfResponsavel: "123.456.789-00", telefoneResponsavel: "(31) 95555-4444", 
    tempoContrato: 12, valoresDiferentes: true, valorMensalidade: "", valorMaterial: "",
    valores: [
      { semestre: 1, mensalidade: "250,00", material: "300,00" },
      { semestre: 2, mensalidade: "270,00", material: "0,00" }
    ], 
    anexos: [
      { id: 1, tipo: "Contrato Assinado", nomeArquivo: "contrato_assinado.pdf", data: "11/03/2026" },
      { id: 2, tipo: "Comprovante de Pagamento (Matrícula)", nomeArquivo: "pix.png", data: "11/03/2026" }
    ]
  },
  // 👇 NOVO: Exemplo de Lead Devolvido pela Secretaria 👇
  { 
    id: 5, nome: "Carlos Eduardo", telefone: "(41) 91111-2222", email: "carlos@email.com", interesse: "Book 1 (Iniciante)", estagio: "APROVADO", dataRegistro: "24/03/2026", observacoes: "Enviado ontem, mas a secretaria devolveu.",
    maiorDeIdade: true, cpf: "111.222.333-44", rg: "", dataNascimento: "10/10/2000", cep: "80000-000", logradouro: "Rua X", numero: "10", bairro: "Centro", cidade: "Curitiba", nomeResponsavel: "", cpfResponsavel: "", telefoneResponsavel: "", 
    tempoContrato: 6, valoresDiferentes: false, valorMensalidade: "200,00", valorMaterial: "150,00", valores: [], 
    anexos: [
      { id: 3, tipo: "Contrato Assinado", nomeArquivo: "contrato.pdf", data: "24/03/2026" }
    ],
    devolvidoSecretaria: true, 
    motivoDevolucao: "Falta anexar o comprovante de pagamento da matrícula. O arquivo do contrato também está ilegível na página 2. Por favor, reenvie."
  },
];

const ESTAGIOS: { key: EstagioFunil; label: string; cor: string; bg: string }[] = [
  { key: "NOVO", label: "Novos Contatos", cor: "text-blue-700", bg: "bg-blue-100" },
  { key: "NEGOCIACAO", label: "Em Negociação", cor: "text-amber-700", bg: "bg-amber-100" },
  { key: "APROVADO", label: "Contrato / Aprovado", cor: "text-green-700", bg: "bg-green-100" },
];

const TIPOS_ANEXO = [
  "Contrato Assinado",
  "Comprovante de Pagamento (Matrícula)",
  "Ficha de Inscrição",
  "Conversa de WhatsApp",
  "Documento Pessoal (RG/CPF)",
  "Outros"
];

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

// ─── Modal Novo Lead ──────────────────────────────────────────────────────────
function ModalNovoLead({ onClose, onSave }: { onClose: () => void, onSave: (lead: Partial<Lead>) => void }) {
  const [form, setForm] = useState({ nome: "", telefone: "", email: "", interesse: "", observacoes: "" });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-base font-semibold text-zinc-900">Cadastrar Novo Pré-aluno</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 mb-2">
            No primeiro contato, cadastre apenas o básico. Os dados de contrato podem ser preenchidos depois na fase de negociação.
          </div>
          <Campo label="Nome Completo *" value={form.nome} onChange={(e: any) => setForm({...form, nome: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
            <Campo label="Telefone / WhatsApp *" value={form.telefone} onChange={(e: any) => setForm({...form, telefone: e.target.value})} required />
            <Campo label="E-mail" type="email" value={form.email} onChange={(e: any) => setForm({...form, email: e.target.value})} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Curso de Interesse *</label>
            <select value={form.interesse} onChange={(e) => setForm({...form, interesse: e.target.value})} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] bg-white">
              <option value="">Selecione...</option>
              <option value="Book 1 (Iniciante)">Book 1 (Iniciante)</option>
              <option value="Book 2 (Intermediário)">Book 2 (Intermediário)</option>
              <option value="Book 3 (Avançado)">Book 3 (Avançado)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Observações (Opcional)</label>
            <textarea value={form.observacoes} onChange={(e) => setForm({...form, observacoes: e.target.value})} rows={3} className="border border-zinc-300 rounded-lg p-3 text-sm outline-none focus:border-[#1F2A35] resize-none" placeholder="Ex: Tem disponibilidade apenas à noite." />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50 rounded-b-xl">
          <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-zinc-600 border border-zinc-300 bg-white rounded-lg hover:bg-zinc-50 transition-colors">Cancelar</button>
          <button disabled={!form.nome || !form.telefone || !form.interesse} onClick={() => { onSave(form); onClose(); }} className="h-9 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">Salvar Pré-aluno</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Detalhes do Lead (COM AVISO DE DEVOLUÇÃO) ──────────────────────────
function ModalDetalhesLead({ lead, onClose, onSave, onGerarContrato, onEnviarSecretaria }: { lead: Lead, onClose: () => void, onSave: (lead: Lead) => void, onGerarContrato: (lead: Lead) => void, onEnviarSecretaria: (lead: Lead) => void }) {
  const [form, setForm] = useState<Lead>(lead);
  const [abaAtual, setAbaAtual] = useState<"contato" | "contrato" | "anexos">("contato");

  const [tipoAnexoSelecionado, setTipoAnexoSelecionado] = useState(TIPOS_ANEXO[0]);
  const [arquivoUpload, setArquivoUpload] = useState<File | null>(null);

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

  // Verifica dados do Contrato
  let valoresPreenchidos = false;
  if (form.tempoContrato > 0) {
    if (form.valoresDiferentes) {
      valoresPreenchidos = form.valores.length > 0 && form.valores.every(v => v.mensalidade.trim() !== "");
    } else {
      valoresPreenchidos = form.valorMensalidade.trim() !== "";
    }
  }

  const dadosContratoProntos = form.cpf && form.logradouro && form.cidade && valoresPreenchidos;
  
  const temContratoAssinado = form.anexos.some(a => a.tipo === "Contrato Assinado");
  const temComprovantePagto = form.anexos.some(a => a.tipo === "Comprovante de Pagamento (Matrícula)");
  const anexosProntos = temContratoAssinado && temComprovantePagto;

  function handleUpload() {
    if (!arquivoUpload) return;
    const novoAnexo: Anexo = {
      id: Date.now(),
      tipo: tipoAnexoSelecionado,
      nomeArquivo: arquivoUpload.name,
      data: new Date().toLocaleDateString('pt-BR')
    };
    setForm(prev => ({ ...prev, anexos: [novoAnexo, ...prev.anexos] }));
    setArquivoUpload(null);
  }

  function removerAnexo(id: number) {
    setForm(prev => ({ ...prev, anexos: prev.anexos.filter(a => a.id !== id) }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 flex flex-col max-h-[95vh]">
        
        <div className="flex flex-col border-b border-zinc-200 sticky top-0 bg-white rounded-t-xl z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Gestão do Pré-aluno: <span className="text-[#1F2A35]">{lead.nome}</span></h2>
              <p className="text-xs text-zinc-500 mt-0.5">Registrado em {lead.dataRegistro}</p>
            </div>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>

          {/* 👇 NOVO: ALERTA DE DEVOLUÇÃO DA SECRETARIA 👇 */}
          {form.devolvidoSecretaria && (
            <div className="bg-red-50 border-y border-red-200 px-6 py-3 flex gap-3 items-start">
              <svg className="text-red-600 mt-0.5 shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>
                <h4 className="text-sm font-bold text-red-800">Devolvido pela Secretaria</h4>
                <p className="text-sm text-red-700 mt-0.5"><strong>Motivo:</strong> {form.motivoDevolucao}</p>
                <p className="text-xs text-red-600 mt-1">Corrija o problema (Ex: altere os dados ou reanexe o documento) e clique em "Enviar para Secretaria" novamente.</p>
              </div>
            </div>
          )}
          
          <div className="flex px-6 gap-6 border-t border-zinc-100">
            <button onClick={() => setAbaAtual("contato")} className={`py-3 text-sm font-medium border-b-2 transition-colors ${abaAtual === "contato" ? "border-[#1F2A35] text-[#1F2A35]" : "border-transparent text-zinc-500 hover:text-zinc-700"}`}>
              1. Negociação
            </button>
            <button onClick={() => setAbaAtual("contrato")} className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${abaAtual === "contrato" ? "border-[#1F2A35] text-[#1F2A35]" : "border-transparent text-zinc-500 hover:text-zinc-700"}`}>
              2. Dados & Valores
              {!dadosContratoProntos && <span className="w-2 h-2 rounded-full bg-red-500" title="Dados pendentes para contrato"></span>}
            </button>
            <button onClick={() => setAbaAtual("anexos")} className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${abaAtual === "anexos" ? "border-green-600 text-green-700" : "border-transparent text-zinc-500 hover:text-zinc-700"}`}>
              3. Anexos & Envio
              {!anexosProntos && <span className="w-2 h-2 rounded-full bg-amber-500" title="Anexos obrigatórios pendentes"></span>}
            </button>
          </div>
        </div>
        
        <div className="p-6 flex flex-col gap-5 overflow-y-auto bg-zinc-50/30">
          
          {/* ABA 1: NEGOCIAÇÃO */}
          {abaAtual === "contato" && (
            <div className="flex flex-col gap-6">
              <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
                <label className="text-sm font-bold text-zinc-800 block mb-3">Estágio no Funil de Vendas</label>
                <div className="flex gap-2">
                  {ESTAGIOS.map((est) => (
                    <button
                      key={est.key}
                      onClick={() => setForm({ ...form, estagio: est.key })}
                      className={`flex-1 h-10 rounded-md text-xs font-bold transition-all border ${
                        form.estagio === est.key 
                          ? `${est.bg} ${est.cor} border-transparent shadow-sm scale-[1.02]` 
                          : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      {est.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
                <Campo label="Nome Completo" value={form.nome} onChange={(e: any) => setForm({...form, nome: e.target.value})} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-700">Curso de Interesse</label>
                  <select value={form.interesse} onChange={(e) => setForm({...form, interesse: e.target.value})} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] bg-white">
                    <option value="Book 1 (Iniciante)">Book 1 (Iniciante)</option>
                    <option value="Book 2 (Intermediário)">Book 2 (Intermediário)</option>
                    <option value="Book 3 (Avançado)">Book 3 (Avançado)</option>
                  </select>
                </div>
                <Campo label="Telefone / WhatsApp" value={form.telefone} onChange={(e: any) => setForm({...form, telefone: e.target.value})} />
                <Campo label="E-mail" type="email" value={form.email} onChange={(e: any) => setForm({...form, email: e.target.value})} />
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-sm font-medium text-zinc-700">Anotações do Vendedor</label>
                  <textarea value={form.observacoes} onChange={(e) => setForm({...form, observacoes: e.target.value})} rows={3} className="border border-zinc-300 rounded-lg p-3 text-sm outline-none focus:border-[#1F2A35] resize-none" />
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: DADOS PARA CONTRATO & FINANCEIRO */}
          {abaAtual === "contrato" && (
            <div className="flex flex-col gap-6">
              <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
                <h3 className="text-sm font-bold text-green-800 mb-4 border-b border-zinc-100 pb-2">Duração do Contrato e Valores</h3>
                
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
                        <Campo label="Mensalidade Padrão (R$) *" value={form.valorMensalidade} onChange={(e: any) => setForm({...form, valorMensalidade: e.target.value})} placeholder="Ex: 250,00" />
                        <Campo label="Material Padrão (R$)" value={form.valorMaterial} onChange={(e: any) => setForm({...form, valorMaterial: e.target.value})} placeholder="Ex: 300,00" />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide">Valores por semestre</p>
                        {form.valores.map((v, i) => (
                          <div key={i} className="flex gap-4 items-center bg-zinc-50 p-4 rounded-lg border border-zinc-200 shadow-sm">
                            <span className="text-sm font-bold text-[#1F2A35] uppercase w-28 whitespace-nowrap">{i + 1}º Semestre</span>
                            <div className="grid grid-cols-2 gap-4 flex-1">
                              <Campo label="Mensalidade (R$) *" value={v.mensalidade} onChange={(e: any) => handleValorSemestreChange(i, 'mensalidade', e.target.value)} placeholder="Ex: 250,00" />
                              <Campo label="Material (R$)" value={v.material} onChange={(e: any) => handleValorSemestreChange(i, 'material', e.target.value)} placeholder="Ex: 300,00" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

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
                <h3 className="text-sm font-bold text-zinc-800 mb-4 border-b border-zinc-100 pb-2">Documentação do Aluno</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Campo label="CPF *" value={form.cpf} onChange={(e: any) => setForm({...form, cpf: e.target.value})} placeholder="000.000.000-00" />
                  <Campo label="RG" value={form.rg} onChange={(e: any) => setForm({...form, rg: e.target.value})} placeholder="00.000.000-0" />
                  <Campo label="Data Nascimento *" type="date" value={form.dataNascimento} onChange={(e: any) => setForm({...form, dataNascimento: e.target.value})} />
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
                <h3 className="text-sm font-bold text-zinc-800 mb-4 border-b border-zinc-100 pb-2">Endereço Residencial</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2 md:col-span-1"><Campo label="CEP *" value={form.cep} onChange={(e: any) => setForm({...form, cep: e.target.value})} placeholder="00000-000" /></div>
                  <div className="col-span-2 md:col-span-3"><Campo label="Logradouro *" value={form.logradouro} onChange={(e: any) => setForm({...form, logradouro: e.target.value})} placeholder="Rua, Avenida..." /></div>
                  <div className="col-span-1"><Campo label="Número *" value={form.numero} onChange={(e: any) => setForm({...form, numero: e.target.value})} placeholder="123" /></div>
                  <div className="col-span-1 md:col-span-1"><Campo label="Bairro *" value={form.bairro} onChange={(e: any) => setForm({...form, bairro: e.target.value})} placeholder="Centro" /></div>
                  <div className="col-span-2"><Campo label="Cidade *" value={form.cidade} onChange={(e: any) => setForm({...form, cidade: e.target.value})} placeholder="São Paulo - SP" /></div>
                </div>
              </div>

              {!form.maiorDeIdade && (
                <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-amber-800 mb-4 border-b border-zinc-100 pb-2">Dados do Responsável Financeiro</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Campo label="Nome do Responsável *" value={form.nomeResponsavel} onChange={(e: any) => setForm({...form, nomeResponsavel: e.target.value})} />
                    <Campo label="CPF do Responsável *" value={form.cpfResponsavel} onChange={(e: any) => setForm({...form, cpfResponsavel: e.target.value})} placeholder="000.000.000-00" />
                    <Campo label="Telefone do Responsável *" value={form.telefoneResponsavel} onChange={(e: any) => setForm({...form, telefoneResponsavel: e.target.value})} placeholder="(00) 00000-0000" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ABA 3: ANEXOS E ENVIO */}
          {abaAtual === "anexos" && (
            <div className="flex flex-col gap-6">
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800 mb-2">Para enviar este aluno para a Secretaria, deve anexar obrigatoriamente:</p>
                <ul className="text-sm text-amber-700 list-disc pl-5">
                  <li className={temContratoAssinado ? "text-green-700 line-through" : "font-bold"}>Contrato Assinado</li>
                  <li className={temComprovantePagto ? "text-green-700 line-through" : "font-bold"}>Comprovante de Pagamento da Matrícula</li>
                </ul>
              </div>

              <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Gerar Contrato (PDF)</h3>
                  <p className="text-xs text-zinc-500 mt-1">Imprima o contrato para o aluno assinar, ou salve em PDF para enviar via WhatsApp.</p>
                </div>
                <button 
                  onClick={() => {
                    if(!dadosContratoProntos) {
                      alert("Preencha os Valores (Tempo e Semestres), CPF e Endereço na aba 'Dados & Valores' antes de gerar o PDF.");
                      setAbaAtual("contrato");
                    } else {
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
                <h3 className="text-sm font-bold text-zinc-800 mb-4 border-b border-zinc-100 pb-2">Anexar Documentos</h3>
                
                <div className="flex gap-3 items-end mb-6">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Tipo de Documento</label>
                    <select value={tipoAnexoSelecionado} onChange={(e) => setTipoAnexoSelecionado(e.target.value)} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] bg-white">
                      {TIPOS_ANEXO.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Ficheiro</label>
                    <input 
                      type="file" 
                      onChange={(e) => setArquivoUpload(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors border border-zinc-300 rounded-lg p-1.5"
                    />
                  </div>
                  <button 
                    disabled={!arquivoUpload}
                    onClick={handleUpload}
                    className="h-10 px-4 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anexar
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {form.anexos.length === 0 ? (
                    <div className="text-center py-6 text-sm text-zinc-400 bg-zinc-50 rounded-lg border border-dashed border-zinc-300">Nenhum documento anexado ainda.</div>
                  ) : (
                    form.anexos.map(anexo => (
                      <div key={anexo.id} className="flex items-center justify-between p-3 border border-zinc-200 rounded-lg bg-zinc-50">
                        <div className="flex items-center gap-3">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                          <div>
                            <p className="text-sm font-bold text-zinc-800">{anexo.tipo}</p>
                            <p className="text-xs text-zinc-500">{anexo.nomeArquivo} • Enviado em {anexo.data}</p>
                          </div>
                        </div>
                        <button onClick={() => removerAnexo(anexo.id)} className="text-red-500 hover:text-red-700 text-xs font-bold uppercase">
                          Excluir
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-2 flex justify-center">
                <button 
                  disabled={!anexosProntos}
                  onClick={() => { 
                    // Limpa a flag de devolução ao reenviar para a secretaria
                    const formDataFinal = { ...form, devolvidoSecretaria: false, motivoDevolucao: "" };
                    onEnviarSecretaria(formDataFinal); 
                    onClose(); 
                  }} 
                  className="w-full h-12 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Finalizar Venda e Enviar para a Secretaria
                </button>
              </div>

            </div>
          )}

        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200 bg-white rounded-b-xl">
          <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">Cancelar</button>
          <button onClick={() => { onSave(form); onClose(); }} className="h-9 px-4 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors shadow-sm">Salvar Progresso</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Gerar Contrato (Visualização Oficial PDF) ──────────────────────────
function ModalContrato({ lead, onClose }: { lead: Lead, onClose: () => void }) {
  const dataAtual = new Date().toLocaleDateString('pt-BR');

  const nomeContratante = lead.maiorDeIdade ? lead.nome : lead.nomeResponsavel;
  const cpfContratante = lead.maiorDeIdade ? lead.cpf : lead.cpfResponsavel;
  const telefoneContratante = lead.maiorDeIdade ? lead.telefone : lead.telefoneResponsavel;
  
  const enderecoCompleto = `${lead.logradouro}, ${lead.numero} - ${lead.bairro}, ${lead.cidade} - CEP: ${lead.cep}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 print:bg-white print:items-start">
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 shadow-md print:hidden">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      <div className="bg-white rounded-lg shadow-xl print:shadow-none w-full max-w-4xl mx-4 print:mx-0 flex flex-col p-12 border border-zinc-300 print:border-none h-[95vh] overflow-y-auto print:h-auto print:overflow-visible">
        
        <div className="text-center mb-10 border-b-2 border-zinc-800 pb-6">
          <h1 className="text-2xl font-bold text-zinc-900 uppercase tracking-widest">Contrato de Prestação de Serviços Educacionais</h1>
          <p className="text-sm font-medium text-zinc-600 mt-2">LEARLY IDIOMAS - CNPJ: 12.345.678/0001-90</p>
        </div>

        <div className="text-sm leading-relaxed text-zinc-800 space-y-6 font-[Georgia,serif] text-justify">
          <p>
            Pelo presente instrumento particular, de um lado <strong>LEARLY IDIOMAS</strong>, doravante denominada simplesmente CONTRATADA, e de outro lado o(a) CONTRATANTE e responsável financeiro:
          </p>
          
          <div className="bg-zinc-50 border border-zinc-200 p-4 rounded text-sm my-4">
            <p><strong>Nome:</strong> {nomeContratante.toUpperCase() || "____________________________________________"}</p>
            <p><strong>CPF:</strong> {cpfContratante || "_________________"} | <strong>Telefone:</strong> {telefoneContratante || "_________________"}</p>
            <p><strong>Endereço:</strong> {lead.logradouro ? enderecoCompleto.toUpperCase() : "________________________________________________________________________"}</p>
            {!lead.maiorDeIdade && (
              <p className="mt-2 text-zinc-600 border-t border-zinc-200 pt-2">
                <strong>Atuando como responsável educacional pelo aluno(a):</strong> {lead.nome.toUpperCase()}
              </p>
            )}
          </div>

          <p>têm entre si justo e acordado o presente Contrato de Prestação de Serviços Educacionais, que se regerá pelas cláusulas seguintes:</p>

          <p><strong>CLÁUSULA PRIMEIRA - DO OBJETO:</strong> O objeto deste contrato é a prestação de serviços educacionais no ensino de idiomas, referente ao curso/nível <strong>{lead.interesse.toUpperCase()}</strong>.</p>
          
          <p>
            <strong>CLÁUSULA SEGUNDA - DOS VALORES E MATRÍCULA:</strong> O presente contrato tem duração estipulada de <strong>{lead.tempoContrato} meses</strong>. O CONTRATANTE obriga-se a pagar à CONTRATADA os valores referentes à prestação dos serviços educacionais e material didático, conforme acordado abaixo:
          </p>

          {!lead.valoresDiferentes ? (
            <div className="my-4 bg-zinc-50 p-4 border border-zinc-200 rounded">
              <p><strong>Mensalidade Padrão:</strong> R$ {lead.valorMensalidade}</p>
              {lead.valorMaterial && <p className="mt-1"><strong>Material Didático:</strong> R$ {lead.valorMaterial}</p>}
            </div>
          ) : (
            <ul className="list-none pl-4 space-y-2 my-4 bg-zinc-50 p-4 border border-zinc-200 rounded">
              {lead.valores.map((v) => (
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

        {/* Botão de Imprimir */}
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

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function ComercialPage() {
  const [leads, setLeads] = useState<Lead[]>(leadsMockIniciais);
  const [modalNovo, setModalNovo] = useState(false);
  
  const [leadEditando, setLeadEditando] = useState<Lead | null>(null);
  const [leadContrato, setLeadContrato] = useState<Lead | null>(null);

  // Filtra os leads por coluna, ocultando os cancelados
  const leadsNovo = leads.filter(l => l.estagio === "NOVO");
  const leadsNegociacao = leads.filter(l => l.estagio === "NEGOCIACAO");
  const leadsAprovado = leads.filter(l => l.estagio === "APROVADO");

  function adicionarLead(dados: Partial<Lead>) {
    const novoLead: Lead = {
      id: Date.now(),
      nome: dados.nome || "",
      telefone: dados.telefone || "",
      email: dados.email || "",
      interesse: dados.interesse || "",
      estagio: "NOVO", 
      dataRegistro: new Date().toLocaleDateString('pt-BR'),
      observacoes: dados.observacoes || "",
      maiorDeIdade: true, cpf: "", rg: "", dataNascimento: "", cep: "", logradouro: "", numero: "", bairro: "", cidade: "", nomeResponsavel: "", cpfResponsavel: "", telefoneResponsavel: "", valorMensalidade: "", valorMaterial: "", tempoContrato: 0, valoresDiferentes: false, valores: [], anexos: []
    };
    setLeads(prev => [novoLead, ...prev]);
  }

  function atualizarLead(leadAtualizado: Lead) {
    setLeads(prev => prev.map(l => l.id === leadAtualizado.id ? leadAtualizado : l));
  }

  function enviarParaSecretaria(lead: Lead) {
    alert(`Sucesso! A pasta de ${lead.nome} foi enviada para a fila da Secretaria.\nA Secretaria fará a matrícula no sistema e gerará as cobranças financeiras oficiais.`);
    setLeads(prev => prev.filter(l => l.id !== lead.id)); 
  }

  // 👇 NOVO: Função para cancelar o lead (Marcá-lo como perdido) 👇
  function cancelarLead(lead: Lead) {
    if (confirm(`Tem a certeza que deseja CANCELAR a negociação com ${lead.nome}?\nO pré-aluno será removido do funil de vendas.`)) {
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, estagio: "CANCELADO" } : l));
    }
  }

  const renderColuna = (estagioId: EstagioFunil, listaLeads: Lead[], config: typeof ESTAGIOS[0]) => (
    <div className="flex flex-col bg-zinc-100/50 rounded-xl p-3 min-w-[320px] max-w-[350px] flex-1 border border-zinc-200">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${config.bg.replace("100", "500")}`} />
          <h3 className="font-bold text-zinc-800 text-sm uppercase tracking-wide">{config.label}</h3>
        </div>
        <span className="text-xs font-bold text-zinc-500 bg-white px-2 py-0.5 rounded shadow-sm border border-zinc-200">{listaLeads.length}</span>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto pr-1 pb-2 h-[calc(100vh-250px)]">
        {listaLeads.length === 0 ? (
          <div className="text-center py-10 text-zinc-400 text-xs font-medium border-2 border-dashed border-zinc-200 rounded-lg">Vazio</div>
        ) : (
          listaLeads.map(lead => {
            const temContratoAssinado = lead.anexos.some(a => a.tipo === "Contrato Assinado");
            const temComprovantePagto = lead.anexos.some(a => a.tipo === "Comprovante de Pagamento (Matrícula)");
            const prontoParaEnvio = temContratoAssinado && temComprovantePagto;

            return (
              <div 
                key={lead.id} 
                onClick={() => setLeadEditando(lead)}
                className="bg-white p-4 rounded-lg shadow-sm border border-zinc-200 cursor-pointer hover:border-blue-400 hover:shadow transition-all group flex flex-col gap-2 relative overflow-hidden"
              >
                {/* 👇 NOVO: Indicador de Devolução da Secretaria 👇 */}
                {lead.devolvidoSecretaria && (
                  <div className="mb-1 bg-red-100 border border-red-200 text-red-700 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 w-fit">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    DEVOLVIDO PELA SECRETARIA
                  </div>
                )}

                {/* Indicadores de Status (Pendente/Pronto) */}
                {lead.estagio === "APROVADO" && !prontoParaEnvio && (
                  <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                    <div className="absolute transform rotate-45 bg-amber-500 text-white text-[8px] font-bold py-1 right-[-20px] top-[15px] w-[80px] text-center shadow-sm">
                      PENDENTE
                    </div>
                  </div>
                )}
                {lead.estagio === "APROVADO" && prontoParaEnvio && (
                  <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                    <div className="absolute transform rotate-45 bg-green-500 text-white text-[8px] font-bold py-1 right-[-20px] top-[15px] w-[80px] text-center shadow-sm">
                      PRONTO!
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-start">
                  <h4 className={`font-bold text-sm leading-tight pr-4 ${lead.devolvidoSecretaria ? "text-red-900" : "text-zinc-900"}`}>{lead.nome}</h4>
                  
                  {/* 👇 NOVO: Botão de Cancelar o Lead no canto superior 👇 */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); cancelarLead(lead); }} 
                    className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 transition-all absolute right-3 top-3 bg-white rounded-full p-1"
                    title="Cancelar Negociação"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                
                <span className="text-[10px] font-semibold text-zinc-400">{lead.dataRegistro}</span>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-medium">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    {lead.telefone}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-medium">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                    {lead.interesse}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-6 h-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Comercial / CRM</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Gerencie os interessados, colete dados e gere contratos.</p>
          </div>
          <button 
            onClick={() => setModalNovo(true)}
            className="flex items-center gap-2 h-9 px-4 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo Pré-aluno
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 h-full">
          {renderColuna("NOVO", leadsNovo, ESTAGIOS[0])}
          {renderColuna("NEGOCIACAO", leadsNegociacao, ESTAGIOS[1])}
          {renderColuna("APROVADO", leadsAprovado, ESTAGIOS[2])}
        </div>
      </div>

      {modalNovo && (
        <ModalNovoLead onClose={() => setModalNovo(false)} onSave={adicionarLead} />
      )}

      {leadEditando && (
        <ModalDetalhesLead 
          lead={leadEditando} 
          onClose={() => setLeadEditando(null)} 
          onSave={atualizarLead} 
          onGerarContrato={(l) => { setLeadEditando(null); setLeadContrato(l); }}
          onEnviarSecretaria={enviarParaSecretaria}
        />
      )}

      {leadContrato && (
        <ModalContrato lead={leadContrato} onClose={() => setLeadContrato(null)} />
      )}
    </>
  );
}