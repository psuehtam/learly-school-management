"use client";

import { useEffect, useMemo, useState } from "react";
import {
  criarUsuarioMinhaEscola,
  editarUsuarioMinhaEscola,
  listarPerfisMinhaEscola,
  listarUsuariosMinhaEscola,
  type EditarUsuarioMinhaEscolaPayload,
  type PerfilMinhaEscola,
  type UsuarioMinhaEscola,
} from "@/lib/api/usuarios";
import { getApiErrorMessage } from "@/lib/api/client";

type StatusFiltro = "todos" | "Ativo" | "Inativo";
type ModalMode = "create" | "edit";

interface ModalProps {
  mode: ModalMode;
  perfis: PerfilMinhaEscola[];
  usuario: UsuarioMinhaEscola | null;
  onClose: () => void;
  onCreate: (payload: {
    nomeCompleto: string;
    email: string;
    senha: string;
    perfilId: number;
  }) => Promise<void>;
  onEdit: (payload: EditarUsuarioMinhaEscolaPayload) => Promise<void>;
  saving: boolean;
  errorMessage: string | null;
}

function ModalUsuario({
  mode,
  perfis,
  usuario,
  onClose,
  onCreate,
  onEdit,
  saving,
  errorMessage,
}: ModalProps) {
  const [form, setForm] = useState({
    nomeCompleto: usuario?.nomeCompleto ?? "",
    email: usuario?.email ?? "",
    senha: "",
    perfilId: usuario?.perfilId ?? perfis[0]?.id ?? 0,
    status: usuario?.status ?? "Ativo",
  });
  const [showPassword, setShowPassword] = useState(false);
  const isCreate = mode === "create";

  function handleChange(
    field: "nomeCompleto" | "email" | "senha" | "perfilId" | "status",
    value: string,
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (isCreate) {
      await onCreate({
        nomeCompleto: form.nomeCompleto,
        email: form.email,
        senha: form.senha,
        perfilId: Number(form.perfilId),
      });
      return;
    }

    await onEdit({
      nomeCompleto: form.nomeCompleto,
      email: form.email,
      perfilId: Number(form.perfilId),
      status: form.status as "Ativo" | "Inativo",
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-base font-semibold text-zinc-900">
            {isCreate ? "Novo usuario" : "Editar usuario"}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 flex flex-col gap-4">

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Nome completo *</label>
            <input
              type="text"
              value={form.nomeCompleto}
              onChange={(e) => handleChange("nomeCompleto", e.target.value)}
              placeholder="Nome do usuário"
              className="h-10 border border-zinc-300 rounded-lg px-3 text-sm text-zinc-900 outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">E-mail *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="email@learly.com"
              className="h-10 border border-zinc-300 rounded-lg px-3 text-sm text-zinc-900 outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition"
            />
          </div>

          {isCreate && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Senha *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.senha}
                  onChange={(e) => handleChange("senha", e.target.value)}
                  placeholder="Senha forte (ex.: Senha123)"
                  className="h-10 w-full border border-zinc-300 rounded-lg pl-3 pr-10 text-sm text-zinc-900 outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-600 hover:text-zinc-900"
                >
                  {showPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Perfil *</label>
            <select
              value={form.perfilId}
              onChange={(e) => handleChange("perfilId", e.target.value)}
              className="h-10 border border-zinc-300 rounded-lg px-3 text-sm text-zinc-900 outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition bg-white"
            >
              {perfis.map((perfil) => (
                <option key={perfil.id} value={perfil.id}>
                  {perfil.nome}
                </option>
              ))}
            </select>
          </div>

          {!isCreate && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Status *</label>
              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="h-10 border border-zinc-300 rounded-lg px-3 text-sm text-zinc-900 outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition bg-white"
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200">
          <button
            onClick={onClose}
            className="h-9 px-4 text-sm font-medium text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            disabled={saving || perfis.length === 0}
            onClick={() => void handleSubmit()}
            className="h-9 px-4 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors disabled:opacity-60"
          >
            {saving ? "Salvando..." : isCreate ? "Criar usuario" : "Salvar alteracoes"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioMinhaEscola[]>([]);
  const [perfis, setPerfis] = useState<PerfilMinhaEscola[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroPerfil, setFiltroPerfil] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<StatusFiltro>("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioMinhaEscola | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      setPageError(null);
      try {
        const [usuariosResp, perfisResp] = await Promise.all([
          listarUsuariosMinhaEscola(),
          listarPerfisMinhaEscola(),
        ]);
        setUsuarios(usuariosResp);
        setPerfis(perfisResp);
      } catch (error) {
        setPageError(getApiErrorMessage(error, "Falha ao carregar usuarios."));
      } finally {
        setLoading(false);
      }
    }

    void carregar();
  }, []);

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const buscaTexto = busca.trim().toLowerCase();
      const buscaOk =
        buscaTexto.length === 0 ||
        u.nomeCompleto.toLowerCase().includes(buscaTexto) ||
        u.email.toLowerCase().includes(buscaTexto);
      const perfilOk = filtroPerfil === "todos" || String(u.perfilId) === filtroPerfil;
      const statusOk = filtroStatus === "todos" || u.status === filtroStatus;
      return buscaOk && perfilOk && statusOk;
    });
  }, [usuarios, busca, filtroPerfil, filtroStatus]);

  async function salvar(payload: {
    nomeCompleto: string;
    email: string;
    senha: string;
    perfilId: number;
  }) {
    setSaving(true);
    setModalError(null);
    try {
      await criarUsuarioMinhaEscola(payload);
      const usuariosAtualizados = await listarUsuariosMinhaEscola();
      setUsuarios(usuariosAtualizados);
      setModalAberto(false);
    } catch (error) {
      setModalError(getApiErrorMessage(error, "Nao foi possivel criar o usuario."));
    } finally {
      setSaving(false);
    }
  }

  async function editar(payload: EditarUsuarioMinhaEscolaPayload) {
    if (!usuarioSelecionado) return;

    setSaving(true);
    setModalError(null);
    try {
      await editarUsuarioMinhaEscola(usuarioSelecionado.id, payload);
      const usuariosAtualizados = await listarUsuariosMinhaEscola();
      setUsuarios(usuariosAtualizados);
      setModalAberto(false);
      setUsuarioSelecionado(null);
    } catch (error) {
      setModalError(getApiErrorMessage(error, "Nao foi possivel editar o usuario."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">

        {/* Topo */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Usuários</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Gerencie os acessos ao sistema</p>
          </div>
          <button
            onClick={() => {
              setModalError(null);
              setModalMode("create");
              setUsuarioSelecionado(null);
              setModalAberto(true);
            }}
            disabled={perfis.length === 0}
            className="flex items-center gap-2 h-9 px-4 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Novo usuario
          </button>
        </div>

        {pageError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {pageError}
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-9 border border-zinc-300 rounded-lg px-3 text-sm text-zinc-900 outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition w-72"
          />
          <select
            value={filtroPerfil}
            onChange={(e) => setFiltroPerfil(e.target.value)}
            className="h-9 border border-zinc-300 rounded-lg px-3 text-sm text-zinc-700 outline-none focus:border-[#1F2A35] transition bg-white"
          >
            <option value="todos">Todos os perfis</option>
            {perfis.map((perfil) => (
              <option key={perfil.id} value={String(perfil.id)}>
                {perfil.nome}
              </option>
            ))}
          </select>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as StatusFiltro)}
            className="h-9 border border-zinc-300 rounded-lg px-3 text-sm text-zinc-700 outline-none focus:border-[#1F2A35] transition bg-white"
          >
            <option value="todos">Todos os status</option>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>
        </div>

        {/* Tabela */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">E-mail</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Perfil</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Status</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-500">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-zinc-400">
                    Carregando usuarios...
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-zinc-400">
                    Nenhum usuario encontrado
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((u, i) => (
                  <tr
                    key={u.id}
                    className={`border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${i === usuariosFiltrados.length - 1 ? "border-b-0" : ""}`}
                  >
                    {/* Nome + avatar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1F2A35] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                          {u.nomeCompleto.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-zinc-900">{u.nomeCompleto}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-zinc-500">{u.email}</td>

                    {/* Perfil badge */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700">
                        {u.perfilNome}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.status === "Ativo"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-600"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === "Ativo" ? "bg-green-500" : "bg-red-400"}`} />
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setModalError(null);
                          setModalMode("edit");
                          setUsuarioSelecionado(u);
                          setModalAberto(true);
                        }}
                        className="h-8 px-3 text-xs font-medium border border-zinc-300 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors"
                      >
                        Alterar dados
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da tabela */}
        <p className="text-xs text-zinc-400">
          {usuariosFiltrados.length} usuário{usuariosFiltrados.length !== 1 ? "s" : ""} encontrado{usuariosFiltrados.length !== 1 ? "s" : ""}
        </p>

      </div>

      {/* Modal */}
      {modalAberto && (
        <ModalUsuario
          mode={modalMode}
          perfis={perfis}
          usuario={usuarioSelecionado}
          saving={saving}
          errorMessage={modalError}
          onClose={() => setModalAberto(false)}
          onCreate={salvar}
          onEdit={editar}
        />
      )}
    </>
  );
}