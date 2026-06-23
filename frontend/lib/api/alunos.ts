import { apiRequest } from "@/lib/api/client";
import type { Aluno, Filiacao } from "@/types/aluno";

export type ListarAlunosFiltro = {
  status?: string;
  busca?: string;
  limite?: number;
};

function normalizarAluno(raw: Aluno & { Nome?: string; Sobrenome?: string; Cpf?: string; Status?: string }): Aluno {
  return {
    ...raw,
    nome: raw.nome ?? raw.Nome ?? "",
    sobrenome: raw.sobrenome ?? raw.Sobrenome ?? "",
    cpf: raw.cpf ?? raw.Cpf,
    status: (raw.status ?? raw.Status ?? "Ativo") as Aluno["status"],
  };
}

export async function listarAlunos(filtros?: ListarAlunosFiltro): Promise<Aluno[]> {
  const params = new URLSearchParams();
  if (filtros?.status) params.set("status", filtros.status);
  if (filtros?.busca?.trim()) params.set("busca", filtros.busca.trim());
  if (typeof filtros?.limite === "number") params.set("limite", String(filtros.limite));
  const query = params.toString();
  const data = await apiRequest<Aluno[]>(`/api/alunos${query ? `?${query}` : ""}`);
  return data.map((a) => normalizarAluno(a as Aluno & { Nome?: string; Sobrenome?: string }));
}

export interface AlunoDetalhe {
  id: number;
  escolaId: number;
  escolaNome: string;
  nome: string;
  sobrenome: string;
  sexo: string;
  dataNascimento: string;
  dataIngresso: string;
  cpf?: string | null;
  status: string;
  cep: string;
  tipoLogradouro: string;
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  municipio: string;
  naturalidadeCidade?: string | null;
  naturalidadeEstado?: string | null;
  rgNumero?: string | null;
  rgExpedicao?: string | null;
  rgOrgao?: string | null;
  telefoneAluno?: string | null;
  eProprioResponsavel: boolean;
  responsavelNome?: string | null;
  responsavelSobrenome?: string | null;
  responsavelCpf?: string | null;
  telefoneResponsavel?: string | null;
}

function normalizarAlunoDetalhe(raw: AlunoDetalhe & Record<string, unknown>): AlunoDetalhe {
  const r = raw as AlunoDetalhe & {
    Nome?: string;
    Sobrenome?: string;
    EscolaNome?: string;
    TelefoneAluno?: string;
    ResponsavelNome?: string;
    ResponsavelSobrenome?: string;
    ResponsavelCpf?: string;
    TelefoneResponsavel?: string;
    NaturalidadeCidade?: string;
    NaturalidadeEstado?: string;
    RgNumero?: string;
    RgExpedicao?: string;
    RgOrgao?: string;
    TipoLogradouro?: string;
    Logradouro?: string;
    Complemento?: string;
    Bairro?: string;
    Municipio?: string;
    Cep?: string;
    Numero?: string;
    DataNascimento?: string;
    DataIngresso?: string;
    Cpf?: string;
  };

  return {
    id: raw.id,
    escolaId: raw.escolaId,
    escolaNome: (raw.escolaNome ?? r.EscolaNome ?? "").trim(),
    nome: (raw.nome ?? r.Nome ?? "").trim(),
    sobrenome: (raw.sobrenome ?? r.Sobrenome ?? "").trim(),
    sexo: raw.sexo,
    dataNascimento: raw.dataNascimento ?? r.DataNascimento ?? "",
    dataIngresso: raw.dataIngresso ?? r.DataIngresso ?? "",
    cpf: raw.cpf ?? r.Cpf ?? null,
    status: raw.status,
    cep: raw.cep ?? r.Cep ?? "",
    tipoLogradouro: raw.tipoLogradouro ?? r.TipoLogradouro ?? "",
    logradouro: raw.logradouro ?? r.Logradouro ?? "",
    numero: raw.numero ?? r.Numero ?? "",
    complemento: raw.complemento ?? r.Complemento ?? null,
    bairro: raw.bairro ?? r.Bairro ?? "",
    municipio: raw.municipio ?? r.Municipio ?? "",
    naturalidadeCidade: raw.naturalidadeCidade ?? r.NaturalidadeCidade ?? null,
    naturalidadeEstado: raw.naturalidadeEstado ?? r.NaturalidadeEstado ?? null,
    rgNumero: raw.rgNumero ?? r.RgNumero ?? null,
    rgExpedicao: raw.rgExpedicao ?? r.RgExpedicao ?? null,
    rgOrgao: raw.rgOrgao ?? r.RgOrgao ?? null,
    telefoneAluno: raw.telefoneAluno ?? r.TelefoneAluno ?? null,
    eProprioResponsavel: raw.eProprioResponsavel,
    responsavelNome: raw.responsavelNome ?? r.ResponsavelNome ?? null,
    responsavelSobrenome: raw.responsavelSobrenome ?? r.ResponsavelSobrenome ?? null,
    responsavelCpf: raw.responsavelCpf ?? r.ResponsavelCpf ?? null,
    telefoneResponsavel: raw.telefoneResponsavel ?? r.TelefoneResponsavel ?? null,
  };
}

export async function buscarAluno(id: number): Promise<AlunoDetalhe> {
  const data = await apiRequest<AlunoDetalhe>(`/api/alunos/${id}`);
  return normalizarAlunoDetalhe(data as AlunoDetalhe & Record<string, unknown>);
}

export async function editarAluno(id: number, dados: Partial<Aluno>): Promise<Aluno> {
  return apiRequest<Aluno>(`/api/alunos/${id}`, { method: "PUT", body: dados });
}

export async function inativarAluno(id: number): Promise<void> {
  await apiRequest<void>(`/api/alunos/${id}/inativar`, { method: "PATCH" });
}

export async function trancarAluno(id: number): Promise<void> {
  await apiRequest<void>(`/api/alunos/${id}/trancar`, { method: "PATCH" });
}

export async function listarFiliacoes(alunoId: number): Promise<Filiacao[]> {
  return apiRequest<Filiacao[]>(`/api/alunos/${alunoId}/filiacoes`);
}

export async function criarFiliacao(alunoId: number, dados: Partial<Filiacao>): Promise<Filiacao> {
  return apiRequest<Filiacao>(`/api/alunos/${alunoId}/filiacoes`, { method: "POST", body: dados });
}
