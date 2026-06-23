"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  getApiErrorMessage,
  buscarAluno,
  listarMatriculas,
  listarPreAlunos,
  cancelarMatriculaById,
  vincularTurmaMatricula,
  type MatriculaListItem,
  type MatriculaStatus,
  type ListarMatriculasFiltro,
} from "@/lib/api";
import { ModalAprovarPreAluno } from "@/components/secretaria/ModalAprovarPreAluno";
import type { User } from "@/lib/api/types";
import type { PreAlunoListItem } from "@/types/comercial";
import { getCurrentUser } from "@/lib/api/auth";
import { hasPermission } from "@/lib/permissions";

function labelAlunoMatricula(m: MatriculaListItem): string {
  const withPascal = m as MatriculaListItem & { AlunoNomeCompleto?: string };
  const n = (m.alunoNomeCompleto ?? withPascal.AlunoNomeCompleto)?.trim();
  return n && n.length > 0 ? n : `Aluno #${m.alunoId}`;
}

function labelTurmaMatricula(m: MatriculaListItem): string {
  const n = m.turmaNome?.trim();
  if (n) return n;
  if (m.turmaId != null) return `Turma #${m.turmaId}`;
  return "Não definida";
}

type AbaFiltro =
  | { status: MatriculaStatus; grupo?: never }
  | { grupo: "inativos"; status?: never }
  | { status?: never; grupo?: never };

const STATUS_ABAS: Array<{ id: "enturmados" | "espera" | "inativos" | "todas"; label: string } & AbaFiltro> = [
  { id: "enturmados", label: "Alunos Enturmados", status: "Ativo" },
  { id: "espera", label: "Alunos em Espera", status: "Em Espera" },
  { id: "inativos", label: "Alunos Inativos", grupo: "inativos" },
  { id: "todas", label: "Todas as Matrículas" },
];

type AbaId = (typeof STATUS_ABAS)[number]["id"];


function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SecretariaPage() {
  const [aba, setAba] = useState<AbaId>("espera");
  const [busca, setBusca] = useState("");
  const [alunoIdFiltro, setAlunoIdFiltro] = useState("");
  const [matriculas, setMatriculas] = useState<MatriculaListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [matriculaParaEnturmar, setMatriculaParaEnturmar] = useState<MatriculaListItem | null>(null);
  const [turmaIdEnturmar, setTurmaIdEnturmar] = useState("");
  /** Valor inicial do campo ao abrir o modal (para detectar alteração antes de vincular). */
  const [turmaIdEnturmarInicial, setTurmaIdEnturmarInicial] = useState("");
  const [savingEnturmar, setSavingEnturmar] = useState(false);
  const nomeAlunoPorIdRef = useRef<Record<number, string>>({});

  const [usuarioSessao, setUsuarioSessao] = useState<User | null>(null);
  const [preAlunosAguardando, setPreAlunosAguardando] = useState<PreAlunoListItem[]>([]);
  const [carregandoPreAlunos, setCarregandoPreAlunos] = useState(false);
  const [preAlunoParaAprovar, setPreAlunoParaAprovar] = useState<PreAlunoListItem | null>(null);

  useEffect(() => {
    void getCurrentUser().then(setUsuarioSessao).catch(() => setUsuarioSessao(null));
  }, []);

  const carregarPreAlunosAguardando = useCallback(async () => {
    if (!usuarioSessao || !hasPermission(usuarioSessao, "APROVAR_MATRICULA")) {
      setPreAlunosAguardando([]);
      return;
    }

    setCarregandoPreAlunos(true);
    try {
      const data = await listarPreAlunos({ status: "Aguardando aprovacao" });
      setPreAlunosAguardando(data);
    } catch {
      setPreAlunosAguardando([]);
    } finally {
      setCarregandoPreAlunos(false);
    }
  }, [usuarioSessao]);

  useEffect(() => {
    void carregarPreAlunosAguardando();
  }, [carregarPreAlunosAguardando]);

  const abrirAnalisePreAluno = (p: PreAlunoListItem) => {
    setPreAlunoParaAprovar(p);
  };

  const podeAprovarPreAluno =
    usuarioSessao !== null && hasPermission(usuarioSessao, "APROVAR_MATRICULA");

  const podeReprovarPreAluno =
    usuarioSessao !== null && hasPermission(usuarioSessao, "REPROVAR_MATRICULA");

  const podeEnturmar =
    usuarioSessao !== null && hasPermission(usuarioSessao, "EDITAR_MATRICULA");

  const podeCancelarMatricula =
    usuarioSessao !== null && hasPermission(usuarioSessao, "CANCELAR_MATRICULA");

  const abaAtual = STATUS_ABAS.find((s) => s.id === aba);

  const carregarMatriculas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filtroAlunoId = alunoIdFiltro.trim() ? Number(alunoIdFiltro) : undefined;
      const filtro: ListarMatriculasFiltro = {
        alunoId: Number.isFinite(filtroAlunoId as number) ? filtroAlunoId : undefined,
      };
      if (abaAtual?.grupo) filtro.grupo = abaAtual.grupo;
      else if (abaAtual?.status) filtro.status = abaAtual.status;
      const data = await listarMatriculas(filtro);
      const enriquecidas = await Promise.all(
        data.map(async (m) => {
          if (m.alunoNomeCompleto?.trim()) return m;

          const cache = nomeAlunoPorIdRef.current[m.alunoId];
          if (cache) {
            return { ...m, alunoNomeCompleto: cache };
          }

          try {
            const aluno = await buscarAluno(m.alunoId);
            const nome = `${String(aluno.nome ?? "").trim()} ${String(aluno.sobrenome ?? "").trim()}`.trim();
            if (nome) {
              nomeAlunoPorIdRef.current[m.alunoId] = nome;
              return { ...m, alunoNomeCompleto: nome };
            }
          } catch {
            // Mantém fallback "Aluno #id" quando API de aluno falhar.
          }

          return m;
        }),
      );

      setMatriculas(enriquecidas);
    } catch (e) {
      setError(getApiErrorMessage(e, "Falha ao carregar matriculas."));
    } finally {
      setIsLoading(false);
    }
  }, [alunoIdFiltro, abaAtual]);

  useEffect(() => {
    void carregarMatriculas();
  }, [carregarMatriculas]);

  useEffect(() => {
    if (!matriculaParaEnturmar) setTurmaIdEnturmarInicial("");
  }, [matriculaParaEnturmar]);

  const enturmarModalTemAlteracao =
    !!matriculaParaEnturmar && !savingEnturmar && turmaIdEnturmar !== turmaIdEnturmarInicial;

  const matriculasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return matriculas;
    return matriculas.filter((m) => {
      const blob = `${m.id} ${m.alunoId} ${m.turmaId ?? ""} ${m.status} ${m.alunoNomeCompleto ?? ""} ${m.turmaNome ?? ""}`.toLowerCase();
      return blob.includes(termo);
    });
  }, [matriculas, busca]);

  const fecharModalEnturmar = () => {
    setMatriculaParaEnturmar(null);
    setTurmaIdEnturmar("");
    setTurmaIdEnturmarInicial("");
  };

  const enturmarMatricula = async () => {
    if (!matriculaParaEnturmar) return;

    const turmaId = Number(turmaIdEnturmar);
    if (!Number.isFinite(turmaId) || turmaId <= 0) {
      setError("Informe um TurmaId valido.");
      return;
    }

    setSavingEnturmar(true);
    setError(null);
    try {
      await vincularTurmaMatricula(matriculaParaEnturmar.id, turmaId);
      fecharModalEnturmar();
      await carregarMatriculas();
    } catch (e) {
      setError(getApiErrorMessage(e, "Falha ao vincular turma."));
    } finally {
      setSavingEnturmar(false);
    }
  };

  const onCancelarMatricula = async (m: MatriculaListItem) => {
    if (!confirm(`Cancelar matrícula #${m.id} (${labelAlunoMatricula(m)})?`)) return;

    setError(null);
    try {
      await cancelarMatriculaById(m.id);
      await carregarMatriculas();
    } catch (e) {
      setError(getApiErrorMessage(e, "Falha ao cancelar matricula."));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Secretaria</h1>
          <p className="text-sm text-zinc-500">Cadastro de alunos e gestao de matriculas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={carregarMatriculas} isLoading={isLoading}>Atualizar</Button>
        </div>
      </div>

      {podeAprovarPreAluno && (
        <Card className="p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Pré-alunos aguardando aprovação</CardTitle>
              <p className="mt-0.5 text-xs text-zinc-500">
                O comercial envia a ficha; aqui você confere e marca como aprovada antes da matrícula formal.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => void carregarPreAlunosAguardando()} isLoading={carregandoPreAlunos}>
              Atualizar fila
            </Button>
          </div>
          {preAlunosAguardando.length === 0 && !carregandoPreAlunos ? (
            <p className="text-sm text-zinc-400">Nenhuma ficha pendente neste momento.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-zinc-100">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <th className="px-4 py-2">Pré-aluno</th>
                    <th className="px-4 py-2">Responsável</th>
                    <th className="px-4 py-2">Livro</th>
                    <th className="px-4 py-2">Contrato</th>
                    <th className="px-4 py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {preAlunosAguardando.map((p) => (
                    <tr key={p.id} className="border-b border-zinc-100 last:border-b-0">
                      <td className="px-4 py-2 font-medium text-zinc-900">{p.nomeCompletoAluno}</td>
                      <td className="px-4 py-2 text-zinc-600">{p.nomeCompletoResponsavel}</td>
                      <td className="px-4 py-2 text-zinc-600">{p.nomeLivroInteresse}</td>
                      <td className="px-4 py-2 text-xs text-zinc-600">{p.tipoContrato}</td>
                      <td className="px-4 py-2 text-right">
                        <Button size="sm" onClick={() => abrirAnalisePreAluno(p)}>
                          Analisar / Aceite
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_ABAS.map((item) => (
            <button
              key={item.id}
              onClick={() => setAba(item.id)}
              className={`h-9 rounded-lg px-4 text-sm font-medium transition-colors ${
                aba === item.id
                  ? "bg-[#1F2A35] text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input
            label="Busca rápida"
            placeholder="ID, alunoId, turmaId ou status"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <Input
            label="Filtrar por AlunoId"
            placeholder="Ex.: 123"
            value={alunoIdFiltro}
            onChange={(e) => setAlunoIdFiltro(e.target.value)}
          />
          <div className="flex items-end">
            <Button className="w-full" onClick={carregarMatriculas} isLoading={isLoading}>Aplicar filtros</Button>
          </div>
        </div>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="mb-3">
          <CardTitle className="text-base">Matrículas ({matriculasFiltradas.length})</CardTitle>
        </CardHeader>

        <div className="overflow-x-auto rounded-lg border border-zinc-100">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="whitespace-nowrap px-4 py-3">Matrícula</th>
                <th className="min-w-[220px] px-4 py-3">Aluno</th>
                <th className="min-w-[140px] px-4 py-3">Turma</th>
                <th className="whitespace-nowrap px-4 py-3">Status</th>
                <th className="min-w-[140px] px-4 py-3">Datas</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && matriculasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-400">
                    Nenhuma matrícula encontrada.
                  </td>
                </tr>
              ) : (
                matriculasFiltradas.map((m) => {
                  const inicial = labelAlunoMatricula(m).charAt(0).toUpperCase();
                  return (
                    <tr key={m.id} className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/80">
                      <td className="align-top px-4 py-3 font-mono text-xs font-medium text-zinc-600">#{m.id}</td>
                      <td className="align-top px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div
                            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1F2A35] text-xs font-semibold text-white"
                            aria-hidden
                          >
                            {inicial}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/alunos/${m.alunoId}`}
                              className="font-medium text-zinc-900 hover:underline"
                            >
                              {labelAlunoMatricula(m)}
                            </Link>
                            <p className="mt-0.5 text-xs text-zinc-400">ID do aluno: {m.alunoId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="align-top px-4 py-3 text-zinc-800">
                        <span className="font-medium">{labelTurmaMatricula(m)}</span>
                        {m.turmaId != null ? (
                          <p className="mt-0.5 text-xs text-zinc-400">ID turma: {m.turmaId}</p>
                        ) : null}
                      </td>
                      <td className="align-top px-4 py-3">
                        <Badge>{m.status}</Badge>
                      </td>
                      <td className="align-top px-4 py-3 text-zinc-600">
                        <div className="text-zinc-800">{formatDate(m.dataMatricula)}</div>
                        <div className="mt-1 text-xs text-zinc-400">Atualizado: {formatDateTime(m.dataAtualizacao)}</div>
                      </td>
                      <td className="align-top px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          {podeEnturmar && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                const ini = m.turmaId ? String(m.turmaId) : "";
                                setTurmaIdEnturmarInicial(ini);
                                setMatriculaParaEnturmar(m);
                                setTurmaIdEnturmar(ini);
                              }}
                              disabled={m.status !== "Em Espera"}
                            >
                              Enturmar
                            </Button>
                          )}
                          {podeCancelarMatricula && (
                            <Button size="sm" variant="danger" onClick={() => void onCancelarMatricula(m)} disabled={m.status === "Cancelado"}>
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={!!matriculaParaEnturmar}
        onClose={fecharModalEnturmar}
        title={
          matriculaParaEnturmar
            ? `Enturmar — ${labelAlunoMatricula(matriculaParaEnturmar)} (#${matriculaParaEnturmar.id})`
            : "Enturmar"
        }
        hasUnsavedChanges={enturmarModalTemAlteracao}
        closeDisabled={savingEnturmar}
        footer={(requestClose) => (
          <>
            <Button variant="secondary" onClick={requestClose} disabled={savingEnturmar}>
              Fechar
            </Button>
            <Button onClick={enturmarMatricula} isLoading={savingEnturmar}>Vincular turma</Button>
          </>
        )}
      >
        <div className="space-y-3">
          {matriculaParaEnturmar && (
            <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              <span className="font-medium text-zinc-900">{labelAlunoMatricula(matriculaParaEnturmar)}</span>
              <span className="text-zinc-400"> · matrícula #{matriculaParaEnturmar.id}</span>
            </p>
          )}
          <p className="text-sm text-zinc-600">
            Como o módulo de turmas ainda está em implementação, use o <strong>TurmaId</strong> manual para concluir a enturmação.
          </p>
          <Input
            label="TurmaId"
            placeholder="Ex.: 15"
            value={turmaIdEnturmar}
            onChange={(e) => setTurmaIdEnturmar(e.target.value)}
          />
        </div>
      </Modal>

      <ModalAprovarPreAluno
        preAluno={preAlunoParaAprovar}
        open={preAlunoParaAprovar !== null}
        onClose={() => setPreAlunoParaAprovar(null)}
        podeReprovar={podeReprovarPreAluno}
        onAprovado={() => {
          void carregarPreAlunosAguardando();
          void carregarMatriculas();
        }}
        onReprovado={() => {
          void carregarPreAlunosAguardando();
        }}
      />
    </div>
  );
}
