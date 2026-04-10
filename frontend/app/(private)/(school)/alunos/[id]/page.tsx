"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface HistoricoMatricula {
  id: number;
  periodoLetivo: string;
  unidade: string;
  turma: string;
  situacao: "ATIVO" | "CANCELADO" | "CONCLUÍDO" | "TRANCADO";
}

interface Ocorrencia {
  id: number;
  data: string;
  hora: string;
  tipo: "Acadêmica" | "Administrativa";
  descricao: string;
  resolucao: string;
  aulaVinculada: string;
  autor: string;
}

interface Documento {
  id: number;
  nome: string;
  tipo: string;
  dataEnvio: string;
  tamanho: string;
  autor: string;
}

interface Falta {
  id: number;
  data: string;
  book: string;
  aula: string;
  justificada: boolean;
  motivo?: string;
  autorJustificativa?: string;
  dataJustificativa?: string;
}

interface AlunoInfo {
  id: string | number;
  nome: string;
  cpf: string;
  naturalidade: string;
  dataIngresso: string;
  dataNascimento: string;
  telefoneAluno: string;
  rg: string;
  endereco: string;
  telefoneResponsavel: string;
  nomeResponsavel: string;
  cpfResponsavel: string;
}

// ─── BANDO DE DADOS SIMULADO (Mock por ID) ────────────────────────────────────
const bancoDeAlunosMock: Record<string, AlunoInfo> = {
  "1": {
    id: 1, nome: "ALICE MASSARI SOARES", cpf: "123.456.789-00", naturalidade: "SÃO PAULO / SP", dataIngresso: "01/02/2024", dataNascimento: "15/08/2010", telefoneAluno: "(11) 99999-1111", rg: "12.345.678-9 /SP", endereco: "RUA DAS FLORES, 123 - CENTRO - SÃO PAULO / SP", telefoneResponsavel: "(11) 98888-2222", nomeResponsavel: "TULLAINE MASSARI", cpfResponsavel: "987.654.321-00"
  },
  "2": {
    id: 2, nome: "RONALD XAVIER DE ABREU", cpf: "234.567.890-00", naturalidade: "CURITIBA / PR", dataIngresso: "01/02/2023", dataNascimento: "25/02/2008", telefoneAluno: "(41) 99949-0460", rg: "98.765.432-1 /PR", endereco: "RUA SANTA MÔNICA, 832 - CAPÃO RASO - CURITIBA / PR", telefoneResponsavel: "(41) 99949-0460", nomeResponsavel: "CARLOS DE ABREU", cpfResponsavel: "876.543.210-00"
  },
  "3": {
    id: 3, nome: "JULIA FERREIRA LIMA", cpf: "345.678.901-00", naturalidade: "RIO DE JANEIRO / RJ", dataIngresso: "05/03/2024", dataNascimento: "10/12/2005", telefoneAluno: "(21) 97777-3333", rg: "11.222.333-4 /RJ", endereco: "AV. BRASIL, 456 - COPACABANA - RIO DE JANEIRO / RJ", telefoneResponsavel: "(21) 97777-3333", nomeResponsavel: "JULIA FERREIRA LIMA", cpfResponsavel: "345.678.901-00"
  }
};

const historicoMatriculasInicial: HistoricoMatricula[] = [
  { id: 128, periodoLetivo: "BOOK 1 ADULTS / 12 QUI 19:00", unidade: "CWB IDIOMAS", turma: "BOOK 1 (IDIOMA) B1 ADULTS / 12 QUI 19:00", situacao: "CANCELADO" },
  { id: 145, periodoLetivo: "BOOK 2 ADULTS / 01 SEG 18:30", unidade: "CWB IDIOMAS", turma: "BOOK 2 (IDIOMA) B2 ADULTS / 01 SEG 18:30", situacao: "ATIVO" }
];

const ocorrenciasMockIniciais: Ocorrencia[] = [
  { id: 1, data: "2026-03-15", hora: "14:30", tipo: "Acadêmica", descricao: "Aluno chegou 30 minutos atrasado e perdeu a introdução da lição. Orientado a chegar no horário.", resolucao: "Conversa com o aluno ao final da aula.", aulaVinculada: "Lesson 3 - Simple Past", autor: "Prof. Marcos Silva" },
  { id: 2, data: "2026-02-20", hora: "09:00", tipo: "Administrativa", descricao: "Aluno solicitou renegociação da parcela de fevereiro por motivos de saúde.", resolucao: "Prazo estendido para dia 25/02 sem juros.", aulaVinculada: "—", autor: "Ana (Secretaria)" }
];

const documentosMockIniciais: Documento[] = [
  { id: 1, nome: "Contrato de Matrícula Assinado", tipo: "Contrato (PDF)", dataEnvio: "05/08/2024", tamanho: "2.4 MB", autor: "Ana (Secretaria)" },
  { id: 2, nome: "Print Confirmação Pagamento Fev", tipo: "Conversa WhatsApp (PNG)", dataEnvio: "20/02/2026", tamanho: "850 KB", autor: "Financeiro" }
];

const faltasMockIniciais: Falta[] = [
  { id: 1, data: "12/08/2024", book: "BOOK 1 ADULTS / 12 QUI 19:00", aula: "Lesson 2 - Verb To Be", justificada: true, motivo: "Aluno apresentou atestado médico de 2 dias por virose.", autorJustificativa: "Ana (Secretaria)", dataJustificativa: "14/08/2024" },
  { id: 2, data: "05/09/2024", book: "BOOK 1 ADULTS / 12 QUI 19:00", aula: "Lesson 6 - Daily Routine", justificada: false },
  { id: 3, data: "10/03/2026", book: "BOOK 2 ADULTS / 01 SEG 18:30", aula: "Lesson 4 - Past Continuous", justificada: false },
];

// ─── Componentes Auxiliares ───────────────────────────────────────────────────
function LabelValue({ label, value, whatsapp }: { label: string, value: string, whatsapp?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-900">{value || "—"}</span>
        {whatsapp && value && value !== "—" && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366" stroke="none">
            <path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.656.844 5.12 2.312 7.156L.657 24l5.03-1.625a11.93 11.93 0 0 0 6.344 1.782c6.646 0 12.03-5.385 12.03-12.031S18.677 0 12.031 0zm0 22.156a9.95 9.95 0 0 1-5.187-1.468l-.375-.219-3.75 1.188 1.218-3.625-.25-.375A9.957 9.957 0 0 1 2.062 12.03C2.062 6.53 6.53 2.062 12.03 2.062S22 6.53 22 12.03c0 5.5-4.469 9.968-9.969 9.968h-.002zm5.406-7.375c-.281-.156-1.75-.875-2.031-.968-.281-.094-.469-.156-.656.156-.188.281-.781.968-.969 1.156-.187.219-.375.219-.656.094-.281-.156-1.25-.469-2.375-1.469-.875-.781-1.469-1.75-1.625-2.031-.156-.281-.031-.437.094-.562.125-.125.281-.344.437-.531.156-.187.219-.312.312-.531.094-.219.063-.406 0-.531-.063-.125-.656-1.593-.875-2.187-.219-.562-.437-.469-.625-.469-.156 0-.344-.031-.531-.031-.188 0-.5.063-.781.375-.281.281-1.062 1.031-1.062 2.5s1.094 2.875 1.25 3.094c.156.219 2.125 3.187 5.125 4.469.719.312 1.281.5 1.719.656.719.219 1.375.187 1.875.094.594-.094 1.75-.719 2-1.406.25-.687.25-1.281.188-1.406-.063-.125-.25-.219-.531-.344z"/>
          </svg>
        )}
      </div>
    </div>
  );
}

// ─── Modais (Mantidos exatamente iguais) ──────────────────────────────────────
function ModalEditarHistorico({ matricula, onClose, onSave }: { matricula: HistoricoMatricula, onClose: () => void, onSave: (m: HistoricoMatricula) => void }) {
  const [form, setForm] = useState<HistoricoMatricula>(matricula);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <div><h2 className="text-base font-semibold text-zinc-900">Editar Histórico</h2><p className="text-xs text-zinc-500 mt-0.5">Matrícula #{matricula.id}</p></div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-zinc-700">Período Letivo</label><input type="text" value={form.periodoLetivo} onChange={(e) => setForm({ ...form, periodoLetivo: e.target.value })} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-zinc-700">Unidade</label><input type="text" value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-zinc-700">Turma</label><input type="text" value={form.turma} onChange={(e) => setForm({ ...form, turma: e.target.value })} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition" /></div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Situação</label>
            <select value={form.situacao} onChange={(e) => setForm({ ...form, situacao: e.target.value as any })} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition bg-white">
              <option value="ATIVO">ATIVO</option><option value="CANCELADO">CANCELADO</option><option value="CONCLUÍDO">CONCLUÍDO</option><option value="TRANCADO">TRANCADO</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200">
          <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">Cancelar</button>
          <button onClick={() => { onSave(form); onClose(); }} className="h-9 px-4 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors">Salvar Alterações</button>
        </div>
      </div>
    </div>
  );
}

function ModalOcorrencia({ ocorrencia, onClose, onSave }: { ocorrencia?: Ocorrencia | null, onClose: () => void, onSave: (o: Ocorrencia) => void }) {
  const [form, setForm] = useState<Ocorrencia>(
    ocorrencia || { id: Date.now(), data: new Date().toISOString().split('T')[0], hora: new Date().toTimeString().split(':')[0] + ":" + new Date().toTimeString().split(':')[1], tipo: "Acadêmica", descricao: "", resolucao: "", aulaVinculada: "", autor: "Você (Usuário Logado)" }
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[95vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <div><h2 className="text-base font-semibold text-zinc-900">{ocorrencia ? "Editar Ocorrência" : "Registrar Nova Ocorrência"}</h2><p className="text-xs text-zinc-500 mt-0.5">As ocorrências são permanentes e mantêm histórico de auditoria.</p></div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-zinc-700">Data *</label><input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-zinc-700">Hora *</label><input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition" /></div>
            <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1"><label className="text-sm font-medium text-zinc-700">Tipo *</label><select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as any })} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition bg-white"><option value="Acadêmica">Acadêmica</option><option value="Administrativa">Administrativa</option></select></div>
          </div>
          <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-zinc-700">Descrição da Ocorrência *</label><textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descreva o que aconteceu de forma clara e objetiva..." className="h-24 border border-zinc-300 rounded-lg p-3 text-sm outline-none focus:border-[#1F2A35] transition resize-none" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-zinc-700">Resolução / Encaminhamento (Opcional)</label><textarea value={form.resolucao} onChange={(e) => setForm({ ...form, resolucao: e.target.value })} placeholder="Qual medida foi adotada? Houve orientação?" className="h-20 border border-zinc-300 rounded-lg p-3 text-sm outline-none focus:border-[#1F2A35] transition resize-none" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-zinc-700">Aula Vinculada (Opcional)</label><select value={form.aulaVinculada} onChange={(e) => setForm({ ...form, aulaVinculada: e.target.value })} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition bg-white"><option value="">Nenhuma aula vinculada</option><option value="Lesson 1 - Introdução">Lesson 1 - Introdução</option><option value="Lesson 2 - Simple Present">Lesson 2 - Simple Present</option><option value="Lesson 3 - Simple Past">Lesson 3 - Simple Past</option></select></div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200">
          <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">Cancelar</button>
          <button disabled={!form.data || !form.hora || !form.descricao} onClick={() => { onSave(form); onClose(); }} className="h-9 px-4 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{ocorrencia ? "Salvar Alterações" : "Registrar Ocorrência"}</button>
        </div>
      </div>
    </div>
  );
}

function ModalAnexarDocumento({ onClose, onSave }: { onClose: () => void, onSave: (d: Documento) => void }) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  function handleSave() {
    if (!nome || !tipo || !arquivo) return;
    let tamanhoFmt = arquivo.size < 1024 * 1024 ? (arquivo.size / 1024).toFixed(1) + " KB" : (arquivo.size / (1024 * 1024)).toFixed(1) + " MB";
    onSave({ id: Date.now(), nome, tipo, dataEnvio: new Date().toLocaleDateString('pt-BR'), tamanho: tamanhoFmt, autor: "Você (Usuário Logado)" });
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <div><h2 className="text-base font-semibold text-zinc-900">Anexar Novo Documento</h2><p className="text-xs text-zinc-500 mt-0.5">Formatos suportados: PDF, JPG, PNG.</p></div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-zinc-700">Arquivo *</label><input type="file" accept=".pdf, image/png, image/jpeg" onChange={(e) => setArquivo(e.target.files?.[0] || null)} className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#1F2A35]/10 file:text-[#1F2A35] hover:file:bg-[#1F2A35]/20 transition-colors border border-zinc-300 rounded-lg p-1.5" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-zinc-700">Nome de Identificação *</label><input type="text" placeholder="Ex: Contrato Assinado 2026" value={nome} onChange={(e) => setNome(e.target.value)} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-zinc-700">Tipo de Documento *</label><select value={tipo} onChange={(e) => setTipo(e.target.value)} className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition bg-white"><option value="">Selecione...</option><option value="Contrato (PDF)">Contrato (PDF)</option><option value="Documento Pessoal">Documento Pessoal (RG, CPF)</option><option value="Comprovante de Endereço">Comprovante de Endereço</option><option value="Conversa WhatsApp">Conversa WhatsApp (Print)</option><option value="Outros">Outros</option></select></div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200">
          <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">Cancelar</button>
          <button disabled={!nome || !tipo || !arquivo} onClick={() => { handleSave(); onClose(); }} className="h-9 px-4 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Fazer Upload</button>
        </div>
      </div>
    </div>
  );
}

function ModalJustificativaFalta({ falta, onClose, onSave }: { falta: Falta, onClose: () => void, onSave: (id: number, motivo: string) => void }) {
  const [motivo, setMotivo] = useState(falta.motivo || "");
  const isJustificada = falta.justificada;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <div><h2 className="text-base font-semibold text-zinc-900">{isJustificada ? "Detalhes da Justificativa" : "Justificar Falta"}</h2><p className="text-xs text-zinc-500 mt-0.5">Aula: {falta.aula} - Data: {falta.data}</p></div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          {isJustificada ? (
            <div className="flex flex-col gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4"><span className="text-xs font-semibold text-green-700 uppercase tracking-wide block mb-2">Motivo da Falta</span><p className="text-sm text-zinc-800 leading-relaxed">{falta.motivo}</p></div>
              <div className="flex flex-col gap-1 mt-2"><span className="text-[10px] text-zinc-400 uppercase font-semibold">Justificado por:</span><span className="text-sm font-medium text-zinc-700">{falta.autorJustificativa} em {falta.dataJustificativa}</span></div>
            </div>
          ) : (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">Ao justificar esta falta, ela não será mais contabilizada no limite de reprovação por faltas do aluno nesta etapa.</div>
              <div className="flex flex-col gap-1.5 mt-2"><label className="text-sm font-medium text-zinc-700">Motivo / Observação *</label><textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex: Atestado médico anexado, problemas familiares..." className="h-28 border border-zinc-300 rounded-lg p-3 text-sm outline-none focus:border-[#1F2A35] transition resize-none" /></div>
              <div className="flex flex-col gap-1.5 mt-2"><label className="text-sm font-medium text-zinc-700">Anexar Comprovante (Opcional)</label><input type="file" className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 transition-colors border border-zinc-300 rounded-lg p-1.5"/></div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200">
          <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">{isJustificada ? "Fechar" : "Cancelar"}</button>
          {!isJustificada && (<button disabled={!motivo.trim()} onClick={() => { onSave(falta.id, motivo); onClose(); }} className="h-9 px-4 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Salvar Justificativa</button>)}
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function PerfilAlunoPage() {
  // Puxar o ID da URL via params!
  const params = useParams();
  const alunoId = params.id as string;
  
  // Localizar no Mock
  const alunoSelecionado = bancoDeAlunosMock[alunoId] || {
    id: "N/A", nome: "Aluno Não Encontrado", cpf: "—", naturalidade: "—", dataIngresso: "—", dataNascimento: "—", telefoneAluno: "—", rg: "—", endereco: "—", telefoneResponsavel: "—", nomeResponsavel: "—", cpfResponsavel: "—"
  };

  const [abaAtual, setAbaAtual] = useState("Histórico escolar"); 
  
  // States
  const [historico, setHistorico] = useState<HistoricoMatricula[]>(historicoMatriculasInicial);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>(ocorrenciasMockIniciais);
  const [documentos, setDocumentos] = useState<Documento[]>(documentosMockIniciais);
  const [faltas, setFaltas] = useState<Falta[]>(faltasMockIniciais);
  
  // Modal Control
  const [matriculaEditando, setMatriculaEditando] = useState<HistoricoMatricula | null>(null);
  const [ocorrenciaModal, setOcorrenciaModal] = useState<{ isOpen: boolean, oco: Ocorrencia | null }>({ isOpen: false, oco: null });
  const [documentoModalAberto, setDocumentoModalAberto] = useState(false);
  const [faltaModalAberto, setFaltaModalAberto] = useState<Falta | null>(null);

  const abas = [
    "Histórico escolar",
    "Ocorrências",
    "Gestão de documentos",
    "Faltas justificadas"
  ];

  function salvarEdicaoHistorico(dadosEditados: HistoricoMatricula) {
    setHistorico(prev => prev.map(m => m.id === dadosEditados.id ? dadosEditados : m));
  }

  function salvarOcorrencia(dadosOcorrencia: Ocorrencia) {
    if (ocorrencias.find(o => o.id === dadosOcorrencia.id)) {
      setOcorrencias(prev => prev.map(o => o.id === dadosOcorrencia.id ? dadosOcorrencia : o));
    } else {
      setOcorrencias(prev => [dadosOcorrencia, ...prev]);
    }
  }

  function salvarDocumento(novoDoc: Documento) {
    setDocumentos(prev => [novoDoc, ...prev]);
  }

  function deletarDocumento(id: number) {
    if(confirm("Tem certeza que deseja excluir este documento permanentemente?")) {
      setDocumentos(prev => prev.filter(d => d.id !== id));
    }
  }

  function justificarFalta(id: number, motivo: string) {
    setFaltas(prev => prev.map(f => {
      if (f.id === id) {
        return { 
          ...f, 
          justificada: true, 
          motivo: motivo,
          autorJustificativa: "Você (Usuário Logado)",
          dataJustificativa: new Date().toLocaleDateString('pt-BR')
        };
      }
      return f;
    }));
  }

  function formatDate(isoDate: string) {
    if(!isoDate) return "—";
    if (isoDate.includes('/')) return isoDate; 
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  }

  const livrosComFaltas = Array.from(new Set(faltas.map(f => f.book)));

  return (
    <>
      <div className="flex flex-col gap-6">

        {/* Voltar e Título */}
        <div>
          <Link href="/secretaria" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors w-fit mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Voltar para Secretaria
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-zinc-900">Perfil do Aluno</h1>
            {alunoSelecionado.id !== "N/A" && (
               <span className="text-sm text-zinc-500 bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm">ID: {alunoSelecionado.id}</span>
            )}
          </div>
        </div>

        {/* ─── CARD: INFORMAÇÕES GERAIS (COM DADOS DINÂMICOS) ─── */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-zinc-50 border-b border-zinc-200 px-5 py-3">
            <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">Informações Gerais</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
            <LabelValue label="Nome" value={alunoSelecionado.nome} />
            <LabelValue label="CPF" value={alunoSelecionado.cpf} />
            <div className="hidden lg:block"></div> 

            <LabelValue label="Naturalidade" value={alunoSelecionado.naturalidade} />
            <LabelValue label="Data de ingresso" value={alunoSelecionado.dataIngresso} />
            <div className="hidden lg:block"></div>

            <LabelValue label="Telefone(s) do aluno" value={alunoSelecionado.telefoneAluno !== "—" ? `CELULAR: ${alunoSelecionado.telefoneAluno} [OUTRA]` : "—"} whatsapp />
            <LabelValue label="Data de nascimento" value={alunoSelecionado.dataNascimento} />
            <div className="hidden lg:block"></div>

            <LabelValue label="RG" value={alunoSelecionado.rg} />
            <div className="col-span-1 md:col-span-2">
              <LabelValue label="Endereço do aluno" value={alunoSelecionado.endereco} />
            </div>

            <LabelValue label="Telefone(s) do responsável" value={alunoSelecionado.telefoneResponsavel !== "—" ? `CELULAR: ${alunoSelecionado.telefoneResponsavel} [OUTRA]` : "—"} whatsapp />
            <div className="col-span-1 md:col-span-2"></div>

            <LabelValue label="Responsável" value={alunoSelecionado.nomeResponsavel} />
            <LabelValue label="Responsável | CPF" value={alunoSelecionado.cpfResponsavel} />
          </div>
        </div>

        {/* ─── BARRA DE ABAS ─── */}
        <div className="flex flex-wrap gap-2 border-b border-zinc-200">
          {abas.map((aba) => (
            <button 
              key={aba} 
              onClick={() => setAbaAtual(aba)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                abaAtual === aba 
                  ? "border-[#1F2A35] text-[#1F2A35]" 
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {aba}
            </button>
          ))}
        </div>

        {/* ─── CONTEÚDO DAS ABAS ─── */}
        
        {/* ABA: Histórico Escolar */}
        {abaAtual === "Histórico escolar" && (
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-zinc-50 border-b border-zinc-200 px-5 py-4">
              <h3 className="text-sm font-bold text-zinc-800">Histórico de matrículas</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white border-b border-zinc-200">
                    <th className="text-left px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Matrícula</th>
                    <th className="text-left px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Período Letivo</th>
                    <th className="text-left px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Unidade</th>
                    <th className="text-left px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Turma</th>
                    <th className="text-left px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Situação</th>
                    <th className="text-center px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Opções</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((mat, i) => (
                    <tr key={mat.id} className={`border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${i === historico.length - 1 ? "border-b-0" : ""}`}>
                      <td className="px-5 py-3 text-zinc-600">{mat.id}</td>
                      <td className="px-5 py-3 font-medium text-zinc-800">{mat.periodoLetivo}</td>
                      <td className="px-5 py-3 text-zinc-600">{mat.unidade}</td>
                      <td className="px-5 py-3 text-zinc-600">{mat.turma}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-bold ${mat.situacao === 'ATIVO' ? 'text-green-600' : 'text-zinc-500'}`}>
                          {mat.situacao}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setMatriculaEditando(mat)} className="w-8 h-8 flex items-center justify-center rounded border border-zinc-200 hover:bg-zinc-100 text-zinc-500 transition-colors" title="Editar">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button className="w-8 h-8 flex items-center justify-center rounded border border-zinc-200 hover:bg-zinc-100 text-blue-600 transition-colors" title="Ver Diário">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA: Ocorrências */}
        {abaAtual === "Ocorrências" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-zinc-800">Ocorrências Registradas</h3>
              <button onClick={() => setOcorrenciaModal({ isOpen: true, oco: null })} className="flex items-center gap-2 h-9 px-4 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nova ocorrência
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {ocorrencias.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center text-zinc-500">Nenhuma ocorrência registrada.</div>
              ) : (
                ocorrencias.map((oco) => (
                  <div key={oco.id} className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-4 md:gap-8 relative">
                    <button onClick={() => setOcorrenciaModal({ isOpen: true, oco: oco })} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded border border-zinc-200 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-700 transition-colors" title="Editar ocorrência">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <div className="min-w-[150px] shrink-0 border-l-4 pl-3 py-1 flex flex-col justify-center border-blue-500">
                      <span className="text-sm font-bold text-zinc-900">{formatDate(oco.data)}</span>
                      <span className="text-xs text-zinc-500 mt-0.5">{oco.hora}</span>
                      <span className={`mt-2 mb-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide w-fit ${oco.tipo === 'Acadêmica' ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'}`}>{oco.tipo}</span>
                      <span className="text-[10px] text-zinc-400 mt-1 uppercase font-semibold">Registrado por:</span>
                      <span className="text-xs font-medium text-zinc-700">{oco.autor}</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-3 pt-1">
                      <div><span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1">Descrição</span><p className="text-sm text-zinc-800 leading-relaxed">{oco.descricao}</p></div>
                      {oco.resolucao && (<div className="bg-zinc-50 rounded p-3 border border-zinc-100"><span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1">Resolução Adotada</span><p className="text-sm text-zinc-700">{oco.resolucao}</p></div>)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ABA: Gestão de Documentos */}
        {abaAtual === "Gestão de documentos" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-zinc-800">Documentos Anexados</h3>
              <button onClick={() => setDocumentoModalAberto(true)} className="flex items-center gap-2 h-9 px-4 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Anexar documento
              </button>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="text-left px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Nome do Arquivo</th>
                    <th className="text-left px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Tipo</th>
                    <th className="text-left px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Tamanho</th>
                    <th className="text-left px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Enviado em</th>
                    <th className="text-left px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Autor</th>
                    <th className="text-center px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {documentos.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-zinc-400">Nenhum documento anexado.</td></tr>
                  ) : (
                    documentos.map((doc, i) => (
                      <tr key={doc.id} className={`border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${i === documentos.length - 1 ? "border-b-0" : ""}`}>
                        <td className="px-5 py-3 font-medium text-zinc-800 flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                          {doc.nome}
                        </td>
                        <td className="px-5 py-3 text-zinc-600">{doc.tipo}</td>
                        <td className="px-5 py-3 text-zinc-600">{doc.tamanho}</td>
                        <td className="px-5 py-3 text-zinc-600">{doc.dataEnvio}</td>
                        <td className="px-5 py-3 text-zinc-600">{doc.autor}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button className="w-8 h-8 flex items-center justify-center rounded border border-zinc-200 hover:bg-blue-50 text-blue-600 transition-colors" title="Baixar Arquivo"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
                            <button onClick={() => deletarDocumento(doc.id)} className="w-8 h-8 flex items-center justify-center rounded border border-zinc-200 hover:bg-red-50 text-red-600 transition-colors" title="Excluir Arquivo"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
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

        {/* ABA: Faltas Justificadas */}
        {abaAtual === "Faltas justificadas" && (
          <div className="flex flex-col gap-6">
            <h3 className="text-lg font-medium text-zinc-800">Faltas por Período Letivo</h3>
            {faltas.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center text-zinc-500">O aluno não possui nenhuma falta registrada no sistema.</div>
            ) : (
              livrosComFaltas.map((livro) => {
                const faltasDoLivro = faltas.filter(f => f.book === livro);
                return (
                  <div key={livro} className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-zinc-50 border-b border-zinc-200 px-5 py-3">
                      <h4 className="text-sm font-bold text-[#1F2A35]">{livro}</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-200">
                            <th className="text-left px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs w-32">Data da Falta</th>
                            <th className="text-left px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs">Aula / Lição</th>
                            <th className="text-left px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs w-48">Status</th>
                            <th className="text-right px-5 py-3 font-bold text-zinc-500 uppercase tracking-wide text-xs w-44">Ação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {faltasDoLivro.map((falta, index) => (
                            <tr key={falta.id} className={`hover:bg-zinc-50 transition-colors ${index === faltasDoLivro.length - 1 ? "" : "border-b border-zinc-100"}`}>
                              <td className="px-5 py-4 font-medium text-zinc-800">{formatDate(falta.data)}</td>
                              <td className="px-5 py-4 text-zinc-600">{falta.aula}</td>
                              <td className="px-5 py-4">
                                {falta.justificada ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-green-50 text-green-700 border border-green-200"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> JUSTIFICADA</span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-50 text-red-600 border border-red-200"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> NÃO JUSTIFICADA</span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <button onClick={() => setFaltaModalAberto(falta)} className={`h-8 px-3 text-xs font-medium rounded-lg transition-colors border ${falta.justificada ? "text-zinc-600 border-zinc-300 hover:bg-zinc-100" : "text-white bg-[#1F2A35] border-[#1F2A35] hover:bg-[#2d3d4d]"}`}>{falta.justificada ? "Ver Justificativa" : "Justificar"}</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>

      {/* Render dos Modais */}
      {matriculaEditando && (
        <ModalEditarHistorico matricula={matriculaEditando} onClose={() => setMatriculaEditando(null)} onSave={salvarEdicaoHistorico} />
      )}

      {ocorrenciaModal.isOpen && (
        <ModalOcorrencia ocorrencia={ocorrenciaModal.oco} onClose={() => setOcorrenciaModal({ isOpen: false, oco: null })} onSave={salvarOcorrencia} />
      )}

      {documentoModalAberto && (
        <ModalAnexarDocumento onClose={() => setDocumentoModalAberto(false)} onSave={salvarDocumento} />
      )}

      {faltaModalAberto && (
        <ModalJustificativaFalta falta={faltaModalAberto} onClose={() => setFaltaModalAberto(null)} onSave={justificarFalta} />
      )}
    </>
  );
}