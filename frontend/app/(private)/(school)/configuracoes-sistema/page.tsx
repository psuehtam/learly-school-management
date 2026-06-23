import { ConfiguracoesSistemaPanel } from "@/components/escola/configuracoes-sistema-panel";

export default function ConfiguracoesSistemaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Configuração do sistema</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Parâmetros gerais da escola, como limites de alunos por turma.
        </p>
      </div>
      <ConfiguracoesSistemaPanel />
    </div>
  );
}
