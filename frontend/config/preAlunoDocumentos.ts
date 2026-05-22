/**
 * Tipos de documentos anexáveis ao pré-aluno.
 * Para adicionar um novo campo de upload, inclua um item neste array.
 */
export type PreAlunoDocumentoTipoConfig = {
  codigo: string;
  label: string;
  /** Texto de ajuda opcional exibido abaixo do campo. */
  hint?: string;
};

export const PRE_ALUNO_DOCUMENTOS_PADRAO: PreAlunoDocumentoTipoConfig[] = [
  { codigo: "contrato", label: "Contrato" },
  { codigo: "comprovante_matricula", label: "Comprovante de Matrícula" },
  { codigo: "ficha_inscricao", label: "Ficha de Inscrição" },
  { codigo: "documento_aluno", label: "Documento do Aluno" },
];

export interface PreAlunoDocumentoItem {
  id: number;
  tipoCodigo: string;
  nomeExibicao: string;
  nomeArquivoOriginal: string;
  contentType: string | null;
  tamanhoBytes: number;
  dataUpload: string;
  urlDownload: string;
}
