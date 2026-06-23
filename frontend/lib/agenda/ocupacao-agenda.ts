import type { Aula } from "@/types/aula";
import type { Compromisso } from "@/lib/api/compromissos";
import { formatarDataIsoPtBr } from "@/lib/dates";

/** Altura mínima (px) do bloco na grade para compromissos/aulas muito curtos continuarem legíveis. */
export const AGENDA_ALTURA_MINIMA_CARD_OCUPACAO_PX = 72;

/** Duração em minutos entre dois horários `HH:mm`. */
export function duracaoAgendaMinutos(inicio: string, fim: string): number {
  const [h1, m1] = inicio.split(":").map(Number);
  const [h2, m2] = fim.split(":").map(Number);
  return Math.max(0, h2 * 60 + m2 - (h1 * 60 + m1));
}

/** Tipos de ocupação exibidos na grade de agenda (extensível no futuro). */
export type OcupacaoAgendaTipo = "AULA" | "REPOSICAO" | "COMPROMISSO";

export interface OcupacaoAgendaItem {
  id: string;
  usuarioId: number;
  inicio: string;
  fim: string;
  titulo: string;
  subtitulo: string;
  tipo: OcupacaoAgendaTipo;
  /** Categoria do compromisso vinda da API (`tipo` do registro), ex.: reunião. */
  categoriaCompromisso?: string;
  /** Reposição: aluno e aula original (quando a API envia os vínculos). */
  contextoAulaExtra?: string;
}

export function toHorarioAgenda(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value;
}

/** Fundo e borda do card; texto fica neutro no componente para legibilidade. */
export function ocupacaoAgendaCardClassNames(tipo: OcupacaoAgendaTipo): string {
  if (tipo === "REPOSICAO") return "bg-amber-50/95 border-amber-200 shadow-sm";
  if (tipo === "COMPROMISSO") return "bg-violet-50/95 border-violet-200 shadow-sm";
  return "bg-blue-50/95 border-blue-200 shadow-sm";
}

export function ocupacaoAgendaTipoBadgeClassNames(tipo: OcupacaoAgendaTipo): string {
  if (tipo === "REPOSICAO") return "bg-amber-600 text-white";
  if (tipo === "COMPROMISSO") return "bg-violet-600 text-white";
  return "bg-blue-600 text-white";
}

/** Rótulo curto para badge ou acessibilidade. */
export function ocupacaoAgendaTipoLegivel(tipo: OcupacaoAgendaTipo): string {
  if (tipo === "REPOSICAO") return "Reposição";
  if (tipo === "COMPROMISSO") return "Compromisso";
  return "Aula";
}

/** Normaliza texto vindo da API para exibir ao lado do tipo. */
export function formatarCategoriaCompromisso(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  const comEspacos = t.replace(/_/g, " ");
  return comEspacos.charAt(0).toUpperCase() + comEspacos.slice(1).toLowerCase();
}

export { formatarDataIsoPtBr } from "@/lib/dates";

function montarSubtituloAulaTurmaLivro(a: Aula): string {
  const turma = a.turmaNome?.trim() || `Turma ${a.turmaId}`;
  const livro = a.livroNome?.trim();
  return livro ? `${turma} · ${livro}` : turma;
}

function montarContextoReposicaoAgenda(a: Aula): string | undefined {
  if (a.tipoAula !== "Reposicao") return undefined;
  const aluno = a.reposicaoAlunoNome?.trim();
  const n = a.reposicaoAulaOriginalNumero;
  const d = a.reposicaoAulaOriginalData?.trim();
  const dataFmt = d ? formatarDataIsoPtBr(d) : null;
  if (aluno && n != null && n > 0 && dataFmt) {
    return `${aluno} · repõe aula #${n} (${dataFmt})`;
  }
  if (aluno && n != null && n > 0) {
    return `${aluno} · repõe aula #${n}`;
  }
  if (aluno) return aluno;
  return undefined;
}

export function mapearAulasParaOcupacoesAgenda(
  aulas: Aula[],
  dataIso: string,
  options?: { professorId?: number },
): OcupacaoAgendaItem[] {
  const filtroProfessor = options?.professorId;
  const aulasDoDia = aulas.filter(
    (a) => a.dataAula === dataIso && a.status !== "Cancelada",
  );
  const filtradas = filtroProfessor != null
    ? aulasDoDia.filter((a) => a.professorId === filtroProfessor)
    : aulasDoDia;

  return filtradas.map((a) => {
    const subtitulo = montarSubtituloAulaTurmaLivro(a);
    const contextoAulaExtra = montarContextoReposicaoAgenda(a);
    return {
      id: `aula-${a.id}`,
      usuarioId: a.professorId,
      inicio: toHorarioAgenda(a.horarioInicio),
      fim: toHorarioAgenda(a.horarioFim),
      titulo: a.tipoAula === "Reposicao" ? `Reposição #${a.numeroAula}` : `Aula #${a.numeroAula}`,
      subtitulo,
      tipo: a.tipoAula === "Reposicao" ? "REPOSICAO" as const : "AULA" as const,
      ...(contextoAulaExtra ? { contextoAulaExtra } : {}),
    };
  });
}

export function mapearCompromissosParaOcupacoesAgenda(
  compromissos: Compromisso[],
  options?: { usuarioId?: number },
): OcupacaoAgendaItem[] {
  const filtroUsuario = options?.usuarioId;
  const validos = compromissos.filter((c) => c.status !== "Cancelado");

  return validos.flatMap((c) => {
    const ini = new Date(c.dataInicio);
    const fim = new Date(c.dataFim);
    const inicio = `${String(ini.getHours()).padStart(2, "0")}:${String(ini.getMinutes()).padStart(2, "0")}`;
    const termino = `${String(fim.getHours()).padStart(2, "0")}:${String(fim.getMinutes()).padStart(2, "0")}`;
    const cat = formatarCategoriaCompromisso(c.tipo ?? "");
    return c.participantesUsuarioIds
      .filter((uid) => (filtroUsuario != null ? uid === filtroUsuario : true))
      .map((uid) => ({
        id: `comp-${c.id}-${uid}`,
        usuarioId: uid,
        inicio,
        fim: termino,
        titulo: c.titulo,
        subtitulo: c.local?.trim() ? c.local : "Sem local definido",
        tipo: "COMPROMISSO" as const,
        ...(cat ? { categoriaCompromisso: cat } : {}),
      }));
  });
}
