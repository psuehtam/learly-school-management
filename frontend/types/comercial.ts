export interface PreAluno {
  id: number;
  escolaId: number;
  responsavelId: number;
  nome: string;
  sobrenome: string;
  dataNascimento: string;
  livroInteresseId: number;
  tipoContrato: string;
  valorMensalidade: number;
  formaPagamento: string;
  dataInicioPrevista: string;
  observacoes?: string;
  status:
    | "Em negociacao"
    | "Aguardando aprovacao"
    | "Aprovado"
    | "Matriculado"
    | "Cancelado";
}

export interface Contrato {
  id: number;
  preAlunoId: number;
  templateId: number;
  conteudo: string;
  status: "Gerado" | "Assinado" | "Cancelado";
  dataCriacao: string;
}

export interface ContratoTemplate {
  id: number;
  escolaId: number;
  nome: string;
  conteudo: string;
  status: "Ativo" | "Inativo";
}
