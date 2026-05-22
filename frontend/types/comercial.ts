export type PreAlunoStatus =

  | "Em negociacao"

  | "Aguardando aprovacao"

  | "Aprovado"

  | "Matriculado"

  | "Cancelado";



/** Item retornado pela listagem `/api/pre-alunos`. */

export interface PreAlunoListItem {

  id: number;

  nomeCompletoAluno: string;

  nomeCompletoResponsavel: string;

  dataCadastro: string;

  tipoContrato: string;

  status: PreAlunoStatus;

  nomeLivroInteresse: string;

  telefoneAluno: string | null;

  valorMensalidade: number;

  formaPagamento: string | null;

  origemCaptacao: string;

  valorMaterial: number | null;

  valorMatricula: number;

  observacoesComerciais: string | null;

}

/** Detalhe de `/api/pre-alunos/{id}` para edição no comercial. */
export interface PreAlunoDetalhe {
  id: number;
  responsavelTipoPessoa: string;
  responsavelCpfCnpj: string;
  responsavelNome: string;
  responsavelSobrenome: string;
  responsavelTelefone: string | null;
  responsavelSexo: string | null;
  responsavelGrauParentesco: string | null;
  responsavelEstadoCivil: string | null;
  responsavelCorRaca: string | null;
  responsavelNacionalidade: string | null;
  responsavelDataNascimento: string | null;
  responsavelNaturalidadeCidade: string | null;
  responsavelNaturalidadeEstado: string | null;
  responsavelRgNumero: string | null;
  responsavelRgExpedicao: string | null;
  responsavelRgOrgao: string | null;
  nomeAluno: string;
  sobrenomeAluno: string;
  dataNascimentoAluno: string;
  telefoneAluno: string | null;
  livroInteresseId: number;
  tipoContrato: string;
  valorMensalidade: number;
  formaPagamento: string | null;
  valorMatricula: number;
  formaPagamentoMatricula: string | null;
  valorMaterial: number | null;
  origemCaptacao: string;
  usaTransporteVan: boolean;
  transporteCep: string | null;
  transporteLogradouro: string | null;
  transporteNumero: string | null;
  transporteComplemento: string | null;
  transporteBairro: string | null;
  transporteCidade: string | null;
  transporteUf: string | null;
  observacoesComerciais: string | null;
  eProprioResponsavel: boolean;
  alunoCpf: string | null;
  status: PreAlunoStatus;
}



export interface LivroInteresseOpcao {

  id: number;

  nome: string;

  status: string;

}



export interface CriarPreAlunoPayload {

  /** Permitido apenas se maior de idade; menores sempre `false`. */

  eProprioResponsavel: boolean;

  /** Obrigatório quando maior e `eProprioResponsavel`. */

  alunoCpf?: string | null;

  responsavelTipoPessoa: string;

  responsavelCpfCnpj: string;

  responsavelNome: string;

  responsavelSobrenome: string;

  responsavelTelefone: string;

  responsavelSexo?: string | null;
  responsavelGrauParentesco?: string | null;
  responsavelEstadoCivil?: string | null;
  responsavelCorRaca?: string | null;
  responsavelNacionalidade?: string | null;
  responsavelDataNascimento?: string | null;
  responsavelNaturalidadeCidade?: string | null;
  responsavelNaturalidadeEstado?: string | null;
  responsavelRgNumero?: string | null;
  responsavelRgExpedicao?: string | null;
  responsavelRgOrgao?: string | null;

  nome: string;

  sobrenome: string;

  dataNascimento: string;

  telefoneAluno?: string | null;

  livroInteresseId: number;

  tipoContrato: string;

  valorMensalidade: number;

  /** Opcional. */

  formaPagamento?: string | null;

  valorMatricula: number;

  /** Obrigatório se `valorMatricula` > 0. */

  formaPagamentoMatricula?: string | null;

  /** Valor total do livro/material (0 = gratuito). */

  valorMaterial?: number | null;

  origemCaptacao: string;

  usaTransporteVan: boolean;

  transporteCep?: string | null;

  transporteLogradouro?: string | null;

  transporteNumero?: string | null;

  transporteComplemento?: string | null;

  transporteBairro?: string | null;

  transporteCidade?: string | null;

  transporteUf?: string | null;

  observacoesComerciais?: string | null;

}



export interface ContratoGerado {
  id: number;
  preAlunoId: number;
  templateId: number;
  nomeTemplate: string;
  conteudoGeradoHtml: string;
  dataGeracao: string;
}

export interface ContratoTemplate {
  id: number;
  nome: string;
  versao: number;
  ativo: boolean;
  dataCriacao: string;
  conteudoHtml: string;
}

export interface ContratoVariavel {
  variavel: string;
  descricao: string;
}

export interface CriarContratoTemplatePayload {
  nome: string;
  conteudoHtml: string;
  ativarImediatamente: boolean;
}

export interface EditarContratoTemplatePayload {
  nome: string;
  conteudoHtml: string;
}

export interface GerarContratoPayload {
  preAlunoId: number;
  templateId?: number | null;
}

export interface ContratoGeradoData {
  id: number;
  templateId: number;
  nomeTemplate: string;
  conteudoGeradoHtml: string;
  dataGeracao: string;
}

