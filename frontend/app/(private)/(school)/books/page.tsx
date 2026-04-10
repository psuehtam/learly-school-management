"use client";

import { useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Capitulo {
  id: number;
  nome: string;
  aulas: number;
}

interface Livro {
  id: number;
  nome: string;
  status: "ativo" | "inativo";
  capitulos: Capitulo[];
}

// ─── Dados mock ───────────────────────────────────────────────────────────────
const livrosMock: Livro[] = [
  {
    id: 1, nome: "Book 1", status: "ativo",
    capitulos: [
      { id: 1, nome: "Unit 1", aulas: 1 },
      { id: 2, nome: "Unit 2", aulas: 2 },
      { id: 3, nome: "Unit 3", aulas: 1 },
    ],
  },
  {
    id: 2, nome: "Book 2", status: "ativo",
    capitulos: [
      { id: 4, nome: "Unit 1", aulas: 2 },
      { id: 5, nome: "Unit 2", aulas: 1 },
    ],
  },
  {
    id: 3, nome: "Book 3", status: "inativo",
    capitulos: [
      { id: 6, nome: "Unit 1", aulas: 1 },
    ],
  },
];

// ─── Modal Livro (Criar Livro com Capítulos Dinâmicos) ────────────────────────
interface ModalLivroProps {
  livro: Livro | null;
  onClose: () => void;
  onSave: (nome: string, capitulosConfig: { nome: string; aulas: number }[]) => void;
}

function ModalLivro({ livro, onClose, onSave }: ModalLivroProps) {
  const isEdit = !!livro;
  const [nome, setNome] = useState(livro?.nome ?? "");
  
  // States para a criação em lote
  const [numCapitulos, setNumCapitulos] = useState<number | "">("");
  const [capitulosConfigs, setCapitulosConfigs] = useState<{ nome: string; aulas: number }[]>([]);

  // Atualiza a quantidade de linhas de capítulos
  function handleNumCapitulosChange(val: string) {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 0) {
      setNumCapitulos("");
      setCapitulosConfigs([]);
      return;
    }
    setNumCapitulos(num);

    setCapitulosConfigs(prev => {
      const newConfigs = [...prev];
      if (num > prev.length) {
        // Adiciona novos capítulos
        for (let i = prev.length; i < num; i++) {
          newConfigs.push({ nome: `Unit ${i + 1}`, aulas: 1 });
        }
      } else if (num < prev.length) {
        // Remove os que sobraram se o número diminuir
        newConfigs.splice(num);
      }
      return newConfigs;
    });
  }

  // Atualiza o nome ou a quantidade de aulas de uma linha específica
  function handleCapituloChange(index: number, field: "nome" | "aulas", value: string | number) {
    setCapitulosConfigs(prev => {
      const newConfigs = [...prev];
      newConfigs[index] = { ...newConfigs[index], [field]: value };
      return newConfigs;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-base font-semibold text-zinc-900">
            {isEdit ? "Editar livro" : "Novo livro"}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 flex-1 overflow-y-auto flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Nome do livro *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Book 1"
              className="h-10 border border-zinc-300 rounded-lg px-3 text-sm text-zinc-900 outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition"
            />
          </div>

          {/* Opcões extras APENAS na criação (não na edição do nome) */}
          {!isEdit && (
            <>
              <div className="flex flex-col gap-1.5 pt-2">
                <label className="text-sm font-medium text-zinc-700">Quantidade de Capítulos / Unidades</label>
                <input
                  type="number"
                  min="0"
                  value={numCapitulos}
                  onChange={(e) => handleNumCapitulosChange(e.target.value)}
                  placeholder="Ex: 10"
                  className="h-10 border border-zinc-300 rounded-lg px-3 text-sm text-zinc-900 outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition"
                />
              </div>

              {capitulosConfigs.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-zinc-100 pt-4 mt-2">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Configuração de Aulas</p>
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2">
                    {capitulosConfigs.map((cap, index) => (
                      <div key={index} className="flex gap-3 items-center bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                        <div className="flex-1 flex flex-col gap-1">
                          <label className="text-[11px] text-zinc-500 font-semibold uppercase">Nome do Cap.</label>
                          <input
                            type="text"
                            value={cap.nome}
                            onChange={(e) => handleCapituloChange(index, "nome", e.target.value)}
                            className="h-8 border border-zinc-300 rounded-md px-2 text-sm text-zinc-900 outline-none focus:border-[#1F2A35] transition bg-white"
                          />
                        </div>
                        <div className="w-24 flex flex-col gap-1">
                          <label className="text-[11px] text-zinc-500 font-semibold uppercase">Qtd. Aulas</label>
                          <input
                            type="number"
                            min="1"
                            value={cap.aulas}
                            onChange={(e) => handleCapituloChange(index, "aulas", parseInt(e.target.value) || 1)}
                            className="h-8 border border-zinc-300 rounded-md px-2 text-sm text-zinc-900 outline-none focus:border-[#1F2A35] transition bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200">
          <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => nome.trim() && onSave(nome.trim(), capitulosConfigs)}
            className="h-9 px-4 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors"
          >
            {isEdit ? "Salvar" : "Criar livro"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Capítulo ───────────────────────────────────────────────────────────
interface ModalCapituloProps {
  capitulo: Capitulo | null;
  onClose: () => void;
  onSave: (nome: string, aulas: number) => void;
}

function ModalCapitulo({ capitulo, onClose, onSave }: ModalCapituloProps) {
  const [nome, setNome] = useState(capitulo?.nome ?? "");
  const [aulas, setAulas] = useState(capitulo?.aulas ?? 1);
  const isEdit = !!capitulo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-base font-semibold text-zinc-900">
            {isEdit ? "Editar capítulo" : "Novo capítulo"}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Nome do capítulo *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Unit 1"
              className="h-10 border border-zinc-300 rounded-lg px-3 text-sm text-zinc-900 outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Quantidade de aulas *</label>
            <input
              type="number"
              min={1}
              value={aulas}
              onChange={(e) => setAulas(Number(e.target.value))}
              className="h-10 border border-zinc-300 rounded-lg px-3 text-sm text-zinc-900 outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200">
          <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => nome.trim() && onSave(nome.trim(), aulas)}
            className="h-9 px-4 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors"
          >
            {isEdit ? "Salvar" : "Criar capítulo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Card do Livro ────────────────────────────────────────────────────────────
interface CardLivroProps {
  livro: Livro;
  onEditar: (l: Livro) => void;
  onToggleStatus: (id: number) => void;
  onNovoCapitulo: (livroId: number) => void;
  onEditarCapitulo: (livroId: number, c: Capitulo) => void;
}

function CardLivro({ livro, onEditar, onToggleStatus, onNovoCapitulo, onEditarCapitulo }: CardLivroProps) {
  const [expandido, setExpandido] = useState(false);
  const totalAulas = livro.capitulos.reduce((acc, c) => acc + c.aulas, 0);

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
      {/* Header do card */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpandido(!expandido)}
            className={`transition-transform duration-200 text-zinc-400 ${expandido ? "rotate-180" : ""}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900">{livro.nome}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                livro.status === "ativo" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${livro.status === "ativo" ? "bg-green-500" : "bg-red-400"}`} />
                {livro.status === "ativo" ? "Ativo" : "Inativo"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {livro.capitulos.length} capítulo{livro.capitulos.length !== 1 ? "s" : ""} · {totalAulas} aula{totalAulas !== 1 ? "s" : ""} no total
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditar(livro)}
            className="h-8 px-3 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => onToggleStatus(livro.id)}
            className={`h-8 px-3 text-xs font-medium rounded-lg border transition-colors ${
              livro.status === "ativo"
                ? "text-red-600 border-red-200 hover:bg-red-50"
                : "text-green-700 border-green-200 hover:bg-green-50"
            }`}
          >
            {livro.status === "ativo" ? "Inativar" : "Ativar"}
          </button>
        </div>
      </div>

      {/* Capítulos expandidos */}
      {expandido && (
        <div className="border-t border-zinc-100 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Capítulos</span>
            <button
              onClick={() => onNovoCapitulo(livro.id)}
              className="flex items-center gap-1 h-7 px-3 text-xs font-medium text-[#1F2A35] border border-[#1F2A35]/20 rounded-lg hover:bg-[#1F2A35]/5 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Novo capítulo
            </button>
          </div>

          {livro.capitulos.length === 0 ? (
            <p className="text-sm text-zinc-400 py-2">Nenhum capítulo cadastrado.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {livro.capitulos.map((cap) => (
                <div
                  key={cap.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-700 font-medium">{cap.nome}</span>
                    <span className="text-xs text-zinc-400">{cap.aulas} aula{cap.aulas !== 1 ? "s" : ""}</span>
                  </div>
                  <button
                    onClick={() => onEditarCapitulo(livro.id, cap)}
                    className="opacity-0 group-hover:opacity-100 h-7 px-3 text-xs font-medium text-zinc-500 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-all"
                  >
                    Editar
                  </button>
                </div>
              ))}

              {/* Total */}
              <div className="flex items-center justify-between py-2 px-3 mt-1 border-t border-zinc-100">
                <span className="text-xs font-semibold text-zinc-500">Total</span>
                <span className="text-xs font-semibold text-zinc-700">{totalAulas} aulas</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function BooksPage() {
  const [livros, setLivros] = useState<Livro[]>(livrosMock);
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "ativo" | "inativo">("todos");

  const [modalLivro, setModalLivro] = useState(false);
  const [livroEditando, setLivroEditando] = useState<Livro | null>(null);

  const [modalCapitulo, setModalCapitulo] = useState(false);
  const [livroIdCapitulo, setLivroIdCapitulo] = useState<number | null>(null);
  const [capituloEditando, setCapituloEditando] = useState<Capitulo | null>(null);

  const livrosFiltrados = livros.filter((l) =>
    filtroStatus === "todos" ? true : l.status === filtroStatus
  );

  // ── Livro ──
  function abrirNovoLivro() { setLivroEditando(null); setModalLivro(true); }
  function abrirEditarLivro(l: Livro) { setLivroEditando(l); setModalLivro(true); }

  function salvarLivro(nome: string, capitulosConfig: {nome: string, aulas: number}[]) {
    if (livroEditando) {
      // Na edição, só altera o nome do livro (capítulos são editados individualmente)
      setLivros((prev) => prev.map((l) => l.id === livroEditando.id ? { ...l, nome } : l));
    } else {
      // Na criação, formata os capítulos que vieram do modal dinâmico
      const novosCapitulos: Capitulo[] = capitulosConfig.map((cap, i) => ({
        id: Date.now() + i, // id provisório
        nome: cap.nome,
        aulas: cap.aulas,
      }));
      setLivros((prev) => [...prev, { id: Date.now(), nome, status: "ativo", capitulos: novosCapitulos }]);
    }
    setModalLivro(false);
  }

  function toggleStatusLivro(id: number) {
    setLivros((prev) => prev.map((l) =>
      l.id === id ? { ...l, status: l.status === "ativo" ? "inativo" : "ativo" } : l
    ));
  }

  // ── Capítulo ──
  function abrirNovoCapitulo(livroId: number) {
    setLivroIdCapitulo(livroId);
    setCapituloEditando(null);
    setModalCapitulo(true);
  }

  function abrirEditarCapitulo(livroId: number, cap: Capitulo) {
    setLivroIdCapitulo(livroId);
    setCapituloEditando(cap);
    setModalCapitulo(true);
  }

  function salvarCapitulo(nome: string, aulas: number) {
    if (!livroIdCapitulo) return;
    setLivros((prev) => prev.map((l) => {
      if (l.id !== livroIdCapitulo) return l;
      if (capituloEditando) {
        return { ...l, capitulos: l.capitulos.map((c) => c.id === capituloEditando.id ? { ...c, nome, aulas } : c) };
      }
      return { ...l, capitulos: [...l.capitulos, { id: Date.now(), nome, aulas }] };
    }));
    setModalCapitulo(false);
  }

  return (
    <>
      <div className="flex flex-col gap-6">

        {/* Topo */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Books</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Gerencie os livros e capítulos do sistema</p>
          </div>
          <button
            onClick={abrirNovoLivro}
            className="flex items-center gap-2 h-9 px-4 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Novo livro
          </button>
        </div>

        {/* Filtro */}
        <div className="flex gap-2">
          {(["todos", "ativo", "inativo"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              className={`h-8 px-4 text-sm rounded-lg font-medium transition-colors border ${
                filtroStatus === s
                  ? "bg-[#1F2A35] text-white border-[#1F2A35]"
                  : "text-zinc-600 border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              {s === "todos" ? "Todos" : s === "ativo" ? "Ativos" : "Inativos"}
            </button>
          ))}
        </div>

        {/* Lista de livros */}
        {livrosFiltrados.length === 0 ? (
          <div className="text-center py-16 text-zinc-400 text-sm">Nenhum livro encontrado</div>
        ) : (
          <div className="flex flex-col gap-3">
            {livrosFiltrados.map((livro) => (
              <CardLivro
                key={livro.id}
                livro={livro}
                onEditar={abrirEditarLivro}
                onToggleStatus={toggleStatusLivro}
                onNovoCapitulo={abrirNovoCapitulo}
                onEditarCapitulo={abrirEditarCapitulo}
              />
            ))}
          </div>
        )}

      </div>

      {/* Modais */}
      {modalLivro && (
        <ModalLivro
          livro={livroEditando}
          onClose={() => setModalLivro(false)}
          onSave={salvarLivro}
        />
      )}
      {modalCapitulo && (
        <ModalCapitulo
          capitulo={capituloEditando}
          onClose={() => setModalCapitulo(false)}
          onSave={salvarCapitulo}
        />
      )}
    </>
  );
}