"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PRE_ALUNO_DOCUMENTOS_PADRAO,
  type PreAlunoDocumentoItem,
  type PreAlunoDocumentoTipoConfig,
} from "@/config/preAlunoDocumentos";
import {
  listarDocumentosPreAluno,
  uploadDocumentoPreAluno,
  urlDocumentoPreAluno,
  getApiErrorMessage,
} from "@/lib/api";

type Props = {
  preAlunoId: number;
  /** Tipos exibidos; padrão = PRE_ALUNO_DOCUMENTOS_PADRAO */
  tipos?: PreAlunoDocumentoTipoConfig[];
  disabled?: boolean;
  onChange?: (documentos: PreAlunoDocumentoItem[]) => void;
};

export function PreAlunoDocumentosUpload({
  preAlunoId,
  tipos = PRE_ALUNO_DOCUMENTOS_PADRAO,
  disabled = false,
  onChange,
}: Props) {
  const [documentos, setDocumentos] = useState<PreAlunoDocumentoItem[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [enviandoTipo, setEnviandoTipo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (preAlunoId <= 0) return;
    setCarregando(true);
    setErro(null);
    try {
      const lista = await listarDocumentosPreAluno(preAlunoId);
      setDocumentos(lista);
      onChange?.(lista);
    } catch (e) {
      setErro(getApiErrorMessage(e, "Falha ao carregar documentos."));
    } finally {
      setCarregando(false);
    }
  }, [preAlunoId, onChange]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const docPorTipo = (codigo: string) =>
    documentos.find((d) => d.tipoCodigo.toLowerCase() === codigo.toLowerCase());

  const onSelecionarArquivo = async (tipo: PreAlunoDocumentoTipoConfig, file: File | null) => {
    if (!file || disabled) return;
    setEnviandoTipo(tipo.codigo);
    setErro(null);
    try {
      await uploadDocumentoPreAluno(preAlunoId, tipo.codigo, file, tipo.label);
      await carregar();
    } catch (e) {
      setErro(getApiErrorMessage(e, "Falha ao enviar arquivo."));
    } finally {
      setEnviandoTipo(null);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-zinc-700">
        Anexos opcionais (PDF, JPG, PNG, DOC — até 10 MB). Você pode enviar depois, antes de submeter à secretaria.
      </p>
      {erro && <p className="text-sm font-medium text-red-700">{erro}</p>}
      {carregando && <p className="text-xs font-medium text-zinc-700">Carregando anexos…</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {tipos.map((tipo) => {
          const existente = docPorTipo(tipo.codigo);
          const busy = enviandoTipo === tipo.codigo;
          return (
            <label
              key={tipo.codigo}
              className="flex flex-col gap-1 rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 text-sm"
            >
              <span className="text-sm font-semibold text-zinc-900">{tipo.label}</span>
              {tipo.hint && <span className="text-xs text-zinc-500">{tipo.hint}</span>}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                disabled={disabled || busy}
                className="text-xs file:mr-2 file:rounded file:border-0 file:bg-[#1F2A35] file:px-2 file:py-1 file:text-xs file:text-white"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  void onSelecionarArquivo(tipo, f);
                  e.target.value = "";
                }}
              />
              {existente && (
                <a
                  href={urlDocumentoPreAluno(preAlunoId, existente.urlDownload)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#1F2A35] underline"
                >
                  {existente.nomeArquivoOriginal}
                </a>
              )}
              {busy && <span className="text-xs text-zinc-400">Enviando…</span>}
            </label>
          );
        })}
      </div>
    </div>
  );
}
