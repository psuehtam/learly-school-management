/**
 * Formata uma duração em minutos para exibição amigável.
 * Ex.: 75 → "1h 15m", 120 → "2h", 30 → "30m"
 */
export function minutosParaExibicao(minutos: number): string {
  if (!Number.isFinite(minutos) || minutos < 0) return "0m";
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Converte uma string no formato "H:MM" ou "HH:MM" para minutos.
 * Retorna null se o formato for inválido.
 * Ex.: "2:00" → 120, "1:30" → 90, "0:15" → 15
 */
export function horasMinutosParaMinutos(input: string): number | null {
  const trimmed = (input ?? "").trim();
  const match = /^(\d{1,3}):([0-5]\d)$/.exec(trimmed);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const total = h * 60 + m;
  return total > 0 ? total : null;
}

/**
 * Converte dias inteiros para minutos dado a duração de uma aula por dia.
 * Ex.: 2 dias × 120min/dia = 240min
 */
export function diasParaMinutos(dias: number, duracaoAulaMinutos: number): number {
  return dias * duracaoAulaMinutos;
}

/**
 * Formata minutos como "H:MM" para uso em inputs.
 * Ex.: 90 → "1:30", 120 → "2:00"
 */
export function minutosParaInputHHMM(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}
