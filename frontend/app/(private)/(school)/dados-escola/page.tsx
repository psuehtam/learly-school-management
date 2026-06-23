import { DadosEscolaPanel } from "@/components/escola/dados-escola-panel";

export default function DadosEscolaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Dados da escola</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Nome, CNPJ, endereço e logo exibidos nos documentos e telas da escola.
        </p>
      </div>
      <DadosEscolaPanel />
    </div>
  );
}
