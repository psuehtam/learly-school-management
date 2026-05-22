"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { getCurrentUser } from "@/lib/api/auth";
import {
  listarContratoTemplates,
  listarVariaveisContrato,
  criarContratoTemplate,
  editarContratoTemplate,
  ativarContratoTemplate,
  inativarContratoTemplate,
  listarPreAlunos,
  gerarContrato,
  getApiErrorMessage,
} from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { User } from "@/lib/api/types";
import type {
  ContratoTemplate,
  ContratoVariavel,
  ContratoGeradoData,
} from "@/types/comercial";
import type { PreAlunoListItem } from "@/types/comercial";

// ─────────────────── helpers ───────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-BR");
}

// ─────────────────── Toolbar ───────────────────

interface EditorToolbarProps {
  editor: ReturnType<typeof useEditor>;
  variaveis: ContratoVariavel[];
}

function EditorToolbar({ editor, variaveis }: EditorToolbarProps) {
  const [showVars, setShowVars] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowVars(false);
      }
    }
    if (showVars) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showVars]);

  if (!editor) return null;

  function btn(active: boolean, onClick: () => void, title: string, children: React.ReactNode) {
    return (
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onClick(); }}
        title={title}
        className={`rounded px-2 py-1 text-sm transition ${active ? "bg-[#4a6d8c] text-white" : "hover:bg-zinc-100 text-zinc-600"}`}
      >
        {children}
      </button>
    );
  }

  function insertVariavel(variavel: string) {
    editor?.chain().focus().insertContent(variavel).run();
    setShowVars(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5">
      {btn(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), "Negrito (Ctrl+B)", <strong>B</strong>)}
      {btn(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), "Itálico (Ctrl+I)", <em>I</em>)}
      {btn(editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), "Sublinhado (Ctrl+U)", <span className="underline">U</span>)}
      {btn(editor.isActive("strike"), () => editor.chain().focus().toggleStrike().run(), "Tachado", <span className="line-through">S</span>)}

      <div className="mx-1 h-4 w-px bg-zinc-300" />

      {btn(editor.isActive({ textAlign: "left" }), () => editor.chain().focus().setTextAlign("left").run(), "Alinhar à esquerda",
        <svg viewBox="0 0 16 16" className="size-4" fill="currentColor"><path d="M2 4h12v1H2zm0 3h8v1H2zm0 3h12v1H2zm0 3h8v1H2z" /></svg>
      )}
      {btn(editor.isActive({ textAlign: "center" }), () => editor.chain().focus().setTextAlign("center").run(), "Centralizar",
        <svg viewBox="0 0 16 16" className="size-4" fill="currentColor"><path d="M2 4h12v1H2zm2 3h8v1H4zm-2 3h12v1H2zm2 3h8v1H4z" /></svg>
      )}
      {btn(editor.isActive({ textAlign: "right" }), () => editor.chain().focus().setTextAlign("right").run(), "Alinhar à direita",
        <svg viewBox="0 0 16 16" className="size-4" fill="currentColor"><path d="M2 4h12v1H2zm4 3h8v1H6zm-4 3h12v1H2zm4 3h8v1H6z" /></svg>
      )}
      {btn(editor.isActive({ textAlign: "justify" }), () => editor.chain().focus().setTextAlign("justify").run(), "Justificar",
        <svg viewBox="0 0 16 16" className="size-4" fill="currentColor"><path d="M2 4h12v1H2zm0 3h12v1H2zm0 3h12v1H2zm0 3h10v1H2z" /></svg>
      )}

      <div className="mx-1 h-4 w-px bg-zinc-300" />

      {btn(editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), "Lista com marcadores",
        <svg viewBox="0 0 16 16" className="size-4" fill="currentColor"><circle cx="2.5" cy="4.5" r="1" /><path d="M5 4h9v1H5zm-2.5 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm2.5 0h9V7H5zm-2.5 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm2.5 0h9v-1H5z" /></svg>
      )}
      {btn(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), "Lista numerada",
        <svg viewBox="0 0 16 16" className="size-4" fill="currentColor"><path d="M1 1h1v3H1zm0 0" /><path d="M5 2h9v1H5zm-4 4h2v1H2v1h2v.5H1V9h2v.5H1V11h2v-1h1V8H1zm4 1h9v1H5zm-4 5h1v-1H1v1H0v1h2V13H1zm4-1h9v1H5z" /></svg>
      )}

      <div className="mx-1 h-4 w-px bg-zinc-300" />

      <div ref={panelRef} className="relative">
        <button
          type="button"
          onClick={() => setShowVars((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded bg-[#4a6d8c]/10 px-2.5 py-1 text-xs font-semibold text-[#4a6d8c] transition hover:bg-[#4a6d8c]/20"
        >
          <svg viewBox="0 0 20 20" className="size-3.5" fill="currentColor" aria-hidden>
            <path d="M3 4a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 4a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 4a1 1 0 0 1 1-1h10a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1z" />
          </svg>
          Inserir variável
        </button>

        {showVars && (
          <div className="absolute left-0 top-full z-30 mt-1 max-h-64 w-72 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-xl">
            {variaveis.map((v) => (
              <button
                key={v.variavel}
                type="button"
                onClick={() => insertVariavel(v.variavel)}
                className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-zinc-50"
              >
                <span className="font-mono text-xs font-semibold text-[#4a6d8c]">{v.variavel}</span>
                <span className="text-xs text-zinc-500">{v.descricao}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────── Modal Template ───────────────────

interface ModalTemplateProps {
  open: boolean;
  onClose: () => void;
  template?: ContratoTemplate | null;
  variaveis: ContratoVariavel[];
  onSaved: () => void;
}

function ModalTemplate({ open, onClose, template, variaveis, onSaved }: ModalTemplateProps) {
  const isEdicao = !!template;
  const [nome, setNome] = useState("");
  const [ativar, setAtivar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [dirty, setDirty] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: "",
    onUpdate: () => setDirty(true),
  });

  useEffect(() => {
    if (!open) return;
    setNome(template?.nome ?? "");
    setAtivar(false);
    setErro("");
    setDirty(false);
    editor?.commands.setContent(template?.conteudoHtml ?? "<p></p>");
  }, [open, template, editor]);

  async function handleSalvar() {
    const html = editor?.getHTML() ?? "";
    if (!nome.trim()) { setErro("Nome é obrigatório."); return; }
    if (!html || html === "<p></p>") { setErro("Conteúdo do template é obrigatório."); return; }

    setSaving(true);
    setErro("");
    try {
      if (isEdicao && template) {
        await editarContratoTemplate(template.id, { nome: nome.trim(), conteudoHtml: html });
      } else {
        await criarContratoTemplate({ nome: nome.trim(), conteudoHtml: html, ativarImediatamente: ativar });
      }
      onSaved();
      onClose();
    } catch (e) {
      setErro(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdicao ? "Editar template" : "Novo modelo de contrato"}
      className="max-w-4xl"
      hasUnsavedChanges={dirty}
      closeDisabled={saving}
      footer={(rc) => (
        <>
          <Button variant="secondary" onClick={rc} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSalvar} disabled={saving}>
            {saving ? "Salvando…" : isEdicao ? "Salvar alterações" : "Criar template"}
          </Button>
        </>
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Nome do template *</label>
          <Input
            value={nome}
            onChange={(e) => { setNome(e.target.value); setDirty(true); }}
            placeholder="Ex.: Contrato Padrão 2026"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Conteúdo *</label>
          <div className="overflow-hidden rounded-lg border border-zinc-200">
            <EditorToolbar editor={editor} variaveis={variaveis} />
            <EditorContent
              editor={editor}
              className="prose prose-sm min-h-[320px] max-w-none p-4 text-zinc-900 focus-within:outline-none [&_.ProseMirror]:min-h-[300px] [&_.ProseMirror]:outline-none"
            />
          </div>
          <p className="text-xs text-zinc-400">
            Use o botão "Inserir variável" para adicionar campos dinâmicos como <span className="font-mono">{"{{PreAluno_NomeCompleto}}"}</span>.
          </p>
        </div>

        {!isEdicao && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={ativar}
              onChange={(e) => setAtivar(e.target.checked)}
              className="size-4 rounded accent-[#4a6d8c]"
            />
            Ativar este template imediatamente (desativa o atual)
          </label>
        )}

        {erro && (
          <p role="alert" className="text-sm font-medium text-red-600">{erro}</p>
        )}
      </div>
    </Modal>
  );
}

// ─────────────────── Modal Gerar Contrato ───────────────────

function serializarGerarContratoEstado(p: {
  busca: string;
  preAlunoId: number | "";
  templateId: number | "";
}) {
  return JSON.stringify(p);
}

interface ModalGerarProps {
  open: boolean;
  onClose: () => void;
  templates: ContratoTemplate[];
  preAlunos: PreAlunoListItem[];
  preAlunoIdInicial?: number | null;
}

function ModalGerarContrato({ open, onClose, templates, preAlunos, preAlunoIdInicial }: ModalGerarProps) {
  const [busca, setBusca] = useState("");
  const [preAlunoId, setPreAlunoId] = useState<number | "">("");
  const [templateId, setTemplateId] = useState<number | "">("");
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState<ContratoGeradoData | null>(null);
  const [baseline, setBaseline] = useState("");

  const templateAtivo = templates.find((t) => t.ativo);

  useEffect(() => {
    if (!open) {
      setBaseline("");
      return;
    }
    const templateInicial = templateAtivo?.id ?? "";
    setBusca("");
    setPreAlunoId(preAlunoIdInicial ?? "");
    setTemplateId(templateInicial);
    setErro("");
    setResultado(null);
    setBaseline(
      serializarGerarContratoEstado({
        busca: "",
        preAlunoId: preAlunoIdInicial ?? "",
        templateId: templateInicial,
      }),
    );
  }, [open, preAlunoIdInicial, templateAtivo]);

  const estadoAtual = serializarGerarContratoEstado({ busca, preAlunoId, templateId });
  const temAlteracao =
    open && !gerando && baseline !== "" && estadoAtual !== baseline;

  const preAlunosFiltrados = preAlunos.filter((p) => {
    const q = busca.toLowerCase();
    return !q || p.nomeCompletoAluno.toLowerCase().includes(q);
  });

  async function handleGerar() {
    if (!preAlunoId) { setErro("Selecione o pré-aluno."); return; }
    setGerando(true);
    setErro("");
    try {
      const data = await gerarContrato({
        preAlunoId: Number(preAlunoId),
        templateId: templateId ? Number(templateId) : null,
      });
      setResultado(data);
    } catch (e) {
      setErro(getApiErrorMessage(e));
    } finally {
      setGerando(false);
    }
  }

  function handleImprimir() {
    if (!resultado) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Contrato - ${resultado.nomeTemplate}</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; font-size: 12pt; line-height: 1.6; margin: 2cm 2.5cm; color: #111; }
            h1,h2,h3 { margin-top: 1.2em; }
            p { margin: 0.5em 0; }
            ul,ol { margin: 0.5em 0 0.5em 1.5em; }
            @media print { body { margin: 1.5cm 2cm; } }
          </style>
        </head>
        <body>
          ${resultado.conteudoGeradoHtml}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }

  const SELECT =
    "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none focus:border-[#4a6d8c] focus:ring-2 focus:ring-[#4a6d8c]/20";

  if (resultado) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Contrato gerado"
        className="max-w-4xl"
        hasUnsavedChanges
        confirmDiscardMessage="Deseja fechar? O contrato já foi gerado — imprima ou salve em PDF antes de sair, se precisar."
        footer={(rc) => (
          <>
            <Button variant="secondary" onClick={rc}>Fechar</Button>
            <Button onClick={handleImprimir}>
              <svg className="mr-1.5 size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Imprimir / PDF
            </Button>
          </>
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            Template: <strong>{resultado.nomeTemplate}</strong>
          </p>
          <p className="text-xs text-zinc-400">
            {new Date(resultado.dataGeracao).toLocaleString("pt-BR")}
          </p>
        </div>
        <div
          className="prose prose-sm max-w-none rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
          dangerouslySetInnerHTML={{ __html: resultado.conteudoGeradoHtml }}
        />
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Gerar contrato"
      hasUnsavedChanges={temAlteracao}
      closeDisabled={gerando}
      footer={(rc) => (
        <>
          <Button variant="secondary" onClick={rc} disabled={gerando}>Cancelar</Button>
          <Button onClick={handleGerar} disabled={gerando}>
            {gerando ? "Gerando…" : "Gerar contrato"}
          </Button>
        </>
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Buscar pré-aluno</label>
          <Input
            placeholder="Digite o nome…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Pré-aluno *</label>
          <select
            value={preAlunoId}
            onChange={(e) => setPreAlunoId(e.target.value ? Number(e.target.value) : "")}
            className={SELECT}
          >
            <option value="">Selecione…</option>
            {preAlunosFiltrados.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nomeCompletoAluno}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Template</label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value ? Number(e.target.value) : "")}
            className={SELECT}
          >
            <option value="">Usar template ativo{templateAtivo ? ` (${templateAtivo.nome})` : " — nenhum ativo"}</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                v{t.versao} — {t.nome}{t.ativo ? " ✓" : ""}
              </option>
            ))}
          </select>
        </div>

        {erro && <p role="alert" className="text-sm font-medium text-red-600">{erro}</p>}
      </div>
    </Modal>
  );
}

// ─────────────────── Página principal ───────────────────

export default function ContratosPage() {
  const [user, setUser] = useState<User | null>(null);
  const [templates, setTemplates] = useState<ContratoTemplate[]>([]);
  const [variaveis, setVariaveis] = useState<ContratoVariavel[]>([]);
  const [preAlunos, setPreAlunos] = useState<PreAlunoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [modalTemplate, setModalTemplate] = useState(false);
  const [templateEditando, setTemplateEditando] = useState<ContratoTemplate | null>(null);
  const [modalGerar, setModalGerar] = useState(false);
  const [atualizandoId, setAtualizandoId] = useState<number | null>(null);

  const canEdit = hasPermission(user, "CRIAR_TEMPLATE_CONTRATO") || hasPermission(user, "EDITAR_TEMPLATE_CONTRATO");
  const canGerar = hasPermission(user, "GERAR_CONTRATO");
  const canInativar = hasPermission(user, "INATIVAR_TEMPLATE_CONTRATO");

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      const [u, tmpl, vars, pa] = await Promise.all([
        getCurrentUser(),
        listarContratoTemplates(),
        listarVariaveisContrato(),
        listarPreAlunos(),
      ]);
      setUser(u);
      setTemplates(tmpl);
      setVariaveis(vars);
      setPreAlunos(pa);
    } catch (e) {
      setErro(getApiErrorMessage(e, "Erro ao carregar dados."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function handleAtivar(id: number) {
    setAtualizandoId(id);
    try { await ativarContratoTemplate(id); await carregar(); }
    catch (e) { alert(getApiErrorMessage(e)); }
    finally { setAtualizandoId(null); }
  }

  async function handleInativar(id: number) {
    if (!confirm("Deseja inativar este template?")) return;
    setAtualizandoId(id);
    try { await inativarContratoTemplate(id); await carregar(); }
    catch (e) { alert(getApiErrorMessage(e)); }
    finally { setAtualizandoId(null); }
  }

  function abrirEditar(t: ContratoTemplate) {
    setTemplateEditando(t);
    setModalTemplate(true);
  }

  function abrirNovo() {
    setTemplateEditando(null);
    setModalTemplate(true);
  }

  const templateAtivo = templates.find((t) => t.ativo);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Contratos</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Gerencie modelos de contrato e gere contratos para pré-alunos.
          </p>
        </div>
        <div className="flex gap-2">
          {canGerar && (
            <Button
              variant="secondary"
              onClick={() => setModalGerar(true)}
              disabled={loading}
            >
              <svg className="mr-1.5 size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              Gerar contrato
            </Button>
          )}
          {canEdit && (
            <Button onClick={abrirNovo} disabled={loading}>
              <svg className="mr-1.5 size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Novo modelo
            </Button>
          )}
        </div>
      </div>

      {/* Template ativo em destaque */}
      {templateAtivo && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <svg className="size-5 shrink-0 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <p className="text-sm text-green-800">
            Template ativo: <strong>{templateAtivo.nome}</strong> (v{templateAtivo.versao})
          </p>
        </div>
      )}

      {/* Erros */}
      {erro && (
        <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      {/* Tabela */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-zinc-400">
            <svg className="mr-2 size-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            Carregando…
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-400">
            <svg className="size-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <p className="text-sm">Nenhum modelo de contrato cadastrado.</p>
            {canEdit && (
              <Button onClick={abrirNovo} variant="secondary">
                Criar o primeiro modelo
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Versão</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Criado em</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {templates.map((t) => {
                const busy = atualizandoId === t.id;
                return (
                  <tr key={t.id} className="transition-colors hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">{t.nome}</td>
                    <td className="px-4 py-3 text-zinc-600">v{t.versao}</td>
                    <td className="px-4 py-3">
                      {t.ativo ? (
                        <Badge className="bg-green-100 text-green-700">Ativo</Badge>
                      ) : (
                        <Badge className="bg-zinc-100 text-zinc-500">Inativo</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{formatDate(t.dataCriacao)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {canGerar && (
                          <button
                            type="button"
                            title="Gerar contrato com este template"
                            onClick={() => { setTemplateEditando(t); setModalGerar(true); }}
                            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                          >
                            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                          </button>
                        )}
                        {canEdit && (
                          <button
                            type="button"
                            title="Editar template"
                            onClick={() => abrirEditar(t)}
                            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                          >
                            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                        )}
                        {canEdit && !t.ativo && (
                          <button
                            type="button"
                            title="Ativar template"
                            disabled={busy}
                            onClick={() => handleAtivar(t.id)}
                            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-green-50 hover:text-green-600 disabled:opacity-40"
                          >
                            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="20 6 9 17 4 12"/></svg>
                          </button>
                        )}
                        {canInativar && t.ativo && (
                          <button
                            type="button"
                            title="Inativar template"
                            disabled={busy}
                            onClick={() => handleInativar(t.id)}
                            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                          >
                            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modais */}
      <ModalTemplate
        open={modalTemplate}
        onClose={() => setModalTemplate(false)}
        template={templateEditando}
        variaveis={variaveis}
        onSaved={carregar}
      />

      <ModalGerarContrato
        open={modalGerar}
        onClose={() => { setModalGerar(false); setTemplateEditando(null); }}
        templates={templates}
        preAlunos={preAlunos}
        preAlunoIdInicial={null}
      />
    </div>
  );
}
