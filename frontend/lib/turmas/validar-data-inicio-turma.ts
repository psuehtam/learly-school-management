import type { EventoCalendario } from "@/lib/api/calendario";

const DIAS_LABEL: Record<number, string> = {
  0: "domingo",
  1: "segunda-feira",
  2: "terça-feira",
  3: "quarta-feira",
  4: "quinta-feira",
  5: "sexta-feira",
  6: "sábado",
};

/** Converte ISO yyyy-MM-dd para DayOfWeek .NET (0=dom … 6=sáb). */
export function diaSemanaDeDataIso(dataIso: string): number {
  const [y, m, d] = dataIso.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function validarDataInicioTurma(
  dataIso: string,
  diasSemana: number[],
  eventosCalendario: EventoCalendario[],
): string | null {
  if (!dataIso) return "Informe a data de início.";
  if (diasSemana.length === 0) return "Selecione ao menos um dia da semana.";

  const dow = diaSemanaDeDataIso(dataIso);
  if (!diasSemana.includes(dow)) {
    const nomes = diasSemana.map((d) => DIAS_LABEL[d] ?? `dia ${d}`).join(", ");
    return `A data de início deve cair em um dos dias da turma (${nomes}).`;
  }

  const evento = eventosCalendario.find((e) => e.dataEvento === dataIso);
  if (evento?.suspendeAula) {
    const tipo = evento.tipoEvento.replace(/\s+/g, " ").toLowerCase();
    return `A data selecionada é ${tipo} no calendário (${evento.descricao?.trim() || "sem descrição"}). Escolha outro dia.`;
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const [y, m, d] = dataIso.split("-").map(Number);
  const escolhida = new Date(y, m - 1, d);
  if (escolhida < hoje) {
    return "A data de início não pode ser anterior a hoje.";
  }

  return null;
}

export function parseMesAnoDeDataIso(dataIso: string): { mes: number; ano: number } | null {
  const [y, m] = dataIso.split("-").map(Number);
  if (!y || !m) return null;
  return { mes: m, ano: y };
}
