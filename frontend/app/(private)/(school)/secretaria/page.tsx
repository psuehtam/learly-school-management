"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  getApiErrorMessage,
  buscarAluno,
  criarAlunoComMatricula,
  listarMatriculas,
  listarPreAlunos,
  cancelarMatriculaById,
  vincularTurmaMatricula,
  type MatriculaListItem,
  type MatriculaStatus,
} from "@/lib/api";
import { ModalAprovarPreAluno } from "@/components/secretaria/ModalAprovarPreAluno";
import type { User } from "@/lib/api/types";
import type { PreAlunoListItem } from "@/types/comercial";
import { getCurrentUser } from "@/lib/api/auth";
import { hasPermission } from "@/lib/permissions";
import { calcularIdadeAnos, dataHojeIsoLocal } from "@/lib/dates";
import { buscarEnderecoPorCep } from "@/lib/viacep";
import { applyBrazilMask, digitsOnly } from "@/utils";

/** Estilo legível para selects (texto escuro no controle e nas opções). */
const SELECT_FIELD =
  "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/20";

function labelAlunoMatricula(m: MatriculaListItem): string {
  const withPascal = m as MatriculaListItem & { AlunoNomeCompleto?: string };
  const n = (m.alunoNomeCompleto ?? withPascal.AlunoNomeCompleto)?.trim();
  return n && n.length > 0 ? n : `Aluno #${m.alunoId}`;
}

function labelTurmaMatricula(m: MatriculaListItem): string {
  const n = m.turmaNome?.trim();
  if (n) return n;
  if (m.turmaId != null) return `Turma #${m.turmaId}`;
  return "Não definida";
}

const STATUS_ABAS: Array<{ id: "espera" | "canceladas" | "todas"; label: string; status?: MatriculaStatus }> = [
  { id: "espera", label: "Alunos em Espera", status: "Em Espera" },
  { id: "canceladas", label: "Canceladas", status: "Cancelado" },
  { id: "todas", label: "Todas as Matriculas" },
];

type AbaId = (typeof STATUS_ABAS)[number]["id"];

type NovoAlunoForm = {
  eProprioResponsavel: boolean;
  nome: string;
  sobrenome: string;
  sexo: "Masculino" | "Feminino" | "Outro";
  dataNascimento: string;
  dataIngresso: string;
  telefoneAluno: string;
  cpf: string;
  cep: string;
  tipoLogradouro: "Rua" | "Avenida" | "Travessa" | "Alameda" | "Estrada" | "Rodovia" | "Outro";
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  corRaca: "" | "Branca" | "Preta" | "Parda" | "Amarela" | "Indigena" | "Nao Declarado";
  estadoCivil: "" | "Solteiro" | "Casado" | "Divorciado" | "Viuvo" | "Uniao Estavel";
  profissao: string;
  registroEscolar: string;
  nacionalidade: string;
  dataEntradaPais: string;
  naturalidadeCidade: string;
  naturalidadeEstado: string;
  rgNumero: string;
  rgExpedicao: string;
  rgOrgao: string;
  responsavelNome: string;
  responsavelSobrenome: string;
  responsavelCpf: string;
  responsavelSexo: "Masculino" | "Feminino" | "Outro";
  responsavelTelefone: string;
  responsavelCep: string;
  responsavelTipoLogradouro: "Rua" | "Avenida" | "Travessa" | "Alameda" | "Estrada" | "Rodovia" | "Outro";
  responsavelLogradouro: string;
  responsavelNumero: string;
  responsavelComplemento: string;
  responsavelBairro: string;
  responsavelMunicipio: string;
};

const emptyNovoAlunoForm: NovoAlunoForm = {
  eProprioResponsavel: false,
  nome: "",
  sobrenome: "",
  sexo: "Masculino",
  dataNascimento: "",
  dataIngresso: "",
  telefoneAluno: "",
  cpf: "",
  cep: "",
  tipoLogradouro: "Rua",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  municipio: "",
  corRaca: "",
  estadoCivil: "",
  profissao: "",
  registroEscolar: "",
  nacionalidade: "",
  dataEntradaPais: "",
  naturalidadeCidade: "",
  naturalidadeEstado: "",
  rgNumero: "",
  rgExpedicao: "",
  rgOrgao: "",
  responsavelNome: "",
  responsavelSobrenome: "",
  responsavelCpf: "",
  responsavelSexo: "Feminino",
  responsavelTelefone: "",
  responsavelCep: "",
  responsavelTipoLogradouro: "Rua",
  responsavelLogradouro: "",
  responsavelNumero: "",
  responsavelComplemento: "",
  responsavelBairro: "",
  responsavelMunicipio: "",
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SecretariaPage() {
  const [aba, setAba] = useState<AbaId>("espera");
  const [busca, setBusca] = useState("");
  const [alunoIdFiltro, setAlunoIdFiltro] = useState("");
  const [matriculas, setMatriculas] = useState<MatriculaListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalNovoAlunoOpen, setModalNovoAlunoOpen] = useState(false);
  const [novoAlunoModalBaseline, setNovoAlunoModalBaseline] = useState("");
  const [novoAlunoForm, setNovoAlunoForm] = useState<NovoAlunoForm>(emptyNovoAlunoForm);
  const [etapaCadastro, setEtapaCadastro] = useState<"aluno" | "responsavel" | "outros">("aluno");
  const [savingAluno, setSavingAluno] = useState(false);
  const [buscandoCepAluno, setBuscandoCepAluno] = useState(false);
  const [buscandoCepResponsavel, setBuscandoCepResponsavel] = useState(false);
  const [msgCepAluno, setMsgCepAluno] = useState<string | null>(null);
  const [msgCepResponsavel, setMsgCepResponsavel] = useState<string | null>(null);

  const [matriculaParaEnturmar, setMatriculaParaEnturmar] = useState<MatriculaListItem | null>(null);
  const [turmaIdEnturmar, setTurmaIdEnturmar] = useState("");
  /** Valor inicial do campo ao abrir o modal (para detectar alteração antes de vincular). */
  const [turmaIdEnturmarInicial, setTurmaIdEnturmarInicial] = useState("");
  const [savingEnturmar, setSavingEnturmar] = useState(false);
  const nomeAlunoPorIdRef = useRef<Record<number, string>>({});

  const [usuarioSessao, setUsuarioSessao] = useState<User | null>(null);
  const [preAlunosAguardando, setPreAlunosAguardando] = useState<PreAlunoListItem[]>([]);
  const [carregandoPreAlunos, setCarregandoPreAlunos] = useState(false);
  const [preAlunoParaAprovar, setPreAlunoParaAprovar] = useState<PreAlunoListItem | null>(null);

  useEffect(() => {
    void getCurrentUser().then(setUsuarioSessao).catch(() => setUsuarioSessao(null));
  }, []);

  const carregarPreAlunosAguardando = useCallback(async () => {
    if (!usuarioSessao || !hasPermission(usuarioSessao, "APROVAR_MATRICULA")) {
      setPreAlunosAguardando([]);
      return;
    }

    setCarregandoPreAlunos(true);
    try {
      const data = await listarPreAlunos({ status: "Aguardando aprovacao" });
      setPreAlunosAguardando(data);
    } catch {
      setPreAlunosAguardando([]);
    } finally {
      setCarregandoPreAlunos(false);
    }
  }, [usuarioSessao]);

  useEffect(() => {
    void carregarPreAlunosAguardando();
  }, [carregarPreAlunosAguardando]);

  const abrirAnalisePreAluno = (p: PreAlunoListItem) => {
    setPreAlunoParaAprovar(p);
  };

  const podeAprovarPreAluno =
    usuarioSessao !== null && hasPermission(usuarioSessao, "APROVAR_MATRICULA");

  const podeReprovarPreAluno =
    usuarioSessao !== null && hasPermission(usuarioSessao, "REPROVAR_MATRICULA");

  const podeCriarAluno =
    usuarioSessao !== null && hasPermission(usuarioSessao, "CRIAR_ALUNO");

  const podeEnturmar =
    usuarioSessao !== null && hasPermission(usuarioSessao, "EDITAR_MATRICULA");

  const podeCancelarMatricula =
    usuarioSessao !== null && hasPermission(usuarioSessao, "CANCELAR_MATRICULA");

  const statusSelecionado = STATUS_ABAS.find((s) => s.id === aba)?.status;
  const idadeAluno = calcularIdadeAnos(novoAlunoForm.dataNascimento, dataHojeIsoLocal());
  const alunoMenor = idadeAluno !== null && idadeAluno < 18;

  const carregarMatriculas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filtroAlunoId = alunoIdFiltro.trim() ? Number(alunoIdFiltro) : undefined;
      const data = await listarMatriculas({
        status: statusSelecionado,
        alunoId: Number.isFinite(filtroAlunoId as number) ? filtroAlunoId : undefined,
      });
      const enriquecidas = await Promise.all(
        data.map(async (m) => {
          if (m.alunoNomeCompleto?.trim()) return m;

          const cache = nomeAlunoPorIdRef.current[m.alunoId];
          if (cache) {
            return { ...m, alunoNomeCompleto: cache };
          }

          try {
            const aluno = await buscarAluno(m.alunoId);
            const nome = `${String(aluno.nome ?? "").trim()} ${String(aluno.sobrenome ?? "").trim()}`.trim();
            if (nome) {
              nomeAlunoPorIdRef.current[m.alunoId] = nome;
              return { ...m, alunoNomeCompleto: nome };
            }
          } catch {
            // Mantém fallback "Aluno #id" quando API de aluno falhar.
          }

          return m;
        }),
      );

      setMatriculas(enriquecidas);
    } catch (e) {
      setError(getApiErrorMessage(e, "Falha ao carregar matriculas."));
    } finally {
      setIsLoading(false);
    }
  }, [alunoIdFiltro, statusSelecionado]);

  useEffect(() => {
    void carregarMatriculas();
  }, [carregarMatriculas]);

  useEffect(() => {
    if (!modalNovoAlunoOpen) setNovoAlunoModalBaseline("");
  }, [modalNovoAlunoOpen]);

  useEffect(() => {
    if (!matriculaParaEnturmar) setTurmaIdEnturmarInicial("");
  }, [matriculaParaEnturmar]);

  const novoAlunoModalEstadoAtual = useMemo(
    () => JSON.stringify({ form: novoAlunoForm, etapa: etapaCadastro }),
    [novoAlunoForm, etapaCadastro],
  );

  const novoAlunoModalTemAlteracao =
    modalNovoAlunoOpen &&
    !savingAluno &&
    novoAlunoModalBaseline !== "" &&
    novoAlunoModalEstadoAtual !== novoAlunoModalBaseline;

  const enturmarModalTemAlteracao =
    !!matriculaParaEnturmar && !savingEnturmar && turmaIdEnturmar !== turmaIdEnturmarInicial;

  const matriculasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return matriculas;
    return matriculas.filter((m) => {
      const blob = `${m.id} ${m.alunoId} ${m.turmaId ?? ""} ${m.status} ${m.alunoNomeCompleto ?? ""} ${m.turmaNome ?? ""}`.toLowerCase();
      return blob.includes(termo);
    });
  }, [matriculas, busca]);

  const abrirModalNovoAluno = () => {
    setNovoAlunoForm(emptyNovoAlunoForm);
    setEtapaCadastro("aluno");
    setMsgCepAluno(null);
    setMsgCepResponsavel(null);
    setNovoAlunoModalBaseline(JSON.stringify({ form: emptyNovoAlunoForm, etapa: "aluno" }));
    setModalNovoAlunoOpen(true);
  };

  const fecharModalEnturmar = () => {
    setMatriculaParaEnturmar(null);
    setTurmaIdEnturmar("");
    setTurmaIdEnturmarInicial("");
  };

  const buscarCepAluno = async () => {
    setMsgCepAluno(null);
    const d = digitsOnly(novoAlunoForm.cep, 8);
    if (d.length !== 8) {
      setMsgCepAluno("Informe o CEP com 8 digitos.");
      return;
    }
    setBuscandoCepAluno(true);
    try {
      const r = await buscarEnderecoPorCep(novoAlunoForm.cep);
      setNovoAlunoForm((p) => ({
        ...p,
        cep: r.cepFormatado,
        tipoLogradouro: r.tipoLogradouro,
        logradouro: r.logradouro,
        bairro: r.bairro,
        municipio: r.municipio,
        complemento: p.complemento.trim() || r.complemento || "",
      }));
    } catch (e) {
      setMsgCepAluno(e instanceof Error ? e.message : "CEP nao encontrado.");
    } finally {
      setBuscandoCepAluno(false);
    }
  };

  const buscarCepResponsavel = async () => {
    setMsgCepResponsavel(null);
    const d = digitsOnly(novoAlunoForm.responsavelCep, 8);
    if (d.length !== 8) {
      setMsgCepResponsavel("Informe o CEP com 8 digitos.");
      return;
    }
    setBuscandoCepResponsavel(true);
    try {
      const r = await buscarEnderecoPorCep(novoAlunoForm.responsavelCep);
      setNovoAlunoForm((p) => ({
        ...p,
        responsavelCep: r.cepFormatado,
        responsavelTipoLogradouro: r.tipoLogradouro,
        responsavelLogradouro: r.logradouro,
        responsavelBairro: r.bairro,
        responsavelMunicipio: r.municipio,
        responsavelComplemento: p.responsavelComplemento.trim() || r.complemento || "",
      }));
    } catch (e) {
      setMsgCepResponsavel(e instanceof Error ? e.message : "CEP nao encontrado.");
    } finally {
      setBuscandoCepResponsavel(false);
    }
  };

  const salvarNovoAluno = async () => {
    if (!novoAlunoForm.nome.trim() || !novoAlunoForm.sobrenome.trim()) {
      setError("Nome e sobrenome sao obrigatorios.");
      return;
    }

    if (!novoAlunoForm.dataNascimento || !novoAlunoForm.dataIngresso) {
      setError("Data de nascimento e data de ingresso sao obrigatorias.");
      return;
    }

    if (
      !novoAlunoForm.cep.trim() ||
      !novoAlunoForm.tipoLogradouro.trim() ||
      !novoAlunoForm.logradouro.trim() ||
      !novoAlunoForm.numero.trim() ||
      !novoAlunoForm.bairro.trim() ||
      !novoAlunoForm.municipio.trim()
    ) {
      setError("Preencha o endereco completo do aluno.");
      return;
    }

    if (alunoMenor && novoAlunoForm.eProprioResponsavel) {
      setError("Aluno menor de idade nao pode ser marcado como proprio responsavel.");
      return;
    }

    if (novoAlunoForm.eProprioResponsavel && !novoAlunoForm.cpf.trim()) {
      setError("CPF e obrigatorio quando o aluno e o proprio responsavel.");
      return;
    }

    if (!novoAlunoForm.eProprioResponsavel) {
      if (
        !novoAlunoForm.responsavelNome.trim() ||
        !novoAlunoForm.responsavelSobrenome.trim() ||
        !novoAlunoForm.responsavelCpf.trim() ||
        !novoAlunoForm.responsavelCep.trim() ||
        !novoAlunoForm.responsavelTipoLogradouro.trim() ||
        !novoAlunoForm.responsavelLogradouro.trim() ||
        !novoAlunoForm.responsavelNumero.trim() ||
        !novoAlunoForm.responsavelBairro.trim() ||
        !novoAlunoForm.responsavelMunicipio.trim()
      ) {
        setError("Preencha os dados e endereco completos do responsavel.");
        return;
      }
    }

    const telAluno = digitsOnly(novoAlunoForm.telefoneAluno);
    const telResp = digitsOnly(novoAlunoForm.responsavelTelefone);
    if (novoAlunoForm.eProprioResponsavel && telAluno.length < 10) {
      setError("Informe o telefone celular do aluno (minimo 10 digitos) quando ele e o proprio responsavel.");
      return;
    }
    if (!novoAlunoForm.eProprioResponsavel && telResp.length < 10) {
      setError("Informe o telefone celular do responsavel (minimo 10 digitos).");
      return;
    }
    if (!novoAlunoForm.eProprioResponsavel && telAluno.length > 0 && telAluno.length < 10) {
      setError("Telefone do aluno invalido (use ao menos 10 digitos ou deixe em branco).");
      return;
    }

    setSavingAluno(true);
    setError(null);
    try {
      await criarAlunoComMatricula({
        eProprioResponsavel: novoAlunoForm.eProprioResponsavel,
        nome: novoAlunoForm.nome.trim(),
        sobrenome: novoAlunoForm.sobrenome.trim(),
        sexo: novoAlunoForm.sexo,
        dataNascimento: novoAlunoForm.dataNascimento,
        dataIngresso: novoAlunoForm.dataIngresso,
        cpf: novoAlunoForm.cpf.trim() || undefined,
        cep: novoAlunoForm.cep.trim(),
        tipoLogradouro: novoAlunoForm.tipoLogradouro,
        logradouro: novoAlunoForm.logradouro.trim(),
        numero: novoAlunoForm.numero.trim(),
        complemento: novoAlunoForm.complemento.trim() || undefined,
        bairro: novoAlunoForm.bairro.trim(),
        municipio: novoAlunoForm.municipio.trim(),
        alunoTelefone: telAluno.length >= 10 ? novoAlunoForm.telefoneAluno : undefined,
        corRaca: novoAlunoForm.corRaca || undefined,
        estadoCivil: novoAlunoForm.estadoCivil || undefined,
        profissao: novoAlunoForm.profissao.trim() || undefined,
        registroEscolar: novoAlunoForm.registroEscolar.trim() || undefined,
        nacionalidade: novoAlunoForm.nacionalidade.trim() || undefined,
        dataEntradaPais: novoAlunoForm.dataEntradaPais || undefined,
        naturalidadeCidade: novoAlunoForm.naturalidadeCidade.trim() || undefined,
        naturalidadeEstado: novoAlunoForm.naturalidadeEstado.trim().toUpperCase() || undefined,
        rgNumero: novoAlunoForm.rgNumero.trim() || undefined,
        rgExpedicao: novoAlunoForm.rgExpedicao || undefined,
        rgOrgao: novoAlunoForm.rgOrgao.trim() || undefined,
        responsavelNome: novoAlunoForm.eProprioResponsavel ? undefined : novoAlunoForm.responsavelNome.trim(),
        responsavelSobrenome: novoAlunoForm.eProprioResponsavel ? undefined : novoAlunoForm.responsavelSobrenome.trim(),
        responsavelCpf: novoAlunoForm.eProprioResponsavel ? undefined : novoAlunoForm.responsavelCpf.trim(),
        responsavelSexo: novoAlunoForm.eProprioResponsavel ? undefined : novoAlunoForm.responsavelSexo,
        responsavelCep: novoAlunoForm.eProprioResponsavel ? undefined : novoAlunoForm.responsavelCep.trim(),
        responsavelTipoLogradouro: novoAlunoForm.eProprioResponsavel ? undefined : novoAlunoForm.responsavelTipoLogradouro,
        responsavelLogradouro: novoAlunoForm.eProprioResponsavel ? undefined : novoAlunoForm.responsavelLogradouro.trim(),
        responsavelNumero: novoAlunoForm.eProprioResponsavel ? undefined : novoAlunoForm.responsavelNumero.trim(),
        responsavelComplemento: novoAlunoForm.eProprioResponsavel ? undefined : novoAlunoForm.responsavelComplemento.trim() || undefined,
        responsavelBairro: novoAlunoForm.eProprioResponsavel ? undefined : novoAlunoForm.responsavelBairro.trim(),
        responsavelMunicipio: novoAlunoForm.eProprioResponsavel ? undefined : novoAlunoForm.responsavelMunicipio.trim(),
        responsavelTelefone: novoAlunoForm.eProprioResponsavel ? undefined : novoAlunoForm.responsavelTelefone,
      });

      setModalNovoAlunoOpen(false);
      await carregarMatriculas();
    } catch (e) {
      setError(getApiErrorMessage(e, "Falha ao criar aluno."));
    } finally {
      setSavingAluno(false);
    }
  };

  const enturmarMatricula = async () => {
    if (!matriculaParaEnturmar) return;

    const turmaId = Number(turmaIdEnturmar);
    if (!Number.isFinite(turmaId) || turmaId <= 0) {
      setError("Informe um TurmaId valido.");
      return;
    }

    setSavingEnturmar(true);
    setError(null);
    try {
      await vincularTurmaMatricula(matriculaParaEnturmar.id, turmaId);
      fecharModalEnturmar();
      await carregarMatriculas();
    } catch (e) {
      setError(getApiErrorMessage(e, "Falha ao vincular turma."));
    } finally {
      setSavingEnturmar(false);
    }
  };

  const onCancelarMatricula = async (m: MatriculaListItem) => {
    if (!confirm(`Cancelar matrícula #${m.id} (${labelAlunoMatricula(m)})?`)) return;

    setError(null);
    try {
      await cancelarMatriculaById(m.id);
      await carregarMatriculas();
    } catch (e) {
      setError(getApiErrorMessage(e, "Falha ao cancelar matricula."));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Secretaria</h1>
          <p className="text-sm text-zinc-500">Cadastro de alunos e gestao de matriculas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={carregarMatriculas} isLoading={isLoading}>Atualizar</Button>
          {podeCriarAluno && (
            <Button onClick={abrirModalNovoAluno}>Novo Aluno</Button>
          )}
        </div>
      </div>

      {podeAprovarPreAluno && (
        <Card className="p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Pré-alunos aguardando aprovação</CardTitle>
              <p className="mt-0.5 text-xs text-zinc-500">
                O comercial envia a ficha; aqui você confere e marca como aprovada antes da matrícula formal.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => void carregarPreAlunosAguardando()} isLoading={carregandoPreAlunos}>
              Atualizar fila
            </Button>
          </div>
          {preAlunosAguardando.length === 0 && !carregandoPreAlunos ? (
            <p className="text-sm text-zinc-400">Nenhuma ficha pendente neste momento.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-zinc-100">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <th className="px-4 py-2">Pré-aluno</th>
                    <th className="px-4 py-2">Responsável</th>
                    <th className="px-4 py-2">Livro</th>
                    <th className="px-4 py-2">Contrato</th>
                    <th className="px-4 py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {preAlunosAguardando.map((p) => (
                    <tr key={p.id} className="border-b border-zinc-100 last:border-b-0">
                      <td className="px-4 py-2 font-medium text-zinc-900">{p.nomeCompletoAluno}</td>
                      <td className="px-4 py-2 text-zinc-600">{p.nomeCompletoResponsavel}</td>
                      <td className="px-4 py-2 text-zinc-600">{p.nomeLivroInteresse}</td>
                      <td className="px-4 py-2 text-xs text-zinc-600">{p.tipoContrato}</td>
                      <td className="px-4 py-2 text-right">
                        <Button size="sm" onClick={() => abrirAnalisePreAluno(p)}>
                          Analisar / Aceite
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_ABAS.map((item) => (
            <button
              key={item.id}
              onClick={() => setAba(item.id)}
              className={`h-9 rounded-lg px-4 text-sm font-medium transition-colors ${
                aba === item.id
                  ? "bg-[#1F2A35] text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input
            label="Busca rápida"
            placeholder="ID, alunoId, turmaId ou status"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <Input
            label="Filtrar por AlunoId"
            placeholder="Ex.: 123"
            value={alunoIdFiltro}
            onChange={(e) => setAlunoIdFiltro(e.target.value)}
          />
          <div className="flex items-end">
            <Button className="w-full" onClick={carregarMatriculas} isLoading={isLoading}>Aplicar filtros</Button>
          </div>
        </div>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="mb-3">
          <CardTitle className="text-base">Matrículas ({matriculasFiltradas.length})</CardTitle>
        </CardHeader>

        <div className="overflow-x-auto rounded-lg border border-zinc-100">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="whitespace-nowrap px-4 py-3">Matrícula</th>
                <th className="min-w-[220px] px-4 py-3">Aluno</th>
                <th className="min-w-[140px] px-4 py-3">Turma</th>
                <th className="whitespace-nowrap px-4 py-3">Status</th>
                <th className="min-w-[140px] px-4 py-3">Datas</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && matriculasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-400">
                    Nenhuma matrícula encontrada.
                  </td>
                </tr>
              ) : (
                matriculasFiltradas.map((m) => {
                  const inicial = labelAlunoMatricula(m).charAt(0).toUpperCase();
                  return (
                    <tr key={m.id} className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/80">
                      <td className="align-top px-4 py-3 font-mono text-xs font-medium text-zinc-600">#{m.id}</td>
                      <td className="align-top px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div
                            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1F2A35] text-xs font-semibold text-white"
                            aria-hidden
                          >
                            {inicial}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/alunos/${m.alunoId}`}
                              className="font-medium text-zinc-900 hover:underline"
                            >
                              {labelAlunoMatricula(m)}
                            </Link>
                            <p className="mt-0.5 text-xs text-zinc-400">ID do aluno: {m.alunoId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="align-top px-4 py-3 text-zinc-800">
                        <span className="font-medium">{labelTurmaMatricula(m)}</span>
                        {m.turmaId != null ? (
                          <p className="mt-0.5 text-xs text-zinc-400">ID turma: {m.turmaId}</p>
                        ) : null}
                      </td>
                      <td className="align-top px-4 py-3">
                        <Badge>{m.status}</Badge>
                      </td>
                      <td className="align-top px-4 py-3 text-zinc-600">
                        <div className="text-zinc-800">{formatDate(m.dataMatricula)}</div>
                        <div className="mt-1 text-xs text-zinc-400">Atualizado: {formatDateTime(m.dataAtualizacao)}</div>
                      </td>
                      <td className="align-top px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          {podeEnturmar && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                const ini = m.turmaId ? String(m.turmaId) : "";
                                setTurmaIdEnturmarInicial(ini);
                                setMatriculaParaEnturmar(m);
                                setTurmaIdEnturmar(ini);
                              }}
                              disabled={m.status !== "Em Espera"}
                            >
                              Enturmar
                            </Button>
                          )}
                          {podeCancelarMatricula && (
                            <Button size="sm" variant="danger" onClick={() => void onCancelarMatricula(m)} disabled={m.status === "Cancelado"}>
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={modalNovoAlunoOpen}
        onClose={() => setModalNovoAlunoOpen(false)}
        title="Novo aluno"
        hasUnsavedChanges={novoAlunoModalTemAlteracao}
        closeDisabled={savingAluno}
        footer={(requestClose) => (
          <>
            <Button variant="secondary" onClick={requestClose} disabled={savingAluno}>
              Fechar
            </Button>
            {etapaCadastro !== "aluno" && (
              <Button
                variant="secondary"
                onClick={() =>
                  setEtapaCadastro((prev) => (prev === "outros" ? (novoAlunoForm.eProprioResponsavel ? "aluno" : "responsavel") : "aluno"))
                }
              >
                Voltar
              </Button>
            )}
            {etapaCadastro === "aluno" && (
              <Button
                onClick={() => {
                  if (
                    !novoAlunoForm.nome.trim() ||
                    !novoAlunoForm.sobrenome.trim() ||
                    !novoAlunoForm.dataNascimento ||
                    !novoAlunoForm.sexo ||
                    !novoAlunoForm.cep.trim() ||
                    !novoAlunoForm.tipoLogradouro.trim() ||
                    !novoAlunoForm.logradouro.trim() ||
                    !novoAlunoForm.numero.trim() ||
                    !novoAlunoForm.bairro.trim() ||
                    !novoAlunoForm.municipio.trim()
                  ) {
                    setError("Preencha dados pessoais e endereco obrigatorios do aluno para continuar.");
                    return;
                  }

                  if (!alunoMenor && novoAlunoForm.eProprioResponsavel && digitsOnly(novoAlunoForm.telefoneAluno).length < 10) {
                    setError("Informe o telefone celular do aluno (minimo 10 digitos) quando ele e o proprio responsavel.");
                    return;
                  }

                  if (alunoMenor || !novoAlunoForm.eProprioResponsavel) {
                    setEtapaCadastro("responsavel");
                  } else {
                    setEtapaCadastro("outros");
                  }
                }}
              >
                Proximo
              </Button>
            )}
            {etapaCadastro === "responsavel" && (
              <Button
                onClick={() => {
                  if (
                    !novoAlunoForm.responsavelNome.trim() ||
                    !novoAlunoForm.responsavelSobrenome.trim() ||
                    !novoAlunoForm.responsavelCpf.trim() ||
                    !novoAlunoForm.responsavelCep.trim() ||
                    !novoAlunoForm.responsavelTipoLogradouro.trim() ||
                    !novoAlunoForm.responsavelLogradouro.trim() ||
                    !novoAlunoForm.responsavelNumero.trim() ||
                    !novoAlunoForm.responsavelBairro.trim() ||
                    !novoAlunoForm.responsavelMunicipio.trim()
                  ) {
                    setError("Preencha os dados obrigatorios do responsavel, incluindo endereco.");
                    return;
                  }

                  if (digitsOnly(novoAlunoForm.responsavelTelefone).length < 10) {
                    setError("Informe o telefone celular do responsavel (minimo 10 digitos).");
                    return;
                  }

                  setEtapaCadastro("outros");
                }}
              >
                Proximo
              </Button>
            )}
            {etapaCadastro === "outros" && (
              <Button onClick={salvarNovoAluno} isLoading={savingAluno}>Salvar aluno</Button>
            )}
          </>
        )}
      >
        <div className="mb-4 flex items-center gap-2 text-xs">
          <Badge variant={etapaCadastro === "aluno" ? "info" : "muted"}>1. Dados do aluno</Badge>
          <span className="text-zinc-400">/</span>
          <Badge variant={etapaCadastro === "responsavel" ? "info" : "muted"}>2. Responsavel</Badge>
          <span className="text-zinc-400">/</span>
          <Badge variant={etapaCadastro === "outros" ? "info" : "muted"}>3. Outros dados</Badge>
        </div>

        {etapaCadastro === "aluno" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
              <h3 className="mb-3 text-sm font-semibold text-zinc-800">Dados pessoais</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input label="Nome" value={novoAlunoForm.nome} onChange={(e) => setNovoAlunoForm((p) => ({ ...p, nome: e.target.value }))} required />
                <Input label="Sobrenome" value={novoAlunoForm.sobrenome} onChange={(e) => setNovoAlunoForm((p) => ({ ...p, sobrenome: e.target.value }))} required />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-700">Sexo</label>
                  <select
                    className={SELECT_FIELD}
                    value={novoAlunoForm.sexo}
                    onChange={(e) => setNovoAlunoForm((p) => ({ ...p, sexo: e.target.value as NovoAlunoForm["sexo"] }))}
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <Input
                  label="Data de nascimento"
                  type="date"
                  value={novoAlunoForm.dataNascimento}
                  required
                  onChange={(e) => {
                    const novaData = e.target.value;
                    const idade = calcularIdadeAnos(novaData, dataHojeIsoLocal());
                    setNovoAlunoForm((p) => ({
                      ...p,
                      dataNascimento: novaData,
                      eProprioResponsavel: idade !== null && idade < 18 ? false : p.eProprioResponsavel,
                    }));
                  }}
                />
                <div className="md:col-span-2">
                  <Input
                    label="Telefone celular do aluno"
                    value={novoAlunoForm.telefoneAluno}
                    onChange={(e) =>
                      setNovoAlunoForm((p) => ({ ...p, telefoneAluno: applyBrazilMask("phone", e.target.value) }))
                    }
                    helperText="Opcional se houver responsavel com telefone. Obrigatorio se o aluno for o proprio responsavel."
                  />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-zinc-800">Endereco do aluno</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-zinc-700">CEP</span>
                  <div className="flex gap-2">
                    <div className="min-w-0 flex-1">
                      <Input
                        value={novoAlunoForm.cep}
                        onChange={(e) => {
                          setMsgCepAluno(null);
                          setNovoAlunoForm((p) => ({ ...p, cep: applyBrazilMask("cep", e.target.value) }));
                        }}
                        placeholder="00000-000"
                        maxLength={9}
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="shrink-0 self-end"
                      isLoading={buscandoCepAluno}
                      onClick={() => void buscarCepAluno()}
                    >
                      Buscar
                    </Button>
                  </div>
                  {msgCepAluno && <p className="text-xs text-red-600">{msgCepAluno}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-700">Tipo de logradouro</label>
                  <select
                    className={SELECT_FIELD}
                    value={novoAlunoForm.tipoLogradouro}
                    onChange={(e) => setNovoAlunoForm((p) => ({ ...p, tipoLogradouro: e.target.value as NovoAlunoForm["tipoLogradouro"] }))}
                  >
                    <option value="Rua">Rua</option>
                    <option value="Avenida">Avenida</option>
                    <option value="Travessa">Travessa</option>
                    <option value="Alameda">Alameda</option>
                    <option value="Estrada">Estrada</option>
                    <option value="Rodovia">Rodovia</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <Input label="Numero" value={novoAlunoForm.numero} onChange={(e) => setNovoAlunoForm((p) => ({ ...p, numero: e.target.value }))} required />
                <div className="md:col-span-2">
                  <Input label="Logradouro" value={novoAlunoForm.logradouro} onChange={(e) => setNovoAlunoForm((p) => ({ ...p, logradouro: e.target.value }))} required />
                </div>
                <Input label="Complemento" value={novoAlunoForm.complemento} onChange={(e) => setNovoAlunoForm((p) => ({ ...p, complemento: e.target.value }))} />
                <Input label="Bairro" value={novoAlunoForm.bairro} onChange={(e) => setNovoAlunoForm((p) => ({ ...p, bairro: e.target.value }))} required />
                <Input label="Municipio" value={novoAlunoForm.municipio} onChange={(e) => setNovoAlunoForm((p) => ({ ...p, municipio: e.target.value }))} required />
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              {alunoMenor
                ? "Aluno menor de idade: o proximo passo sera o cadastro do responsavel."
                : "Aluno maior de idade: voce pode definir se ele sera o proprio responsavel."}
            </div>
            {!alunoMenor && (
              <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={novoAlunoForm.eProprioResponsavel}
                  onChange={(e) => setNovoAlunoForm((p) => ({ ...p, eProprioResponsavel: e.target.checked }))}
                />
                Aluno e o proprio responsavel
              </label>
            )}
          </div>
        )}

        {etapaCadastro === "responsavel" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
              <h3 className="mb-3 text-sm font-semibold text-zinc-800">Dados do responsavel</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input label="Nome do responsavel" value={novoAlunoForm.responsavelNome} onChange={(e) => setNovoAlunoForm((p) => ({ ...p, responsavelNome: e.target.value }))} required />
                <Input label="Sobrenome do responsavel" value={novoAlunoForm.responsavelSobrenome} onChange={(e) => setNovoAlunoForm((p) => ({ ...p, responsavelSobrenome: e.target.value }))} required />
                <Input
                  label="CPF do responsavel"
                  value={novoAlunoForm.responsavelCpf}
                  onChange={(e) =>
                    setNovoAlunoForm((p) => ({ ...p, responsavelCpf: applyBrazilMask("cpf", e.target.value) }))
                  }
                  required
                />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-700">Sexo do responsavel</label>
                  <select
                    className={SELECT_FIELD}
                    value={novoAlunoForm.responsavelSexo}
                    onChange={(e) => setNovoAlunoForm((p) => ({ ...p, responsavelSexo: e.target.value as NovoAlunoForm["responsavelSexo"] }))}
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Telefone celular do responsavel"
                    value={novoAlunoForm.responsavelTelefone}
                    onChange={(e) =>
                      setNovoAlunoForm((p) => ({
                        ...p,
                        responsavelTelefone: applyBrazilMask("phone", e.target.value),
                      }))
                    }
                    required
                    helperText="Obrigatorio quando o aluno nao e o proprio responsavel."
                  />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-zinc-800">Endereco do responsavel</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-zinc-700">CEP</span>
                  <div className="flex gap-2">
                    <div className="min-w-0 flex-1">
                      <Input
                        value={novoAlunoForm.responsavelCep}
                        onChange={(e) => {
                          setMsgCepResponsavel(null);
                          setNovoAlunoForm((p) => ({
                            ...p,
                            responsavelCep: applyBrazilMask("cep", e.target.value),
                          }));
                        }}
                        placeholder="00000-000"
                        maxLength={9}
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="shrink-0 self-end"
                      isLoading={buscandoCepResponsavel}
                      onClick={() => void buscarCepResponsavel()}
                    >
                      Buscar
                    </Button>
                  </div>
                  {msgCepResponsavel && <p className="text-xs text-red-600">{msgCepResponsavel}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-700">Tipo de logradouro</label>
                  <select
                    className={SELECT_FIELD}
                    value={novoAlunoForm.responsavelTipoLogradouro}
                    onChange={(e) =>
                      setNovoAlunoForm((p) => ({ ...p, responsavelTipoLogradouro: e.target.value as NovoAlunoForm["responsavelTipoLogradouro"] }))
                    }
                  >
                    <option value="Rua">Rua</option>
                    <option value="Avenida">Avenida</option>
                    <option value="Travessa">Travessa</option>
                    <option value="Alameda">Alameda</option>
                    <option value="Estrada">Estrada</option>
                    <option value="Rodovia">Rodovia</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <Input label="Numero" value={novoAlunoForm.responsavelNumero} onChange={(e) => setNovoAlunoForm((p) => ({ ...p, responsavelNumero: e.target.value }))} required />
                <div className="md:col-span-2">
                  <Input label="Logradouro" value={novoAlunoForm.responsavelLogradouro} onChange={(e) => setNovoAlunoForm((p) => ({ ...p, responsavelLogradouro: e.target.value }))} required />
                </div>
                <Input label="Complemento" value={novoAlunoForm.responsavelComplemento} onChange={(e) => setNovoAlunoForm((p) => ({ ...p, responsavelComplemento: e.target.value }))} />
                <Input label="Bairro" value={novoAlunoForm.responsavelBairro} onChange={(e) => setNovoAlunoForm((p) => ({ ...p, responsavelBairro: e.target.value }))} required />
                <Input label="Municipio" value={novoAlunoForm.responsavelMunicipio} onChange={(e) => setNovoAlunoForm((p) => ({ ...p, responsavelMunicipio: e.target.value }))} required />
              </div>
            </div>
          </div>
        )}

        {etapaCadastro === "outros" && (
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input
                label="CPF do aluno"
                value={novoAlunoForm.cpf}
                onChange={(e) => setNovoAlunoForm((p) => ({ ...p, cpf: applyBrazilMask("cpf", e.target.value) }))}
                helperText={novoAlunoForm.eProprioResponsavel ? "Obrigatorio quando o aluno e o proprio responsavel." : "Opcional se o aluno tiver CPF."}
              />
              <Input
                label="Data de ingresso"
                type="date"
                value={novoAlunoForm.dataIngresso}
                onChange={(e) => setNovoAlunoForm((p) => ({ ...p, dataIngresso: e.target.value }))}
                required
              />
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
              <h3 className="mb-3 text-sm font-semibold text-zinc-800">Documentacao e origem (opcional)</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-700">Cor / raca</label>
                  <select
                    className={SELECT_FIELD}
                    value={novoAlunoForm.corRaca}
                    onChange={(e) => setNovoAlunoForm((p) => ({ ...p, corRaca: e.target.value as NovoAlunoForm["corRaca"] }))}
                  >
                    <option value="">Nao informado</option>
                    <option value="Branca">Branca</option>
                    <option value="Preta">Preta</option>
                    <option value="Parda">Parda</option>
                    <option value="Amarela">Amarela</option>
                    <option value="Indigena">Indigena</option>
                    <option value="Nao Declarado">Nao declarado</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-700">Estado civil</label>
                  <select
                    className={SELECT_FIELD}
                    value={novoAlunoForm.estadoCivil}
                    onChange={(e) => setNovoAlunoForm((p) => ({ ...p, estadoCivil: e.target.value as NovoAlunoForm["estadoCivil"] }))}
                  >
                    <option value="">Nao informado</option>
                    <option value="Solteiro">Solteiro</option>
                    <option value="Casado">Casado</option>
                    <option value="Divorciado">Divorciado</option>
                    <option value="Viuvo">Viuvo</option>
                    <option value="Uniao Estavel">Uniao estavel</option>
                  </select>
                </div>
                <Input label="Profissao" value={novoAlunoForm.profissao} onChange={(e) => setNovoAlunoForm((p) => ({ ...p, profissao: e.target.value }))} />
                <Input
                  label="Registro escolar"
                  value={novoAlunoForm.registroEscolar}
                  onChange={(e) => setNovoAlunoForm((p) => ({ ...p, registroEscolar: e.target.value }))}
                />
                <Input
                  label="Nacionalidade"
                  value={novoAlunoForm.nacionalidade}
                  onChange={(e) => setNovoAlunoForm((p) => ({ ...p, nacionalidade: e.target.value }))}
                />
                <Input
                  label="Data de entrada no pais"
                  type="date"
                  value={novoAlunoForm.dataEntradaPais}
                  onChange={(e) => setNovoAlunoForm((p) => ({ ...p, dataEntradaPais: e.target.value }))}
                />
                <Input
                  label="Naturalidade (cidade)"
                  value={novoAlunoForm.naturalidadeCidade}
                  onChange={(e) => setNovoAlunoForm((p) => ({ ...p, naturalidadeCidade: e.target.value }))}
                />
                <Input
                  label="Naturalidade (UF)"
                  value={novoAlunoForm.naturalidadeEstado}
                  onChange={(e) =>
                    setNovoAlunoForm((p) => ({
                      ...p,
                      naturalidadeEstado: e.target.value.toUpperCase().slice(0, 2),
                    }))
                  }
                  maxLength={2}
                />
                <Input label="RG — numero" value={novoAlunoForm.rgNumero} onChange={(e) => setNovoAlunoForm((p) => ({ ...p, rgNumero: e.target.value }))} />
                <Input
                  label="RG — expedicao"
                  type="date"
                  value={novoAlunoForm.rgExpedicao}
                  onChange={(e) => setNovoAlunoForm((p) => ({ ...p, rgExpedicao: e.target.value }))}
                />
                <Input label="RG — orgao emissor" value={novoAlunoForm.rgOrgao} onChange={(e) => setNovoAlunoForm((p) => ({ ...p, rgOrgao: e.target.value }))} />
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              Ao salvar: o sistema cria o aluno e abre uma matricula em <strong>Em Espera</strong>. Telefones sao gravados em{" "}
              <code className="text-xs">contatos_telefone</code> quando informados.
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!matriculaParaEnturmar}
        onClose={fecharModalEnturmar}
        title={
          matriculaParaEnturmar
            ? `Enturmar — ${labelAlunoMatricula(matriculaParaEnturmar)} (#${matriculaParaEnturmar.id})`
            : "Enturmar"
        }
        hasUnsavedChanges={enturmarModalTemAlteracao}
        closeDisabled={savingEnturmar}
        footer={(requestClose) => (
          <>
            <Button variant="secondary" onClick={requestClose} disabled={savingEnturmar}>
              Fechar
            </Button>
            <Button onClick={enturmarMatricula} isLoading={savingEnturmar}>Vincular turma</Button>
          </>
        )}
      >
        <div className="space-y-3">
          {matriculaParaEnturmar && (
            <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              <span className="font-medium text-zinc-900">{labelAlunoMatricula(matriculaParaEnturmar)}</span>
              <span className="text-zinc-400"> · matrícula #{matriculaParaEnturmar.id}</span>
            </p>
          )}
          <p className="text-sm text-zinc-600">
            Como o módulo de turmas ainda está em implementação, use o <strong>TurmaId</strong> manual para concluir a enturmação.
          </p>
          <Input
            label="TurmaId"
            placeholder="Ex.: 15"
            value={turmaIdEnturmar}
            onChange={(e) => setTurmaIdEnturmar(e.target.value)}
          />
        </div>
      </Modal>

      <ModalAprovarPreAluno
        preAluno={preAlunoParaAprovar}
        open={preAlunoParaAprovar !== null}
        onClose={() => setPreAlunoParaAprovar(null)}
        podeReprovar={podeReprovarPreAluno}
        onAprovado={() => {
          void carregarPreAlunosAguardando();
          void carregarMatriculas();
        }}
        onReprovado={() => {
          void carregarPreAlunosAguardando();
        }}
      />
    </div>
  );
}
