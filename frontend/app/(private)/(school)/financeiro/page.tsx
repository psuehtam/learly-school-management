"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type StatusMov = "FINALIZADA" | "ESTORNADA" | "PENDENTE";

interface Movimentacao {
  id: number;
  operacao: number;
  descricao: string;
  valor: number;
  status: StatusMov;
  acao: string;
  valorMov: number | null;
  alunoId: number;
  conta: string;
}

interface GrupoDia {
  data: string;
  diaSemana: string;
  total: number;
  movimentacoes: Movimentacao[];
}

// ─── Mock ─────────────────────────────────────────────────────────────────────
const gruposMock: GrupoDia[] = [
  {
    data: "02 de Março de 2026", diaSemana: "Segunda", total: 1864.90,
    movimentacoes: [
      { id: 1,  operacao: 971,   descricao: "PARCELA DE VCTO 28/02/2026 - (00056) MARIANA DE ALMEIDA AMARAL",     valor: 285.00, status: "FINALIZADA", acao: "BAIXA",         valorMov: 285.00, alunoId: 1, conta: "Stone" },
      { id: 2,  operacao: 16260, descricao: "PARCELA DE VCTO 10/03/2026 - (00224) OLIVER MARQUES BELLEGARDE",     valor: 270.00, status: "ESTORNADA",  acao: "BAIXA",         valorMov: null,   alunoId: 2, conta: "Caixa" },
      { id: 3,  operacao: 16261, descricao: "PARCELA DE VCTO 10/03/2026 - (00224) OLIVER MARQUES BELLEGARDE",     valor: 53.33,  status: "FINALIZADA", acao: "BAIXA",         valorMov: 53.33,  alunoId: 2, conta: "Stone" },
      { id: 4,  operacao: 768,   descricao: "PARCELA DE VCTO 05/03/2026 - (00043) MIGUEL TIKASHI PASCOAL AOYAMA", valor: 270.00, status: "FINALIZADA", acao: "BAIXA",         valorMov: 270.00, alunoId: 3, conta: "Banco do Brasil" },
      { id: 5,  operacao: 3546,  descricao: "PARCELA DE VCTO 05/03/2026 - (00043) MIGUEL TIKASHI PASCOAL AOYAMA", valor: 50.00,  status: "FINALIZADA", acao: "BAIXA",         valorMov: 50.00,  alunoId: 3, conta: "Caixa" },
      { id: 6,  operacao: 16260, descricao: "PARCELA DE VCTO 10/03/2026 - (00224) OLIVER MARQUES BELLEGARDE",     valor: 170.00, status: "ESTORNADA",  acao: "BAIXA PARCIAL", valorMov: null,   alunoId: 2, conta: "Stone" },
      { id: 7,  operacao: 16326, descricao: "MATRICULA",                                                           valor: 220.00, status: "FINALIZADA", acao: "BAIXA",         valorMov: 220.00, alunoId: 4, conta: "Stone" },
      { id: 8,  operacao: 16327, descricao: "MATRICULA",                                                           valor: 180.00, status: "FINALIZADA", acao: "BAIXA",         valorMov: 180.00, alunoId: 5, conta: "Banco do Brasil" },
    ],
  },
  {
    data: "03 de Março de 2026", diaSemana: "Terça", total: 2121.90,
    movimentacoes: [
      { id: 9,  operacao: 16329, descricao: "PARCELA DE VCTO 10/03/2026 - (00078) ALICE MASSARI SOARES",          valor: 250.00, status: "FINALIZADA", acao: "BAIXA",         valorMov: 250.00, alunoId: 7, conta: "Stone" },
      { id: 10, operacao: 16330, descricao: "PARCELA DE VCTO 05/03/2026 - (00091) RONALD XAVIER DE ABREU",        valor: 290.00, status: "FINALIZADA", acao: "BAIXA",         valorMov: 290.00, alunoId: 8, conta: "Caixa" },
      { id: 11, operacao: 16331, descricao: "MATRICULA",                                                           valor: 200.00, status: "PENDENTE",   acao: "BAIXA",         valorMov: null,   alunoId: 9, conta: "Stone" },
    ],
  },
];

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function fmt(v: number | null) {
  if (v === null) return "—";
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

// ─── Modal genérico ───────────────────────────────────────────────────────────
function Modal({ titulo, onClose, children, btnColor = "bg-[#1F2A35] hover:bg-[#2d3d4d]" }: { titulo: string; onClose: () => void; children: React.ReactNode; btnColor?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-base font-semibold text-zinc-900">{titulo}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200">
          <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">Cancelar</button>
          <button onClick={onClose} className={`h-9 px-4 text-sm font-medium text-white rounded-lg transition-colors ${btnColor}`}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

function Campo({ label, placeholder, type = "text" }: { label: string; placeholder?: string; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-zinc-700">{label}</label>
      <input type={type} placeholder={placeholder}
        className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition" />
    </div>
  );
}

// ─── Modal Nova Movimentação (Separado por Entrada/Saída) ─────────────────────
function ModalNovaMovimentacao({ tipo, onClose }: { tipo: "entrada" | "saida"; onClose: () => void }) {
  const isEntrada = tipo === "entrada";
  const titulo = isEntrada ? "Nova Entrada" : "Nova Saída";
  const btnColor = isEntrada ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700";
  
  const opcoesTipo = isEntrada 
    ? ["Mensalidade", "Matrícula", "Material", "Doces", "Outro"]
    : ["Pagamento de Professor", "Aluguel", "Luz/Água/Internet", "Material de Limpeza", "Outros Custos"];

  return (
    <Modal titulo={titulo} onClose={onClose} btnColor={btnColor}>
      <div className="flex flex-col gap-4">
        
        {/* Aviso de tipo visual */}
        <div className={`border rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${isEntrada ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isEntrada ? <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/> : <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>}
            {isEntrada ? <polyline points="17 6 23 6 23 12"/> : <polyline points="17 18 23 18 23 12"/>}
          </svg>
          Registrando uma {isEntrada ? "receita (dinheiro entrando)" : "despesa (dinheiro saindo)"}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Categoria *</label>
          <select className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition bg-white">
            <option value="">Selecione a categoria</option>
            {opcoesTipo.map(op => <option key={op}>{op}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Campo label="Valor (R$) *"         placeholder="0,00" />
          <Campo label="Data *"               placeholder="dd/mm/aaaa" type="date" />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Conta *</label>
            <select className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition bg-white">
              <option>Stone</option>
              <option>Caixa</option>
              <option>Banco do Brasil</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Status *</label>
            <select className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition bg-white">
              <option>FINALIZADA</option>
              <option>PENDENTE</option>
            </select>
          </div>
        </div>
        
        <Campo label="Descrição" placeholder="Detalhes adicionais da movimentação" />
        
      </div>
    </Modal>
  );
}

// ─── Modal Editar Movimentação ────────────────────────────────────────────────
function ModalEditarMovimentacao({ mov, onClose }: { mov: Movimentacao; onClose: () => void }) {
  return (
    <Modal titulo={`Editar movimentação #${mov.operacao}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-sm text-zinc-600">
          {mov.descricao}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Valor (R$)</label>
            <input type="text" defaultValue={mov.valor.toFixed(2).replace(".", ",")}
              className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Conta</label>
            <select defaultValue={mov.conta}
              className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition bg-white">
              <option value="Stone">Stone</option>
              <option value="Caixa">Caixa</option>
              <option value="Banco do Brasil">Banco do Brasil</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Status</label>
            <select defaultValue={mov.status}
              className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition bg-white">
              <option>FINALIZADA</option>
              <option>ESTORNADA</option>
              <option>PENDENTE</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Ação</label>
            <select defaultValue={mov.acao}
              className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition bg-white">
              <option>BAIXA</option>
              <option>BAIXA PARCIAL</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Valor Mov. (R$)</label>
            <input type="text" defaultValue={mov.valorMov?.toFixed(2).replace(".", ",") ?? ""}
              className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition" />
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Modal Recibo (AGORA COM IMPRESSÃO REAL) ──────────────────────────────────
function ModalRecibo({ mov, onClose }: { mov: Movimentacao; onClose: () => void }) {
  const dataAtual = new Date().toLocaleDateString('pt-BR');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 print:bg-white print:items-start">
      
      {/* Botão flutuante para fechar, invisível na impressão */}
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 shadow-md print:hidden">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      {/* Container do Recibo - Imitando a estrutura oficial */}
      <div className="bg-white rounded-lg shadow-xl print:shadow-none w-full max-w-3xl mx-4 print:mx-0 flex flex-col p-10 border border-zinc-300 print:border-none">
        
        {/* Cabeçalho do Recibo */}
        <div className="flex items-center justify-between mb-8 border-b-2 border-zinc-200 pb-5">
          <h1 className="text-2xl font-bold text-zinc-900 tracking-wide">RECIBO DE PAGAMENTO</h1>
          <div className="border-2 border-zinc-800 rounded px-4 py-2 text-xl font-bold text-zinc-900">
            {fmt(mov.valorMov || mov.valor)}
          </div>
        </div>

        {/* Corpo do Recibo */}
        <div className="text-[17px] font-[Georgia,serif] leading-relaxed text-zinc-800 space-y-6">
          <p>
            Recebi(emos) a importância de <span className="font-bold">{fmt(mov.valorMov || mov.valor)}</span>, referente a <span className="font-bold uppercase">{mov.descricao}</span>.
          </p>

          <div className="space-y-1">
            <p className="m-0"><span className="font-bold">Conta Destino:</span> {mov.conta}</p>
            <p className="m-0"><span className="font-bold">Operação do Sistema:</span> #{mov.operacao}</p>
            <p className="m-0"><span className="font-bold">Status:</span> {mov.status}</p>
          </div>

          <p className="text-zinc-600 text-sm pt-4 italic">
            Para maior clareza, firmo(amos) o presente recibo, que comprova o recebimento integral do valor mencionado, concedendo quitação plena, geral e irrevogável pela quantia recebida.
          </p>
        </div>

        {/* Rodapé e Assinatura */}
        <div className="mt-16 flex flex-col items-end text-sm text-zinc-800 font-[Georgia,serif]">
          <p className="mb-12 text-base">São Paulo - SP, {dataAtual}</p>
          
          <div className="flex flex-col items-center w-72 text-center font-sans">
            <div className="w-full border-b border-zinc-800 mb-2"></div>
            <p className="font-bold uppercase text-base">LEARLY IDIOMAS</p>
            <p className="text-xs text-zinc-500 mt-1">CNPJ: 12.345.678/0001-90</p>
          </div>
        </div>

        {/* Botão de Imprimir (Que não aparecerá na impressão devido à classe print:hidden) */}
        <div className="mt-10 flex justify-center print:hidden">
          <button 
            onClick={() => window.print()} 
            className="h-10 px-6 font-medium text-zinc-800 border-2 border-zinc-800 rounded hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2 uppercase text-sm tracking-wider"
          >
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

// ─── Modal Categorias (Dinâmico para Entrada ou Saída) ────────────────────────
function ModalCategorias({ tipo, onClose }: { tipo: "entrada" | "saida"; onClose: () => void }) {
  const isEntrada = tipo === "entrada";
  const titulo = isEntrada ? "Categorias de Entrada" : "Categorias de Saída";
  
  const cats = isEntrada 
    ? ["Mensalidade", "Matrícula", "Material", "Doces", "Outro"]
    : ["Pagamento de Professor", "Aluguel", "Luz/Água/Internet", "Material de Limpeza", "Outros Custos"];

  return (
    <Modal titulo={titulo} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {cats.map((c) => (
            <div key={c} className="flex items-center justify-between px-3 py-2.5 border border-zinc-200 rounded-lg">
              <span className="text-sm text-zinc-700">{c}</span>
              <button className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">Editar</button>
            </div>
          ))}
        </div>
        <div className="border-t border-zinc-100 pt-4">
          <Campo label="Nova categoria" placeholder="Nome da categoria" />
        </div>
      </div>
    </Modal>
  );
}

// ─── Modal Contas ─────────────────────────────────────────────────────────────
function ModalContas({ onClose }: { onClose: () => void }) {
  const contas = ["Stone (0001 | 1492817-7)", "Caixa", "Banco do Brasil"];
  return (
    <Modal titulo="Contas" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {contas.map((c) => (
            <div key={c} className="flex items-center justify-between px-3 py-2.5 border border-zinc-200 rounded-lg">
              <span className="text-sm text-zinc-700">{c}</span>
              <button className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">Editar</button>
            </div>
          ))}
        </div>
        <div className="border-t border-zinc-100 pt-4 flex flex-col gap-4">
          <Campo label="Nome da conta *"   placeholder="Ex: Stone, Caixa" />
          <Campo label="Número / Agência"  placeholder="Ex: 0001 | 1492817-7" />
        </div>
      </div>
    </Modal>
  );
}

// ─── Modal Recebimentos ───────────────────────────────────────────────────────
function ModalRecebimentos({ onClose }: { onClose: () => void }) {
  return (
    <Modal titulo="Recebimentos" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Campo label="Data inicial" type="date" />
          <Campo label="Data final"   type="date" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Conta</label>
          <select className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition bg-white">
            <option>Todas as contas</option>
            <option>Stone (0001 | 1492817-7)</option>
            <option>Caixa</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Status</label>
          <select className="h-10 border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition bg-white">
            <option>Todos</option>
            <option>FINALIZADA</option>
            <option>ESTORNADA</option>
            <option>PENDENTE</option>
          </select>
        </div>
        <button className="h-10 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors">
          Gerar relatório
        </button>
      </div>
    </Modal>
  );
}

// ─── Dropdown genérico ────────────────────────────────────────────────────────
function Dropdown({ label, cor, itens, onSelect }: {
  label: string;
  cor: string;
  itens: string[];
  onSelect: (item: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setAberto(!aberto)}
        className={`flex items-center gap-1.5 h-9 px-4 text-sm font-medium text-white rounded-lg transition-colors ${cor}`}>
        {label}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {aberto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAberto(false)} />
          <div className="absolute right-0 top-10 z-20 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 min-w-[200px]">
            {itens.map((item) => (
              <button key={item} onClick={() => { onSelect(item); setAberto(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors">
                {item}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function FinanceiroPage() {
  const [mesAtual, setMesAtual] = useState(2);
  const [anoAtual, setAnoAtual] = useState(2026);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS OS STATUS");
  const [filtroTipo, setFiltroTipo] = useState("TODOS OS TIPOS");
  const [filtroConta, setFiltroConta] = useState("TODAS AS CONTAS");
  const [gruposAbertos, setGruposAbertos] = useState<string[]>(gruposMock.map((g) => g.data));

  // Modais
  const [modal, setModal] = useState<string | null>(null);
  const [movSelecionada, setMovSelecionada] = useState<Movimentacao | null>(null);

  function abrirModal(tipo: string, mov?: Movimentacao) {
    setMovSelecionada(mov ?? null);
    setModal(tipo);
  }

  function fecharModal() { setModal(null); setMovSelecionada(null); }

  function mesAnterior() {
    if (mesAtual === 0) { setMesAtual(11); setAnoAtual(anoAtual - 1); }
    else setMesAtual(mesAtual - 1);
  }

  function proximoMes() {
    if (mesAtual === 11) { setMesAtual(0); setAnoAtual(anoAtual + 1); }
    else setMesAtual(mesAtual + 1);
  }

  function toggleGrupo(data: string) {
    setGruposAbertos((prev) =>
      prev.includes(data) ? prev.filter((d) => d !== data) : [...prev, data]
    );
  }

  const gruposFiltrados = gruposMock.map((g) => ({
    ...g,
    movimentacoes: g.movimentacoes.filter((m) => {
      const buscaOk  = busca === "" || m.descricao.toLowerCase().includes(busca.toLowerCase()) || String(m.operacao).includes(busca);
      const statusOk = filtroStatus === "TODOS OS STATUS" || m.status === filtroStatus;
      const tipoOk   = filtroTipo   === "TODOS OS TIPOS"  || m.acao === filtroTipo;
      const contaOk  = filtroConta  === "TODAS AS CONTAS" || m.conta === filtroConta;
      return buscaOk && statusOk && tipoOk && contaOk;
    }),
  })).filter((g) => g.movimentacoes.length > 0);

  return (
    <>
      <div className="flex flex-col gap-5">

        {/* Topo */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">Movimentações financeiras</h1>
          <p className="text-sm text-zinc-400">Financeiro › Movimentações financeiras</p>
        </div>

        {/* Barra */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <input type="text" placeholder="Procurar" value={busca} onChange={(e) => setBusca(e.target.value)}
              className="h-9 border border-zinc-300 rounded-lg pl-3 pr-10 text-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition w-56" />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>

          {/* Seletor de mês */}
          <div className="flex items-center border border-zinc-300 rounded-lg overflow-hidden h-9">
            <button onClick={mesAnterior} className="px-2 h-full hover:bg-zinc-100 transition-colors text-zinc-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="px-4 text-sm font-medium text-zinc-700 border-x border-zinc-300">
              {MESES[mesAtual].toUpperCase()} DE {anoAtual}
            </span>
            <button onClick={proximoMes} className="px-2 h-full hover:bg-zinc-100 transition-colors text-zinc-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          <div className="flex gap-2 ml-auto">
            <Dropdown
              label="Opções"
              cor="bg-zinc-600 hover:bg-zinc-700"
              itens={["Categorias de entrada", "Categorias de saída", "Contas"]}
              onSelect={(item) => {
                if (item === "Categorias de entrada") abrirModal("categorias_entrada");
                if (item === "Categorias de saída")   abrirModal("categorias_saida");
                if (item === "Contas")                abrirModal("contas");
              }}
            />
            
            <Dropdown
              label="Nova movimentação"
              cor="bg-[#1F2A35] hover:bg-[#2d3d4d]"
              itens={["Nova entrada", "Nova saída"]}
              onSelect={(item) => {
                if (item === "Nova entrada") abrirModal("nova_entrada");
                if (item === "Nova saída")   abrirModal("nova_saida");
              }}
            />
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          {[
            { value: filtroConta,  onChange: setFiltroConta,  options: ["TODAS AS CONTAS", "Stone", "Caixa", "Banco do Brasil"] },
            { value: filtroStatus, onChange: setFiltroStatus, options: ["TODOS OS STATUS","FINALIZADA","ESTORNADA","PENDENTE"] },
            { value: filtroTipo,   onChange: setFiltroTipo,   options: ["TODOS OS TIPOS","BAIXA","BAIXA PARCIAL"] },
          ].map((f, i) => (
            <select key={i} value={f.value} onChange={(e) => f.onChange(e.target.value)}
              className="h-9 border border-zinc-300 rounded-lg px-3 text-sm text-zinc-700 outline-none focus:border-[#1F2A35] transition bg-white font-medium">
              {f.options.map((o) => <option key={o}>{o}</option>)}
            </select>
          ))}
        </div>

        {/* Saldo */}
        <div className="text-right text-sm text-zinc-600">
          Saldo no início do período: <span className="font-semibold text-zinc-900">R$ 624,60</span>
        </div>

        {/* Grupos */}
        <div className="flex flex-col gap-4">
          {gruposFiltrados.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 text-sm">Nenhuma movimentação encontrada</div>
          ) : (
            gruposFiltrados.map((grupo) => {
              const aberto = gruposAbertos.includes(grupo.data);
              return (
                <div key={grupo.data} className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                  <button onClick={() => toggleGrupo(grupo.data)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        className={`transition-transform text-zinc-400 ${aberto ? "" : "-rotate-90"}`}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                      <span className="font-semibold text-zinc-800 text-sm">{grupo.data}, {grupo.diaSemana}</span>
                    </div>
                    <span className="text-sm font-semibold text-zinc-700">{fmt(grupo.total)}</span>
                  </button>

                  {aberto && (
                    <div className="border-t border-zinc-100">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-zinc-50 border-b border-zinc-200">
                            <th className="w-6 px-3 py-2.5" />
                            <th className="text-left px-3 py-2.5 font-semibold text-zinc-500 uppercase tracking-wide">Operação</th>
                            <th className="text-left px-3 py-2.5 font-semibold text-zinc-500 uppercase tracking-wide">Descrição</th>
                            <th className="text-left px-3 py-2.5 font-semibold text-zinc-500 uppercase tracking-wide">Valor</th>
                            <th className="text-left px-3 py-2.5 font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
                            <th className="text-left px-3 py-2.5 font-semibold text-zinc-500 uppercase tracking-wide">Ação</th>
                            <th className="text-left px-3 py-2.5 font-semibold text-zinc-500 uppercase tracking-wide">Valor Mov.</th>
                            <th className="text-left px-3 py-2.5 font-semibold text-zinc-500 uppercase tracking-wide">Opções</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grupo.movimentacoes.map((m, i) => (
                            <tr key={m.id} className={`border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${i === grupo.movimentacoes.length - 1 ? "border-b-0" : ""}`}>
                              <td className="px-3 py-2.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                              </td>
                              <td className="px-3 py-2.5 font-medium text-zinc-700">{m.operacao}</td>
                              <td className="px-3 py-2.5 text-zinc-600 max-w-xs">
                                <div className="flex flex-col">
                                  <Link href={`/financeiro/${m.alunoId}`} className="hover:text-[#1F2A35] hover:underline transition-colors">
                                    {m.descricao}
                                  </Link>
                                  <span className="text-[10px] text-zinc-400 mt-0.5">{m.conta}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-zinc-700 font-medium">{fmt(m.valor)}</td>
                              <td className="px-3 py-2.5">
                                <span className={`font-semibold ${
                                  m.status === "FINALIZADA" ? "text-green-600" :
                                  m.status === "ESTORNADA"  ? "text-red-500"   : "text-amber-500"
                                }`}>{m.status}</span>
                              </td>
                              <td className="px-3 py-2.5 text-zinc-500">{m.acao}</td>
                              <td className="px-3 py-2.5 text-zinc-700 font-medium">{fmt(m.valorMov)}</td>
                              <td className="px-3 py-2.5">
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => abrirModal("editar", m)}
                                    className="w-7 h-7 flex items-center justify-center rounded border border-zinc-200 hover:bg-zinc-100 transition-colors text-zinc-500"
                                    title="Editar">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                  </button>
                                  {m.status === "FINALIZADA" && (
                                    <button
                                      onClick={() => abrirModal("recibo", m)}
                                      className="w-7 h-7 flex items-center justify-center rounded border border-zinc-200 hover:bg-zinc-100 transition-colors text-green-600"
                                      title="Recibo">
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                        <polyline points="14 2 14 8 20 8"/>
                                        <line x1="16" y1="13" x2="8" y2="13"/>
                                        <line x1="16" y1="17" x2="8" y2="17"/>
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modais */}
      {modal === "nova_entrada" && <ModalNovaMovimentacao tipo="entrada" onClose={fecharModal} />}
      {modal === "nova_saida"   && <ModalNovaMovimentacao tipo="saida" onClose={fecharModal} />}
      
      {modal === "editar"       && movSelecionada && <ModalEditarMovimentacao mov={movSelecionada} onClose={fecharModal} />}
      {modal === "recibo"       && movSelecionada && <ModalRecibo mov={movSelecionada} onClose={fecharModal} />}
      
      {modal === "categorias_entrada" && <ModalCategorias tipo="entrada" onClose={fecharModal} />}
      {modal === "categorias_saida"   && <ModalCategorias tipo="saida" onClose={fecharModal} />}
      
      {modal === "contas"       && <ModalContas onClose={fecharModal} />}
    </>
  );
}