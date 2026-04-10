"use client";

import { useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
// 👇 Atualizado com os novos perfis
type Perfil = "professor" | "financeiro" | "coordenador" | "administrador" | "comercial" | "secretaria";
type Status = "ativo" | "inativo";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  status: Status;
  criadoEm: string;
}

// ─── Dados mock (substituir pela API futuramente) ─────────────────────────────
const usuariosMock: Usuario[] = [
  { id: 1, nome: "Ana Paula Silva",    email: "ana@learly.com",    perfil: "coordenador",   status: "ativo",   criadoEm: "10/01/2025" },
  { id: 2, nome: "Carlos Mendes",      email: "carlos@learly.com", perfil: "professor",     status: "ativo",   criadoEm: "12/01/2025" },
  { id: 3, nome: "Fernanda Costa",     email: "fernanda@learly.com",perfil: "financeiro",   status: "ativo",   criadoEm: "15/01/2025" },
  { id: 4, nome: "Rafael Souza",       email: "rafael@learly.com", perfil: "comercial",     status: "ativo",   criadoEm: "20/01/2025" },
  { id: 5, nome: "Gabrielli Pupia",    email: "gabi@learly.com",   perfil: "administrador", status: "ativo",   criadoEm: "01/01/2025" },
  { id: 6, nome: "Marcos Almeida",     email: "marcos@learly.com", perfil: "secretaria",    status: "ativo",   criadoEm: "28/02/2026" },
];

const perfilLabel: Record<Perfil, string> = {
  professor:     "Professor",
  financeiro:    "Financeiro",
  coordenador:   "Coordenador",
  administrador: "Administrador",
  comercial:     "Comercial", // 👈 Novo
  secretaria:    "Secretaria", // 👈 Novo
};

const perfilColors: Record<Perfil, string> = {
  professor:     "bg-blue-50 text-blue-700",
  financeiro:    "bg-amber-50 text-amber-700",
  coordenador:   "bg-purple-50 text-purple-700",
  administrador: "bg-zinc-100 text-zinc-700",
  comercial:     "bg-emerald-50 text-emerald-700", // 👈 Novo
  secretaria:    "bg-indigo-50 text-indigo-700", // 👈 Novo
};

// ─── Modal de criar/editar usuário ────────────────────────────────────────────
interface ModalProps {
  usuario: Partial<Usuario> | null;
  onClose: () => void;
  onSave: (u: Partial<Usuario>) => void;
}

function ModalUsuario({ usuario, onClose, onSave }: ModalProps) {
  const [form, setForm] = useState<Partial<Usuario>>({
    nome:   usuario?.nome   ?? "",
    email:  usuario?.email  ?? "",
    perfil: usuario?.perfil ?? "professor",
    status: usuario?.status ?? "ativo",
  });

  const isEdit = !!usuario?.id;

  function handleChange(field: keyof Usuario, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-base font-semibold text-zinc-900">
            {isEdit ? "Editar usuário" : "Novo usuário"}
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
              value={form.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
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

          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Senha *</label>
              <input
                type="password"
                placeholder="••••••••"
                className="h-10 border border-zinc-300 rounded-lg px-3 text-sm text-zinc-900 outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition"
              />
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-medium text-zinc-700">Perfil *</label>
              <select
                value={form.perfil}
                onChange={(e) => handleChange("perfil", e.target.value)}
                className="h-10 border border-zinc-300 rounded-lg px-3 text-sm text-zinc-900 outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition bg-white"
              >
                {/* 👇 Atualizado com os novos perfis */}
                <option value="professor">Professor</option>
                <option value="comercial">Comercial</option>
                <option value="secretaria">Secretaria</option>
                <option value="financeiro">Financeiro</option>
                <option value="coordenador">Coordenador</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-medium text-zinc-700">Status *</label>
              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="h-10 border border-zinc-300 rounded-lg px-3 text-sm text-zinc-900 outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10 transition bg-white"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>

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
            onClick={() => onSave(form)}
            className="h-9 px-4 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors"
          >
            {isEdit ? "Salvar alterações" : "Criar usuário"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosMock);
  const [busca, setBusca] = useState("");
  const [filtroPerfil, setFiltroPerfil] = useState<Perfil | "todos">("todos");
  const [filtroStatus, setFiltroStatus] = useState<Status | "todos">("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);

  // Filtros
  const usuariosFiltrados = usuarios.filter((u) => {
    const buscaOk = u.nome.toLowerCase().includes(busca.toLowerCase()) ||
                    u.email.toLowerCase().includes(busca.toLowerCase());
    const perfilOk = filtroPerfil === "todos" || u.perfil === filtroPerfil;
    const statusOk = filtroStatus === "todos" || u.status === filtroStatus;
    return buscaOk && perfilOk && statusOk;
  });

  function abrirNovo() {
    setUsuarioEditando(null);
    setModalAberto(true);
  }

  function abrirEditar(u: Usuario) {
    setUsuarioEditando(u);
    setModalAberto(true);
  }

  function salvar(form: Partial<Usuario>) {
    if (usuarioEditando) {
      setUsuarios((prev) =>
        prev.map((u) => (u.id === usuarioEditando.id ? { ...u, ...form } : u))
      );
    } else {
      const novo: Usuario = {
        id: Date.now(),
        nome:      form.nome   ?? "",
        email:     form.email  ?? "",
        perfil:    form.perfil ?? "professor",
        status:    form.status ?? "ativo",
        criadoEm: new Date().toLocaleDateString("pt-BR"),
      };
      setUsuarios((prev) => [novo, ...prev]);
    }
    setModalAberto(false);
  }

  function toggleStatus(id: number) {
    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === "ativo" ? "inativo" : "ativo" } : u
      )
    );
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
            onClick={abrirNovo}
            className="flex items-center gap-2 h-9 px-4 text-sm font-medium text-white bg-[#1F2A35] rounded-lg hover:bg-[#2d3d4d] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Novo usuário
          </button>
        </div>

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
            onChange={(e) => setFiltroPerfil(e.target.value as Perfil | "todos")}
            className="h-9 border border-zinc-300 rounded-lg px-3 text-sm text-zinc-700 outline-none focus:border-[#1F2A35] transition bg-white"
          >
            <option value="todos">Todos os perfis</option>
            <option value="professor">Professor</option>
            <option value="comercial">Comercial</option>
            <option value="secretaria">Secretaria</option>
            <option value="financeiro">Financeiro</option>
            <option value="coordenador">Coordenador</option>
            <option value="administrador">Administrador</option>
          </select>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as Status | "todos")}
            className="h-9 border border-zinc-300 rounded-lg px-3 text-sm text-zinc-700 outline-none focus:border-[#1F2A35] transition bg-white"
          >
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
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
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Criado em</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-zinc-400">
                    Nenhum usuário encontrado
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
                          {u.nome.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-zinc-900">{u.nome}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-zinc-500">{u.email}</td>

                    {/* Perfil badge */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${perfilColors[u.perfil]}`}>
                        {perfilLabel[u.perfil]}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.status === "ativo"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-600"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === "ativo" ? "bg-green-500" : "bg-red-400"}`} />
                        {u.status === "ativo" ? "Ativo" : "Inativo"}
                      </span>
                    </td>

                    {/* Data */}
                    <td className="px-4 py-3 text-zinc-400">{u.criadoEm}</td>

                    {/* Ações */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => abrirEditar(u)}
                          className="h-8 px-3 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => toggleStatus(u.id)}
                          className={`h-8 px-3 text-xs font-medium rounded-lg border transition-colors ${
                            u.status === "ativo"
                              ? "text-red-600 border-red-200 hover:bg-red-50"
                              : "text-green-700 border-green-200 hover:bg-green-50"
                          }`}
                        >
                          {u.status === "ativo" ? "Inativar" : "Ativar"}
                        </button>
                      </div>
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
          usuario={usuarioEditando}
          onClose={() => setModalAberto(false)}
          onSave={salvar}
        />
      )}
    </>
  );
}