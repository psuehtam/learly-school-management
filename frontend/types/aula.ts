export interface Aula {
  id: number;
  escolaId: number;
  turmaId: number;
  capituloId?: number;
  professorId: number;
  numeroAula: number;
  dataAula: string;
  horarioInicio: string;
  horarioFim: string;
  conteudoDado?: string;
  tipoAula: "Normal" | "Reposicao";
  status: "Agendada" | "Realizada" | "Cancelada";
}

export interface Presenca {
  id: number;
  aulaId: number;
  alunoId: number;
  statusPresenca: "P" | "F" | "FJ" | "R";
  reposicaoDePresencaId?: number;
}

export interface Homework {
  id: number;
  aulaId: number;
  alunoId: number;
  nota?: number;
  observacao?: string;
}

export interface Avaliacao {
  id: number;
  turmaId: number;
  alunoId: number;
  tipo: string;
  nota: number;
  observacao?: string;
}

export interface Ocorrencia {
  id: number;
  escolaId: number;
  alunoId: number;
  tipo: "Academica" | "Administrativa";
  descricao: string;
  dataCriacao: string;
}
