"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type StatusParcela = "recebida" | "vencida" | "aberta" | "estornada";

interface Parcela {
  id: number;
  op: number;
  tipo: string;
  responsavel: string;
  vencimento: string;
  competencia: string;
  vlrTitulo: number;
  vlrPago: number | null;
  vlrDevido: number | null;
  status: StatusParcela;
}

// ─── Mock ─────────────────────────────────────────────────────────────────────
const alunoInfo = {
  nome: "RONALD XAVIER DE ABREU",
  cpf: "123.456.789-00",
  dataIngresso: "01/02/2023",
  dataTerminoBook: "02/05/2024",
  professor: "Narjara Gomes",
  bookAtual: "Book 1",
  turma: "BOOK 1 (IDIOMA) B1 KIDS / 01 SEG 14:00"
};

const escolaInfo = {
  nome: "LEARLY IDIOMAS",
  cnpj: "12.345.678/0001-90",
  cidade: "São Paulo - SP"
};

const parcelasMockIniciais: Parcela[] = [
  { id: 1, op: 9682, tipo: "MATERIAL - BOOK 1", responsavel: "FRANCIELI FERNANDES XAVIER", vencimento: "10/08/2024", competencia: "07/2024", vlrTitulo: 50, vlrPago: 50, vlrDevido: null, status: "recebida" },
  { id: 2, op: 9683, tipo: "MENSALIDADE",       responsavel: "FRANCIELI FERNANDES XAVIER", vencimento: "10/08/2024", competencia: "07/2024", vlrTitulo: 270, vlrPago: 270, vlrDevido: null, status: "recebida" },
  { id: 3, op: 9684, tipo: "MENSALIDADE",       responsavel: "FRANCIELI FERNANDES XAVIER", vencimento: "10/09/2024", competencia: "08/2024", vlrTitulo: 270, vlrPago: 270, vlrDevido: null, status: "recebida" },
  { id: 4, op: 9685, tipo: "MENSALIDADE",       responsavel: "FRANCIELI FERNANDES XAVIER", vencimento: "10/10/2024", competencia: "09/2024", vlrTitulo: 270, vlrPago: null, vlrDevido: 275.50, status: "vencida" },
  { id: 5, op: 9686, tipo: "MENSALIDADE",       responsavel: "FRANCIELI FERNANDES XAVIER", vencimento: "10/11/2024", competencia: "10/2024", vlrTitulo: 270, vlrPago: null, vlrDevido: 270, status: "aberta" },
];

const corLinha: Record<StatusParcela, string> = {
  recebida:  "bg-green-50/70 border-green-100 hover:bg-green-100/60",
  vencida:   "bg-red-50/70 border-red-100 hover:bg-red-100/60",
  aberta:    "bg-white hover:bg-zinc-50",
  estornada: "bg-zinc-100 text-zinc-500 hover:bg-zinc-200/60",
};

function fmt(v: number | null) {
  if (v === null || v === 0) return "—";
  return v.toFixed(2).replace(".", ",");
}

// ─── Modal Nova Parcela ───────────────────────────────────────────────────────
function ModalNovaParcela({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-base font-semibold text-zinc-900">Incluir novo parcelamento</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="bg-zinc-50 border-b border-zinc-200 px-6 py-3 flex gap-8 text-sm">
          <div><span className="text-zinc-500 block text-xs font-semibold uppercase">Aluno(a)</span><span className="font-medium text-zinc-900">{alunoInfo.nome}</span></div>
          <div><span className="text-zinc-500 block text-xs font-semibold uppercase">Turma</span><span className="font-medium text-zinc-900">{alunoInfo.turma}</span></div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Incluir novo item no parcelamento *</label>
              <select className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition bg-white">
                <option value="">Selecione o item</option><option>MENSALIDADE</option><option>MATERIAL - BOOK 1</option><option>TAXA DE MATRÍCULA</option><option>OUTROS</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Forma de pagamento *</label>
              <select className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition bg-white">
                <option>CARNÊ ESCOLAR</option><option>BOLETO BANCÁRIO</option><option>CARTÃO DE CRÉDITO</option><option>PIX</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-zinc-700">Quantidade</label><select className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition bg-white"><option>01 PARCELA</option><option>06 PARCELAS</option><option>12 PARCELAS</option></select></div>
            <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-zinc-700">Repetição</label><select className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition bg-white"><option>A CADA 1 MÊS</option><option>ÚNICA</option></select></div>
            <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-zinc-700">Modo</label><select className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition bg-white"><option>EM UM DIA EXATO DO MÊS</option></select></div>
          </div>
          <div className="border-t border-zinc-100 my-1" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-zinc-700">1º Vencimento *</label><input type="date" className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-zinc-700">Mês compet.</label><input type="text" placeholder="MM/AAAA" className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-zinc-700">Valor orig. (R$)</label><input type="text" placeholder="0,00" className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-zinc-700">% Desconto</label><input type="text" placeholder="0.00" className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-zinc-700">Valor c/ desc.</label><input type="text" placeholder="0,00" className="h-10 border border-zinc-300 rounded-lg px-3 text-sm font-semibold text-[#1F2A35] bg-zinc-50 outline-none" readOnly /></div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200">
          <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">Cancelar</button>
          <button className="h-9 px-4 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">Gerar Parcelas</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Dar Baixa ──────────────────────────────────────────────────────────
function ModalDarBaixa({ parcelas, idsSelecionados, onClose, onConfirmar }: { parcelas: Parcela[], idsSelecionados: number[], onClose: () => void, onConfirmar: (dados: any) => void }) {
  const parcelasAtivas = parcelas.filter(p => idsSelecionados.includes(p.id));

  const [dadosBaixa, setDadosBaixa] = useState(() => {
    const initialState: Record<number, { data: string, valor: number, forma: string, conta: string }> = {};
    const hoje = new Date().toISOString().split('T')[0];
    parcelasAtivas.forEach(p => {
      initialState[p.id] = { data: hoje, valor: p.vlrDevido !== null ? p.vlrDevido : p.vlrTitulo, forma: "", conta: "" };
    });
    return initialState;
  });

  function atualizarDado(id: number, field: "data" | "valor" | "forma" | "conta", value: string | number) {
    setDadosBaixa(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  const totalRecebido = Object.values(dadosBaixa).reduce((acc, curr) => acc + (isNaN(curr.valor) ? 0 : curr.valor), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Baixar Parcela(s)</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Preencha os dados de recebimento individualmente</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center sticky top-0 z-10 shadow-sm flex items-center justify-between px-8">
            <div className="text-left">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Valor Total a Receber</p>
              <p className="text-3xl font-bold text-blue-700">R$ {fmt(totalRecebido)}</p>
            </div>
            <div className="text-left text-xs text-blue-600/80 max-w-[200px]">
              * Se o valor recebido for menor que o valor em aberto, o sistema fará uma <strong>Baixa Parcial</strong>.
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {parcelasAtivas.map(p => {
              const valorInformado = dadosBaixa[p.id].valor;
              const valorDevidoReal = p.vlrDevido !== null ? p.vlrDevido : p.vlrTitulo;
              const isParcial = valorInformado > 0 && valorInformado < valorDevidoReal;

              return (
                <div key={p.id} className="border border-zinc-200 rounded-lg p-4 flex flex-col gap-3 bg-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-zinc-900 text-sm">{p.tipo}</p>
                        {isParcial && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">BAIXA PARCIAL</span>}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">Vencimento: {p.vencimento} • Op: {p.op}</p>
                    </div>
                    <span className="text-xs font-bold text-zinc-700 bg-zinc-100 px-2 py-1 rounded border border-zinc-200">
                      Aberto: R$ {fmt(valorDevidoReal)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-100">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-zinc-700">Data de Pagamento *</label>
                      <input type="date" value={dadosBaixa[p.id].data} onChange={e => atualizarDado(p.id, "data", e.target.value)} className="h-9 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-zinc-700">Valor Recebido (R$) *</label>
                      <input type="number" step="0.01" value={dadosBaixa[p.id].valor} onChange={e => atualizarDado(p.id, "valor", parseFloat(e.target.value) || 0)} className="h-9 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition font-medium" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-zinc-700">Forma de Pagamento *</label>
                      <select value={dadosBaixa[p.id].forma} onChange={e => atualizarDado(p.id, "forma", e.target.value)} className="h-9 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition bg-white">
                        <option value="">Selecione...</option><option value="pix">PIX</option><option value="boleto">Boleto Bancário</option><option value="dinheiro">Dinheiro</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-zinc-700">Conta (Destino) *</label>
                      <select value={dadosBaixa[p.id].conta} onChange={e => atualizarDado(p.id, "conta", e.target.value)} className="h-9 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition bg-white">
                        <option value="">Selecione...</option><option value="stone">Stone</option><option value="caixa">Caixa Econômica</option><option value="caixa_fisico">Caixa Físico</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200 bg-white">
          <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">Cancelar</button>
          <button onClick={() => onConfirmar(dadosBaixa)} className="h-9 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">Confirmar Baixa</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Editar Valores ─────────────────────────────────────────────────────
function ModalEditarValores({ parcela, onClose, onSave }: { parcela: Parcela, onClose: () => void, onSave: (p: Parcela) => void }) {
  const [vlrTitulo, setVlrTitulo] = useState(parcela.vlrTitulo);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-base font-semibold text-zinc-900">Editar Parcela #{parcela.op}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Valor do Título (R$)</label>
            <input 
              type="number" step="0.01" 
              value={vlrTitulo} 
              onChange={e => setVlrTitulo(parseFloat(e.target.value) || 0)} 
              className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] transition" 
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200">
          <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">Cancelar</button>
          <button onClick={() => { onSave({ ...parcela, vlrTitulo }); onClose(); }} className="h-9 px-4 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors">Salvar Alterações</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Recibo ─────────────────────────────────────────────────────────────
function ModalRecibo({ parcela, onClose }: { parcela: Parcela, onClose: () => void }) {
  // Num sistema real, usaríamos uma biblioteca como 'numero-por-extenso'
  const valorTexto = "duzentos e setenta reais"; 
  const dataAtual = new Date().toLocaleDateString('pt-BR');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 print:bg-white print:items-start">
      
      {/* Botão flutuante para fechar */}
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 shadow-md print:hidden">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      {/* Container do Recibo */}
      <div className="bg-white rounded-lg shadow-xl print:shadow-none w-full max-w-3xl mx-4 print:mx-0 flex flex-col p-10 border border-zinc-300 print:border-none">
        
        {/* Cabeçalho do Recibo */}
        <div className="flex items-center justify-between mb-8 border-b-2 border-zinc-200 pb-5">
          <h1 className="text-2xl font-bold text-zinc-900 tracking-wide">RECIBO DE PAGAMENTO</h1>
          <div className="border-2 border-zinc-800 rounded px-4 py-2 text-xl font-bold text-zinc-900">
            R$ {fmt(parcela.vlrPago)}
          </div>
        </div>

        {/* Corpo do Recibo */}
        <div className="text-[17px] font-[Georgia,serif] leading-relaxed text-zinc-800 space-y-6">
          <p>
            Recebi(emos) de <span className="font-bold uppercase">{parcela.responsavel}</span>, inscrito(a) no CPF/CNPJ sob o nº <span className="font-bold">{alunoInfo.cpf}</span> a importância de <span className="font-bold">R$ {fmt(parcela.vlrPago)}</span> ({valorTexto}), referente à {parcela.tipo}.
          </p>

          <div className="space-y-1">
            <p className="m-0"><span className="font-bold">Forma de Pagamento:</span> Dinheiro</p>
            <p className="m-0"><span className="font-bold">Mês de Competência:</span> {parcela.competencia}</p>
            <p className="m-0"><span className="font-bold">Data de Vencimento:</span> {parcela.vencimento}</p>
          </div>

          <p className="text-zinc-600 text-sm pt-4 italic">
            Para maior clareza, firmo(amos) o presente recibo, que comprova o recebimento integral do valor mencionado, concedendo quitação plena, geral e irrevogável pela quantia recebida.
          </p>
        </div>

        {/* Rodapé e Assinatura */}
        <div className="mt-16 flex flex-col items-end text-sm text-zinc-800 font-[Georgia,serif]">
          <p className="mb-12 text-base">{escolaInfo.cidade}, {dataAtual}</p>
          
          <div className="flex flex-col items-center w-72 text-center font-sans">
            <div className="w-full border-b border-zinc-800 mb-2"></div>
            <p className="font-bold uppercase text-base">{escolaInfo.nome}</p>
            <p className="text-xs text-zinc-500 mt-1">CPF/CNPJ: {escolaInfo.cnpj}</p>
          </div>
        </div>

        {/* Botão de Imprimir */}
        <div className="mt-10 flex justify-center print:hidden">
          <button onClick={() => window.print()} className="h-10 px-6 font-medium text-zinc-800 border-2 border-zinc-800 rounded hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2 uppercase text-sm tracking-wider">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Imprimir Recibo
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Menu Três Pontinhos ──────────────────────────────────────────────────────
interface MenuOpcoesProps {
  parcela: Parcela;
  onBaixar: (id: number) => void;
  onEditar: (p: Parcela) => void;
  onRecibo: (p: Parcela) => void;
  onEstornar: (id: number) => void;
}

function MenuOpcoesParcela({ parcela, onBaixar, onEditar, onRecibo, onEstornar }: MenuOpcoesProps) {
  const [aberto, setAberto] = useState(false);
  const isPaga = parcela.status === "recebida";

  return (
    <div className="relative">
      <button onClick={() => setAberto(!aberto)}
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-200 transition-colors text-zinc-500 mx-auto relative z-10">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
      </button>
      
      {aberto && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setAberto(false)} />
          
          <div className="absolute right-0 top-8 z-40 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 w-44">
            
            {!isPaga && (
              <button onClick={() => { onBaixar(parcela.id); setAberto(false); }} className="w-full text-left px-4 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50">
                Baixar Parcela
              </button>
            )}
            
            <button onClick={() => { onEditar(parcela); setAberto(false); }} className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
              Editar Valores
            </button>
            
            {isPaga && (
              <button onClick={() => { onRecibo(parcela); setAberto(false); }} className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                Recibo de Pagamento
              </button>
            )}
            
            <div className="border-t border-zinc-100 my-1" />
            
            <button onClick={() => { onEstornar(parcela.id); setAberto(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              Inativar / Estornar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function FinanceiroAlunoPage() {
  const [parcelas, setParcelas] = useState<Parcela[]>(parcelasMockIniciais);
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  
  // Modais State
  const [modalNovaParcela, setModalNovaParcela] = useState(false);
  const [modalBaixa, setModalBaixa] = useState<{ aberto: boolean, ids: number[] }>({ aberto: false, ids: [] });
  const [parcelaEmEdicao, setParcelaEmEdicao] = useState<Parcela | null>(null);
  const [parcelaParaRecibo, setParcelaParaRecibo] = useState<Parcela | null>(null);

  const parcelasPagaveis = parcelas.filter(p => p.status !== "recebida" && p.status !== "estornada");

  function toggleSelecionada(id: number) {
    setSelecionadas((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  }

  function toggleTodas() {
    if (selecionadas.length === parcelasPagaveis.length && parcelasPagaveis.length > 0) {
      setSelecionadas([]);
    } else {
      setSelecionadas(parcelasPagaveis.map(p => p.id));
    }
  }

  // Ações chamadas pelo Menu
  function abrirBaixaMassa() {
    if (selecionadas.length === 0) return;
    setModalBaixa({ aberto: true, ids: selecionadas });
  }

  function abrirBaixaIndividual(id: number) {
    setModalBaixa({ aberto: true, ids: [id] });
  }

  function estornarParcela(id: number) {
    if(confirm("Tem certeza que deseja estornar/inativar esta parcela?")) {
      setParcelas(prev => prev.map(p => p.id === id ? { ...p, status: "estornada", vlrDevido: null, vlrPago: null } : p));
    }
  }

  function salvarEdicaoParcela(parcelaEditada: Parcela) {
    setParcelas(prev => prev.map(p => p.id === parcelaEditada.id ? parcelaEditada : p));
  }

  function processarBaixa(dadosBaixa: Record<number, { data: string, valor: number, forma: string, conta: string }>) {
    setParcelas(prev => prev.map(p => {
      if (dadosBaixa[p.id]) {
        const recebidoAgora = dadosBaixa[p.id].valor;
        const pagoAtual = p.vlrPago || 0;
        const novoPago = pagoAtual + recebidoAgora;
        const novoDevido = p.vlrTitulo - novoPago;

        let novoStatus = p.status;
        if (novoDevido <= 0) {
          novoStatus = "recebida";
        }

        return {
          ...p,
          vlrPago: novoPago,
          vlrDevido: novoDevido > 0 ? novoDevido : null,
          status: novoStatus
        };
      }
      return p;
    }));
    
    setSelecionadas([]);
    setModalBaixa({ aberto: false, ids: [] });
  }

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
            <h1 className="text-xl font-semibold text-zinc-900">Financeiro Individual do Aluno</h1>
            <div className="flex gap-2">
              {selecionadas.length > 0 && (
                <button onClick={abrirBaixaMassa} className="flex items-center gap-1.5 h-9 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  Baixar {selecionadas.length} selecionada(s)
                </button>
              )}
              <button onClick={() => setModalNovaParcela(true)} className="flex items-center gap-2 h-9 px-4 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nova parcela
              </button>
            </div>
          </div>
        </div>

        {/* Card Resumo do Aluno */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#1F2A35] flex items-center justify-center text-white text-lg font-semibold shrink-0">
              {alunoInfo.nome.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-zinc-900 leading-tight">{alunoInfo.nome}</p>
              <p className="text-sm text-zinc-500 mt-0.5">Turma: {alunoInfo.turma}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-8 text-sm">
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Data Ingresso</p>
              <p className="font-semibold text-zinc-800 mt-1">{alunoInfo.dataIngresso}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Termino Book</p>
              <p className="font-semibold text-zinc-800 mt-1">{alunoInfo.dataTerminoBook}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Professor Atual</p>
              <p className="font-semibold text-zinc-800 mt-1">{alunoInfo.professor}</p>
            </div>
          </div>
        </div>

        {/* Tabela de Parcelas do Aluno */}
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-zinc-200 rounded-xl overflow-x-auto shadow-sm pb-10">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-200">
                  <th className="px-4 py-3 w-10 text-center">
                    <input 
                      type="checkbox" 
                      disabled={parcelasPagaveis.length === 0}
                      checked={selecionadas.length > 0 && selecionadas.length === parcelasPagaveis.length} 
                      onChange={toggleTodas}
                      className="w-4 h-4 rounded border-zinc-300 accent-blue-600 disabled:opacity-40 disabled:cursor-not-allowed" 
                    />
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">Op.</th>
                  <th className="text-left px-3 py-3 font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">Tipo</th>
                  <th className="text-left px-3 py-3 font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">Venc.</th>
                  <th className="text-left px-3 py-3 font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">Compet.</th>
                  <th className="text-left px-3 py-3 font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">Vlr. Tít.</th>
                  <th className="text-left px-3 py-3 font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">Vlr. Pago</th>
                  <th className="text-left px-3 py-3 font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">Vlr. Dev.</th>
                  <th className="text-center px-3 py-3 font-semibold text-zinc-500 uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody>
                {parcelas.map((p, i) => {
                  const isBloqueada = p.status === "recebida" || p.status === "estornada";
                  
                  return (
                    <tr key={p.id} className={`border-b ${corLinha[p.status]} transition-colors ${i === parcelas.length - 1 ? "border-b-0" : ""}`}>
                      <td className="px-4 py-3 text-center">
                        <input 
                          type="checkbox" 
                          disabled={isBloqueada}
                          checked={selecionadas.includes(p.id)} 
                          onChange={() => toggleSelecionada(p.id)}
                          className="w-4 h-4 rounded border-zinc-300 accent-blue-600 disabled:opacity-40 disabled:cursor-not-allowed" 
                        />
                      </td>
                      <td className="px-3 py-3 font-medium text-zinc-700">{p.op}</td>
                      <td className="px-3 py-3 font-medium text-zinc-800">{p.tipo}</td>
                      <td className="px-3 py-3 text-zinc-600 font-medium">{p.vencimento}</td>
                      <td className="px-3 py-3 text-zinc-600">{p.competencia}</td>
                      <td className="px-3 py-3 font-medium text-zinc-800">R$ {fmt(p.vlrTitulo)}</td>
                      <td className="px-3 py-3 font-medium text-green-700">{p.vlrPago ? `R$ ${fmt(p.vlrPago)}` : "—"}</td>
                      <td className={`px-3 py-3 font-bold ${p.vlrDevido ? "text-red-600" : "text-zinc-400"}`}>
                        {p.vlrDevido ? `R$ ${fmt(p.vlrDevido)}` : "—"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <MenuOpcoesParcela 
                          parcela={p} 
                          onBaixar={abrirBaixaIndividual} 
                          onEditar={setParcelaEmEdicao} 
                          onRecibo={setParcelaParaRecibo} 
                          onEstornar={estornarParcela} 
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Legenda de Status */}
          <div className="flex flex-wrap gap-5 text-xs text-zinc-500 bg-white border border-zinc-200 rounded-lg p-3 w-fit">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-200 border border-green-400" /> Paga / Recebida
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-200 border border-red-400" /> Vencida em Atraso
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-white border border-zinc-300" /> Aberta (No prazo)
            </span>
          </div>
        </div>
      </div>

      {modalNovaParcela && <ModalNovaParcela onClose={() => setModalNovaParcela(false)} />}
      
      {modalBaixa.aberto && <ModalDarBaixa parcelas={parcelas} idsSelecionados={modalBaixa.ids} onClose={() => setModalBaixa({ aberto: false, ids: [] })} onConfirmar={processarBaixa} />}
      
      {parcelaEmEdicao && <ModalEditarValores parcela={parcelaEmEdicao} onClose={() => setParcelaEmEdicao(null)} onSave={salvarEdicaoParcela} />}
      
      {parcelaParaRecibo && <ModalRecibo parcela={parcelaParaRecibo} onClose={() => setParcelaParaRecibo(null)} />}
    </>
  );
}