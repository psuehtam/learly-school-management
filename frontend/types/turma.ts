import type { Usuario } from "./usuario";

export interface Livro {
  id: number;
  nome: string;
  descricao?: string;
  status: "Ativo" | "Inativo";
}

export interface Capitulo {
  id: number;
  livroId: number;
  nome: string;
  ordem: number;
}

export interface ProgressoCapitulo {
  id: number;
  turmaId: number;
  capituloId: number;
  concluido: boolean;
  dataConclusao?: string;
}

export interface Turma {
  id: number;
  escolaId: number;
  professorId: number;
  livroId: number;
  nome: string;
  sala?: string;
  horario?: string;
  dataInicio?: string;
  dataTerminoPrevista?: string;
  observacoes?: string;
  status: "Em Espera" | "Em Andamento" | "Concluida" | "Cancelada" | "Inativa";
  professor?: Usuario;
  livro?: Livro;
  diasSemana?: number[];
}

export interface Matricula {
  id: number;
  escolaId: number;
  alunoId: number;
  turmaId: number;
  dataMatricula: string;
  status: "Ativo" | "Concluido" | "Trancado" | "Cancelado";
}
