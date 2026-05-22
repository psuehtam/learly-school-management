import { differenceInYears, format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Converte `yyyy-MM-dd` em Date (meio-dia local — evita mudança de dia por fuso em campos só-data). */
export function parseDataIso(iso: string): Date | null {
  const s = iso.trim();
  if (!ISO_DATE_ONLY.test(s)) return null;
  const d = parseISO(`${s}T12:00:00`);
  return isValid(d) ? d : null;
}

/** `yyyy-MM-dd` → `dd/MM/yyyy` */
export function formatarDataIsoPtBr(iso: string): string {
  const d = parseDataIso(iso);
  if (!d) return iso;
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}

/** Idade em anos completos entre nascimento e data de referência (ambas `yyyy-MM-dd`). */
export function calcularIdadeAnos(dataNascimentoIso: string, dataReferenciaIso: string): number | null {
  const nasc = parseDataIso(dataNascimentoIso);
  const ref = parseDataIso(dataReferenciaIso);
  if (!nasc || !ref) return null;
  const idade = differenceInYears(ref, nasc);
  return idade < 0 ? null : idade;
}

/** Data de hoje no fuso local do cliente (`yyyy-MM-dd`). Preferir data do servidor quando a regra de negócio exigir. */
export function dataHojeIsoLocal(): string {
  return format(new Date(), "yyyy-MM-dd");
}
