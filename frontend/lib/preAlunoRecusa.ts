import { isValid, parseISO } from "date-fns";

/** Bloco gravado pela secretaria ao recusar. */
const RECUSA_LINE_ISO =
  /^\[Recusado pela secretaria em (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2}))\]\s*(.+)$/i;

/** Formato antigo (gravado em UTC sem indicar fuso). */
const RECUSA_LINE_LEGACY =
  /^\[Recusado pela secretaria em (\d{2}\/\d{2}\/\d{4} \d{2}:\d{2})\]\s*(.+)$/i;

export type UltimaRecusaSecretaria = {
  /** Valor pronto para exibição em horário de Brasília. */
  dataHora: string;
  motivo: string;
  textoCompleto: string;
};

function formatarInstanteParaBrt(instante: Date): string {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(instante);

  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${pick("day")}/${pick("month")}/${pick("year")} ${pick("hour")}:${pick("minute")}`;
}

function formatarCarimboRecusaParaExibicao(
  raw: string,
  formato: "iso" | "legado",
): string {
  if (formato === "iso") {
    const d = parseISO(raw);
    if (!isValid(d)) return raw;
    return formatarInstanteParaBrt(d);
  }

  const m = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(raw.trim());
  if (!m) return raw;

  const utc = new Date(
    Date.UTC(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]),
  );
  return formatarInstanteParaBrt(utc);
}

function parseLinhaRecusa(line: string): UltimaRecusaSecretaria | null {
  const t = line.trim();
  const iso = RECUSA_LINE_ISO.exec(t);
  if (iso) {
    return {
      dataHora: formatarCarimboRecusaParaExibicao(iso[1], "iso"),
      motivo: iso[2].trim(),
      textoCompleto: t,
    };
  }

  const legado = RECUSA_LINE_LEGACY.exec(t);
  if (legado) {
    return {
      dataHora: formatarCarimboRecusaParaExibicao(legado[1], "legado"),
      motivo: legado[2].trim(),
      textoCompleto: t,
    };
  }

  return null;
}

export function extrairUltimaRecusaSecretaria(
  observacoes: string | null | undefined,
): UltimaRecusaSecretaria | null {
  if (!observacoes?.trim()) return null;
  let ultima: UltimaRecusaSecretaria | null = null;
  for (const line of observacoes.split(/\r?\n/)) {
    const parsed = parseLinhaRecusa(line);
    if (parsed) ultima = parsed;
  }
  return ultima;
}

function linhaEhRecusa(line: string): boolean {
  const t = line.trim();
  return RECUSA_LINE_ISO.test(t) || RECUSA_LINE_LEGACY.test(t);
}

/** Texto livre do comercial, sem linhas de recusa da secretaria. */
export function extrairObservacoesComerciaisUsuario(
  observacoes: string | null | undefined,
): string {
  if (!observacoes?.trim()) return "";
  return observacoes
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !linhaEhRecusa(l))
    .join("\n");
}

export function mesclarObservacoesComRecusa(
  observacoesAtuais: string | null | undefined,
  observacoesUsuario: string | null | undefined,
): string | null {
  const blocos = (observacoesAtuais ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => linhaEhRecusa(l));
  const user = observacoesUsuario?.trim() ?? "";
  const partes = [...blocos];
  if (user) partes.push(user);
  if (partes.length === 0) return null;
  return partes.join("\n\n");
}

export function preAlunoTemRecusaSecretaria(observacoes: string | null | undefined): boolean {
  return extrairUltimaRecusaSecretaria(observacoes) !== null;
}
