"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  getPerfis,
  getPermissoesAgrupadas,
  getPermissoesDoPerfil,
  salvarPermissoes,
  type PermissaoCatalogoItem,
  type PerfilTemplate,
  type PermissaoModuloGrupo,
} from "@/lib/api/templates";

// ─── Agrupamento por página ────────────────────────────────────────────────

const PAGINAS_PERMISSOES: { id: string; rotulo: string; permissoes: string[] }[] = [
  {
    id: "dashboard",
    rotulo: "Dashboard",
    permissoes: [
      "VISUALIZAR_DASHBOARD_GERAL",
      "VISUALIZAR_DASHBOARD_FINANCEIRO",
      "VISUALIZAR_DASHBOARD_ACADEMICO",
      "VISUALIZAR_AGENDA_GLOBAL",
    ],
  },
  {
    id: "pre-alunos",
    rotulo: "Pré-alunos",
    permissoes: [
      "VISUALIZAR_PRE_ALUNO",
      "CRIAR_PRE_ALUNO",
      "EDITAR_PRE_ALUNO",
      "CANCELAR_PRE_ALUNO",
      "APROVAR_MATRICULA",
      "REPROVAR_MATRICULA",
    ],
  },
  {
    id: "contratos",
    rotulo: "Contratos",
    permissoes: [
      "VISUALIZAR_TEMPLATE_CONTRATO",
      "CRIAR_TEMPLATE_CONTRATO",
      "EDITAR_TEMPLATE_CONTRATO",
      "INATIVAR_TEMPLATE_CONTRATO",
      "GERAR_CONTRATO",
      "VISUALIZAR_CONTRATO",
    ],
  },
  {
    id: "matriculas",
    rotulo: "Matrículas",
    permissoes: [
      "VISUALIZAR_MATRICULA",
      "CRIAR_MATRICULA",
      "EDITAR_MATRICULA",
      "CANCELAR_MATRICULA",
      "FINALIZAR_MATRICULA",
      "DEVOLVER_MATRICULA_COMERCIAL",
      "REMOVER_ANEXO_MATRICULA",
    ],
  },
  {
    id: "alunos",
    rotulo: "Alunos",
    permissoes: [
      "VISUALIZAR_ALUNO",
      "EDITAR_ALUNO",
      "INATIVAR_ALUNO",
      "TRANCAR_ALUNO",
      "VISUALIZAR_HISTORICO_ALUNO",
      "ANEXAR_DOCUMENTO_ALUNO",
      "INATIVAR_DOCUMENTO_ALUNO",
      "EXCLUIR_DOCUMENTO_ALUNO",
      "JUSTIFICAR_FALTA_ALUNO",
    ],
  },
  {
    id: "responsaveis",
    rotulo: "Responsáveis e Filiações",
    permissoes: [
      "VISUALIZAR_RESPONSAVEL",
      "CRIAR_RESPONSAVEL",
      "EDITAR_RESPONSAVEL",
      "INATIVAR_RESPONSAVEL",
      "CRIAR_FILIACAO",
      "EDITAR_FILIACAO",
    ],
  },
  {
    id: "turmas",
    rotulo: "Turmas",
    permissoes: [
      "VISUALIZAR_TURMA",
      "CRIAR_TURMA",
      "EDITAR_TURMA",
      "AGENDAR_TURMA",
      "EDITAR_DIAS_TURMA",
      "CONCLUIR_TURMA",
      "INATIVAR_TURMA",
      "CANCELAR_TURMA",
      "VINCULAR_ALUNO_TURMA",
      "DESVINCULAR_ALUNO_TURMA",
      "REMANEJAR_ALUNO",
    ],
  },
  {
    id: "aulas",
    rotulo: "Aulas e Professor",
    permissoes: [
      "VISUALIZAR_AULA",
      "CRIAR_AULA",
      "EDITAR_AULA",
      "CANCELAR_AULA",
      "REALIZAR_AULA",
      "REGISTRAR_CONTEUDO_AULA",
      "REALIZAR_CHAMADA",
      "VISUALIZAR_PRESENCA",
      "EDITAR_PRESENCA",
      "LANCAR_HOMEWORK",
      "VISUALIZAR_HOMEWORK",
      "EDITAR_HOMEWORK",
      "LANCAR_AVALIACAO",
      "VISUALIZAR_AVALIACAO",
      "EDITAR_AVALIACAO",
      "CRIAR_OCORRENCIA_ACADEMICA",
      "CRIAR_OCORRENCIA_ADMINISTRATIVA",
      "VISUALIZAR_OCORRENCIA",
      "EDITAR_OCORRENCIA",
    ],
  },
  {
    id: "reposicoes",
    rotulo: "Reposições",
    permissoes: [
      "VISUALIZAR_REPOSICAO",
      "CRIAR_REPOSICAO",
      "EDITAR_REPOSICAO",
      "CANCELAR_REPOSICAO",
      "REALIZAR_REPOSICAO",
    ],
  },
  {
    id: "livros",
    rotulo: "Livros",
    permissoes: [
      "VISUALIZAR_LIVRO",
      "CRIAR_LIVRO",
      "EDITAR_LIVRO",
      "INATIVAR_LIVRO",
      "CRIAR_CAPITULO",
      "EDITAR_CAPITULO",
      "VISUALIZAR_CAPITULO",
      "INATIVAR_CAPITULO",
      "MARCAR_CAPITULO_CONCLUIDO",
      "VISUALIZAR_PROGRESSO_CAPITULO",
      "PLANEJAR_LIVRO",
    ],
  },
  {
    id: "financeiro",
    rotulo: "Financeiro",
    permissoes: [
      "VISUALIZAR_PARCELA",
      "CRIAR_PARCELA",
      "EDITAR_PARCELA",
      "BAIXA_PARCELA",
      "ESTORNAR_PARCELA",
      "INATIVAR_PARCELA",
      "GERAR_CARNE_ESCOLAR",
      "GERAR_RECIBO",
      "VISUALIZAR_HISTORICO_PARCELA",
      "VISUALIZAR_MOVIMENTACAO_FINANCEIRA",
      "CRIAR_CONTA_BANCARIA",
      "EDITAR_CONTA_BANCARIA",
      "VISUALIZAR_CONTA_BANCARIA",
      "INATIVAR_CONTA_BANCARIA",
      "CRIAR_CATEGORIA_FINANCEIRA",
      "EDITAR_CATEGORIA_FINANCEIRA",
      "VISUALIZAR_CATEGORIA_FINANCEIRA",
      "INATIVAR_CATEGORIA_FINANCEIRA",
    ],
  },
  {
    id: "agenda",
    rotulo: "Agenda e Compromissos",
    permissoes: [
      "VISUALIZAR_CALENDARIO",
      "GERENCIAR_CALENDARIO",
      "EDITAR_EVENTO_CALENDARIO",
      "EXCLUIR_EVENTO_CALENDARIO",
      "CRIAR_COMPROMISSO",
      "VISUALIZAR_COMPROMISSOS",
      "EDITAR_COMPROMISSO",
      "EXCLUIR_COMPROMISSO",
      "VISUALIZAR_COMPROMISSOS_OUTROS",
      "ADICIONAR_PARTICIPANTE_COMPROMISSO",
      "CONFIRMAR_COMPROMISSO",
      "RECUSAR_COMPROMISSO",
    ],
  },
  {
    id: "usuarios",
    rotulo: "Usuários e Perfis",
    permissoes: [
      "VISUALIZAR_USUARIO",
      "CRIAR_USUARIO",
      "EDITAR_USUARIO",
      "INATIVAR_USUARIO",
      "GERENCIAR_PERMISSOES_USUARIO",
      "VISUALIZAR_PERFIL",
      "CRIAR_PERFIL",
      "EDITAR_PERFIL",
    ],
  },
  {
    id: "relatorios",
    rotulo: "Relatórios",
    permissoes: [
      "VISUALIZAR_RELATORIO_FREQUENCIA",
      "VISUALIZAR_RELATORIO_NOTAS",
      "VISUALIZAR_RELATORIO_TURMAS",
      "VISUALIZAR_RELATORIO_ALUNOS",
      "VISUALIZAR_RELATORIO_FINANCEIRO",
      "VISUALIZAR_RELATORIO_INADIMPLENCIA",
      "VISUALIZAR_RELATORIO_RECEITAS",
    ],
  },
  {
    id: "sistema",
    rotulo: "Administração e Sistema",
    permissoes: [
      "GERENCIAR_CONFIGURACOES_SISTEMA",
      "GERENCIAR_BACKUP",
      "VISUALIZAR_METRICAS_SISTEMA",
      "IMPORTAR_ALUNOS",
      "EXPORTAR_ALUNOS",
      "IMPORTAR_FINANCEIRO",
      "EXPORTAR_FINANCEIRO",
      "VISUALIZAR_LOGS_AUDITORIA",
      "EXPORTAR_LOGS",
      "VISUALIZAR_LOGS_USUARIO",
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Retorna o nome da permissão pai (VISUALIZAR_X) para uma permissão filha, se existir. */
function getNomePermissaoPai(
  nomePermissao: string,
  permissaoIdByNome: Map<string, number>,
): string | null {
  if (nomePermissao.startsWith("VISUALIZAR_")) return null;
  const [, ...sufixo] = nomePermissao.split("_");
  if (sufixo.length === 0) return null;
  const possivelPai = `VISUALIZAR_${sufixo.join("_")}`;
  return permissaoIdByNome.has(possivelPai) ? possivelPai : null;
}

function coletarIdsComDependencias(
  permissaoIds: number[],
  permissaoById: Map<number, PermissaoCatalogoItem>,
  permissaoIdByNome: Map<string, number>,
) {
  const resultado = new Set<number>(permissaoIds);
  for (const id of permissaoIds) {
    const permissao = permissaoById.get(id);
    if (!permissao) continue;
    const nomePai = getNomePermissaoPai(permissao.nome, permissaoIdByNome);
    if (!nomePai) continue;
    const paiId = permissaoIdByNome.get(nomePai);
    if (paiId) resultado.add(paiId);
  }
  return Array.from(resultado).sort((a, b) => a - b);
}

function formatarNomePermissao(nomePermissao: string) {
  return nomePermissao.toLowerCase().replaceAll("_", " ");
}

// ─── Componente ───────────────────────────────────────────────────────────

export function GerenciarTemplates() {
  const [perfis, setPerfis] = useState<PerfilTemplate[]>([]);
  // permissoesAgrupadas é usado apenas para montar o catálogo flat; o agrupamento visual é pelo PAGINAS_PERMISSOES
  const [permissoesAgrupadas, setPermissoesAgrupadas] = useState<PermissaoModuloGrupo[]>([]);
  const [perfilSelecionado, setPerfilSelecionado] = useState<number | "">("");
  const [permissoesMarcadas, setPermissoesMarcadas] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [filtroPermissao, setFiltroPermissao] = useState("");
  const [mostrarSomenteSelecionadas, setMostrarSomenteSelecionadas] = useState(false);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      setIsLoading(true);
      setErro("");
      try {
        const [listaPerfis, grupos] = await Promise.all([getPerfis(), getPermissoesAgrupadas()]);
        if (cancelado) return;
        setPerfis(listaPerfis);
        setPermissoesAgrupadas(grupos);
      } catch (e) {
        if (!cancelado) setErro(getApiErrorMessage(e, "Nao foi possivel carregar os dados."));
      } finally {
        if (!cancelado) setIsLoading(false);
      }
    })();
    return () => { cancelado = true; };
  }, []);

  const carregarMarcacoesDoPerfil = useCallback(async (id: number) => {
    setErro("");
    setSucesso("");
    try {
      const res = await getPermissoesDoPerfil(id);
      setPermissoesMarcadas([...res.permissaoIds]);
    } catch (e) {
      setPermissoesMarcadas([]);
      setErro(getApiErrorMessage(e, "Nao foi possivel carregar as permissoes deste perfil."));
    }
  }, []);

  useEffect(() => {
    if (perfilSelecionado === "") { setPermissoesMarcadas([]); return; }
    void carregarMarcacoesDoPerfil(perfilSelecionado);
  }, [perfilSelecionado, carregarMarcacoesDoPerfil]);

  // Catálogo flat de todas as permissões vindas do backend
  const permissoesCatalogo = useMemo(
    () => permissoesAgrupadas.flatMap((g) => g.permissoes),
    [permissoesAgrupadas],
  );

  const permissaoById = useMemo(
    () => new Map(permissoesCatalogo.map((p) => [p.id, p])),
    [permissoesCatalogo],
  );

  const permissaoIdByNome = useMemo(
    () => new Map(permissoesCatalogo.map((p) => [p.nome, p.id])),
    [permissoesCatalogo],
  );

  const dependenciasByFilhaId = useMemo(() => {
    const mapa = new Map<number, number>();
    for (const perm of permissoesCatalogo) {
      const nomePai = getNomePermissaoPai(perm.nome, permissaoIdByNome);
      if (!nomePai) continue;
      const idPai = permissaoIdByNome.get(nomePai);
      if (idPai) mapa.set(perm.id, idPai);
    }
    return mapa;
  }, [permissoesCatalogo, permissaoIdByNome]);

  // Páginas com as permissões resolvidas (somente as que existem no catálogo)
  const paginasResolvidas = useMemo(() => {
    return PAGINAS_PERMISSOES.map((pagina) => {
      const permissoes = pagina.permissoes
        .map((nome) => {
          const id = permissaoIdByNome.get(nome);
          return id !== undefined ? permissaoById.get(id) : undefined;
        })
        .filter((p): p is PermissaoCatalogoItem => p !== undefined);
      return { ...pagina, permissoes };
    }).filter((p) => p.permissoes.length > 0);
  }, [permissaoById, permissaoIdByNome]);

  const marcadasSet = useMemo(() => new Set(permissoesMarcadas), [permissoesMarcadas]);
  const termoFiltro = filtroPermissao.trim().toLowerCase();

  const paginasFiltradas = useMemo(() => {
    return paginasResolvidas
      .map((pagina) => {
        const permissoes = pagina.permissoes.filter((perm) => {
          if (mostrarSomenteSelecionadas && !marcadasSet.has(perm.id)) return false;
          if (!termoFiltro) return true;
          return `${perm.nome} ${perm.descricao ?? ""}`.toLowerCase().includes(termoFiltro);
        });
        return { ...pagina, permissoes };
      })
      .filter((p) => p.permissoes.length > 0);
  }, [marcadasSet, mostrarSomenteSelecionadas, paginasResolvidas, termoFiltro]);

  function handleSelecionarPerfil(idStr: string) {
    setSucesso("");
    if (idStr === "") { setPerfilSelecionado(""); setFiltroPermissao(""); setMostrarSomenteSelecionadas(false); return; }
    const id = Number(idStr);
    if (!Number.isFinite(id)) { setPerfilSelecionado(""); return; }
    setPerfilSelecionado(id);
  }

  function handleTogglePermissao(perm: PermissaoCatalogoItem, marcado: boolean) {
    setPermissoesMarcadas((prev) => {
      const next = new Set(prev);
      if (marcado) {
        next.add(perm.id);
        const nomePai = getNomePermissaoPai(perm.nome, permissaoIdByNome);
        if (nomePai) {
          const paiId = permissaoIdByNome.get(nomePai);
          if (paiId) next.add(paiId);
        }
      } else {
        next.delete(perm.id);
        for (const [filhaId, paiId] of dependenciasByFilhaId.entries()) {
          if (paiId === perm.id) next.delete(filhaId);
        }
      }
      return Array.from(next).sort((a, b) => a - b);
    });
  }

  function handleMarcarPagina(permissoesDaPagina: PermissaoCatalogoItem[]) {
    setPermissoesMarcadas((prev) => {
      const ids = permissoesDaPagina.map((p) => p.id);
      return coletarIdsComDependencias([...prev, ...ids], permissaoById, permissaoIdByNome);
    });
  }

  function handleLimparPagina(permissoesDaPagina: PermissaoCatalogoItem[]) {
    const idsPagina = new Set(permissoesDaPagina.map((p) => p.id));
    setPermissoesMarcadas((prev) => {
      const next = new Set(prev.filter((id) => !idsPagina.has(id)));
      for (const [filhaId, paiId] of dependenciasByFilhaId.entries()) {
        if (!next.has(paiId)) next.delete(filhaId);
      }
      return Array.from(next).sort((a, b) => a - b);
    });
  }

  async function handleSalvar() {
    if (perfilSelecionado === "") { setErro("Selecione um perfil de template antes de salvar."); return; }
    setIsSaving(true);
    setErro("");
    setSucesso("");
    try {
      await salvarPermissoes(perfilSelecionado, permissoesMarcadas);
      setSucesso("Permissoes salvas com sucesso.");
    } catch (e) {
      setErro(getApiErrorMessage(e, "Nao foi possivel salvar as permissoes."));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
        Carregando templates...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-slate-50 to-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Gestao de templates</h1>
        <p className="text-sm text-zinc-600 mt-1 max-w-3xl">
          Defina quais permissoes cada perfil padrao recebe. As permissoes estao organizadas por pagina do sistema.
          Ao marcar uma acao, a permissao de visualizacao correspondente e adicionada automaticamente.
        </p>
      </div>

      {(erro || sucesso) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            erro ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
          role="status"
        >
          {erro || sucesso}
        </div>
      )}

      {/* Seletor de perfil */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <label htmlFor="perfil-template" className="block text-sm font-medium text-zinc-700 mb-2">
          Perfil de template
        </label>
        <select
          id="perfil-template"
          value={perfilSelecionado === "" ? "" : String(perfilSelecionado)}
          onChange={(e) => handleSelecionarPerfil(e.target.value)}
          className="w-full max-w-md h-11 border border-zinc-300 rounded-lg px-3 text-sm bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
        >
          <option value="">Selecione um perfil...</option>
          {perfis.map((p) => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>
      </div>

      {perfilSelecionado !== "" && (
        <div className="flex flex-col gap-6">
          {/* Filtros */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <input
                type="search"
                value={filtroPermissao}
                onChange={(e) => setFiltroPermissao(e.target.value)}
                placeholder="Buscar permissao por nome..."
                className="h-10 w-full border border-zinc-300 rounded-lg pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <svg aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><line x1="16.65" y1="16.65" x2="21" y2="21" />
              </svg>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
              <input
                type="checkbox"
                checked={mostrarSomenteSelecionadas}
                onChange={(e) => setMostrarSomenteSelecionadas(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
              Mostrar somente selecionadas
            </label>
          </div>

          {paginasFiltradas.length === 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white px-5 py-10 text-center shadow-sm">
              <p className="text-sm font-medium text-zinc-700">Nenhuma permissao encontrada.</p>
              <p className="text-xs text-zinc-500 mt-1">Ajuste os filtros para visualizar mais itens.</p>
            </div>
          )}

          {paginasFiltradas.map((pagina) => {
            const total = pagina.permissoes.length;
            const selecionadas = pagina.permissoes.filter((p) => marcadasSet.has(p.id)).length;

            return (
              <section key={pagina.id} className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                <header className="px-5 py-3 border-b border-zinc-100 bg-zinc-50/80 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-800 tracking-wide">{pagina.rotulo}</h2>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{selecionadas} de {total} selecionadas</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleMarcarPagina(pagina.permissoes)}
                      className="h-8 px-3 rounded-md border border-zinc-300 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
                    >
                      Marcar tudo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLimparPagina(pagina.permissoes)}
                      className="h-8 px-3 rounded-md border border-zinc-300 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
                    >
                      Limpar
                    </button>
                  </div>
                </header>

                <ul className="divide-y divide-zinc-100">
                  {pagina.permissoes.map((perm) => {
                    const marcado = marcadasSet.has(perm.id);
                    const paiId = dependenciasByFilhaId.get(perm.id);
                    const permissaoPai = paiId ? permissaoById.get(paiId) : null;
                    const bloqueado = Boolean(paiId && permissaoPai && !marcadasSet.has(paiId));

                    return (
                      <li
                        key={perm.id}
                        className={`px-5 py-3 flex gap-3 items-start transition-colors ${bloqueado ? "bg-zinc-50/80" : "hover:bg-zinc-50/50"}`}
                      >
                        <input
                          type="checkbox"
                          id={`perm-${perm.id}`}
                          checked={marcado}
                          disabled={bloqueado}
                          onChange={(e) => handleTogglePermissao(perm, e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                        <label
                          htmlFor={`perm-${perm.id}`}
                          className={`flex-1 min-w-0 ${bloqueado ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <span className="font-medium text-zinc-900 text-sm block">{perm.nome}</span>
                          <span className="text-[11px] text-zinc-500 block mt-0.5">
                            {formatarNomePermissao(perm.nome)}
                          </span>
                          {perm.descricao && (
                            <span className="text-xs text-zinc-500 block mt-0.5 leading-relaxed">
                              {perm.descricao}
                            </span>
                          )}
                          {permissaoPai && (
                            <span className={`text-[11px] mt-1 inline-block ${bloqueado ? "text-amber-700" : "text-indigo-700"}`}>
                              Requer: <strong>{permissaoPai.nome}</strong>
                              {bloqueado ? " — marque a permissao pai primeiro" : ""}
                            </span>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {perfilSelecionado !== "" && (
        <div className="sticky bottom-4 z-10">
          <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white/95 backdrop-blur px-4 py-3 shadow-lg md:flex-row md:items-center md:justify-between">
            <span className="text-xs text-zinc-600">
              {permissoesMarcadas.length} permissao(oes) selecionada(s)
            </span>
            <button
              type="button"
              onClick={() => void handleSalvar()}
              disabled={isSaving}
              className="inline-flex items-center justify-center h-10 px-5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none shadow-sm transition-colors"
            >
              {isSaving ? "Salvando..." : "Salvar permissoes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
