"use client";

import { useState } from "react";

type StatusEscola = "Ativo" | "Inativo";

interface Escola {
  id: number;
  codigo: string;
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
  status: StatusEscola;
  criadoEm: string;
}

const escolasIniciais: Escola[] = [
  {
    id: 1,
    codigo: "ESCOLA-TESTE-01",
    nomeFantasia: "Escola Teste 01",
    razaoSocial: "Escola Teste 01 LTDA",
    cnpj: "00.000.000/0001-00",
    status: "Ativo",
    criadoEm: "27/03/2026",
  },
  {
    id: 2,
    codigo: "CWB-IDIOM",
    nomeFantasia: "CWB Idiomas",
    razaoSocial: "CWB Idiomas EIRELI",
    cnpj: "12.345.678/0001-90",
    status: "Ativo",
    criadoEm: "15/01/2026",
  },
  {
    id: 3,
    codigo: "DEMO-SCHOOL",
    nomeFantasia: "Escola Demo (inativa)",
    razaoSocial: "Demo LTDA",
    cnpj: "98.765.432/0001-10",
    status: "Inativo",
    criadoEm: "01/12/2025",
  },
];

function ModalNovaEscola({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (d: Omit<Escola, "id" | "criadoEm">) => void;
}) {
  const [codigo, setCodigo] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim() || !nomeFantasia.trim()) return;
    onSave({
      codigo: codigo.trim().toUpperCase(),
      nomeFantasia: nomeFantasia.trim(),
      razaoSocial: razaoSocial.trim() || nomeFantasia.trim(),
      cnpj: cnpj.trim() || "—",
      status: "Ativo",
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-zinc-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-base font-semibold text-zinc-900">Nova escola</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600"
            aria-label="Fechar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <p className="text-xs text-zinc-500">
            O código é usado no login da escola (campo &quot;Código da Escola&quot;). Deve ser único.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Código da escola *</label>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              className="h-10 border border-zinc-300 rounded-lg px-3 text-sm uppercase"
              placeholder="Ex: MINHA-ESCOLA"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Nome fantasia *</label>
            <input
              value={nomeFantasia}
              onChange={(e) => setNomeFantasia(e.target.value)}
              className="h-10 border border-zinc-300 rounded-lg px-3 text-sm"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Razão social</label>
            <input
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              className="h-10 border border-zinc-300 rounded-lg px-3 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">CNPJ</label>
            <input
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              className="h-10 border border-zinc-300 rounded-lg px-3 text-sm"
              placeholder="Opcional"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-sm font-medium text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-9 px-4 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b]"
            >
              Cadastrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SuperAdminEscolasPage() {
  const [escolas, setEscolas] = useState<Escola[]>(escolasIniciais);
  const [modalNova, setModalNova] = useState(false);
  const [filtro, setFiltro] = useState("");

  const filtradas = escolas.filter(
    (e) =>
      e.codigo.toLowerCase().includes(filtro.toLowerCase()) ||
      e.nomeFantasia.toLowerCase().includes(filtro.toLowerCase())
  );

  function alternarStatus(id: number) {
    setEscolas((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: e.status === "Ativo" ? "Inativo" : "Ativo" } : e
      )
    );
  }

  function adicionarEscola(d: Omit<Escola, "id" | "criadoEm">) {
    const novo: Escola = {
      ...d,
      id: Math.max(0, ...escolas.map((e) => e.id)) + 1,
      criadoEm: new Date().toLocaleDateString("pt-BR"),
    };
    setEscolas((prev) => [novo, ...prev]);
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Escolas cadastradas</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Cadastre escolas (tenants), defina o código de login e inative sem apagar o registro.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <input
          type="search"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar por código ou nome..."
          className="h-10 max-w-sm w-full border border-zinc-300 rounded-lg px-3 text-sm outline-none focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/15"
        />
        <button
          type="button"
          onClick={() => setModalNova(true)}
          className="h-10 px-4 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b] transition-colors shrink-0"
        >
          Nova escola
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="text-left px-5 py-3 font-semibold text-zinc-500 text-xs uppercase tracking-wide">
                  Código
                </th>
                <th className="text-left px-5 py-3 font-semibold text-zinc-500 text-xs uppercase tracking-wide">
                  Nome
                </th>
                <th className="text-left px-5 py-3 font-semibold text-zinc-500 text-xs uppercase tracking-wide hidden md:table-cell">
                  CNPJ
                </th>
                <th className="text-left px-5 py-3 font-semibold text-zinc-500 text-xs uppercase tracking-wide">
                  Status
                </th>
                <th className="text-right px-5 py-3 font-semibold text-zinc-500 text-xs uppercase tracking-wide">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-zinc-400">
                    Nenhuma escola encontrada.
                  </td>
                </tr>
              ) : (
                filtradas.map((e) => (
                  <tr key={e.id} className="border-b border-zinc-100 hover:bg-zinc-50/80">
                    <td className="px-5 py-3 font-mono text-xs text-zinc-800">{e.codigo}</td>
                    <td className="px-5 py-3">
                      <span className="font-medium text-zinc-900">{e.nomeFantasia}</span>
                      <p className="text-xs text-zinc-400 mt-0.5 md:hidden">{e.cnpj}</p>
                    </td>
                    <td className="px-5 py-3 text-zinc-600 hidden md:table-cell">{e.cnpj}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                          e.status === "Ativo"
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => alternarStatus(e.id)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                          e.status === "Ativo"
                            ? "border-amber-200 text-amber-800 hover:bg-amber-50"
                            : "border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                        }`}
                      >
                        {e.status === "Ativo" ? "Inativar" : "Ativar"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-zinc-400">
        Dados de demonstração — conecte a API de escolas (`GERENCIAR_ESCOLAS` / Super Admin) quando o backend estiver pronto.
      </p>

      {modalNova && (
        <ModalNovaEscola onClose={() => setModalNova(false)} onSave={adicionarEscola} />
      )}
    </div>
  );
}
