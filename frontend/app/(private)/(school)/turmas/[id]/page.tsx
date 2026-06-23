"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { listarAlunos } from "@/lib/api/alunos";
import { listarAulas, type Aula } from "@/lib/api/aulas";
import {
  removerAlunoDaTurma,
  criarMatricula,
  listarMatriculas,
  vincularTurmaMatricula,
  type MatriculaListItem,
} from "@/lib/api/matriculas";
import { buscarTurma, concluirTurma, editarTurma } from "@/lib/api/turmas";
import { passouTerminoPrevisto } from "@/lib/turmas/termino-previsto";
import {
  listarHorariosFuncionamentoConsultaTurmas,
  type HorarioFuncionamentoDto,
} from "@/lib/api/configuracoes";
import { listarLivrosEscola, type LivroEscolaDto } from "@/lib/api/livros";
import { listarUsuariosMinhaEscola, type UsuarioMinhaEscola } from "@/lib/api/usuarios";
import { obterConfiguracoesEscolaConsultaTurmas } from "@/lib/api/minha-escola";
import { getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { hasPermission } from "@/lib/permissions";
import { validarHorarioTurmaFuncionamento } from "@/lib/turmas/validar-horario-funcionamento";
import type { Aluno } from "@/types/aluno";
import type { AtualizarTurmaPayload, Turma } from "@/types/turma";

// ─── Tipos de exibição (layout original) ─────────────────────────────────────

interface TurmaDetalhe {
  id: number;
  nome: string;
  livro: string;
  professor: string;
  diaSemana: string;
  horario: string;
  sala: string;
  turno: "morning" | "afternoon" | "evening";
  status: "ativa" | "em_espera" | "inativa";
  statusApi: Turma["status"];
  dataInicio: string;
  dataTermino: string;
}

interface AlunoTurma {
  matriculaId: number;
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  statusFinanceiro: "em_dia" | "pendente" | "atrasado";
  frequencia: number;
  media: number | null;
}

interface AulaMinistrada {
  id: number;
  data: string;
  licao: string;
  conteudo: string;
  frequencia: string;
  status: string;
}

const DIAS_OPCOES = [
  { label: "Segunda", value: 1 },
  { label: "Terça", value: 2 },
  { label: "Quarta", value: 3 },
  { label: "Quinta", value: 4 },
  { label: "Sexta", value: 5 },
  { label: "Sábado", value: 6 },
] as const;

const financeiroColors = {
  em_dia: "bg-green-50 text-green-700 border-green-200",
  pendente: "bg-amber-50 text-amber-700 border-amber-200",
  atrasado: "bg-red-50 text-red-700 border-red-200",
};

const financeiroLabel = {
  em_dia: "Em dia",
  pendente: "Pendente",
  atrasado: "Atrasado",
};

const inputCls =
  "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-[#1F2A35]";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function diasParaLabel(dias: number[]): string {
  if (dias.length === 0) return "A definir";
  return dias
    .map((d) => DIAS_OPCOES.find((o) => o.value === d)?.label ?? "")
    .filter(Boolean)
    .join(", ");
}

function formatarDataBr(iso: string): string {
  if (!iso || iso === "A definir" || iso === "—") return iso;
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function inferirTurno(horario?: string | null): "morning" | "afternoon" | "evening" {
  if (!horario) return "afternoon";
  const h = Number.parseInt(horario.split(":")[0] ?? "14", 10);
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

function statusApiParaView(status: Turma["status"]): TurmaDetalhe["status"] {
  if (status === "Em Andamento") return "ativa";
  if (status === "Em Espera") return "em_espera";
  return "inativa";
}

function labelMatricula(m: MatriculaListItem): string {
  return m.alunoNomeCompleto?.trim() || `Aluno #${m.alunoId}`;
}

function labelAluno(a: Aluno): string {
  return `${a.nome ?? ""} ${a.sobrenome ?? ""}`.trim();
}

function turmaParaView(t: Turma): TurmaDetalhe {
  const horario =
    t.horarioInicio && t.horarioFim
      ? `${t.horarioInicio} – ${t.horarioFim}`
      : t.horarioInicio ?? "A definir";

  return {
    id: t.id,
    nome: t.nome,
    livro: t.livroNome ?? `Livro #${t.livroId}`,
    professor: t.professorNome ?? `Professor #${t.professorId}`,
    diaSemana: diasParaLabel(t.diasSemana ?? []),
    horario,
    sala: t.sala ?? "—",
    turno: inferirTurno(t.horarioInicio),
    status: statusApiParaView(t.status),
    statusApi: t.status,
    dataInicio: t.dataInicio ?? "",
    dataTermino: t.dataTerminoPrevista ?? "",
  };
}

function normalizarAula(raw: Aula & Record<string, unknown>): Aula {
  return {
    ...raw,
    id: (raw.id ?? raw.Id) as number,
    turmaId: (raw.turmaId ?? raw.TurmaId) as number,
    numeroAula: (raw.numeroAula ?? raw.NumeroAula) as number,
    dataAula: String(raw.dataAula ?? raw.DataAula ?? ""),
    horarioInicio: String(raw.horarioInicio ?? raw.HorarioInicio ?? ""),
    horarioFim: String(raw.horarioFim ?? raw.HorarioFim ?? ""),
    conteudoDado: (raw.conteudoDado ?? raw.ConteudoDado) as string | undefined,
    status: (raw.status ?? raw.Status ?? "Agendada") as Aula["status"],
  };
}

function aulaParaView(a: Aula): AulaMinistrada {
  return {
    id: a.id,
    data: formatarDataBr(a.dataAula),
    licao: `Aula ${a.numeroAula}`,
    conteudo: a.conteudoDado?.trim() || (a.status === "Agendada" ? "Agendada" : "—"),
    frequencia: a.status === "Realizada" ? "—" : "—",
    status: a.status,
  };
}

function matriculaParaAluno(m: MatriculaListItem, detalhe?: Aluno): AlunoTurma {
  return {
    matriculaId: m.id,
    id: m.alunoId,
    nome: labelMatricula(m),
    cpf: detalhe?.cpf ?? "—",
    telefone: "—",
    statusFinanceiro: "em_dia",
    frequencia: 0,
    media: null,
  };
}

// ─── Componentes auxiliares ────────────────────────────────────────────────────

function LabelValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</span>
      <span className="text-sm font-medium text-zinc-900">{value || "—"}</span>
    </div>
  );
}

function DiasSelectorEdit({ dias, toggle, disabled }: { dias: number[]; toggle: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {DIAS_OPCOES.map((d) => (
        <button
          key={d.value}
          type="button"
          disabled={disabled}
          onClick={() => toggle(d.value)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50 ${
            dias.includes(d.value) ? "border-blue-600 bg-blue-50 text-blue-700" : "border-zinc-300 text-zinc-600"
          }`}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}

function ModalEditarTurma({
  turma,
  livros,
  professores,
  horariosFuncionamento,
  onClose,
  onSalvo,
}: {
  turma: Turma;
  livros: LivroEscolaDto[];
  professores: UsuarioMinhaEscola[];
  horariosFuncionamento: HorarioFuncionamentoDto[];
  onClose: () => void;
  onSalvo: () => void;
}) {
  const emAndamento = turma.status === "Em Andamento";
  const emEspera = turma.status === "Em Espera";

  const [professorId, setProfessorId] = useState(String(turma.professorId));
  const [livroId, setLivroId] = useState(String(turma.livroId));
  const [sala, setSala] = useState(turma.sala ?? "");
  const [observacoes, setObservacoes] = useState(turma.observacoes ?? "");
  const [dias, setDias] = useState<number[]>(turma.diasSemana ?? []);
  const [horaIni, setHoraIni] = useState(turma.horarioInicio ?? "");
  const [horaFim, setHoraFim] = useState(turma.horarioFim ?? "");
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const profsAtivos = professores.filter(
    (p) => p.status === "Ativo" && p.perfilNome.toLowerCase().includes("professor"),
  );
  const livrosAtivos = livros.filter((l) => l.status === "Ativo");

  function toggleDia(v: number) {
    setDias((prev) => (prev.includes(v) ? prev.filter((d) => d !== v) : [...prev, v]));
  }

  async function handleSalvar() {
    if (!professorId) {
      setErro("Selecione um professor.");
      return;
    }
    setErro(null);
    const payload: AtualizarTurmaPayload = {
      professorId: Number(professorId),
      sala: sala.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
    };

    if (emEspera) {
      if (!livroId) {
        setErro("Selecione um livro.");
        return;
      }
      payload.livroId = Number(livroId);
      if (dias.length > 0) payload.diasSemana = dias;
      if (horaIni) payload.horarioInicio = horaIni;
      if (horaFim) payload.horarioFim = horaFim;

      const erroHorario = validarHorarioTurmaFuncionamento(dias, horaIni, horaFim, horariosFuncionamento);
      if (erroHorario) {
        setErro(erroHorario);
        return;
      }
    }

    setSaving(true);
    try {
      await editarTurma(turma.id, payload);
      onSalvo();
      onClose();
    } catch (e) {
      setErro(getApiErrorMessage(e, "Não foi possível salvar as alterações."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-xl border-b border-zinc-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Editar Dados da Turma</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Status: <strong>{turma.status}</strong>
              {emAndamento && " — livro, dias e horários exigem remanejamento."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto p-6">
          {erro && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{erro}</div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Professor *</label>
            <select value={professorId} onChange={(e) => setProfessorId(e.target.value)} className={inputCls}>
              <option value="">Selecione</option>
              {profsAtivos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nomeCompleto}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Livro / Nível {emEspera ? "*" : ""}</label>
            {emEspera ? (
              <select value={livroId} onChange={(e) => setLivroId(e.target.value)} className={inputCls}>
                <option value="">Selecione</option>
                {livrosAtivos.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
            ) : (
              <input
                disabled
                value={turma.livroNome ?? `Livro #${turma.livroId}`}
                className="h-10 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-500"
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Dias da semana</label>
            <DiasSelectorEdit dias={dias} toggle={toggleDia} disabled={emAndamento} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Início (24h)</label>
              <input
                type="time"
                disabled={emAndamento}
                value={horaIni}
                onChange={(e) => setHoraIni(e.target.value)}
                className={emAndamento ? "h-10 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-500" : inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Término (24h)</label>
              <input
                type="time"
                disabled={emAndamento}
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                className={emAndamento ? "h-10 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-500" : inputCls}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Sala</label>
            <input value={sala} onChange={(e) => setSala(e.target.value)} className={inputCls} placeholder="Sala ou link" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Observações</label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className={`${inputCls} min-h-[72px] py-2`}
            />
          </div>

          {emAndamento && (turma.dataInicio || turma.dataTerminoPrevista) && (
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
              {turma.dataInicio && (
                <div>
                  <span className="font-medium text-zinc-700">Início: </span>
                  {formatarDataBr(turma.dataInicio)}
                </div>
              )}
              {turma.dataTerminoPrevista && (
                <div>
                  <span className="font-medium text-zinc-700">Término previsto: </span>
                  {formatarDataBr(turma.dataTerminoPrevista)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 rounded-b-xl border-t border-zinc-200 bg-zinc-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-9 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleSalvar()}
            disabled={saving}
            className="h-9 rounded-lg bg-[#1F2A35] px-4 text-sm font-medium text-white hover:bg-[#2d3d4d] disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}


function ModalVincularAluno({
  turmaId,
  alunosJaNaTurma,
  onClose,
  onAdicionado,
}: {
  turmaId: number;
  alunosJaNaTurma: Set<number>;
  onClose: () => void;
  onAdicionado: () => void;
}) {
  const [busca, setBusca] = useState("");
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const termo = busca.trim();
    if (termo.length === 1) {
      setAlunos([]);
      return;
    }

    let cancelado = false;
    const timer = window.setTimeout(
      () => {
        setLoading(true);
        setLoadError(null);
        void listarAlunos({ status: "Ativo", busca: termo || undefined, limite: 80 })
          .then((lista) => {
            if (!cancelado) setAlunos(lista);
          })
          .catch((e) => {
            if (!cancelado) {
              setAlunos([]);
              setLoadError(getApiErrorMessage(e, "Não foi possível buscar alunos."));
            }
          })
          .finally(() => {
            if (!cancelado) setLoading(false);
          });
      },
      termo ? 300 : 0,
    );

    return () => {
      cancelado = true;
      window.clearTimeout(timer);
    };
  }, [busca]);

  const candidatos = useMemo(
    () => alunos.filter((a) => !alunosJaNaTurma.has(a.id)),
    [alunos, alunosJaNaTurma],
  );

  async function vincular(alunoId: number) {
    setSaving(true);
    const hoje = new Date().toISOString().slice(0, 10);
    try {
      const pendentes = await listarMatriculas({ status: "Em Espera", alunoId });
      const semTurma = pendentes.find((m) => m.turmaId == null);
      if (semTurma) {
        await vincularTurmaMatricula(semTurma.id, turmaId);
      } else {
        await criarMatricula({ alunoId, turmaId, dataMatricula: hoje });
      }
      onAdicionado();
      onClose();
    } catch (e) {
      alert(getApiErrorMessage(e, "Não foi possível matricular o aluno."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Vincular Aluno à Turma</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Pesquise pelo nome ou CPF do aluno.</p>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto p-6">
          <input
            type="search"
            placeholder="Buscar aluno..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={inputCls}
          />
          {loadError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{loadError}</p>
          ) : null}
          <div className="mt-2 flex max-h-64 flex-col gap-2 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-2">
            {busca.trim().length === 1 ? (
              <p className="py-4 text-center text-sm text-zinc-500">Digite pelo menos 2 caracteres.</p>
            ) : loading ? (
              <p className="py-4 text-center text-sm text-zinc-500">Buscando…</p>
            ) : candidatos.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-500">
                {busca.trim() ? "Nenhum aluno encontrado." : "Digite para buscar ou aguarde a lista."}
              </p>
            ) : (
              candidatos.map((aluno) => (
                <div
                  key={aluno.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{labelAluno(aluno)}</p>
                    {aluno.cpf ? <p className="text-xs text-zinc-500">CPF: {aluno.cpf}</p> : null}
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void vincular(aluno.id)}
                    className="h-8 rounded-md bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Vincular
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-zinc-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Cancelar / Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────────

export default function PainelTurmaAdminPage() {
  const params = useParams();
  const router = useRouter();
  const turmaId = Number(params.id);
  const { user, isLoading: authLoading } = useAuth();
  const podeGerenciarTurma =
    !!user &&
    (hasPermission(user, "EDITAR_TURMA") ||
      hasPermission(user, "CRIAR_MATRICULA") ||
      hasPermission(user, "VINCULAR_ALUNO_TURMA"));

  useEffect(() => {
    if (authLoading || !user) return;
    if (!podeGerenciarTurma && Number.isFinite(turmaId) && turmaId > 0) {
      router.replace(`/professor/turma/${turmaId}`);
    }
  }, [authLoading, user, podeGerenciarTurma, turmaId, router]);

  const [turmaApi, setTurmaApi] = useState<Turma | null>(null);
  const [turmaView, setTurmaView] = useState<TurmaDetalhe | null>(null);
  const [livros, setLivros] = useState<LivroEscolaDto[]>([]);
  const [professores, setProfessores] = useState<UsuarioMinhaEscola[]>([]);
  const [horariosFuncionamento, setHorariosFuncionamento] = useState<HorarioFuncionamentoDto[]>([]);
  const [alunos, setAlunos] = useState<AlunoTurma[]>([]);
  const [aulas, setAulas] = useState<AulaMinistrada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [abaAtual, setAbaAtual] = useState("Alunos Matriculados");
  const [buscaAluno, setBuscaAluno] = useState("");
  const [modalVincularAberto, setModalVincularAberto] = useState(false);
  const [modalEditarTurmaAberto, setModalEditarTurmaAberto] = useState(false);
  const [concluindoTurma, setConcluindoTurma] = useState(false);
  const [minAlunosTurma, setMinAlunosTurma] = useState(3);

  const podeConcluirTurma = !!user && hasPermission(user, "CONCLUIR_TURMA");
  const exibirConcluirTurma =
    podeConcluirTurma &&
    turmaView?.statusApi === "Em Andamento" &&
    passouTerminoPrevisto(turmaView?.dataTermino);

  const carregar = useCallback(async () => {
    if (!Number.isFinite(turmaId) || turmaId <= 0) {
      setError("Turma inválida.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [turmaData, mats, todasAulas, catalogoAlunos] = await Promise.all([
        buscarTurma(turmaId),
        listarMatriculas({ turmaId, status: "Ativo" }),
        listarAulas(),
        podeGerenciarTurma
          ? listarAlunos({ status: "Ativo", limite: 200 }).catch(() => [] as Aluno[])
          : Promise.resolve([] as Aluno[]),
      ]);

      setTurmaApi(turmaData);
      const view = turmaParaView(turmaData);
      setTurmaView(view);

      const alunosPorId = new Map(catalogoAlunos.map((a) => [a.id, a]));
      setAlunos(mats.map((m) => matriculaParaAluno(m, alunosPorId.get(m.alunoId))));

      const aulasTurma = todasAulas
        .map((a) => normalizarAula(a as Aula & Record<string, unknown>))
        .filter((a) => a.turmaId === turmaId)
        .sort((a, b) => b.dataAula.localeCompare(a.dataAula) || b.numeroAula - a.numeroAula)
        .map(aulaParaView);
      setAulas(aulasTurma);
    } catch (e) {
      setError(getApiErrorMessage(e, "Não foi possível carregar a turma."));
      setTurmaApi(null);
      setTurmaView(null);
      setAlunos([]);
      setAulas([]);
    } finally {
      setLoading(false);
    }
  }, [turmaId, podeGerenciarTurma]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    if (!podeGerenciarTurma) return;
    void listarLivrosEscola().then(setLivros).catch(() => setLivros([]));
    void listarUsuariosMinhaEscola().then(setProfessores).catch(() => setProfessores([]));
    void listarHorariosFuncionamentoConsultaTurmas()
      .then(setHorariosFuncionamento)
      .catch(() => setHorariosFuncionamento([]));
    void obterConfiguracoesEscolaConsultaTurmas()
      .then((cfg) => setMinAlunosTurma(cfg.minAlunosTurma))
      .catch(() => setMinAlunosTurma(3));
  }, [podeGerenciarTurma]);

  const alunosIds = useMemo(() => new Set(alunos.map((a) => a.id)), [alunos]);

  const alunosFiltrados = useMemo(() => {
    const termo = buscaAluno.trim().toLowerCase();
    if (!termo) return alunos;
    return alunos.filter(
      (a) =>
        a.nome.toLowerCase().includes(termo) ||
        a.cpf.replace(/\D/g, "").includes(termo.replace(/\D/g, "")),
    );
  }, [alunos, buscaAluno]);

  const aulasRealizadas = useMemo(
    () => aulas.filter((a) => a.status === "Realizada"),
    [aulas],
  );

  const podeVincular =
    podeGerenciarTurma &&
    (turmaView?.statusApi === "Em Espera" || turmaView?.statusApi === "Em Andamento");

  const abasTurma = podeGerenciarTurma
    ? ["Alunos Matriculados", "Aulas Ministradas", "Configurações da Turma"]
    : ["Alunos Matriculados", "Aulas Ministradas"];

  async function handleConcluirTurma() {
    if (!turmaView) return;
    if (
      !confirm(
        `Concluir a turma "${turmaView.nome}"?\n\nAs matrículas ativas serão marcadas como concluídas e os alunos poderão ser enturmados em outra turma.`,
      )
    ) {
      return;
    }
    setConcluindoTurma(true);
    try {
      await concluirTurma(turmaView.id);
      await carregar();
    } catch (e) {
      alert(getApiErrorMessage(e, "Não foi possível concluir a turma."));
    } finally {
      setConcluindoTurma(false);
    }
  }

  async function removerAluno(matriculaId: number, nome: string) {
    if (
      !confirm(
        `Remover ${nome} desta turma? O aluno continua ativo na escola e poderá ser matriculado em outra turma.`,
      )
    ) {
      return;
    }
    try {
      await removerAlunoDaTurma(matriculaId);
      await carregar();
    } catch (e) {
      alert(getApiErrorMessage(e, "Não foi possível desvincular o aluno."));
    }
  }

  if (!podeGerenciarTurma && !authLoading) {
    return <p className="py-16 text-center text-sm text-zinc-500">Redirecionando…</p>;
  }

  if (loading) {
    return <p className="py-16 text-center text-sm text-zinc-500">Carregando painel da turma…</p>;
  }

  if (error || !turmaView) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/turmas" className="flex w-fit items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800">
          Voltar para Turmas
        </Link>
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error ?? "Turma não encontrada."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6 pb-8">
        <div>
          <Link
            href="/turmas"
            className="mb-3 flex w-fit items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-800"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Voltar para Turmas
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-zinc-900">
              Painel da Turma
              {podeGerenciarTurma && (
                <span className="font-normal text-zinc-400"> | Visão Administrativa</span>
              )}
            </h1>
            <span className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-500 shadow-sm">
              ID: {turmaView.id}
            </span>
          </div>
        </div>

        {turmaView.statusApi === "Em Espera" && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              alunos.length >= minAlunosTurma
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            <strong>{alunos.length}</strong> aluno(s) matriculado(s). São necessários{" "}
            <strong>{minAlunosTurma}</strong> para ativar a turma na listagem.
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-5 py-3">
            <h2 className="text-sm font-bold text-[#1F2A35]">{turmaView.nome}</h2>
            <div className="flex flex-wrap items-center gap-2">
              {exibirConcluirTurma && (
                <button
                  type="button"
                  disabled={concluindoTurma}
                  onClick={() => void handleConcluirTurma()}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {concluindoTurma ? "Concluindo…" : "Concluir turma"}
                </button>
              )}
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
                  turmaView.status === "ativa"
                    ? "bg-green-100 text-green-700"
                    : turmaView.status === "em_espera"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {turmaView.statusApi}
              </span>
            </div>
          </div>

          {exibirConcluirTurma && (
            <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-2.5 text-xs text-emerald-900">
              O prazo previsto desta turma já passou. Ao concluir, as matrículas ativas serão finalizadas e os alunos
              poderão entrar em outra turma.
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-8 gap-y-6 p-6 md:grid-cols-4">
            <LabelValue label="Professor" value={turmaView.professor} />
            <LabelValue label="Livro / Nível" value={turmaView.livro} />
            <LabelValue label="Dia da Semana" value={turmaView.diaSemana} />
            <LabelValue label="Horário" value={turmaView.horario} />
            <LabelValue label="Sala" value={turmaView.sala} />
            <LabelValue label="Início do Semestre" value={formatarDataBr(turmaView.dataInicio) || "—"} />
            <LabelValue label="Término Previsto" value={formatarDataBr(turmaView.dataTermino) || "—"} />
            <LabelValue label="Total de Alunos" value={`${alunos.length} alunos vinculados`} />
          </div>
        </div>

        <div className="flex gap-1 border-b border-zinc-200">
          {abasTurma.map((aba) => (
            <button
              key={aba}
              type="button"
              onClick={() => setAbaAtual(aba)}
              className={`border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                abaAtual === aba
                  ? "border-[#1F2A35] text-[#1F2A35]"
                  : "border-transparent text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"
              }`}
            >
              {aba}
            </button>
          ))}
        </div>

        {abaAtual === "Alunos Matriculados" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Buscar aluno na turma..."
                  value={buscaAluno}
                  onChange={(e) => setBuscaAluno(e.target.value)}
                  className="h-9 w-64 rounded-lg border border-zinc-300 pl-3 pr-10 text-sm outline-none transition focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/10"
                />
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              {podeVincular && (
                <button
                  type="button"
                  onClick={() => setModalVincularAberto(true)}
                  className="flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Vincular Aluno
                </button>
              )}
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-zinc-500">
                      Aluno
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-zinc-500">
                      Telefone
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-zinc-500">
                      Freq. Atual
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-zinc-500">
                      Situação Financeira
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-zinc-500">
                      Opções
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {alunosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-400">
                        Nenhum aluno matriculado nesta turma.
                      </td>
                    </tr>
                  ) : (
                    alunosFiltrados.map((a, i) => (
                      <tr
                        key={a.matriculaId}
                        className={`border-b border-zinc-100 transition-colors hover:bg-zinc-50 ${
                          i === alunosFiltrados.length - 1 ? "border-b-0" : ""
                        }`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1F2A35] text-xs font-semibold text-white">
                              {a.nome.charAt(0) || "?"}
                            </div>
                            <div>
                              <p className="font-bold text-zinc-900">{a.nome}</p>
                              <p className="text-xs text-zinc-400">
                                ID: {a.id} | CPF: {a.cpf}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-medium text-zinc-700">{a.telefone}</td>
                        <td className="px-5 py-3 text-center">
                          <span
                            className={`font-bold ${a.frequencia >= 75 ? "text-green-600" : a.frequencia > 0 ? "text-red-600" : "text-zinc-400"}`}
                          >
                            {a.frequencia > 0 ? `${a.frequencia}%` : "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span
                            className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${financeiroColors[a.statusFinanceiro]}`}
                          >
                            {financeiroLabel[a.statusFinanceiro]}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {user && hasPermission(user, "VISUALIZAR_ALUNO") && (
                              <Link
                                href={`/alunos/${a.id}`}
                                className="flex h-8 items-center rounded-lg border border-zinc-200 px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
                              >
                                Ver Perfil
                              </Link>
                            )}
                            {podeVincular && (
                              <button
                                type="button"
                                onClick={() => void removerAluno(a.matriculaId, a.nome)}
                                className="h-8 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-600 hover:bg-red-50"
                              >
                                Desvincular
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {abaAtual === "Aulas Ministradas" && (
          <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-5 py-4">
                <h3 className="text-sm font-bold text-zinc-800">Diário de Classe (visão leitura)</h3>
                <span className="text-xs text-zinc-500">
                  {aulas.length} aula(s) · {aulasRealizadas.length} realizada(s)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-white">
                      <th className="w-32 px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-zinc-500">
                        Data
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-zinc-500">
                        Lição
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-zinc-500">
                        Conteúdo Aplicado
                      </th>
                      <th className="w-28 px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-zinc-500">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {aulas.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-zinc-400">
                          {turmaView.statusApi === "Em Espera"
                            ? "Nenhuma aula gerada. Ative a turma para criar o cronograma."
                            : "Nenhuma aula registrada para esta turma."}
                        </td>
                      </tr>
                    ) : (
                      aulas.map((aula, i) => (
                        <tr
                          key={aula.id}
                          className={`border-b border-zinc-100 hover:bg-zinc-50 ${i === aulas.length - 1 ? "border-b-0" : ""}`}
                        >
                          <td className="px-5 py-3 font-medium text-zinc-900">{aula.data}</td>
                          <td className="px-5 py-3 font-bold text-zinc-700">{aula.licao}</td>
                          <td className="px-5 py-3 text-zinc-600">{aula.conteudo}</td>
                          <td className="px-5 py-3 text-center">
                            <span
                              className={`inline-flex rounded border px-2 py-1 text-xs font-bold ${
                                aula.status === "Realizada"
                                  ? "border-green-200 bg-green-50 text-green-800"
                                  : aula.status === "Cancelada"
                                    ? "border-red-200 bg-red-50 text-red-800"
                                    : "border-zinc-200 bg-zinc-100 text-zinc-700"
                              }`}
                            >
                              {aula.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {abaAtual === "Configurações da Turma" && (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-500 shadow-sm">
            <svg className="mx-auto mb-4 h-12 w-12 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-lg font-medium text-zinc-900">Configurações Avançadas</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Consulta de status, sala, professor e horários da turma.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setModalEditarTurmaAberto(true)}
                className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
              >
                Ver / Editar Dados da Turma
              </button>
            </div>
          </div>
        )}
      </div>

      {modalVincularAberto && (
        <ModalVincularAluno
          turmaId={turmaId}
          alunosJaNaTurma={alunosIds}
          onClose={() => setModalVincularAberto(false)}
          onAdicionado={() => void carregar()}
        />
      )}

      {modalEditarTurmaAberto && turmaApi && (
        <ModalEditarTurma
          turma={turmaApi}
          livros={livros}
          professores={professores}
          horariosFuncionamento={horariosFuncionamento}
          onClose={() => setModalEditarTurmaAberto(false)}
          onSalvo={() => void carregar()}
        />
      )}
    </>
  );
}
