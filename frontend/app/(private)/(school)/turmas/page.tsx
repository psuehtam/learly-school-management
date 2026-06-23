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
import { listarMatriculas, type MatriculaListItem } from "@/lib/api/matriculas";
import { listarUsuariosMinhaEscola, type UsuarioMinhaEscola } from "@/lib/api/usuarios";
import { listarEventos, type EventoCalendario } from "@/lib/api/calendario";
import { obterConfiguracoesEscolaConsultaTurmas } from "@/lib/api/minha-escola";
import {
  parseMesAnoDeDataIso,
  validarDataInicioTurma,
} from "@/lib/turmas/validar-data-inicio-turma";
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

function labelAlunoMatricula(matricula: MatriculaListItem): string {
  return matricula.alunoNomeCompleto?.trim() || `Aluno #${matricula.alunoId}`;
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

function AlunosHint({ total, compact, minAlunos = 3 }: { total: number; compact?: boolean; minAlunos?: number }) {
  const ok = total >= minAlunos;
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
      <strong>{total}</strong> aluno(s) matriculado(s). Mínimo para ativar: <strong>{minAlunos}</strong>.
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
  matriculasElegiveis,
  carregandoMatriculas,
  erroMatriculas,
  onReloadMatriculas,
  onClose,
  onSave,
  saving,
}: {
  livros: LivroEscolaDto[];
  professores: UsuarioMinhaEscola[];
  horariosFuncionamento: HorarioFuncionamentoDto[];
  matriculasElegiveis: MatriculaListItem[];
  carregandoMatriculas: boolean;
  erroMatriculas: string | null;
  onReloadMatriculas: () => void;
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
  const [buscaMatricula, setBuscaMatricula] = useState("");
  const [matriculaIdsSelecionadas, setMatriculaIdsSelecionadas] = useState<number[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const profsAtivos = professores.filter(
    (p) => p.status === "Ativo" && p.perfilNome.toLowerCase().includes("professor"),
  );
  const livrosAtivos = livros.filter((l) => l.status === "Ativo");
  const matriculasFiltradas = useMemo(() => {
    const termo = buscaMatricula.trim().toLowerCase();
    const ordenadas = [...matriculasElegiveis].sort((a, b) =>
      labelAlunoMatricula(a).localeCompare(labelAlunoMatricula(b), "pt-BR"),
    );
    if (!termo) return ordenadas;

    return ordenadas.filter((m) =>
      `${labelAlunoMatricula(m)} ${m.alunoId} ${m.id}`.toLowerCase().includes(termo),
    );
  }, [buscaMatricula, matriculasElegiveis]);

  function toggleDia(v: number) {
    setDias((prev) => (prev.includes(v) ? prev.filter((d) => d !== v) : [...prev, v]));
  }

  function toggleMatricula(matriculaId: number) {
    setMatriculaIdsSelecionadas((prev) =>
      prev.includes(matriculaId)
        ? prev.filter((id) => id !== matriculaId)
        : [...prev, matriculaId],
    );
  }

  function handleSave() {
    if (!professorId || !livroId) {
      setErro("Professor e livro são obrigatórios.");
      return;
    }
    const erroHorario = validarHorarioTurmaFuncionamento(dias, horaIni, horaFim, horariosFuncionamento);
    if (erroHorario) {
      setErro(erroHorario);
      return;
    }
    setErro(null);
    onSave({
      professorId: Number(professorId),
      livroId: Number(livroId),
      sala: sala.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
      diasSemana: dias.length > 0 ? dias : undefined,
      horarioInicio: horaIni || undefined,
      horarioFim: horaFim || undefined,
      matriculaIds: matriculaIdsSelecionadas.length > 0 ? matriculaIdsSelecionadas : undefined,
    });
  }

  return (
    <ModalShell title="Criar nova turma" onClose={onClose}>
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Status inicial: <strong>Em Espera</strong>. Você pode criar a turma vazia ou já enturmar alunos da fila de espera.
      </div>

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{erro}</div>
      )}

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
              {l.nome} ({l.totalDuracaoMinutos} min)
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

      <div className="space-y-3 rounded-lg border border-zinc-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Enturmar alunos agora</h3>
            <p className="text-xs text-zinc-500">
              Selecione matrículas em espera sem turma para vincular automaticamente à nova turma.
            </p>
          </div>
          <button
            type="button"
            onClick={onReloadMatriculas}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Atualizar lista
          </button>
        </div>

        <Field label="Buscar por aluno ou matrícula">
          <input
            value={buscaMatricula}
            onChange={(e) => setBuscaMatricula(e.target.value)}
            className={inputCls}
            placeholder="Nome do aluno, AlunoId ou MatrículaId"
          />
        </Field>

        {erroMatriculas && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {erroMatriculas}
          </div>
        )}

        {carregandoMatriculas ? (
          <p className="text-sm text-zinc-500">Carregando matrículas elegíveis…</p>
        ) : matriculasElegiveis.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-4 text-sm text-zinc-500">
            Nenhuma matrícula em espera sem turma disponível no momento.
          </p>
        ) : (
          <>
            <p className="text-xs text-zinc-500">
              {matriculaIdsSelecionadas.length} matrícula(s) selecionada(s) para a nova turma.
            </p>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-zinc-100">
              {matriculasFiltradas.length === 0 ? (
                <p className="px-3 py-4 text-sm text-zinc-500">Nenhuma matrícula encontrada para o filtro informado.</p>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {matriculasFiltradas.map((matricula) => (
                    <label
                      key={matricula.id}
                      className="flex cursor-pointer items-start gap-3 px-3 py-3 hover:bg-zinc-50"
                    >
                      <input
                        type="checkbox"
                        checked={matriculaIdsSelecionadas.includes(matricula.id)}
                        onChange={() => toggleMatricula(matricula.id)}
                        className="mt-0.5 h-4 w-4 rounded border-zinc-300"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900">{labelAlunoMatricula(matricula)}</p>
                        <p className="text-xs text-zinc-500">
                          Matrícula #{matricula.id} · aluno #{matricula.alunoId} · ingresso em{" "}
                          {formatarDataBr(matricula.dataMatricula)}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <ModalFooter onClose={onClose} onConfirm={handleSave} confirmLabel="Salvar em espera" saving={saving} />
    </ModalShell>
  );
}

function ModalAgendarTurma({
  turma,
  horariosFuncionamento,
  minAlunosTurma,
  onClose,
  onSave,
  saving,
}: {
  turma: TurmaView;
  horariosFuncionamento: HorarioFuncionamentoDto[];
  minAlunosTurma: number;
  onClose: () => void;
  onSave: (payload: AtivarTurmaPayload) => void;
  saving: boolean;
}) {
  const [dias, setDias] = useState<number[]>(turma.diasSemana);
  const [dataInicio, setDataInicio] = useState("");
  const [horaIni, setHoraIni] = useState(turma.horarioInicio);
  const [horaFim, setHoraFim] = useState(turma.horarioFim);
  const [sala, setSala] = useState(turma.sala);
  const [eventosMes, setEventosMes] = useState<EventoCalendario[]>([]);

  useEffect(() => {
    if (!dataInicio) {
      setEventosMes([]);
      return;
    }
    const parsed = parseMesAnoDeDataIso(dataInicio);
    if (!parsed) return;
    let cancelled = false;
    void listarEventos(parsed.mes, parsed.ano)
      .then((lista) => {
        if (!cancelled) setEventosMes(lista);
      })
      .catch(() => {
        if (!cancelled) setEventosMes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [dataInicio]);

  function toggleDia(v: number) {
    setDias((prev) => (prev.includes(v) ? prev.filter((d) => d !== v) : [...prev, v]));
  }

  function handleAgendar() {
    if (dias.length === 0 || !dataInicio || !horaIni || !horaFim) {
      alert("Preencha dias, data de início e horários.");
      return;
    }
    if (turma.totalAlunos < minAlunosTurma) {
      alert(`Mínimo ${minAlunosTurma} alunos ativos. Atual: ${turma.totalAlunos}.`);
      return;
    }
    const erroData = validarDataInicioTurma(dataInicio, dias, eventosMes);
    if (erroData) {
      alert(erroData);
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

  const diasLabel = dias
    .map((d) => DIAS_OPCOES.find((o) => o.value === d)?.label ?? "")
    .filter(Boolean)
    .join(", ");

  return (
    <ModalShell title="Ativar turma" subtitle={turma.nome} onClose={onClose}>
      <AlunosHint total={turma.totalAlunos} minAlunos={minAlunosTurma} />
      <Field label="Dias da semana *">
        <DiasSelector dias={dias} toggle={toggleDia} />
      </Field>
      <Field label="Data de início *">
        <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className={inputCls} />
        {dias.length > 0 ? (
          <p className="mt-1 text-xs text-zinc-500">
            A data deve ser um(a): {diasLabel}. Feriados e dias sem aula do calendário não são permitidos.
          </p>
        ) : null}
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
  const [matriculasElegiveis, setMatriculasElegiveis] = useState<MatriculaListItem[]>([]);
  const [carregandoMatriculas, setCarregandoMatriculas] = useState(false);
  const [erroMatriculas, setErroMatriculas] = useState<string | null>(null);
  const [filtroProfessor, setFiltroProfessor] = useState("todos");
  const [filtroLivro, setFiltroLivro] = useState("todos");
  const [minAlunosTurma, setMinAlunosTurma] = useState(3);

  const profsParaFiltro = useMemo(() => {
    const profsAtivos = professores.filter(
      (p) => p.status === "Ativo" && p.perfilNome.toLowerCase().includes("professor"),
    );
    const idsAtivos = new Set(profsAtivos.map((p) => p.id));
    const extras = new Map<number, string>();
    for (const t of turmas) {
      if (!idsAtivos.has(t.professorId)) {
        extras.set(t.professorId, t.professor);
      }
    }
    return [
      ...profsAtivos.map((p) => ({ id: p.id, nome: p.nomeCompleto })),
      ...Array.from(extras.entries()).map(([id, nome]) => ({ id, nome: `${nome} (inativo)` })),
    ].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [professores, turmas]);

  const turmasBaseFiltradas = useMemo(() => {
    return turmas.filter((t) => {
      const profOk = filtroProfessor === "todos" || String(t.professorId) === filtroProfessor;
      const livroOk = filtroLivro === "todos" || String(t.livroId) === filtroLivro;
      return profOk && livroOk;
    });
  }, [turmas, filtroProfessor, filtroLivro]);

  const turmasFiltradas = useMemo(() => {
    return turmasBaseFiltradas.filter((t) => {
      return aba === "andamento"
        ? t.status === "Em Andamento"
        : aba === "espera"
          ? t.status === "Em Espera"
          : aba === "concluidas"
            ? t.status === "Concluida"
            : t.status === "Inativa" || t.status === "Cancelada";
    });
  }, [turmasBaseFiltradas, aba]);

  const counts = useMemo(
    () => ({
      andamento: turmasBaseFiltradas.filter((t) => t.status === "Em Andamento").length,
      espera: turmasBaseFiltradas.filter((t) => t.status === "Em Espera").length,
      concluidas: turmasBaseFiltradas.filter((t) => t.status === "Concluida").length,
      inativas: turmasBaseFiltradas.filter((t) => t.status === "Inativa" || t.status === "Cancelada").length,
    }),
    [turmasBaseFiltradas],
  );

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

  const carregarMatriculasElegiveis = useCallback(async () => {
    setCarregandoMatriculas(true);
    setErroMatriculas(null);
    try {
      const lista = await listarMatriculas({ status: "Em Espera" });
      setMatriculasElegiveis(lista);
    } catch (e) {
      setErroMatriculas(getApiErrorMessage(e, "Não foi possível carregar as matrículas em espera."));
      setMatriculasElegiveis([]);
    } finally {
      setCarregandoMatriculas(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !podeGerenciarTurma) return;
    void listarLivrosEscola().then(setLivros).catch(() => setLivros([]));
    void listarUsuariosMinhaEscola().then(setProfessores).catch(() => setProfessores([]));
    void listarHorariosFuncionamentoConsultaTurmas()
      .then(setHorariosFuncionamento)
      .catch(() => setHorariosFuncionamento([]));
    void obterConfiguracoesEscolaConsultaTurmas()
      .then((cfg) => setMinAlunosTurma(cfg.minAlunosTurma))
      .catch(() => setMinAlunosTurma(3));
    void carregarMatriculasElegiveis();
  }, [authLoading, carregarMatriculasElegiveis, podeGerenciarTurma]);

  async function handleCriar(payload: CriarTurmaPayload) {
    setSaving(true);
    try {
      await criarTurma(payload);
      setModalNova(false);
      setAba("espera");
      await Promise.all([carregar(), carregarMatriculasElegiveis()]);
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
            {profsParaFiltro.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
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
          matriculasElegiveis={matriculasElegiveis}
          carregandoMatriculas={carregandoMatriculas}
          erroMatriculas={erroMatriculas}
          onReloadMatriculas={() => void carregarMatriculasElegiveis()}
          onClose={() => setModalNova(false)}
          onSave={handleCriar}
          saving={saving}
        />
      )}
      {turmaAgendando && (
        <ModalAgendarTurma
          turma={turmaAgendando}
          horariosFuncionamento={horariosFuncionamento}
          minAlunosTurma={minAlunosTurma}
          onClose={() => setTurmaAgendando(null)}
          onSave={handleAtivar}
          saving={saving}
        />
      )}
    </>
  );
}
