"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/api/auth";
import type { User } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";
import {
  atualizarLivroEscola,
  criarLivroEscola,
  listarLivrosEscola,
  obterLivroEscola,
  type LivroEscolaDto,
  type LivroCapituloEscolaDto,
} from "@/lib/api/livros";
import { obterConfiguracoesEscola, type EscolaConfiguracoesDto } from "@/lib/api/minha-escola";
import { hasPermission } from "@/lib/permissions";
import {
  livroFormReducer,
  estadoInicial,
  calcularResumoLivro,
  duracaoCapituloMinutos,
  type CapituloDraft,
} from "@/lib/livros/livro-form-reducer";
import { minutosParaExibicao } from "@/lib/tempo/minutos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

function erroApi(e: unknown): string {
  if (e instanceof ApiError) {
    const data = e.data;
    if (typeof data === "object" && data !== null && "detail" in data) {
      const d = (data as { detail?: unknown }).detail;
      if (typeof d === "string" && d.trim()) return d.trim();
    }
  }
  if (e instanceof Error && e.message) return e.message;
  return "Não foi possível concluir a operação.";
}

const defaultConfig: EscolaConfiguracoesDto = {
  minAlunosTurma: 3,
  maxAlunosTurma: null,
  metricaAula: "POR_DIA",
  duracaoAulaMinutos: 120,
};

export default function BooksPage() {
  const [user, setUser] = useState<User | null>(null);
  const [livros, setLivros] = useState<LivroEscolaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "ativo" | "inativo">("todos");
  const [escolaConfig, setEscolaConfig] = useState<EscolaConfiguracoesDto>(defaultConfig);

  const [modalOpen, setModalOpen] = useState(false);
  const [livroEditando, setLivroEditando] = useState<LivroEscolaDto | null>(null);
  const [livroDetalhe, setLivroDetalhe] = useState<LivroEscolaDto | null>(null);
  const [carregandoDetalheLivro, setCarregandoDetalheLivro] = useState(false);
  const [salvandoModal, setSalvandoModal] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);

  // Reducer state for new livro form
  const [formState, dispatch] = useReducer(livroFormReducer, undefined, estadoInicial);

  // Edit mode state for existing chapters
  const [aulasEdicaoLinhas, setAulasEdicaoLinhas] = useState<string[]>([]);

  const podeCriar = user ? hasPermission(user, "CRIAR_LIVRO") : false;
  const podeEditar = user ? hasPermission(user, "EDITAR_LIVRO") : false;
  const podePlanejar = user ? hasPermission(user, "PLANEJAR_LIVRO") : false;

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const dados = await listarLivrosEscola();
      setLivros(dados);
    } catch {
      setLivros([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    void carregar();
    void obterConfiguracoesEscola().then(setEscolaConfig).catch(() => {});
  }, [carregar]);

  const livrosFiltrados = livros.filter((l) =>
    filtroStatus === "todos" ? true : filtroStatus === "ativo" ? l.status === "Ativo" : l.status === "Inativo",
  );

  // ── Computed summary for new livro form ──────────────────────────────────────
  const resumo = useMemo(
    () => calcularResumoLivro(formState, escolaConfig.metricaAula, escolaConfig.duracaoAulaMinutos),
    [formState, escolaConfig],
  );

  // ── Modal open/close ─────────────────────────────────────────────────────────
  function abrirNovo() {
    setLivroEditando(null);
    setLivroDetalhe(null);
    setAulasEdicaoLinhas([]);
    setCarregandoDetalheLivro(false);
    setErroModal(null);
    dispatch({ type: "RESET", payload: estadoInicial() });
    setModalOpen(true);
  }

  function abrirEditar(l: LivroEscolaDto) {
    setLivroEditando(l);
    setLivroDetalhe(null);
    setAulasEdicaoLinhas([]);
    setErroModal(null);
    dispatch({ type: "RESET", payload: { nome: l.nome, capitulos: [] } });
    setModalOpen(true);
    setCarregandoDetalheLivro(true);
    void obterLivroEscola(l.id)
      .then((d) => {
        const caps = [...(d.capitulos ?? [])].sort((a, b) => a.id - b.id);
        setLivroDetalhe({ ...d, capitulos: caps });
        setAulasEdicaoLinhas(caps.map((c) => String(c.duracaoMinutos)));
      })
      .catch(() => {
        setLivroDetalhe(null);
        setAulasEdicaoLinhas([]);
      })
      .finally(() => setCarregandoDetalheLivro(false));
  }

  function fecharModal() {
    if (salvandoModal) return;
    setModalOpen(false);
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  async function salvarModal() {
    setErroModal(null);
    setSalvandoModal(true);
    try {
      if (livroEditando) {
        await salvarEdicao();
      } else {
        await salvarNovo();
      }
      setModalOpen(false);
      setLivroEditando(null);
      setLivroDetalhe(null);
      await carregar();
    } catch (e) {
      setErroModal(erroApi(e));
    } finally {
      setSalvandoModal(false);
    }
  }

  async function salvarNovo() {
    const nome = formState.nome.trim();
    if (!nome) throw new Error("Nome é obrigatório.");
    if (!resumo.podeSalvar) throw new Error("Corrija as durações antes de salvar.");

    const capitulos = formState.capitulos.map((c) => ({
      nome: c.nome.trim() || undefined,
      duracaoMinutos: duracaoCapituloMinutos(c, escolaConfig.metricaAula, escolaConfig.duracaoAulaMinutos) ?? 0,
    }));

    await criarLivroEscola({ nome, capitulos });
  }

  async function salvarEdicao() {
    if (!livroEditando || !livroDetalhe) throw new Error("Carregue o livro antes de salvar.");

    const nome = formState.nome.trim();
    if (!nome) throw new Error("Nome é obrigatório.");

    const caps = [...(livroDetalhe.capitulos ?? [])].sort((a, b) => a.id - b.id);
    const capitulosAulas = caps.map((c, i) => ({
      capituloId: c.id,
      duracaoMinutos: parseInt(aulasEdicaoLinhas[i] ?? "0", 10),
    }));

    if (capitulosAulas.some((x) => !Number.isFinite(x.duracaoMinutos) || x.duracaoMinutos < 1)) {
      throw new Error("Cada capítulo deve ter duração de ao menos 1 minuto.");
    }

    await atualizarLivroEscola(livroEditando.id, { nome, capitulosAulas });
  }

  async function toggleStatus(l: LivroEscolaDto) {
    const proximo = l.status === "Ativo" ? "Inativo" : "Ativo";
    try {
      await atualizarLivroEscola(l.id, { status: proximo });
      await carregar();
    } catch (e) {
      alert(erroApi(e));
    }
  }

  // ── Derived for edit modal ───────────────────────────────────────────────────
  const capsEdicaoOrdenados: LivroCapituloEscolaDto[] = livroEditando
    ? [...(livroDetalhe?.capitulos ?? [])].sort((a, b) => a.id - b.id)
    : [];

  const edicaoLivroPodeSalvar =
    formState.nome.trim().length > 0 &&
    livroDetalhe !== null &&
    !carregandoDetalheLivro &&
    capsEdicaoOrdenados.every((_, i) => {
      const n = parseInt(aulasEdicaoLinhas[i] ?? "", 10);
      return Number.isFinite(n) && n >= 1;
    });

  // ── Duration input placeholder ───────────────────────────────────────────────
  const duracaoPlaceholder = escolaConfig.metricaAula === "POR_DIA" ? "ex.: 2" : "ex.: 1:30";
  const duracaoLabel =
    escolaConfig.metricaAula === "POR_DIA"
      ? `Duração (dias, 1 dia = ${minutosParaExibicao(escolaConfig.duracaoAulaMinutos)})`
      : "Duração (H:MM)";

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto">
      <div className="flex flex-shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Livros</h1>
          <p className="mt-0.5 max-w-xl text-sm text-zinc-500">
            Cadastro de níveis/livros da escola. Cada capítulo tem uma duração em minutos; ao criar ou editar um livro,
            o planejamento por dias de aula é gerado automaticamente.
          </p>
        </div>
        {podeCriar ? (
          <Button type="button" onClick={abrirNovo} className="flex-shrink-0">
            Novo livro
          </Button>
        ) : null}
      </div>

      <div className="flex flex-shrink-0 flex-wrap gap-2">
        {(["todos", "ativo", "inativo"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFiltroStatus(s)}
            className={`h-8 rounded-lg border px-4 text-sm font-medium transition-colors ${
              filtroStatus === s
                ? "border-[#1F2A35] bg-[#1F2A35] text-white"
                : "border-zinc-300 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {s === "todos" ? "Todos" : s === "ativo" ? "Ativos" : "Inativos"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Carregando…</p>
      ) : livrosFiltrados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 py-14 text-center text-sm text-zinc-500">
          Nenhum livro neste filtro. {podeCriar ? "Clique em Novo livro para cadastrar." : ""}
        </div>
      ) : (
        <div className="flex flex-col gap-2 pb-8">
          {livrosFiltrados.map((l) => (
            <div
              key={l.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-4"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-zinc-900">{l.nome}</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      l.status === "Ativo" ? "bg-green-50 text-green-700" : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {l.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {l.quantidadeCapitulos} capítulo{l.quantidadeCapitulos === 1 ? "" : "s"} ·{" "}
                  {minutosParaExibicao(l.totalDuracaoMinutos)} no total
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {podePlanejar ? (
                  <Link href={`/books/${l.id}/planejamento`}>
                    <Button type="button" variant="secondary" size="sm">
                      Planejar
                    </Button>
                  </Link>
                ) : null}
                {podeEditar ? (
                  <>
                    <Button type="button" variant="secondary" size="sm" onClick={() => abrirEditar(l)}>
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant={l.status === "Ativo" ? "danger" : "secondary"}
                      size="sm"
                      onClick={() => void toggleStatus(l)}
                    >
                      {l.status === "Ativo" ? "Inativar" : "Reativar"}
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ─────────────────────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={fecharModal}
        title={livroEditando ? "Editar livro" : "Novo livro"}
        closeDisabled={salvandoModal}
        footer={(requestClose) => (
          <>
            <Button type="button" variant="secondary" disabled={salvandoModal} onClick={requestClose}>
              Cancelar
            </Button>
            <Button
              type="button"
              isLoading={salvandoModal}
              disabled={livroEditando ? !edicaoLivroPodeSalvar : !resumo.podeSalvar}
              onClick={() => void salvarModal()}
            >
              {livroEditando ? "Salvar" : "Cadastrar"}
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          {erroModal ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{erroModal}</div>
          ) : null}

          <Input
            label="Nome do livro"
            placeholder="Ex.: Book 1, Teens A"
            value={formState.nome}
            onChange={(e) => dispatch({ type: "SET_NOME", payload: e.target.value })}
          />

          {/* ── CREATE: dynamic chapters ─────────────────────────────────────── */}
          {!livroEditando ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-700">Capítulos</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={formState.capitulos.length >= 200}
                  onClick={() => dispatch({ type: "ADD_CAPITULO" })}
                >
                  + Capítulo
                </Button>
              </div>

              {formState.capitulos.length === 0 ? (
                <p className="text-xs text-zinc-500">Adicione ao menos um capítulo.</p>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50/50 p-3">
                  {formState.capitulos.map((cap: CapituloDraft, idx: number) => {
                    const mins = duracaoCapituloMinutos(cap, escolaConfig.metricaAula, escolaConfig.duracaoAulaMinutos);
                    const invalido = cap.duracaoInput !== "" && mins === null;
                    return (
                      <div key={cap.clientId} className="flex flex-wrap items-end gap-2">
                        <Input
                          label={idx === 0 ? "Nome" : undefined}
                          className="min-w-[8rem] flex-1"
                          placeholder={`Capítulo ${idx + 1}`}
                          value={cap.nome}
                          onChange={(e) =>
                            dispatch({ type: "UPDATE_CAPITULO", payload: { clientId: cap.clientId, nome: e.target.value } })
                          }
                        />
                        <div className="flex flex-col gap-1">
                          {idx === 0 ? (
                            <span className="mb-1 block text-xs font-medium text-zinc-700">{duracaoLabel}</span>
                          ) : null}
                          <input
                            type={escolaConfig.metricaAula === "POR_DIA" ? "number" : "text"}
                            min={escolaConfig.metricaAula === "POR_DIA" ? 1 : undefined}
                            placeholder={duracaoPlaceholder}
                            value={cap.duracaoInput}
                            onChange={(e) =>
                              dispatch({
                                type: "UPDATE_CAPITULO",
                                payload: { clientId: cap.clientId, duracaoInput: e.target.value },
                              })
                            }
                            className={`h-10 w-28 rounded-lg border px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-[#1F2A35]/20 ${
                              invalido ? "border-red-400 bg-red-50" : "border-zinc-300 bg-white"
                            }`}
                          />
                          {escolaConfig.metricaAula === "POR_DIA" && cap.duracaoInput.trim() !== "" ? (
                            (() => {
                              const dias = parseInt(cap.duracaoInput, 10);
                              if (!Number.isFinite(dias) || dias < 1) return null;
                              return (
                                <span className="text-xs text-zinc-400">
                                  = {dias} dia{dias === 1 ? "" : "s"} de aula
                                </span>
                              );
                            })()
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="shrink-0"
                          onClick={() => dispatch({ type: "REMOVE_CAPITULO", payload: cap.clientId })}
                        >
                          ✕
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Real-time summary */}
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                <p className="text-xs text-zinc-700">
                  Total: <strong>{resumo.totalExibicao}</strong> · ~{resumo.aulasEstimadas} aula
                  {resumo.aulasEstimadas === 1 ? "" : "s"}
                  {" ("}duração: {minutosParaExibicao(escolaConfig.duracaoAulaMinutos)}/dia{")"}
                </p>
                {resumo.totalMinutos > 0 && !resumo.fechamentoExato ? (
                  <p className="mt-1 text-xs text-amber-700">
                    ⚠ O tempo total ({resumo.totalMinutos}min) não é múltiplo exato de{" "}
                    {escolaConfig.duracaoAulaMinutos}min. Faltam {escolaConfig.duracaoAulaMinutos - resumo.resto}min para
                    completar o último dia. Ajuste as durações antes de salvar.
                  </p>
                ) : resumo.fechamentoExato ? (
                  <p className="mt-1 text-xs text-emerald-700">✓ Tempo fecha exatamente em {resumo.aulasEstimadas} dias de aula.</p>
                ) : null}
              </div>
            </div>
          ) : (
            // ── EDIT: existing chapters ─────────────────────────────────────────
            <div className="mt-2 space-y-3">
              {carregandoDetalheLivro ? (
                <p className="text-sm text-zinc-500">Carregando capítulos…</p>
              ) : !livroDetalhe ? (
                <p className="text-sm text-amber-800">Não foi possível carregar o livro. Feche e tente novamente.</p>
              ) : capsEdicaoOrdenados.length === 0 ? (
                <p className="text-sm text-zinc-600">Este livro não tem capítulos.</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-zinc-700">Capítulos — duração em minutos</p>
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50/50 p-3">
                    {capsEdicaoOrdenados.map((c, i) => (
                      <div key={c.id} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                        <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-700" title={c.nome}>
                          {c.nome}
                        </span>
                        <Input
                          id={`livro-edit-dur-${c.id}`}
                          className="w-24 shrink-0"
                          type="number"
                          min={1}
                          value={aulasEdicaoLinhas[i] ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setAulasEdicaoLinhas((prev) => {
                              const next = [...prev];
                              while (next.length <= i) next.push("");
                              next[i] = v;
                              return next;
                            });
                          }}
                          aria-label={`Duração (min) — ${c.nome}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
