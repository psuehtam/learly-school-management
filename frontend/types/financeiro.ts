export interface Parcela {
  id: number;
  escolaId: number;
  matriculaId: number;
  turmaId: number;
  responsavelId: number;
  mesCompetencia: string;
  dataVencimento: string;
  dataPagamento?: string;
  valorOriginal: number;
  valorComDesconto: number;
  valorPago?: number;
  formaPagamento?: string;
  status: "Pendente" | "Pago" | "Vencido" | "Estornado" | "Inativo";
}

export interface MovimentacaoFinanceira {
  id: number;
  escolaId: number;
  tipo: "Receita" | "Despesa";
  valor: number;
  descricao: string;
  dataMovimentacao: string;
  categoriaId: number;
  contaBancariaId?: number;
}

export interface ContaBancaria {
  id: number;
  escolaId: number;
  nomeBanco: string;
  agencia: string;
  conta: string;
  tipoConta: string;
  status: "Ativo" | "Inativo";
}

export interface CategoriaFinanceira {
  id: number;
  escolaId: number;
  nome: string;
  tipo: "Receita" | "Despesa";
  status: "Ativo" | "Inativo";
}
