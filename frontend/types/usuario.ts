export interface Perfil {
  id: number;
  nome: string;
  descricao: string;
}

export interface Usuario {
  id: number;
  escolaId: number;
  nomeCompleto: string;
  email: string;
  perfilId: number;
  perfil: Perfil;
  permissoes: string[];
  status: "Ativo" | "Inativo";
}
