"use client";

import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/lib/api/client";
import { criarEscola, listarEscolas, type Escola } from "@/lib/api/escolas";

function ModalNovaEscola({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (d: {
    codigoEscola: string;
    nomeFantasia: string;
    razaoSocial?: string;
    cnpj?: string;
    adminNomeCompleto?: string;
    adminEmail: string;
    adminPassword: string;
  }) => Promise<void>;
}) {
  const [codigoEscola, setCodigoEscola] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [adminNomeCompleto, setAdminNomeCompleto] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!codigoEscola.trim() || !nomeFantasia.trim() || !adminEmail.trim() || !adminPassword.trim()) return;
    setSubmitting(true);
    setErro("");
    try {
      await onSave({
        codigoEscola: codigoEscola.trim().toUpperCase(),
        nomeFantasia: nomeFantasia.trim(),
        razaoSocial: razaoSocial.trim() || undefined,
        cnpj: cnpj.trim() || undefined,
        adminNomeCompleto: adminNomeCompleto.trim() || undefined,
        adminEmail: adminEmail.trim().toLowerCase(),
        adminPassword,
      });
      onClose();
    } catch (e) {
      setErro(getApiErrorMessage(e, "Nao foi possivel criar a escola."));
    } finally {
      setSubmitting(false);
    }
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
              value={codigoEscola}
              onChange={(e) => setCodigoEscola(e.target.value.toUpperCase())}
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
          <div className="pt-2 border-t border-zinc-100">
            <h3 className="text-sm font-semibold text-zinc-800">Administrador da escola</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Esse usuario sera criado automaticamente e podera fazer login com o codigo da escola.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Nome completo do admin</label>
            <input
              value={adminNomeCompleto}
              onChange={(e) => setAdminNomeCompleto(e.target.value)}
              className="h-10 border border-zinc-300 rounded-lg px-3 text-sm"
              placeholder="Opcional (padrao: Administrador + escola)"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Email do admin *</label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="h-10 border border-zinc-300 rounded-lg px-3 text-sm"
              placeholder="admin@escola.com"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Senha do admin *</label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="h-10 border border-zinc-300 rounded-lg px-3 text-sm"
              placeholder="Min. 8, com maiuscula, minuscula e numero"
              required
            />
          </div>
          {erro && (
            <p className="text-xs text-red-600">{erro}</p>
          )}
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
              disabled={submitting}
              className="h-9 px-4 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#1e293b]"
            >
              {submitting ? "Salvando..." : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SuperAdminEscolasPage() {
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [modalNova, setModalNova] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function carregar() {
      try {
        setLoading(true);
        setErro("");
        const data = await listarEscolas();
        if (!cancelled) setEscolas(data);
      } catch (e) {
        if (!cancelled) setErro(getApiErrorMessage(e, "Falha ao carregar escolas."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void carregar();
    return () => { cancelled = true; };
  }, []);

  const filtradas = escolas.filter(
    (e) =>
      e.codigoEscola.toLowerCase().includes(filtro.toLowerCase()) ||
      e.nomeFantasia.toLowerCase().includes(filtro.toLowerCase())
  );

  async function adicionarEscola(d: {
    codigoEscola: string;
    nomeFantasia: string;
    razaoSocial?: string;
    cnpj?: string;
    adminNomeCompleto?: string;
    adminEmail: string;
    adminPassword: string;
  }) {
    const nova = await criarEscola(d);
    setEscolas((prev) => [nova, ...prev]);
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
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-zinc-400">
                    Carregando escolas...
                  </td>
                </tr>
              ) : erro ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-red-500">
                    {erro}
                  </td>
                </tr>
              ) : filtradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-zinc-400">
                    Nenhuma escola encontrada.
                  </td>
                </tr>
              ) : (
                filtradas.map((e) => (
                  <tr key={e.id} className="border-b border-zinc-100 hover:bg-zinc-50/80">
                    <td className="px-5 py-3 font-mono text-xs text-zinc-800">{e.codigoEscola}</td>
                    <td className="px-5 py-3">
                      <span className="font-medium text-zinc-900">{e.nomeFantasia}</span>
                      <p className="text-xs text-zinc-400 mt-0.5 md:hidden">ID {e.id}</p>
                    </td>
                    <td className="px-5 py-3 text-zinc-600 hidden md:table-cell">ID {e.id}</td>
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
                    <td className="px-5 py-3 text-right text-xs text-zinc-400">—</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-zinc-400">
        Lista alimentada pela API (`GET /api/escolas`). Criacao usa `POST /api/escolas`.
      </p>

      {modalNova && (
        <ModalNovaEscola onClose={() => setModalNova(false)} onSave={adicionarEscola} />
      )}
    </div>
  );
}
