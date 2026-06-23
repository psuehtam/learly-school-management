"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  obterPlanejamentoLivro,
  salvarPlanejamentoLivro,
  type LivroPlanejamentoDto,
  type PlanejamentoDiaDto,
  type PlanejamentoAlocacaoDto,
} from "@/lib/api/livros";
import { minutosParaExibicao } from "@/lib/tempo/minutos";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api/client";

// ── Reducer ──────────────────────────────────────────────────────────────────

type PlanState = {
  duracaoAulaMinutos: number;
  livroNome: string;
  dias: PlanejamentoDiaDto[];
  baselineJson: string;
};

type PlanAction =
  | { type: "LOAD"; payload: LivroPlanejamentoDto }
  | {
      type: "MOVER_ALOCACAO";
      payload: { alocacaoId: number; deDiaId: number; paraDiaId: number; novaOrdem: number };
    };

function planReducer(state: PlanState, action: PlanAction): PlanState {
  switch (action.type) {
    case "LOAD": {
      const json = JSON.stringify(action.payload.dias);
      return {
        duracaoAulaMinutos: action.payload.duracaoAulaMinutos,
        livroNome: action.payload.livroNome,
        dias: action.payload.dias,
        baselineJson: json,
      };
    }

    case "MOVER_ALOCACAO": {
      const { alocacaoId, deDiaId, paraDiaId, novaOrdem } = action.payload;

      const diasAtualizados = state.dias.map((dia) => {
        if (dia.id === deDiaId) {
          return { ...dia, alocacoes: dia.alocacoes.filter((a) => a.id !== alocacaoId) };
        }
        if (dia.id === paraDiaId) {
          const alocacao = state.dias.find((d) => d.id === deDiaId)?.alocacoes.find((a) => a.id === alocacaoId);
          if (!alocacao) return dia;

          const novas = [...dia.alocacoes];
          const inserir = { ...alocacao, ordem: novaOrdem };
          novas.splice(novaOrdem - 1, 0, inserir);
          return { ...dia, alocacoes: novas.map((a, i) => ({ ...a, ordem: i + 1 })) };
        }
        return dia;
      });

      return {
        ...state,
        dias: diasAtualizados.map((d) => ({
          ...d,
          minutosUsados: d.alocacoes.reduce((acc, a) => acc + a.minutosAlocados, 0),
        })),
      };
    }

    default:
      return state;
  }
}

// ── Bloco arrastável ──────────────────────────────────────────────────────────

function BlocoAlocacao({
  alocacao,
  dragging,
}: {
  alocacao: PlanejamentoAlocacaoDto;
  dragging: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: `aloc-${alocacao.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: dragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex cursor-grab items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm active:cursor-grabbing"
    >
      <span className="text-zinc-400">⠿</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-800">{alocacao.capituloNome}</p>
        <p className="text-xs text-zinc-500">{minutosParaExibicao(alocacao.minutosAlocados)}</p>
      </div>
    </div>
  );
}

// ── Card de Dia ───────────────────────────────────────────────────────────────

function CardDia({
  dia,
  duracaoAulaMinutos,
  draggingId,
  overflow,
}: {
  dia: PlanejamentoDiaDto;
  duracaoAulaMinutos: number;
  draggingId: number | null;
  overflow: boolean;
}) {
  const pct = duracaoAulaMinutos > 0 ? Math.min((dia.minutosUsados / duracaoAulaMinutos) * 100, 100) : 0;
  const alocIds = dia.alocacoes.map((a) => `aloc-${a.id}`);

  return (
    <div
      className={`flex w-72 flex-col gap-2 rounded-xl border p-4 ${
        overflow ? "border-red-300 bg-red-50" : "border-zinc-200 bg-white"
      } shadow-sm`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-800">Dia {dia.ordem}</span>
        <span className={`text-xs font-medium ${overflow ? "text-red-700" : "text-zinc-500"}`}>
          {dia.minutosUsados} / {duracaoAulaMinutos} min
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full rounded-full transition-all ${overflow ? "bg-red-500" : "bg-emerald-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {overflow ? (
        <p className="text-xs text-red-700">⚠ Excede a capacidade do dia ({duracaoAulaMinutos} min).</p>
      ) : null}

      {/* Alocações sortable */}
      <SortableContext items={alocIds} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-[3rem] flex-col gap-1.5">
          {dia.alocacoes.map((a) => (
            <BlocoAlocacao key={a.id} alocacao={a} dragging={draggingId === a.id} />
          ))}
          {dia.alocacoes.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-zinc-200 py-4">
              <span className="text-xs text-zinc-400">Solte um capítulo aqui</span>
            </div>
          ) : null}
        </div>
      </SortableContext>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const initialState: PlanState = {
  duracaoAulaMinutos: 120,
  livroNome: "",
  dias: [],
  baselineJson: "",
};

export default function PlanejamentoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const livroId = parseInt(params.id, 10);

  const [state, dispatch] = useReducer(planReducer, initialState);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [draggingAlocId, setDraggingAlocId] = useState<number | null>(null);

  const draggingAlocRef = useRef<PlanejamentoAlocacaoDto | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await obterPlanejamentoLivro(livroId);
      dispatch({ type: "LOAD", payload: data });
    } catch (e) {
      setErro(getApiErrorMessage(e, "Não foi possível carregar o planejamento."));
    } finally {
      setLoading(false);
    }
  }, [livroId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const temAlteracao = state.baselineJson !== JSON.stringify(state.dias);

  const overflowDias = new Set(
    state.dias.filter((d) => d.minutosUsados > state.duracaoAulaMinutos).map((d) => d.id),
  );

  // ── Drag handlers ─────────────────────────────────────────────────────────────
  function onDragStart(event: DragStartEvent) {
    const id = event.active.id as string;
    const alocId = parseInt(id.replace("aloc-", ""), 10);
    setDraggingAlocId(alocId);

    for (const dia of state.dias) {
      const found = dia.alocacoes.find((a) => a.id === alocId);
      if (found) {
        draggingAlocRef.current = found;
        break;
      }
    }
  }

  function onDragOver(event: DragOverEvent) {
    // preview handled by dnd-kit
    void event;
  }

  function onDragEnd(event: DragEndEvent) {
    setDraggingAlocId(null);
    draggingAlocRef.current = null;

    const { active, over } = event;
    if (!over) return;

    const alocIdStr = active.id as string;
    const overIdStr = over.id as string;

    const alocId = parseInt(alocIdStr.replace("aloc-", ""), 10);

    // Find source dia
    const deDia = state.dias.find((d) => d.alocacoes.some((a) => a.id === alocId));
    if (!deDia) return;

    // Determine target dia and order
    let paraDia: PlanejamentoDiaDto | undefined;
    let novaOrdem = 1;

    if (overIdStr.startsWith("aloc-")) {
      const overAlocId = parseInt(overIdStr.replace("aloc-", ""), 10);
      paraDia = state.dias.find((d) => d.alocacoes.some((a) => a.id === overAlocId));
      if (paraDia) {
        novaOrdem = (paraDia.alocacoes.findIndex((a) => a.id === overAlocId) ?? 0) + 1;
      }
    }

    if (!paraDia) return;
    if (deDia.id === paraDia.id && alocId === parseInt(overIdStr.replace("aloc-", ""), 10)) return;

    // Capacity check
    const blocoAloc = deDia.alocacoes.find((a) => a.id === alocId);
    if (!blocoAloc) return;
    const minutosAposMove = paraDia.minutosUsados + (deDia.id !== paraDia.id ? blocoAloc.minutosAlocados : 0);
    if (minutosAposMove > state.duracaoAulaMinutos) {
      setErroSalvar(
        `Este conteúdo excede a capacidade do Dia ${paraDia.ordem} (${state.duracaoAulaMinutos} min). Reorganize o dia antes.`,
      );
      return;
    }

    setErroSalvar(null);
    dispatch({
      type: "MOVER_ALOCACAO",
      payload: { alocacaoId: alocId, deDiaId: deDia.id, paraDiaId: paraDia.id, novaOrdem },
    });
  }

  async function salvar() {
    setSalvando(true);
    setErroSalvar(null);
    try {
      const payload = {
        dias: state.dias.map((d, dIdx) => ({
          ordem: d.ordem > 0 ? d.ordem : dIdx + 1,
          alocacoes: d.alocacoes.map((a, aIdx) => ({
            capituloId: a.capituloId,
            minutosAlocados: a.minutosAlocados,
            ordem: a.ordem > 0 ? a.ordem : aIdx + 1,
          })),
        })),
      };
      const data = await salvarPlanejamentoLivro(livroId, payload);
      dispatch({ type: "LOAD", payload: data });
    } catch (e) {
      setErroSalvar(getApiErrorMessage(e, "Não foi possível salvar o planejamento."));
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-zinc-500">Carregando planejamento…</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-700">{erro}</p>
        <Button variant="secondary" onClick={() => void carregar()}>
          Tentar novamente
        </Button>
        <button onClick={() => router.back()} className="text-sm text-zinc-500 underline">
          Voltar
        </button>
      </div>
    );
  }

  const draggingAlocacao = draggingAlocId !== null
    ? state.dias.flatMap((d) => d.alocacoes).find((a) => a.id === draggingAlocId) ?? null
    : null;

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto">
      {/* Header */}
      <div className="flex flex-shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <button onClick={() => router.back()} className="mb-1 text-xs text-zinc-400 underline">
            ← Voltar para livros
          </button>
          <h1 className="text-xl font-semibold text-zinc-900">Planejamento — {state.livroNome}</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Capacidade: {minutosParaExibicao(state.duracaoAulaMinutos)} por dia · Arraste capítulos entre os cards para
            reorganizar.
          </p>
        </div>
        <Button
          type="button"
          disabled={salvando || !temAlteracao || overflowDias.size > 0}
          isLoading={salvando}
          onClick={() => void salvar()}
        >
          Salvar planejamento
        </Button>
      </div>

      {erroSalvar ? (
        <div className="flex-shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {erroSalvar}
        </div>
      ) : null}

      {overflowDias.size > 0 ? (
        <div className="flex-shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {overflowDias.size} dia{overflowDias.size > 1 ? "s" : ""} excedem a capacidade. Corrija antes de salvar.
        </div>
      ) : null}

      {/* Cards */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex flex-wrap gap-4 pb-8">
          {state.dias.map((dia) => (
            <CardDia
              key={dia.id}
              dia={dia}
              duracaoAulaMinutos={state.duracaoAulaMinutos}
              draggingId={draggingAlocId}
              overflow={overflowDias.has(dia.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {draggingAlocacao ? (
            <div className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 shadow-lg">
              <span className="text-zinc-400">⠿</span>
              <div>
                <p className="text-sm font-medium text-zinc-800">{draggingAlocacao.capituloNome}</p>
                <p className="text-xs text-zinc-500">{minutosParaExibicao(draggingAlocacao.minutosAlocados)}</p>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
