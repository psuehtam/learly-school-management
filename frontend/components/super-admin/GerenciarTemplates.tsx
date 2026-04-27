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

const PREFIXOS_PERMISSAO_FILHA = ["CRIAR_", "EDITAR_", "INATIVAR_", "EXCLUIR_", "GERENCIAR_"] as const;

function getNomePermissaoPai(nomePermissao: string): string | null {
  for (const prefixo of PREFIXOS_PERMISSAO_FILHA) {
    if (nomePermissao.startsWith(prefixo)) {
      return `VISUALIZAR_${nomePermissao.slice(prefixo.length)}`;
    }
  }
  return null;
}

function isPermissaoPai(nomePermissao: string): boolean {
  return nomePermissao.startsWith("VISUALIZAR_");
}

export function GerenciarTemplates() {
  const [perfis, setPerfis] = useState<PerfilTemplate[]>([]);
  const [permissoesAgrupadas, setPermissoesAgrupadas] = useState<PermissaoModuloGrupo[]>([]);
  const [perfilSelecionado, setPerfilSelecionado] = useState<number | "">("");
  const [permissoesMarcadas, setPermissoesMarcadas] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

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
        if (!cancelado) {
          setErro(getApiErrorMessage(e, "Nao foi possivel carregar os dados de templates."));
        }
      } finally {
        if (!cancelado) setIsLoading(false);
      }
    })();
    return () => {
      cancelado = true;
    };
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
    if (perfilSelecionado === "") {
      setPermissoesMarcadas([]);
      return;
    }
    void carregarMarcacoesDoPerfil(perfilSelecionado);
  }, [perfilSelecionado, carregarMarcacoesDoPerfil]);

  const permissoesCatalogo = useMemo(
    () => permissoesAgrupadas.flatMap((grupo) => grupo.permissoes),
    [permissoesAgrupadas],
  );

  const permissoesById = useMemo(
    () => new Map(permissoesCatalogo.map((permissao) => [permissao.id, permissao])),
    [permissoesCatalogo],
  );

  const permissaoIdByNome = useMemo(
    () => new Map(permissoesCatalogo.map((permissao) => [permissao.nome, permissao.id])),
    [permissoesCatalogo],
  );

  function handleSelecionarPerfil(idStr: string) {
    setSucesso("");
    if (idStr === "") {
      setPerfilSelecionado("");
      return;
    }
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      setPerfilSelecionado("");
      return;
    }
    setPerfilSelecionado(id);
  }

  function handleTogglePermissao(permissao: PermissaoCatalogoItem, marcado: boolean) {
    setPermissoesMarcadas((prev) => {
      if (marcado) {
        if (prev.includes(permissao.id)) return prev;
        return [...prev, permissao.id].sort((a, b) => a - b);
      }

      const semPermissaoAtual = prev.filter((id) => id !== permissao.id);
      if (!isPermissaoPai(permissao.nome)) {
        return semPermissaoAtual;
      }

      return semPermissaoAtual.filter((idMarcado) => {
        const permissaoMarcada = permissoesById.get(idMarcado);
        if (!permissaoMarcada) return true;
        return getNomePermissaoPai(permissaoMarcada.nome) !== permissao.nome;
      });
    });
  }

  async function handleSalvar() {
    if (perfilSelecionado === "") {
      setErro("Selecione um perfil de template antes de salvar.");
      return;
    }
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
        Carregando templates…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Gestão de templates</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Defina quais permissões do sistema entram em cada perfil padrão ao criar uma nova escola.
        </p>
      </div>

      {(erro || sucesso) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            erro
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
          role="status"
        >
          {erro || sucesso}
        </div>
      )}

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
          <option value="">Selecione um perfil…</option>
          {perfis.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </div>

      {perfilSelecionado !== "" && (
        <div className="flex flex-col gap-6">
          {permissoesAgrupadas.map((grupo) => (
            <section
              key={grupo.modulo}
              className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden"
            >
              <header className="px-5 py-3 border-b border-zinc-100 bg-zinc-50/80">
                <h2 className="text-sm font-semibold text-zinc-800 tracking-wide uppercase">
                  {grupo.moduloRotulo}
                </h2>
                <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">{grupo.modulo}</p>
              </header>
              <ul className="divide-y divide-zinc-100">
                {grupo.permissoes.map((perm) => {
                  const marcado = permissoesMarcadas.includes(perm.id);
                  const nomePermissaoPai = getNomePermissaoPai(perm.nome);
                  const permissaoPaiId = nomePermissaoPai
                    ? permissaoIdByNome.get(nomePermissaoPai)
                    : undefined;
                  const bloqueadoPorDependencia =
                    permissaoPaiId !== undefined && !permissoesMarcadas.includes(permissaoPaiId);

                  return (
                    <li
                      key={perm.id}
                      className={`px-5 py-3.5 flex gap-3 items-start transition-colors ${
                        bloqueadoPorDependencia
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-zinc-50/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        id={`perm-${perm.id}`}
                        checked={marcado}
                        disabled={bloqueadoPorDependencia}
                        onChange={(e) => handleTogglePermissao(perm, e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label
                        htmlFor={`perm-${perm.id}`}
                        className={`flex-1 min-w-0 ${bloqueadoPorDependencia ? "cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <span className="font-semibold text-zinc-900 text-sm block">{perm.nome}</span>
                        {perm.descricao ? (
                          <span className="text-xs text-zinc-500 block mt-0.5 leading-relaxed">{perm.descricao}</span>
                        ) : null}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {perfilSelecionado !== "" && (
        <div className="flex items-center gap-3 pt-2 border-t border-zinc-200">
          <button
            type="button"
            onClick={() => void handleSalvar()}
            disabled={isSaving}
            className="inline-flex items-center justify-center h-11 px-6 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none shadow-sm transition-colors"
          >
            {isSaving ? "Salvando…" : "Salvar permissões"}
          </button>
          <span className="text-xs text-zinc-500">
            {permissoesMarcadas.length} permissão(ões) selecionada(s)
          </span>
        </div>
      )}
    </div>
  );
}
