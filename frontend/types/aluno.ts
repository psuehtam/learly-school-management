export interface Responsavel {
  id: number;
  nome: string;
  sobrenome: string;
  cpfCnpj: string;
  grauParentesco: string;
}

export interface Aluno {
  id: number;
  escolaId: number;
  responsavelId: number;
  nome: string;
  sobrenome: string;
  sexo: "Masculino" | "Feminino" | "Outro";
  dataNascimento: string;
  dataIngresso: string;
  cpf: string;
  status: "Ativo" | "Inativo" | "Trancado";
  responsavel?: Responsavel;
}

export interface Filiacao {
  id: number;
  alunoId: number;
  responsavelId: number;
  grauParentesco: string;
  responsavel?: Responsavel;
}
