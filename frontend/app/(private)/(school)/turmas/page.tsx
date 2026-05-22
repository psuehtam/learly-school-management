"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ativarTurma,
  concluirTurma,
  criarTurma,
  inativarTurma,
  listarTurmas,
  type AtivarTurmaPayload,
} from "@/lib/api/turmas";
import { passouTerminoPrevisto } from "@/lib/turmas/termino-previsto";
import {
  listarHorariosFuncionamentoConsultaTurmas,
  type HorarioFuncionamentoDto,
} from "@/lib/api/configuracoes";
import { listarLivrosEscola, type LivroEscolaDto } from "@/lib/api/livros";
import { listarUsuariosMinhaEscola, type UsuarioMinhaEscola } from "@/lib/api/usuarios";
import { getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { hasPermission } from "@/lib/permissions";
import { validarHorarioTurmaFuncionamento } from "@/lib/turmas/validar-horario-funcionamento";
import type { CriarTurmaPayload } from "@/types/turma";

type StatusApi = "Em Espera" | "Em Andamento" | "Concluida" | "Cancelada" | "Inativa";

type TurmaView = {
  id: number;
  nome: string;
  livro: string;
  livroId: number;
  professor: string;
  professorId: number;
  diaSemanaLabel: string;
  horarioInicio: string;
  horarioFim: string;
  sala: string;
  status: StatusApi;
  dataInicio: string;
  dataTermino: string;
  dataTerminoPrevistaIso: string | null;
  totalAlunos: number;
  diasSemana: number[];
};

const DIAS_OPCOES = [
  { label: "Segunda", value: 1 },
  { label: "Terça", value: 2 },
  { label: "Quarta", value: 3 },
  { label: "Quinta", value: 4 },
  { label: "Sexta", value: 5 },
  { label: "Sábado", value: 6 },
] as const;

const inputCls =
  "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-[#1F2A35]";

function diasParaLabel(dias: number[]): string {
  if (dias.length === 0) return "";
  return dias
    .map((d) => DIAS_OPCOES.find((o) => o.value === d)?.label?.substring(0, 3).toUpperCase() ?? "")
    .filter(Boolean)
    .join("-");
}

function formatarDataBr(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function mapApiTurma(t: {
  id: number;
  nome: string;
  livroId: number;
  livroNome?: string | null;
  professorId: number;
  professorNome?: string | null;
  sala?: string | null;
  horarioInicio?: string | null;
  horarioFim?: string | null;
  dataInicio?: string | null;
  dataTerminoPrevista?: string | null;
  status: string;
  diasSemana?: number[];
  totalAlunosAtivos?: number;
}): TurmaView {
  const dias = t.diasSemana ?? [];
  return {
    id: t.id,
    nome: t.nome,
    livro: t.livroNome ?? `Livro ${t.livroId}`,
    livroId: t.livroId,
    professor: t.professorNome ?? `Professor ${t.professorId}`,
    professorId: t.professorId,
    diaSemanaLabel: diasParaLabel(dias),
    horarioInicio: t.horarioInicio ?? "",
    horarioFim: t.horarioFim ?? "",
    sala: t.sala ?? "",
    status: t.status as StatusApi,
    dataInicio: t.dataInicio ? formatarDataBr(t.dataInicio) : "A definir",
    dataTermino: t.dataTerminoPrevista ? formatarDataBr(t.dataTerminoPrevista) : "A calcular na ativação",
    dataTerminoPrevistaIso: t.dataTerminoPrevista ?? null,
    totalAlunos: t.totalAlunosAtivos ?? 0,
    diasSemana: dias,
  };
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</label>
      {children}
    </div>
  );
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const requestClose = () => {
    if (typeof window !== "undefined" && window.confirm("Deseja fechar esta janela?")) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
            {subtitle ? <p className="text-xs font-medium text-zinc-700">{subtitle}</p> : null}
          </div>
          <button type="button" onClick={requestClose} className="text-zinc-600 hover:text-zinc-900">
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-4 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({
  onClose,
  onConfirm,
  confirmLabel,
  saving,
  confirmClass = "bg-[#1F2A35] hover:bg-[#2d3d4d]",
}: {
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  saving: boolean;
  confirmClass?: string;
}) {
  return (
    <div className="flex justify-end gap-3 border-t border-zinc-100 pt-4">
      <button type="button" onClick={onClose} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600">
        Cancelar
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={onConfirm}
        className={`rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50 ${confirmClass}`}
      >
        {saving ? "Salvando…" : confirmLabel}
      </button>
    </div>
  );
}

function DiasSelector({ dias, toggle }: { dias: number[]; toggle: (v: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {DIAS_OPCOES.map((d) => (
        <button
          key={d.value}
          type="button"
          onClick={() => toggle(d.value)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
            dias.includes(d.value) ? "border-blue-600 bg-blue-50 text-blue-700" : "border-zinc-300 text-zinc-600"
          }`}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}

function HorariosFields({
  horaIni,
  horaFim,
  setIni,
  setFim,
}: {
  horaIni: string;
  horaFim: string;
  setIni: (v: string) => void;
  setFim: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Field label="Início (24h) *">
        <input type="time" value={horaIni} onChange={(e) => setIni(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Término (24h) *">
        <input type="time" value={horaFim} onChange={(e) => setFim(e.target.value)} className={inputCls} />
      </Field>
    </div>
  );
}

function AlunosHint({ total, compact }: { total: number; compact?: boolean }) {
  const ok = total >= 3;
  if (compact) {
    return (
      <div>
        <span className="text-zinc-400">Alunos</span>
        <p className={`font-semibold ${ok ? "text-zinc-800" : "text-amber-700"}`}>{total} ativos</p>
      </div>
    );
  }
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${ok ? "border-zinc-200 bg-zinc-50 text-zinc-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
      <strong>{total}</strong> aluno(s) matriculado(s). Mínimo para ativar: <strong>3</strong>.
    </div>
  );
}

function StatusBadge({ status }: { status: StatusApi }) {
  const cls =
    status === "Em Espera"
      ? "bg-amber-100 text-amber-800"
      : status === "Em Andamento"
        ? "bg-sky-100 text-sky-900"
        : status === "Concluida"
          ? "bg-emerald-100 text-emerald-800"
          : "bg-zinc-200 text-zinc-700";
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${cls}`}>{status}</span>;
}

function ModalNovaTurma({
  livros,
  professores,
  horariosFuncionamento,
  onClose,
  onSave,
  saving,
}: {
  livros: LivroEscolaDto[];
  professores: UsuarioMinhaEscola[];
  horariosFuncionamento: HorarioFuncionamentoDto[];
  onClose: () => void;
  onSave: (payload: CriarTurmaPayload) => void;
  saving: boolean;
}) {
  const [professorId, setProfessorId] = useState("");
  const [livroId, setLivroId] = useState("");
  const [sala, setSala] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [dias, setDias] = useState<number[]>([]);
  const [horaIni, setHoraIni] = useState("");
  const [horaFim, setHoraFim] = useState("");

  const profsAtivos = professores.filter(
    (p) => p.status === "Ativo" && p.perfilNome.toLowerCase().includes("professor"),
  );
  const livrosAtivos = livros.filter((l) => l.status === "Ativo");

  function toggleDia(v: number) {
    setDias((prev) => (prev.includes(v) ? prev.filter((d) => d !== v) : [...prev, v]));
  }

  function handleSave() {
    if (!professorId || !livroId) {
      alert("Professor e livro são obrigatórios.");
      return;
    }
    const erroHorario = validarHorarioTurmaFuncionamento(dias, horaIni, horaFim, horariosFuncionamento);
    if (erroHorario) {
      alert(erroHorario);
      return;
    }
    onSave({
      professorId: Number(professorId),
      livroId: Number(livroId),
      sala: sala || undefined,
      observacoes: observacoes || undefined,
      diasSemana: dias.length > 0 ? dias : undefined,
      horarioInicio: horaIni || undefined,
      horarioFim: horaFim || undefined,
    });
  }

  return (
    <ModalShell title="Criar nova turma" onClose={onClose}>
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Status inicial: <strong>Em Espera</strong>. Ativação exige ≥3 alunos e data de início.
      </div>

      <Field label="Professor *">
        <select value={professorId} onChange={(e) => setProfessorId(e.target.value)} className={inputCls}>
          <option value="">Selecione</option>
          {profsAtivos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nomeCompleto}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Livro (book) *">
        <select value={livroId} onChange={(e) => setLivroId(e.target.value)} className={inputCls}>
          <option value="">Selecione</option>
          {livrosAtivos.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nome} ({l.totalAulasPrevistas} aulas)
            </option>
          ))}
        </select>
      </Field>

      <Field label="Dias da semana (opcional)">
        <DiasSelector dias={dias} toggle={toggleDia} />
      </Field>

      <HorariosFields horaIni={horaIni} horaFim={horaFim} setIni={setHoraIni} setFim={setHoraFim} />

      <Field label="Local / sala">
        <input value={sala} onChange={(e) => setSala(e.target.value)} className={inputCls} placeholder="Sala ou link" />
      </Field>

      <Field label="Observações">
        <textarea
          rows={2}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className={`${inputCls} min-h-[72px] py-2`}
        />
      </Field>

      <ModalFooter onClose={onClose} onConfirm={handleSave} confirmLabel="Salvar em espera" saving={saving} />
    </ModalShell>
  );
}

function ModalAgendarTurma({
  turma,
  horariosFuncionamento,
  onClose,
  onSave,
  saving,
}: {
  turma: TurmaView;
  horariosFuncionamento: HorarioFuncionamentoDto[];
  onClose: () => void;
  onSave: (payload: AtivarTurmaPayload) => void;
  saving: boolean;
}) {
  const [dias, setDias] = useState<number[]>(turma.diasSemana);
  const [dataInicio, setDataInicio] = useState("");
  const [horaIni, setHoraIni] = useState(turma.horarioInicio);
  const [horaFim, setHoraFim] = useState(turma.horarioFim);
  const [sala, setSala] = useState(turma.sala);

  function toggleDia(v: number) {
    setDias((prev) => (prev.includes(v) ? prev.filter((d) => d !== v) : [...prev, v]));
  }

  function handleAgendar() {
    if (dias.length === 0 || !dataInicio || !horaIni || !horaFim) {
      alert("Preencha dias, data de início e horários.");
      return;
    }
    if (turma.totalAlunos < 3) {
      alert(`Mínimo 3 alunos ativos. Atual: ${turma.totalAlunos}.`);
      return;
    }
    const erroHorario = validarHorarioTurmaFuncionamento(dias, horaIni, horaFim, horariosFuncionamento);
    if (erroHorario) {
      alert(erroHorario);
      return;
    }
    onSave({
      dataInicio,
      diasSemana: dias,
      horarioInicio: horaIni,
      horarioFim: horaFim,
      sala: sala || undefined,
    });
  }

  return (
    <ModalShell title="Ativar turma" subtitle={turma.nome} onClose={onClose}>
      <AlunosHint total={turma.totalAlunos} />
      <Field label="Dias da semana *">
        <DiasSelector dias={dias} toggle={toggleDia} />
      </Field>
      <Field label="Data de início *">
        <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className={inputCls} />
      </Field>
      <HorariosFields horaIni={horaIni} horaFim={horaFim} setIni={setHoraIni} setFim={setHoraFim} />
      <Field label="Sala">
        <input value={sala} onChange={(e) => setSala(e.target.value)} className={inputCls} />
      </Field>
      <p className="text-xs text-zinc-500">
        Gera aulas do livro, pula feriados/recessos e define a previsão de término.
      </p>
      <ModalFooter
        onClose={onClose}
        onConfirm={handleAgendar}
        confirmLabel="Ativar turma"
        saving={saving}
        confirmClass="bg-emerald-600 hover:bg-emerald-700"
      />
    </ModalShell>
  );
}

function CardTurmaProfessor({ turma }: { turma: TurmaView }) {
  return (
    <Link
      href={`/professor/turma/${turma.id}`}
      className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-[#1F2A35]/30 hover:shadow-md"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-zinc-900">{turma.nome}</p>
        <p className="mt-1 text-xs text-zinc-500">{turma.livro}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-xs">
        <div>
          <span className="text-zinc-400">Horário</span>
          <p className="font-semibold text-zinc-800">
            {turma.diaSemanaLabel && turma.horarioInicio
              ? `${turma.diaSemanaLabel} · ${turma.horarioInicio}–${turma.horarioFim}`
              : "—"}
          </p>
        </div>
        <AlunosHint total={turma.totalAlunos} compact />
        <div className="col-span-2 border-t border-zinc-200 pt-2">
          <span className="text-zinc-400">Período</span>
          <p className="font-semibold text-zinc-800">
            {turma.dataInicio} → {turma.dataTermino}
          </p>
        </div>
      </div>

      <span className="text-center text-xs font-semibold text-[#1F2A35]">Acessar turma →</span>
    </Link>
  );
}

function CardTurma({
  turma,
  onInativar,
  onAgendar,
  onConcluir,
  podeConcluir,
  concluindo,
}: {
  turma: TurmaView;
  onInativar: (id: number) => void;
  onAgendar: (t: TurmaView) => void;
  onConcluir: (id: number, nome: string) => void;
  podeConcluir: boolean;
  concluindo: boolean;
}) {
  const encerrada = turma.status === "Concluida" || turma.status === "Cancelada" || turma.status === "Inativa";
  const exibirConcluir =
    podeConcluir &&
    turma.status === "Em Andamento" &&
    passouTerminoPrevisto(turma.dataTerminoPrevistaIso);

  return (
    <div
      className={`flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 ${
        encerrada ? "opacity-75 grayscale" : "hover:border-zinc-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-zinc-900">{turma.nome}</p>
          <p className="mt-1 text-xs text-zinc-500">{turma.professor}</p>
        </div>
        <StatusBadge status={turma.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-xs">
        <div>
          <span className="text-zinc-400">Livro</span>
          <p className="font-semibold text-zinc-800">{turma.livro}</p>
        </div>
        <AlunosHint total={turma.totalAlunos} compact />
        <div className="col-span-2 border-t border-zinc-200 pt-2">
          <span className="text-zinc-400">Cronograma</span>
          <p className="font-semibold text-zinc-800">
            {turma.diaSemanaLabel && turma.horarioInicio
              ? `${turma.diaSemanaLabel} · ${turma.horarioInicio}–${turma.horarioFim}`
              : "Definir no agendamento"}
          </p>
          {turma.status === "Em Andamento" && (
            <p className="mt-0.5 text-zinc-500">
              {turma.dataInicio} → {turma.dataTermino}
            </p>
          )}
          {exibirConcluir && (
            <p className="mt-1 text-[11px] font-medium text-emerald-700">
              Prazo previsto encerrado — disponível para conclusão
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-t border-zinc-100 pt-3">
        {turma.status === "Em Espera" && (
          <>
            <button
              type="button"
              onClick={() => onAgendar(turma)}
              className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700"
            >
              Ativar turma
            </button>
            <Link
              href={`/turmas/${turma.id}`}
              className="flex flex-1 items-center justify-center rounded-lg border border-zinc-300 bg-white py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
            >
              Alunos
            </Link>
          </>
        )}
        {turma.status === "Em Andamento" && (
          <>
            {exibirConcluir && (
              <button
                type="button"
                disabled={concluindo}
                onClick={() => onConcluir(turma.id, turma.nome)}
                className="flex flex-1 items-center justify-center rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {concluindo ? "Concluindo…" : "Concluir turma"}
              </button>
            )}
            <Link
              href={`/turmas/${turma.id}`}
              className="flex flex-1 items-center justify-center rounded-lg border border-zinc-300 bg-white py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
            >
              Acessar turma
            </Link>
          </>
        )}
        {encerrada && (
          <Link
            href={`/turmas/${turma.id}`}
            className="flex flex-1 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 py-2 text-xs font-bold text-zinc-600"
          >
            Ver detalhes
          </Link>
        )}
        {(turma.status === "Em Andamento" || turma.status === "Em Espera") && (
          <button
            type="button"
            onClick={() => onInativar(turma.id)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-zinc-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            title="Inativar"
          >
            ⏻
          </button>
        )}
      </div>
    </div>
  );
}

export default function TurmasPage() {
  const { user, isLoading: authLoading } = useAuth();
  const podeGerenciarTurma = !!user && hasPermission(user, "CRIAR_TURMA");
  const podeConcluirTurma = !!user && hasPermission(user, "CONCLUIR_TURMA");

  const [turmas, setTurmas] = useState<TurmaView[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [concluindoId, setConcluindoId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aba, setAba] = useState<"andamento" | "espera" | "concluidas" | "inativas">("andamento");
  const [modalNova, setModalNova] = useState(false);
  const [turmaAgendando, setTurmaAgendando] = useState<TurmaView | null>(null);
  const [livros, setLivros] = useState<LivroEscolaDto[]>([]);
  const [professores, setProfessores] = useState<UsuarioMinhaEscola[]>([]);
  const [horariosFuncionamento, setHorariosFuncionamento] = useState<HorarioFuncionamentoDto[]>([]);
  const [filtroProfessor, setFiltroProfessor] = useState("todos");
  const [filtroLivro, setFiltroLivro] = useState("todos");

  const carregar = useCallback(async () => {
    if (authLoading) return;

    const gestao = !!user && hasPermission(user, "CRIAR_TURMA");
    setLoading(true);
    setError(null);
    try {
      const lista = await listarTurmas(gestao ? undefined : { status: "Em Andamento" });
      setTurmas(lista.map(mapApiTurma));
    } catch (e) {
      setError(getApiErrorMessage(e, "Não foi possível carregar turmas."));
      setTurmas([]);
    } finally {
      setLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    (async () => {
      const gestao = !!user && hasPermission(user, "CRIAR_TURMA");
      setLoading(true);
      setError(null);
      try {
        const lista = await listarTurmas(gestao ? undefined : { status: "Em Andamento" });
        if (!cancelled) setTurmas(lista.map(mapApiTurma));
      } catch (e) {
        if (!cancelled) {
          setError(getApiErrorMessage(e, "Não foi possível carregar turmas."));
          setTurmas([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading || !podeGerenciarTurma) return;
    void listarLivrosEscola().then(setLivros).catch(() => setLivros([]));
    void listarUsuariosMinhaEscola().then(setProfessores).catch(() => setProfessores([]));
    void listarHorariosFuncionamentoConsultaTurmas()
      .then(setHorariosFuncionamento)
      .catch(() => setHorariosFuncionamento([]));
  }, [authLoading, podeGerenciarTurma]);

  const turmasFiltradas = useMemo(() => {
    return turmas.filter((t) => {
      const abaOk =
        aba === "andamento"
          ? t.status === "Em Andamento"
          : aba === "espera"
            ? t.status === "Em Espera"
            : aba === "concluidas"
              ? t.status === "Concluida"
              : t.status === "Inativa" || t.status === "Cancelada";
      const profOk = filtroProfessor === "todos" || String(t.professorId) === filtroProfessor;
      const livroOk = filtroLivro === "todos" || String(t.livroId) === filtroLivro;
      return abaOk && profOk && livroOk;
    });
  }, [turmas, aba, filtroProfessor, filtroLivro]);

  const counts = useMemo(
    () => ({
      andamento: turmas.filter((t) => t.status === "Em Andamento").length,
      espera: turmas.filter((t) => t.status === "Em Espera").length,
      concluidas: turmas.filter((t) => t.status === "Concluida").length,
      inativas: turmas.filter((t) => t.status === "Inativa" || t.status === "Cancelada").length,
    }),
    [turmas],
  );

  async function handleCriar(payload: CriarTurmaPayload) {
    setSaving(true);
    try {
      await criarTurma(payload);
      setModalNova(false);
      setAba("espera");
      await carregar();
    } catch (e) {
      alert(getApiErrorMessage(e, "Não foi possível criar a turma."));
    } finally {
      setSaving(false);
    }
  }

  async function handleAtivar(payload: AtivarTurmaPayload) {
    if (!turmaAgendando) return;
    setSaving(true);
    try {
      await ativarTurma(turmaAgendando.id, payload);
      setTurmaAgendando(null);
      setAba("andamento");
      await carregar();
    } catch (e) {
      alert(getApiErrorMessage(e, "Não foi possível ativar a turma."));
    } finally {
      setSaving(false);
    }
  }

  async function handleInativar(id: number) {
    if (!confirm("Inativar esta turma?")) return;
    try {
      await inativarTurma(id);
      await carregar();
    } catch (e) {
      alert(getApiErrorMessage(e, "Não foi possível inativar."));
    }
  }

  async function handleConcluir(id: number, nome: string) {
    if (
      !confirm(
        `Concluir a turma "${nome}"?\n\nAs matrículas ativas serão marcadas como concluídas e os alunos poderão ser enturmados em outra turma.`,
      )
    ) {
      return;
    }
    setConcluindoId(id);
    try {
      await concluirTurma(id);
      setAba("concluidas");
      await carregar();
    } catch (e) {
      alert(getApiErrorMessage(e, "Não foi possível concluir a turma."));
    } finally {
      setConcluindoId(null);
    }
  }

  if (authLoading) {
    return <p className="py-16 text-center text-sm text-zinc-500">Carregando turmas…</p>;
  }

  if (!podeGerenciarTurma) {
    return (
      <div className="flex h-full flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Minhas Turmas</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Turmas em andamento sob sua responsabilidade.</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <p className="py-16 text-center text-sm text-zinc-500">Carregando turmas…</p>
        ) : turmas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 py-16 text-center text-sm text-zinc-500">
            Você não tem turmas ativas no momento.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 pb-6 sm:grid-cols-2 lg:grid-cols-3">
            {turmas.map((t) => (
              <CardTurmaProfessor key={t.id} turma={t} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Turmas</h1>
            <p className="mt-0.5 text-sm text-zinc-500">Em espera → ativar (≥3 alunos) → aulas e término automáticos.</p>
          </div>
          <button
            type="button"
            onClick={() => setModalNova(true)}
            className="flex h-10 items-center gap-2 rounded-lg bg-[#1F2A35] px-5 text-sm font-bold text-white hover:bg-[#2d3d4d]"
          >
            + Nova turma
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}

        <div className="flex w-fit gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1.5">
          {(
            [
              { key: "andamento" as const, label: "Em andamento", count: counts.andamento },
              { key: "espera" as const, label: "Em espera", count: counts.espera },
              { key: "concluidas" as const, label: "Concluídas", count: counts.concluidas },
              { key: "inativas" as const, label: "Inativas", count: counts.inativas },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setAba(t.key)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold ${
                aba === t.key ? "bg-white text-[#1F2A35] shadow-sm" : "text-zinc-500"
              }`}
            >
              {t.label}
              <span className="rounded-full bg-zinc-200 px-1.5 text-[10px]">{t.count}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <select value={filtroProfessor} onChange={(e) => setFiltroProfessor(e.target.value)} className={inputCls}>
            <option value="todos">Todos os professores</option>
            {professores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nomeCompleto}
              </option>
            ))}
          </select>
          <select value={filtroLivro} onChange={(e) => setFiltroLivro(e.target.value)} className={inputCls}>
            <option value="todos">Todos os livros</option>
            {livros.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="py-16 text-center text-sm text-zinc-500">Carregando turmas…</p>
        ) : turmasFiltradas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 py-16 text-center text-sm text-zinc-500">
            Nenhuma turma nesta aba.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 pb-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {turmasFiltradas.map((t) => (
              <CardTurma
                key={t.id}
                turma={t}
                onInativar={handleInativar}
                onAgendar={setTurmaAgendando}
                onConcluir={handleConcluir}
                podeConcluir={podeConcluirTurma}
                concluindo={concluindoId === t.id}
              />
            ))}
          </div>
        )}
      </div>

      {modalNova && (
        <ModalNovaTurma
          livros={livros}
          professores={professores}
          horariosFuncionamento={horariosFuncionamento}
          onClose={() => setModalNova(false)}
          onSave={handleCriar}
          saving={saving}
        />
      )}
      {turmaAgendando && (
        <ModalAgendarTurma
          turma={turmaAgendando}
          horariosFuncionamento={horariosFuncionamento}
          onClose={() => setTurmaAgendando(null)}
          onSave={handleAtivar}
          saving={saving}
        />
      )}
    </>
  );
}
