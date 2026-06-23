import { horasMinutosParaMinutos, diasParaMinutos, minutosParaExibicao } from "@/lib/tempo/minutos";
import type { MetricaAula } from "@/lib/api/minha-escola";

export type CapituloDraft = {
  clientId: string;
  nome: string;
  /** Dias inteiros (POR_DIA) ou "H:MM" (POR_HORA). */
  duracaoInput: string;
};

export type LivroFormState = {
  nome: string;
  capitulos: CapituloDraft[];
};

export type LivroFormAction =
  | { type: "SET_NOME"; payload: string }
  | { type: "ADD_CAPITULO" }
  | { type: "REMOVE_CAPITULO"; payload: string }
  | { type: "UPDATE_CAPITULO"; payload: { clientId: string; nome?: string; duracaoInput?: string } }
  | { type: "RESET"; payload: LivroFormState };

function gerarClientId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function novoCapitulo(index: number): CapituloDraft {
  return { clientId: gerarClientId(), nome: `Capítulo ${index + 1}`, duracaoInput: "" };
}

export function livroFormReducer(state: LivroFormState, action: LivroFormAction): LivroFormState {
  switch (action.type) {
    case "SET_NOME":
      return { ...state, nome: action.payload };

    case "ADD_CAPITULO":
      return {
        ...state,
        capitulos: [...state.capitulos, novoCapitulo(state.capitulos.length)],
      };

    case "REMOVE_CAPITULO":
      return {
        ...state,
        capitulos: state.capitulos.filter((c) => c.clientId !== action.payload),
      };

    case "UPDATE_CAPITULO":
      return {
        ...state,
        capitulos: state.capitulos.map((c) =>
          c.clientId === action.payload.clientId
            ? {
                ...c,
                ...(action.payload.nome !== undefined ? { nome: action.payload.nome } : {}),
                ...(action.payload.duracaoInput !== undefined ? { duracaoInput: action.payload.duracaoInput } : {}),
              }
            : c,
        ),
      };

    case "RESET":
      return action.payload;

    default:
      return state;
  }
}

export function estadoInicial(): LivroFormState {
  return { nome: "", capitulos: [novoCapitulo(0)] };
}

// ── Derived selectors ─────────────────────────────────────────────────────────

export function duracaoCapituloMinutos(
  cap: CapituloDraft,
  metrica: MetricaAula,
  duracaoAulaMinutos: number,
): number | null {
  if (metrica === "POR_DIA") {
    const dias = parseInt(cap.duracaoInput, 10);
    if (!Number.isFinite(dias) || dias < 1) return null;
    return diasParaMinutos(dias, duracaoAulaMinutos);
  }
  return horasMinutosParaMinutos(cap.duracaoInput);
}

export type ResumoLivro = {
  totalMinutos: number;
  aulasEstimadas: number;
  resto: number;
  fechamentoExato: boolean;
  todosValidos: boolean;
  podeSalvar: boolean;
  totalExibicao: string;
};

export function calcularResumoLivro(
  state: LivroFormState,
  metrica: MetricaAula,
  duracaoAulaMinutos: number,
): ResumoLivro {
  const minutosPorCap = state.capitulos.map((c) => duracaoCapituloMinutos(c, metrica, duracaoAulaMinutos));
  const todosValidos = minutosPorCap.every((m) => m !== null);
  const totalMinutos = minutosPorCap.reduce<number>((acc, m) => acc + (m ?? 0), 0);
  const aulasEstimadas = duracaoAulaMinutos > 0 ? Math.ceil(totalMinutos / duracaoAulaMinutos) : 0;
  const resto = duracaoAulaMinutos > 0 ? totalMinutos % duracaoAulaMinutos : 0;
  const fechamentoExato = resto === 0 && totalMinutos > 0;
  const nomeOk = state.nome.trim().length > 0 && state.nome.trim().length <= 150;
  const temCapitulos = state.capitulos.length > 0;

  return {
    totalMinutos,
    aulasEstimadas,
    resto,
    fechamentoExato,
    todosValidos,
    podeSalvar: todosValidos && nomeOk && fechamentoExato && temCapitulos,
    totalExibicao: minutosParaExibicao(totalMinutos),
  };
}
