"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "@/lib/api/auth";
import {
  buscarPreAluno,
  criarPreAluno,
  editarPreAluno,
  getApiErrorMessage,
  cancelarPreAluno,
  listarContratoTemplates,
  listarLivrosInteressePreAluno,
  listarPreAlunos,
  obterDataReferenciaServidor,
  submeterPreAlunoParaAprovacao,
} from "@/lib/api";
import {
  mapDetalheParaFormulario,
  resolverTemplateIdPorNome,
  type OpcaoRespAdulto,
} from "@/lib/mapPreAlunoForm";
import {
  extrairUltimaRecusaSecretaria,
  preAlunoTemRecusaSecretaria,
  type UltimaRecusaSecretaria,
} from "@/lib/preAlunoRecusa";
import { PreAlunoDocumentosUpload } from "@/components/comercial/PreAlunoDocumentosUpload";
import { hasPermission } from "@/lib/permissions";
import type { User } from "@/lib/api/types";
import type {
  ContratoTemplate,
  CriarPreAlunoPayload,
  LivroInteresseOpcao,
  PreAlunoListItem,
  PreAlunoStatus,
} from "@/types/comercial";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { calcularIdadeAnos, formatarDataIsoPtBr } from "@/lib/dates";
import { buscarEnderecoPorCep } from "@/lib/viacep";
import { applyBrazilMask, digitsOnly } from "@/utils";

const SELECT_FIELD =
  "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/20";

const SECTION_CARD = "overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm";
const SECTION_HEAD = "border-b border-zinc-100 bg-zinc-50/90 px-4 py-3";
const SUBSECTION_LABEL =
  "mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500";

function formatMoney(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
}

const STATUS_META: Record<PreAlunoStatus, { label: string }> = {
  "Em negociacao": { label: "Em negociação" },
  "Aguardando aprovacao": { label: "Aguardando aprovação" },
  Aprovado: { label: "Aprovado" },
  Matriculado: { label: "Matriculado" },
  Cancelado: { label: "Cancelado" },
};

const FILTROS_STATUS: Array<{ value: string; label: string }> = [
  { value: "", label: "Todos" },
  { value: "Em negociacao", label: STATUS_META["Em negociacao"].label },
  { value: "Aguardando aprovacao", label: STATUS_META["Aguardando aprovacao"].label },
  { value: "Aprovado", label: STATUS_META.Aprovado.label },
  { value: "Matriculado", label: STATUS_META.Matriculado.label },
  { value: "Cancelado", label: STATUS_META.Cancelado.label },
];

type PassoCadastroPreAluno = "aluno" | "responsavel" | "comercial";
type ModoModalPreAluno = "criar" | "editar";

const STEPS_PRE_ALUNO: { id: PassoCadastroPreAluno; label: string; short: string }[] = [
  { id: "aluno", label: "Pré-aluno", short: "Pré-aluno" },
  { id: "responsavel", label: "Responsável financeiro", short: "Responsável" },
  { id: "comercial", label: "Contrato e valores", short: "Contrato" },
];

const ORIGEM_CAPTACAO_OPCOES = [
  "Indicação",
  "Redes sociais",
  "Site ou lead digital",
  "Ativo / Ligação outbound",
  "Evento ou feira",
  "Passou na frente / outdoor",
  "Parceria",
  "Google / busca",
  "Outro",
] as const;

const FORMAS_PAGAMENTO_OPCOES = ["PIX", "Boleto", "Cartão", "Dinheiro", "Outro"] as const;

const emptyPayload: CriarPreAlunoPayload = {
  eProprioResponsavel: false,
  alunoCpf: "",
  responsavelTipoPessoa: "Fisica",
  responsavelCpfCnpj: "",
  responsavelNome: "",
  responsavelSobrenome: "",
  responsavelTelefone: "",
  responsavelSexo: "",
  responsavelGrauParentesco: "",
  responsavelEstadoCivil: "",
  responsavelCorRaca: "",
  responsavelNacionalidade: "",
  responsavelDataNascimento: "",
  responsavelNaturalidadeCidade: "",
  responsavelNaturalidadeEstado: "",
  responsavelRgNumero: "",
  responsavelRgExpedicao: "",
  responsavelRgOrgao: "",
  nome: "",
  sobrenome: "",
  dataNascimento: "",
  telefoneAluno: "",
  livroInteresseId: 0,
  tipoContrato: "",
  valorMensalidade: 0,
  formaPagamento: "",
  valorMatricula: 0,
  formaPagamentoMatricula: "",
  valorMaterial: 0,
  origemCaptacao: "",
  usaTransporteVan: false,
  transporteCep: "",
  transporteLogradouro: "",
  transporteNumero: "",
  transporteComplemento: "",
  transporteBairro: "",
  transporteCidade: "",
  transporteUf: "",
  observacoesComerciais: "",
};

function escolherTemplateContratoPadrao(templates: ContratoTemplate[]): number | "" {
  if (templates.length === 0) return "";
  const ativo = templates.find((t) => t.ativo);
  return ativo?.id ?? templates[0].id;
}

function serializarModalPreAlunoEstado(p: {
  form: CriarPreAlunoPayload;
  passo: PassoCadastroPreAluno;
  tipo: OpcaoRespAdulto;
  templateContratoId: number | "";
}) {
  return JSON.stringify(p);
}

export default function ComercialPage() {
  const [user, setUser] = useState<User | null>(null);
  const [lista, setLista] = useState<PreAlunoListItem[]>([]);
  const [livros, setLivros] = useState<LivroInteresseOpcao[]>([]);
  const [contratoTemplates, setContratoTemplates] = useState<ContratoTemplate[]>([]);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalNovo, setModalNovo] = useState(false);
  const [modoModal, setModoModal] = useState<ModoModalPreAluno>("criar");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [motivoRecusaModal, setMotivoRecusaModal] = useState<UltimaRecusaSecretaria | null>(null);
  const [carregandoFormulario, setCarregandoFormulario] = useState(false);
  const [preAlunoModalBaseline, setPreAlunoModalBaseline] = useState("");
  const [formNovo, setFormNovo] = useState<CriarPreAlunoPayload>(() => ({ ...emptyPayload }));
  const [passoCadastro, setPassoCadastro] = useState<PassoCadastroPreAluno>("aluno");
  const [tipoResponsavelAdulto, setTipoResponsavelAdulto] = useState<OpcaoRespAdulto>(null);
  const [salvando, setSalvando] = useState(false);
  const [templateContratoId, setTemplateContratoId] = useState<number | "">("");
  const [cepVanBuscando, setCepVanBuscando] = useState(false);
  const [mostrarOpcionaisResp, setMostrarOpcionaisResp] = useState(false);
  const [preAlunoSubmeter, setPreAlunoSubmeter] = useState<PreAlunoListItem | null>(null);
  const [submetendo, setSubmetendo] = useState(false);
  const [dataReferenciaServidor, setDataReferenciaServidor] = useState<string | null>(null);

  const idadePreAluno = useMemo(() => {
    if (!dataReferenciaServidor) return null;
    return calcularIdadeAnos(formNovo.dataNascimento, dataReferenciaServidor);
  }, [formNovo.dataNascimento, dataReferenciaServidor]);
  const menorDeIdade = idadePreAluno !== null && idadePreAluno < 18;
  const maiorOu18 = idadePreAluno !== null && idadePreAluno >= 18;

  useEffect(() => {
    if (!modalNovo) setPreAlunoModalBaseline("");
  }, [modalNovo]);

  useEffect(() => {
    if (!modalNovo || dataReferenciaServidor) return;
    void obterDataReferenciaServidor()
      .then((r) => setDataReferenciaServidor(r.dataHoje))
      .catch(() => setDataReferenciaServidor(null));
  }, [modalNovo, dataReferenciaServidor]);

  const preAlunoModalEstadoAtual = useMemo(
    () =>
      serializarModalPreAlunoEstado({
        form: formNovo,
        passo: passoCadastro,
        tipo: tipoResponsavelAdulto,
        templateContratoId,
      }),
    [formNovo, passoCadastro, tipoResponsavelAdulto, templateContratoId],
  );

  const preAlunoModalTemAlteracao =
    modalNovo &&
    !salvando &&
    preAlunoModalBaseline !== "" &&
    preAlunoModalEstadoAtual !== preAlunoModalBaseline;

  const podeCriar = user ? hasPermission(user, "CRIAR_PRE_ALUNO") : false;
  const podeEditarOuCriarFicha = user
    ? hasPermission(user, "CRIAR_PRE_ALUNO") || hasPermission(user, "EDITAR_PRE_ALUNO")
    : false;
  const podeCancelar = user ? hasPermission(user, "CANCELAR_PRE_ALUNO") : false;

  useEffect(() => {
    void getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pa, liv, templates, ref] = await Promise.all([
        listarPreAlunos(filtroStatus.trim() ? { status: filtroStatus.trim() } : undefined),
        listarLivrosInteressePreAluno(),
        listarContratoTemplates().catch(() => [] as ContratoTemplate[]),
        obterDataReferenciaServidor().catch(() => null),
      ]);
      setLista(pa);
      setLivros(liv);
      setContratoTemplates(templates);
      setDataReferenciaServidor(ref?.dataHoje ?? null);
    } catch (e) {
      setError(getApiErrorMessage(e, "Falha ao carregar dados do comercial."));
    } finally {
      setLoading(false);
    }
  }, [filtroStatus]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function resolverTipoContrato(): string {
    if (templateContratoId === "") return "";
    const template = contratoTemplates.find((t) => t.id === templateContratoId);
    return template?.nome.trim() ?? "";
  }

  const abrirNovo = () => {
    const templatePadrao = escolherTemplateContratoPadrao(contratoTemplates);
    setModoModal("criar");
    setEditandoId(null);
    setMotivoRecusaModal(null);
    setFormNovo({ ...emptyPayload });
    setTemplateContratoId(templatePadrao);
    setPassoCadastro("aluno");
    setTipoResponsavelAdulto(null);
    setMostrarOpcionaisResp(false);
    setPreAlunoModalBaseline(
      serializarModalPreAlunoEstado({
        form: { ...emptyPayload },
        passo: "aluno",
        tipo: null,
        templateContratoId: templatePadrao,
      }),
    );
    setModalNovo(true);
  };

  const abrirEditar = async (row: PreAlunoListItem) => {
    setCarregandoFormulario(true);
    setError(null);
    try {
      const detalhe = await buscarPreAluno(row.id);
      const mapped = mapDetalheParaFormulario(detalhe);
      const templateId = resolverTemplateIdPorNome(detalhe.tipoContrato, contratoTemplates);

      setModoModal("editar");
      setEditandoId(row.id);
      setMotivoRecusaModal(mapped.motivoRecusa);
      setFormNovo(mapped.form);
      setTemplateContratoId(templateId);
      setPassoCadastro("aluno");
      setTipoResponsavelAdulto(mapped.tipoResponsavelAdulto);
      setMostrarOpcionaisResp(false);
      setPreAlunoModalBaseline(
        serializarModalPreAlunoEstado({
          form: mapped.form,
          passo: "aluno",
          tipo: mapped.tipoResponsavelAdulto,
          templateContratoId: templateId,
        }),
      );
      setModalNovo(true);
    } catch (e) {
      setError(getApiErrorMessage(e, "Nao foi possivel carregar o pre-aluno para edicao."));
    } finally {
      setCarregandoFormulario(false);
    }
  };

  const fecharModalNovo = () => {
    setModalNovo(false);
    setModoModal("criar");
    setEditandoId(null);
    setMotivoRecusaModal(null);
    setPassoCadastro("aluno");
    setTipoResponsavelAdulto(null);
  };

  const indiceEtapaAtual = STEPS_PRE_ALUNO.findIndex((s) => s.id === passoCadastro);
  const voltarEtapa = () => {
    const anterior = STEPS_PRE_ALUNO[indiceEtapaAtual - 1];
    if (anterior) setPassoCadastro(anterior.id);
  };
  const navegarParaEtapa = (id: PassoCadastroPreAluno) => {
    const idx = STEPS_PRE_ALUNO.findIndex((s) => s.id === id);
    if (idx >= 0 && idx <= indiceEtapaAtual) setPassoCadastro(id);
  };

  const buscarCepTransporteVan = async () => {
    setCepVanBuscando(true);
    try {
      const r = await buscarEnderecoPorCep(formNovo.transporteCep ?? "");
      const logApi = r.logradouro.trim();
      const montado =
        logApi !== ""
          ? `${r.tipoLogradouro} ${logApi}`
              .replace(/\s+/g, " ")
              .trim()
              .replace(/^Outro\s+/, "")
              .trim()
          : "";

      setFormNovo((p) => ({
        ...p,
        transporteCep: digitsOnly(r.cepFormatado, 8),
        transporteLogradouro: montado !== "" ? montado : p.transporteLogradouro,
        transporteBairro: r.bairro !== "" ? r.bairro : p.transporteBairro,
        transporteCidade: r.municipio !== "" ? r.municipio : p.transporteCidade,
        transporteUf: r.uf !== "" ? r.uf : (p.transporteUf ?? ""),
        transporteComplemento:
          r.complemento.trim() !== "" ? r.complemento : (p.transporteComplemento ?? ""),
      }));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Não foi possível buscar o CEP.");
    } finally {
      setCepVanBuscando(false);
    }
  };

  const avancarEtapaAluno = () => {
    if (
      !formNovo.nome.trim()
      || !formNovo.sobrenome.trim()
      || !formNovo.dataNascimento
      || idadePreAluno === null
      || !formNovo.livroInteresseId
    ) {
      return;
    }

    setPassoCadastro("responsavel");
    setTipoResponsavelAdulto(null);

    setFormNovo((p) => ({
      ...p,
      eProprioResponsavel: false,
      alunoCpf: "",
      responsavelNome: "",
      responsavelSobrenome: "",
      responsavelCpfCnpj: "",
      responsavelTelefone: "",
      responsavelTipoPessoa: "Fisica",
      responsavelSexo: "",
      responsavelGrauParentesco: "",
      responsavelEstadoCivil: "",
      responsavelCorRaca: "",
      responsavelNacionalidade: "",
      responsavelDataNascimento: "",
      responsavelNaturalidadeCidade: "",
      responsavelNaturalidadeEstado: "",
      responsavelRgNumero: "",
      responsavelRgExpedicao: "",
      responsavelRgOrgao: "",
    }));
    setMostrarOpcionaisResp(false);
  };

  const escolherProprioResponsavel = () => {
    setTipoResponsavelAdulto("proprio");
    setMostrarOpcionaisResp(false);
    setFormNovo((p) => ({
      ...p,
      eProprioResponsavel: true,
      alunoCpf: "",
      responsavelTipoPessoa: "Fisica",
      responsavelCpfCnpj: "",
      responsavelNome: "",
      responsavelSobrenome: "",
      responsavelTelefone: "",
    }));
  };

  const escolherOutroResponsavel = () => {
    setTipoResponsavelAdulto("outro");
    setFormNovo((p) => ({
      ...p,
      eProprioResponsavel: false,
      alunoCpf: "",
    }));
  };

  const salvarNovo = async () => {
    const telA = digitsOnly(formNovo.telefoneAluno ?? "");
    const usarProprio = maiorOu18 && formNovo.eProprioResponsavel;
    const docResp = digitsOnly(formNovo.responsavelCpfCnpj);
    const telR = digitsOnly(formNovo.responsavelTelefone);
    const cpfAlunoDigits = digitsOnly(formNovo.alunoCpf ?? "");

    const valorMat = formNovo.valorMaterial ?? 0;
    const transp = formNovo.usaTransporteVan
      ? {
          transporteCep: digitsOnly(formNovo.transporteCep ?? "", 8),
          transporteLogradouro: formNovo.transporteLogradouro?.trim() ?? "",
          transporteNumero: formNovo.transporteNumero?.trim() ?? "",
          transporteComplemento:
            formNovo.transporteComplemento?.trim() !== "" ? formNovo.transporteComplemento?.trim() : null,
          transporteBairro: formNovo.transporteBairro?.trim() ?? "",
          transporteCidade: formNovo.transporteCidade?.trim() ?? "",
          transporteUf: (formNovo.transporteUf ?? "").trim().toUpperCase(),
        }
      : {
          transporteCep: null,
          transporteLogradouro: null,
          transporteNumero: null,
          transporteComplemento: null,
          transporteBairro: null,
          transporteCidade: null,
          transporteUf: null,
        };

    const baseComercial = {
      ...formNovo,
      tipoContrato: resolverTipoContrato(),
      valorMaterial: valorMat,
      formaPagamento: formNovo.formaPagamento?.trim() !== "" ? formNovo.formaPagamento!.trim() : null,
      formaPagamentoMatricula:
        formNovo.valorMatricula > 0 ? formNovo.formaPagamentoMatricula?.trim() || null : null,
      observacoesComerciais:
        formNovo.observacoesComerciais?.trim() !== "" ? formNovo.observacoesComerciais?.trim() : null,
      origemCaptacao: formNovo.origemCaptacao.trim(),
      ...transp,
    };

    const payload: CriarPreAlunoPayload = usarProprio
      ? {
          ...baseComercial,
          eProprioResponsavel: true,
          alunoCpf: cpfAlunoDigits,
          responsavelTipoPessoa: "Fisica",
          responsavelCpfCnpj: "",
          responsavelNome: "",
          responsavelSobrenome: "",
          responsavelTelefone: "",
          telefoneAluno: telA.length >= 10 ? telA : null,
        }
      : {
          ...baseComercial,
          eProprioResponsavel: false,
          alunoCpf: null,
          responsavelCpfCnpj: docResp,
          responsavelTelefone: telR,
          telefoneAluno: telA.length >= 10 ? telA : null,
          responsavelSexo: formNovo.responsavelSexo?.trim() || null,
          responsavelGrauParentesco: formNovo.responsavelGrauParentesco?.trim() || null,
          responsavelEstadoCivil: formNovo.responsavelEstadoCivil?.trim() || null,
          responsavelCorRaca: formNovo.responsavelCorRaca?.trim() || null,
          responsavelNacionalidade: formNovo.responsavelNacionalidade?.trim() || null,
          responsavelDataNascimento: formNovo.responsavelDataNascimento?.trim() || null,
          responsavelNaturalidadeCidade: formNovo.responsavelNaturalidadeCidade?.trim() || null,
          responsavelNaturalidadeEstado: formNovo.responsavelNaturalidadeEstado?.trim() || null,
          responsavelRgNumero: formNovo.responsavelRgNumero?.trim() || null,
          responsavelRgExpedicao: formNovo.responsavelRgExpedicao?.trim() || null,
          responsavelRgOrgao: formNovo.responsavelRgOrgao?.trim() || null,
        };

    setSalvando(true);
    setError(null);
    try {
      if (modoModal === "editar" && editandoId !== null) {
        await editarPreAluno(editandoId, payload);
      } else {
        await criarPreAluno(payload);
      }
      fecharModalNovo();
      await carregar();
    } catch (e) {
      setError(
        getApiErrorMessage(
          e,
          modoModal === "editar"
            ? "Nao foi possivel salvar as alteracoes do pre-aluno."
            : "Nao foi possivel criar o pre-aluno.",
        ),
      );
    } finally {
      setSalvando(false);
    }
  };

  const onSubmeter = (row: PreAlunoListItem) => {
    setPreAlunoSubmeter(row);
  };

  const confirmarSubmissao = async () => {
    if (!preAlunoSubmeter) return;
    setSubmetendo(true);
    setError(null);
    try {
      await submeterPreAlunoParaAprovacao(preAlunoSubmeter.id);
      setPreAlunoSubmeter(null);
      await carregar();
    } catch (e) {
      setError(getApiErrorMessage(e, "Falha ao enviar para aprovacao."));
    } finally {
      setSubmetendo(false);
    }
  };

  const onCancelar = async (row: PreAlunoListItem) => {
    if (!confirm(`Cancelar pre-aluno "${row.nomeCompletoAluno}"? Esta acao nao remove o registro do historico.`)) return;
    setError(null);
    try {
      await cancelarPreAluno(row.id);
      await carregar();
    } catch (e) {
      setError(getApiErrorMessage(e, "Falha ao cancelar."));
    }
  };

  const etapaAlunoValida = Boolean(
    dataReferenciaServidor
      && formNovo.nome.trim()
      && formNovo.sobrenome.trim()
      && formNovo.dataNascimento
      && idadePreAluno !== null
      && formNovo.livroInteresseId > 0,
  );

  const livroInteresseNome = useMemo(() => {
    const l = livros.find((x) => x.id === formNovo.livroInteresseId);
    return l?.nome ?? "";
  }, [livros, formNovo.livroInteresseId]);

  const resumoResponsavelCadastro = useMemo(() => {
    if (menorDeIdade) {
      const nome = [formNovo.responsavelNome, formNovo.responsavelSobrenome].filter(Boolean).join(" ").trim();
      return nome || "Responsável legal (etapa 2)";
    }
    if (tipoResponsavelAdulto === "proprio") return "Próprio pré-aluno (CPF na etapa 2)";
    if (tipoResponsavelAdulto === "outro") {
      const nome = [formNovo.responsavelNome, formNovo.responsavelSobrenome].filter(Boolean).join(" ").trim();
      return nome || "Outro responsável (etapa 2)";
    }
    return "Definir na etapa 2";
  }, [
    menorDeIdade,
    tipoResponsavelAdulto,
    formNovo.responsavelNome,
    formNovo.responsavelSobrenome,
  ]);

  const etapaResponsavelValida = useMemo(() => {
    const telAlunoDig = digitsOnly(formNovo.telefoneAluno ?? "");
    const cpfProprioDig = digitsOnly(formNovo.alunoCpf ?? "");
    const docOutroDig = digitsOnly(formNovo.responsavelCpfCnpj);
    const telOutroDig = digitsOnly(formNovo.responsavelTelefone);

    if (menorDeIdade) {
      const okDoc =
        formNovo.responsavelTipoPessoa === "Fisica" ? docOutroDig.length === 11 : docOutroDig.length === 14;
      return (
        okDoc
        && telOutroDig.length >= 10
        && formNovo.responsavelNome.trim().length > 0
        && formNovo.responsavelSobrenome.trim().length > 0
      );
    }

    if (tipoResponsavelAdulto === "proprio") {
      return cpfProprioDig.length === 11 && telAlunoDig.length >= 10;
    }

    if (tipoResponsavelAdulto === "outro") {
      const okDoc =
        formNovo.responsavelTipoPessoa === "Fisica" ? docOutroDig.length === 11 : docOutroDig.length === 14;
      return (
        okDoc
        && telOutroDig.length >= 10
        && formNovo.responsavelNome.trim().length > 0
        && formNovo.responsavelSobrenome.trim().length > 0
      );
    }

    return false;
  }, [
    menorDeIdade,
    tipoResponsavelAdulto,
    formNovo.telefoneAluno,
    formNovo.alunoCpf,
    formNovo.responsavelCpfCnpj,
    formNovo.responsavelTelefone,
    formNovo.responsavelNome,
    formNovo.responsavelSobrenome,
    formNovo.responsavelTipoPessoa,
  ]);

  const tipoContratoResolvido = useMemo(() => {
    if (templateContratoId === "") return "";
    const template = contratoTemplates.find((t) => t.id === templateContratoId);
    return template?.nome.trim() ?? "";
  }, [templateContratoId, contratoTemplates]);

  const etapaComercialValida = useMemo(() => {
    const cepOk = digitsOnly(formNovo.transporteCep ?? "").length === 8;
    const endBasico =
      Boolean(formNovo.transporteLogradouro?.trim())
      && Boolean(formNovo.transporteNumero?.trim())
      && Boolean(formNovo.transporteBairro?.trim())
      && Boolean(formNovo.transporteCidade?.trim())
      && (formNovo.transporteUf ?? "").trim().length === 2;
    const vanOk = !formNovo.usaTransporteVan ? true : cepOk && endBasico;

    const matriculaPgtoOk = formNovo.valorMatricula <= 0 || Boolean(formNovo.formaPagamentoMatricula?.trim());

    return Boolean(
      formNovo.valorMensalidade > 0
        && tipoContratoResolvido.length > 0
        && tipoContratoResolvido.length <= 120
        && formNovo.origemCaptacao.trim().length > 0
        && matriculaPgtoOk
        && vanOk,
    );
  }, [
    formNovo.transporteCep,
    formNovo.transporteLogradouro,
    formNovo.transporteNumero,
    formNovo.transporteBairro,
    formNovo.transporteCidade,
    formNovo.transporteUf,
    formNovo.usaTransporteVan,
    formNovo.valorMensalidade,
    formNovo.origemCaptacao,
    formNovo.valorMatricula,
    formNovo.formaPagamentoMatricula,
    tipoContratoResolvido,
  ]);

  const podeSalvarTudo =
    etapaAlunoValida && etapaResponsavelValida && etapaComercialValida;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Comercial · Pré-alunos</h1>
          <p className="text-sm text-zinc-500">
            Cadastre fichas conforme o manual: após o contrato, envie para a secretaria aprovar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void carregar()} isLoading={loading}>
            Atualizar
          </Button>
          {podeCriar && (
            <Button onClick={abrirNovo}>Novo pré-aluno</Button>
          )}
        </div>
      </div>

      <Card className="p-4">
        <label className="text-sm font-medium text-zinc-700">Filtrar por status</label>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className={`mt-1.5 max-w-xs ${SELECT_FIELD}`}
        >
          {FILTROS_STATUS.map((f) => (
            <option key={f.value || "all"} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="mb-2">
          <CardTitle className="text-base">Lista ({lista.length})</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto rounded-lg border border-zinc-100">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3">Pré-aluno</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3">Livro</th>
                <th className="px-4 py-3">Contrato / valor</th>
                <th className="px-4 py-3">Cadastro</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {!loading && lista.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-400">
                    Nenhum pré-aluno encontrado.
                  </td>
                </tr>
              ) : (
                lista.map((row) => {
                  const st = STATUS_META[row.status] ?? STATUS_META["Em negociacao"];
                  const recusa = extrairUltimaRecusaSecretaria(row.observacoesComerciais);
                  const devolvidoSecretaria =
                    row.status === "Em negociacao" && preAlunoTemRecusaSecretaria(row.observacoesComerciais);
                  const badgeVariant =
                    row.status === "Cancelado"
                      ? "danger"
                      : row.status === "Aprovado" || row.status === "Matriculado"
                        ? "success"
                        : devolvidoSecretaria
                          ? "danger"
                          : row.status === "Em negociacao"
                            ? "warning"
                            : "info";
                  return (
                    <Fragment key={row.id}>
                    <tr className={`border-b border-zinc-100 hover:bg-zinc-50/80 ${devolvidoSecretaria ? "bg-red-50/40" : ""}`}>
                      <td className="px-4 py-3 font-medium text-zinc-900">{row.nomeCompletoAluno}</td>
                      <td className="px-4 py-3 text-zinc-700">{row.nomeCompletoResponsavel}</td>
                      <td className="px-4 py-3 text-zinc-600">{row.nomeLivroInteresse}</td>
                      <td className="px-4 py-3 text-zinc-600">
                        <div>{row.tipoContrato}</div>
                        <div className="text-xs text-zinc-500 space-y-0.5">
                          <div>
                            {formatMoney(row.valorMensalidade)} / mensalidade
                            {row.formaPagamento ? <> · pagamento mensalidade: {row.formaPagamento}</> : <> · mensalidade: pgto não informado</>}
                          </div>
                          <div>
                            Matrícula: {formatMoney(row.valorMatricula)} ·                             Livro/material:{" "}
                            {row.valorMaterial == null ? "—" : formatMoney(Number(row.valorMaterial))} · Origem:{" "}
                            {row.origemCaptacao}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">{formatDate(row.dataCadastro)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={badgeVariant}>
                          {devolvidoSecretaria ? "Devolvido pela secretaria" : st.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {row.status === "Em negociacao" && podeEditarOuCriarFicha && (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 px-3 text-xs"
                                onClick={() => void abrirEditar(row)}
                                disabled={carregandoFormulario}
                              >
                                Editar
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 px-3 text-xs"
                                onClick={() => void onSubmeter(row)}
                              >
                                Enviar p/ secretaria
                              </Button>
                            </>
                          )}
                          {row.status !== "Matriculado" && row.status !== "Cancelado" && podeCancelar && (
                            <Button variant="danger" size="sm" className="h-8 px-3 text-xs" onClick={() => void onCancelar(row)}>
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {recusa && (
                      <tr className="border-b border-zinc-100 bg-red-50/60">
                        <td colSpan={7} className="px-4 py-2.5">
                          <p className="text-xs font-semibold text-red-900">
                            Devolvido pela secretaria em {recusa.dataHora} (horário de Brasília)
                          </p>
                          <p className="mt-1 text-sm text-red-800">{recusa.motivo}</p>
                          <p className="mt-1 text-xs text-red-700/80">
                            Corrija os dados com &quot;Editar&quot; e envie novamente quando estiver pronto.
                          </p>
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={modalNovo}
        title={modoModal === "editar" ? "Editar pré-aluno" : "Novo pré-aluno"}
        className="max-w-3xl"
        onClose={fecharModalNovo}
        hasUnsavedChanges={preAlunoModalTemAlteracao}
        closeDisabled={salvando}
        footer={(requestClose) => (
          <>
            {passoCadastro !== "aluno" && (
              <Button
                variant="secondary"
                onClick={voltarEtapa}
                disabled={salvando}
                className="mr-auto"
              >
                ← Voltar
              </Button>
            )}
            <Button variant="ghost" onClick={requestClose} disabled={salvando}>
              Cancelar
            </Button>
            {passoCadastro === "aluno" && (
              <Button onClick={avancarEtapaAluno} disabled={!etapaAlunoValida}>
                Continuar →
              </Button>
            )}
            {passoCadastro === "responsavel" && (
              <Button
                onClick={() => setPassoCadastro("comercial")}
                disabled={!etapaResponsavelValida || (!menorDeIdade && tipoResponsavelAdulto === null)}
              >
                Continuar →
              </Button>
            )}
            {passoCadastro === "comercial" && (
              <Button
                onClick={() => void salvarNovo()}
                disabled={salvando || !podeSalvarTudo}
                isLoading={salvando}
              >
                {modoModal === "editar" ? "Salvar alterações" : "Criar pré-aluno"}
              </Button>
            )}
          </>
        )}
      >
        <div className="space-y-5">
          {motivoRecusaModal && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            >
              <p className="font-semibold">
                Devolvido pela secretaria em {motivoRecusaModal.dataHora} (horário de Brasília)
              </p>
              <p className="mt-1 leading-relaxed">{motivoRecusaModal.motivo}</p>
              <p className="mt-2 text-xs text-red-800/90">
                Ajuste o que foi solicitado abaixo e envie novamente para aprovação quando concluir.
              </p>
            </div>
          )}

          {/* Stepper */}
          <nav aria-label="Etapas do cadastro">
            <ol className="flex items-center">
              {STEPS_PRE_ALUNO.map((step, i) => {
                const ativo = step.id === passoCadastro;
                const concluido = i < indiceEtapaAtual;
                const navegavel = ativo || concluido;
                return (
                  <li key={step.id} className="flex flex-1 items-center last:flex-none">
                    <button
                      type="button"
                      onClick={() => navegarParaEtapa(step.id)}
                      disabled={!navegavel}
                      className="group flex items-center gap-2 disabled:cursor-not-allowed"
                    >
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                          ativo
                            ? "bg-[#1F2A35] text-white shadow-sm ring-4 ring-[#1F2A35]/10"
                            : concluido
                              ? "bg-emerald-500 text-white"
                              : "bg-zinc-100 text-zinc-400"
                        }`}
                      >
                        {concluido ? (
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                            <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7 7a1 1 0 0 1-1.4 0l-3-3a1 1 0 1 1 1.4-1.4L9 11.6l6.3-6.3a1 1 0 0 1 1.4 0z" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span
                        className={`hidden text-sm font-medium sm:inline ${
                          ativo ? "text-zinc-900" : "text-zinc-500"
                        }`}
                      >
                        {step.short}
                      </span>
                    </button>
                    {i < STEPS_PRE_ALUNO.length - 1 && (
                      <span
                        aria-hidden
                        className={`mx-3 h-px flex-1 transition-colors ${
                          concluido ? "bg-emerald-300" : "bg-zinc-200"
                        }`}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

            {passoCadastro === "aluno" && (
              <div className="space-y-5">
                <header>
                  <h3 className="text-base font-semibold text-zinc-900">Dados do pré-aluno</h3>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    Identificação básica. Em seguida você define o responsável financeiro.
                  </p>
                </header>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Nome *"
                    value={formNovo.nome}
                    onChange={(e) => setFormNovo((p) => ({ ...p, nome: e.target.value }))}
                  />
                  <Input
                    label="Sobrenome *"
                    value={formNovo.sobrenome}
                    onChange={(e) => setFormNovo((p) => ({ ...p, sobrenome: e.target.value }))}
                  />
                  <Input
                    label="Data de nascimento *"
                    type="date"
                    value={formNovo.dataNascimento}
                    onChange={(e) => setFormNovo((p) => ({ ...p, dataNascimento: e.target.value }))}
                  />
                  <Input
                    label={maiorOu18 ? "Celular *" : "Celular (opcional)"}
                    helperText={
                      maiorOu18
                        ? "Obrigatório se for o próprio responsável financeiro."
                        : undefined
                    }
                    inputMode="numeric"
                    value={applyBrazilMask("phone", formNovo.telefoneAluno ?? "")}
                    onChange={(e) =>
                      setFormNovo((p) => ({
                        ...p,
                        telefoneAluno: digitsOnly(e.target.value, 11),
                      }))
                    }
                  />
                </div>

                {/* Card idade */}
                <div
                  className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:gap-5 ${
                    idadePreAluno === null
                      ? "border-zinc-200 bg-zinc-50"
                      : idadePreAluno < 18
                        ? "border-amber-200 bg-amber-50"
                        : "border-emerald-200 bg-emerald-50"
                  }`}
                >
                  <div className="flex min-w-[120px] items-baseline gap-2">
                    <span className="text-4xl font-semibold tabular-nums leading-none text-zinc-900">
                      {idadePreAluno ?? "—"}
                    </span>
                    <span className="text-sm text-zinc-600">
                      {idadePreAluno === 1 ? "ano" : "anos"}
                    </span>
                  </div>
                  <div className="flex-1 text-xs leading-relaxed">
                    {!dataReferenciaServidor ? (
                      <p className="text-amber-700">
                        Aguardando data de referência do servidor para calcular a idade…
                      </p>
                    ) : !formNovo.dataNascimento ? (
                      <p className="text-zinc-600">
                        Informe a data de nascimento acima.
                        <span className="ml-1 text-zinc-400">
                          Referência: {formatarDataIsoPtBr(dataReferenciaServidor)}
                        </span>
                      </p>
                    ) : idadePreAluno !== null && idadePreAluno < 18 ? (
                      <>
                        <p className="font-semibold text-amber-900">Menor de idade</p>
                        <p className="text-amber-800">
                          Será obrigatório cadastrar pai, mãe ou tutor como responsável financeiro
                          na próxima etapa.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-emerald-900">Maior de idade</p>
                        <p className="text-emerald-800">
                          Pode ser o próprio responsável financeiro ou indicar outro adulto.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="livro-interesse"
                    className="mb-1 block text-sm font-medium text-zinc-700"
                  >
                    Livro de interesse *
                  </label>
                  <select
                    id="livro-interesse"
                    value={formNovo.livroInteresseId || ""}
                    onChange={(e) =>
                      setFormNovo((p) => ({
                        ...p,
                        livroInteresseId: Number(e.target.value) || 0,
                      }))
                    }
                    className={SELECT_FIELD}
                  >
                    <option value="">Selecione…</option>
                    {livros.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {passoCadastro === "responsavel" && (
              <div className="space-y-5">
                <header>
                  <h3 className="text-base font-semibold text-zinc-900">Responsável financeiro</h3>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {menorDeIdade
                      ? "Pré-aluno menor de idade — cadastre pai, mãe ou tutor."
                      : `Pré-aluno tem ${idadePreAluno} anos. Quem assina e financia o contrato?`}
                  </p>
                </header>

                {/* Seletor segmentado (só maiores) */}
                {maiorOu18 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        id: "proprio" as const,
                        titulo: "Próprio pré-aluno",
                        desc: "Usa o nome do pré-aluno; pediremos CPF e celular.",
                        action: escolherProprioResponsavel,
                      },
                      {
                        id: "outro" as const,
                        titulo: "Outro responsável",
                        desc: "Pessoa física ou jurídica que assina/financia.",
                        action: escolherOutroResponsavel,
                      },
                    ].map((opt) => {
                      const sel = tipoResponsavelAdulto === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={opt.action}
                          className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                            sel
                              ? "border-[#1F2A35] bg-[#1F2A35]/5 shadow-sm"
                              : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                              sel ? "border-[#1F2A35] bg-[#1F2A35]" : "border-zinc-300"
                            }`}
                          >
                            {sel ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                          </span>
                          <span className="flex flex-col">
                            <span className="text-sm font-semibold text-zinc-900">{opt.titulo}</span>
                            <span className="mt-0.5 text-xs text-zinc-500">{opt.desc}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Formulário: próprio pré-aluno */}
                {!menorDeIdade && tipoResponsavelAdulto === "proprio" && (
                  <section className={SECTION_CARD}>
                    <div className={SECTION_HEAD}>
                      <h4 className="text-sm font-semibold text-zinc-800">Dados do próprio responsável</h4>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        Usaremos o nome e celular informados na etapa anterior; só falta o CPF.
                      </p>
                    </div>
                    <div className="grid gap-4 p-4 sm:grid-cols-2">
                      <Input
                        label="CPF do pré-aluno *"
                        inputMode="numeric"
                        value={applyBrazilMask("cpf", formNovo.alunoCpf ?? "")}
                        onChange={(e) =>
                          setFormNovo((p) => ({
                            ...p,
                            alunoCpf: digitsOnly(e.target.value, 11),
                          }))}
                      />
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
                        <p className="font-medium text-zinc-700">Celular</p>
                        <p className="mt-1">
                          Usaremos o celular informado na etapa 1. Volte para ajustar se necessário.
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {/* Formulário: menor de idade OU outro responsável */}
                {(menorDeIdade || tipoResponsavelAdulto === "outro") && (
                  <>
                    <section className={SECTION_CARD}>
                      <div className={SECTION_HEAD}>
                        <h4 className="text-sm font-semibold text-zinc-800">
                          {menorDeIdade ? "Responsável legal" : "Dados do responsável"}
                        </h4>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          Dados mínimos para registrar a negociação. O cadastro oficial é finalizado pela secretaria.
                        </p>
                      </div>
                      <div className="grid gap-4 p-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-zinc-700">Tipo *</label>
                          <select
                            value={formNovo.responsavelTipoPessoa}
                            onChange={(e) =>
                              setFormNovo((p) => ({ ...p, responsavelTipoPessoa: e.target.value }))}
                            className={SELECT_FIELD}
                          >
                            <option value="Fisica">Pessoa física</option>
                            <option value="Juridica">Pessoa jurídica</option>
                          </select>
                        </div>
                        <Input
                          label={`${formNovo.responsavelTipoPessoa === "Fisica" ? "CPF" : "CNPJ"} *`}
                          inputMode="numeric"
                          value={
                            formNovo.responsavelTipoPessoa === "Fisica"
                              ? applyBrazilMask("cpf", formNovo.responsavelCpfCnpj)
                              : applyBrazilMask("cnpj", formNovo.responsavelCpfCnpj)
                          }
                          onChange={(e) =>
                            setFormNovo((p) => ({
                              ...p,
                              responsavelCpfCnpj: digitsOnly(
                                e.target.value,
                                formNovo.responsavelTipoPessoa === "Fisica" ? 11 : 14,
                              ),
                            }))}
                        />
                        <Input
                          label="Nome *"
                          value={formNovo.responsavelNome}
                          onChange={(e) =>
                            setFormNovo((p) => ({ ...p, responsavelNome: e.target.value }))}
                        />
                        <Input
                          label="Sobrenome *"
                          value={formNovo.responsavelSobrenome}
                          onChange={(e) =>
                            setFormNovo((p) => ({ ...p, responsavelSobrenome: e.target.value }))}
                        />
                        <Input
                          label="Telefone / WhatsApp *"
                          inputMode="numeric"
                          className="sm:col-span-2"
                          value={applyBrazilMask("phone", formNovo.responsavelTelefone)}
                          onChange={(e) =>
                            setFormNovo((p) => ({
                              ...p,
                              responsavelTelefone: digitsOnly(e.target.value, 11),
                            }))}
                        />
                      </div>
                    </section>

                    {/* Opcionais colapsável */}
                    <section className={SECTION_CARD}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                        onClick={() => setMostrarOpcionaisResp((v) => !v)}
                      >
                        <div>
                          <h4 className="text-sm font-semibold text-zinc-800">Dados complementares</h4>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            Opcional — secretaria poderá completar depois.
                          </p>
                        </div>
                        <span className="text-xs font-medium text-[#1F2A35]">
                          {mostrarOpcionaisResp ? "Ocultar" : "Expandir"}
                        </span>
                      </button>
                      {mostrarOpcionaisResp && (
                        <div className="grid gap-4 border-t border-zinc-100 p-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-zinc-700">Sexo</label>
                            <select
                              value={formNovo.responsavelSexo ?? ""}
                              onChange={(e) =>
                                setFormNovo((p) => ({ ...p, responsavelSexo: e.target.value }))}
                              className={SELECT_FIELD}
                            >
                              <option value="">Não informado</option>
                              <option value="Masculino">Masculino</option>
                              <option value="Feminino">Feminino</option>
                              <option value="Outro">Outro</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-zinc-700">
                              Grau de parentesco
                            </label>
                            <select
                              value={formNovo.responsavelGrauParentesco ?? ""}
                              onChange={(e) =>
                                setFormNovo((p) => ({
                                  ...p,
                                  responsavelGrauParentesco: e.target.value,
                                }))}
                              className={SELECT_FIELD}
                            >
                              <option value="">Não informado</option>
                              <option value="Pai">Pai</option>
                              <option value="Mae">Mãe</option>
                              <option value="Avo Paterno">Avô paterno</option>
                              <option value="Avo Materno">Avó materna</option>
                              <option value="Tio">Tio</option>
                              <option value="Tia">Tia</option>
                              <option value="Outro">Outro</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-zinc-700">Estado civil</label>
                            <select
                              value={formNovo.responsavelEstadoCivil ?? ""}
                              onChange={(e) =>
                                setFormNovo((p) => ({ ...p, responsavelEstadoCivil: e.target.value }))}
                              className={SELECT_FIELD}
                            >
                              <option value="">Não informado</option>
                              <option value="Solteiro">Solteiro</option>
                              <option value="Casado">Casado</option>
                              <option value="Divorciado">Divorciado</option>
                              <option value="Viuvo">Viúvo</option>
                              <option value="Uniao Estavel">União estável</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-zinc-700">Cor / raça</label>
                            <select
                              value={formNovo.responsavelCorRaca ?? ""}
                              onChange={(e) =>
                                setFormNovo((p) => ({ ...p, responsavelCorRaca: e.target.value }))}
                              className={SELECT_FIELD}
                            >
                              <option value="">Não informado</option>
                              <option value="Branca">Branca</option>
                              <option value="Preta">Preta</option>
                              <option value="Parda">Parda</option>
                              <option value="Amarela">Amarela</option>
                              <option value="Indigena">Indígena</option>
                              <option value="Nao Declarado">Não declarado</option>
                            </select>
                          </div>
                          <Input
                            label="Nacionalidade"
                            value={formNovo.responsavelNacionalidade ?? ""}
                            onChange={(e) =>
                              setFormNovo((p) => ({
                                ...p,
                                responsavelNacionalidade: e.target.value,
                              }))}
                          />
                          <Input
                            label="Data de nascimento"
                            type="date"
                            value={formNovo.responsavelDataNascimento ?? ""}
                            onChange={(e) =>
                              setFormNovo((p) => ({
                                ...p,
                                responsavelDataNascimento: e.target.value,
                              }))}
                          />
                          <Input
                            label="Naturalidade (cidade)"
                            value={formNovo.responsavelNaturalidadeCidade ?? ""}
                            onChange={(e) =>
                              setFormNovo((p) => ({
                                ...p,
                                responsavelNaturalidadeCidade: e.target.value,
                              }))}
                          />
                          <Input
                            label="Naturalidade (UF)"
                            maxLength={2}
                            value={formNovo.responsavelNaturalidadeEstado ?? ""}
                            onChange={(e) =>
                              setFormNovo((p) => ({
                                ...p,
                                responsavelNaturalidadeEstado: e.target.value.toUpperCase(),
                              }))}
                          />
                          <Input
                            label="RG"
                            value={formNovo.responsavelRgNumero ?? ""}
                            onChange={(e) =>
                              setFormNovo((p) => ({ ...p, responsavelRgNumero: e.target.value }))}
                          />
                          <Input
                            label="Expedição RG"
                            type="date"
                            value={formNovo.responsavelRgExpedicao ?? ""}
                            onChange={(e) =>
                              setFormNovo((p) => ({ ...p, responsavelRgExpedicao: e.target.value }))}
                          />
                          <Input
                            label="Órgão emissor RG"
                            value={formNovo.responsavelRgOrgao ?? ""}
                            onChange={(e) =>
                              setFormNovo((p) => ({ ...p, responsavelRgOrgao: e.target.value }))}
                          />
                        </div>
                      )}
                    </section>
                  </>
                )}

                {/* Estado vazio quando maiorOu18 e nada selecionado */}
                {maiorOu18 && tipoResponsavelAdulto === null && (
                  <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center text-sm text-zinc-500">
                    Escolha uma das opções acima para continuar.
                  </p>
                )}
              </div>
            )}

            {passoCadastro === "comercial" && (
              <div className="space-y-5">
                <header>
                  <h3 className="text-base font-semibold text-zinc-900">Contrato e valores</h3>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    Feche a proposta: modelo, valores, captação e transporte.
                  </p>
                </header>

                {/* Mini resumo */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
                  <p className="text-sm font-semibold text-zinc-900">
                    {[formNovo.nome, formNovo.sobrenome].filter(Boolean).join(" ") || "Pré-aluno"}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-600">
                    {idadePreAluno !== null && <span>{idadePreAluno} anos</span>}
                    {livroInteresseNome && <span>· {livroInteresseNome}</span>}
                    <span>· {resumoResponsavelCadastro}</span>
                  </div>
                </div>

                {/* Modelo de contrato */}
                <section className={SECTION_CARD}>
                  <div className={SECTION_HEAD}>
                    <h4 className="text-sm font-semibold text-zinc-800">Modelo de contrato</h4>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      O nome do modelo fica na ficha e é usado na geração do contrato.
                    </p>
                  </div>
                  <div className="p-4">
                    {contratoTemplates.length === 0 ? (
                      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        Nenhum modelo cadastrado. Crie em{" "}
                        <a href="/contratos" className="font-medium underline">
                          Contratos
                        </a>{" "}
                        antes de salvar.
                      </p>
                    ) : (
                      <>
                        <select
                          id="template-contrato-pre"
                          value={templateContratoId === "" ? "" : String(templateContratoId)}
                          onChange={(e) =>
                            setTemplateContratoId(e.target.value ? Number(e.target.value) : "")}
                          className={SELECT_FIELD}
                        >
                          <option value="">Escolha um modelo…</option>
                          {contratoTemplates.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.nome}
                              {t.ativo ? " · ativo" : ""}
                              {` · v${t.versao}`}
                            </option>
                          ))}
                        </select>
                        {tipoContratoResolvido && (
                          <p className="mt-2 text-xs text-zinc-500">
                            Será salvo como:{" "}
                            <span className="font-medium text-zinc-700">{tipoContratoResolvido}</span>
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </section>

                {/* Valores */}
                <section className={SECTION_CARD}>
                  <div className={SECTION_HEAD}>
                    <h4 className="text-sm font-semibold text-zinc-800">Valores da negociação</h4>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Mensalidade obrigatória; material e matrícula conforme proposta.
                    </p>
                  </div>
                  <div className="space-y-5 p-4">
                    <div>
                      <p className={SUBSECTION_LABEL}>Mensalidade</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                          label="Valor (R$) *"
                          type="number"
                          min={0}
                          step="0.01"
                          value={formNovo.valorMensalidade || ""}
                          onChange={(e) =>
                            setFormNovo((p) => ({
                              ...p,
                              valorMensalidade: Number(e.target.value.replace(",", ".")) || 0,
                            }))}
                        />
                        <div>
                          <label className="mb-1 block text-sm font-medium text-zinc-700">
                            Forma de pagamento{" "}
                            <span className="font-normal text-zinc-500">(opcional)</span>
                          </label>
                          <select
                            value={formNovo.formaPagamento ?? ""}
                            onChange={(e) =>
                              setFormNovo((p) => ({ ...p, formaPagamento: e.target.value }))}
                            className={SELECT_FIELD}
                          >
                            <option value="">Não informar</option>
                            {FORMAS_PAGAMENTO_OPCOES.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-zinc-100 pt-4">
                      <p className={SUBSECTION_LABEL}>Material / livro</p>
                      <Input
                        label="Valor cobrado (R$)"
                        helperText="Use 0 se for gratuito ou não houver cobrança."
                        type="number"
                        min={0}
                        step="0.01"
                        value={formNovo.valorMaterial ?? ""}
                        onChange={(e) =>
                          setFormNovo((p) => ({
                            ...p,
                            valorMaterial:
                              e.target.value === ""
                                ? 0
                                : Math.max(0, Number(e.target.value.replace(",", "."))),
                          }))}
                      />
                    </div>

                    <div className="border-t border-zinc-100 pt-4">
                      <p className={SUBSECTION_LABEL}>Matrícula</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                          label="Valor (R$)"
                          type="number"
                          min={0}
                          step="0.01"
                          value={formNovo.valorMatricula ?? ""}
                          onChange={(e) =>
                            setFormNovo((p) => ({
                              ...p,
                              valorMatricula:
                                e.target.value === ""
                                  ? 0
                                  : Math.max(0, Number(e.target.value.replace(",", "."))),
                            }))}
                        />
                        <div>
                          <label className="mb-1 block text-sm font-medium text-zinc-700">
                            Forma de pagamento
                            {Number(formNovo.valorMatricula) > 0 && (
                              <span className="text-red-600"> *</span>
                            )}
                          </label>
                          <select
                            value={formNovo.formaPagamentoMatricula ?? ""}
                            onChange={(e) =>
                              setFormNovo((p) => ({
                                ...p,
                                formaPagamentoMatricula: e.target.value,
                              }))}
                            disabled={!(Number(formNovo.valorMatricula) > 0)}
                            className={SELECT_FIELD}
                          >
                            <option value="">
                              {Number(formNovo.valorMatricula) > 0
                                ? "Selecione a forma de pagamento"
                                : "Só necessário se houver valor"}
                            </option>
                            {FORMAS_PAGAMENTO_OPCOES.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {(formNovo.valorMensalidade > 0
                      || (formNovo.valorMaterial ?? 0) > 0
                      || formNovo.valorMatricula > 0) && (
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700">
                        <span className="font-medium text-zinc-800">Resumo: </span>
                        Mensalidade {formatMoney(formNovo.valorMensalidade)}
                        {formNovo.formaPagamento ? ` (${formNovo.formaPagamento})` : ""}
                        {" · "}
                        Material{" "}
                        {(formNovo.valorMaterial ?? 0) > 0
                          ? formatMoney(formNovo.valorMaterial ?? 0)
                          : "grátis"}
                        {" · "}
                        Matrícula{" "}
                        {formNovo.valorMatricula > 0
                          ? formatMoney(formNovo.valorMatricula)
                          : "sem cobrança"}
                      </div>
                    )}
                  </div>
                </section>

                {/* Captação */}
                <section className={SECTION_CARD}>
                  <div className={SECTION_HEAD}>
                    <h4 className="text-sm font-semibold text-zinc-800">Captação</h4>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Como esse interessado chegou até a escola.
                    </p>
                  </div>
                  <div className="p-4">
                    <select
                      value={formNovo.origemCaptacao}
                      onChange={(e) =>
                        setFormNovo((p) => ({ ...p, origemCaptacao: e.target.value }))}
                      className={SELECT_FIELD}
                    >
                      <option value="">Selecione a origem…</option>
                      {ORIGEM_CAPTACAO_OPCOES.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                </section>

                {/* Transporte */}
                <section className={SECTION_CARD}>
                  <div className={SECTION_HEAD}>
                    <h4 className="text-sm font-semibold text-zinc-800">Transporte escolar</h4>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Van escolar — endereço só se for utilizar.
                    </p>
                  </div>
                  <div className="space-y-4 p-4">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {[
                        { id: "nao", titulo: "Não utiliza" },
                        { id: "sim", titulo: "Sim, utilizará van" },
                      ].map((opt) => {
                        const sel =
                          (opt.id === "sim" && formNovo.usaTransporteVan)
                          || (opt.id === "nao" && !formNovo.usaTransporteVan);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              const sim = opt.id === "sim";
                              setFormNovo((p) => ({
                                ...p,
                                usaTransporteVan: sim,
                                ...(sim
                                  ? {}
                                  : {
                                      transporteCep: "",
                                      transporteLogradouro: "",
                                      transporteNumero: "",
                                      transporteComplemento: "",
                                      transporteBairro: "",
                                      transporteCidade: "",
                                      transporteUf: "",
                                    }),
                              }));
                            }}
                            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                              sel
                                ? "border-[#1F2A35] bg-[#1F2A35] text-white"
                                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                            }`}
                          >
                            {opt.titulo}
                          </button>
                        );
                      })}
                    </div>

                    {formNovo.usaTransporteVan && (
                      <div className="grid gap-4 border-t border-zinc-100 pt-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-2 sm:col-span-2">
                          <label className="text-sm font-medium text-zinc-700">CEP *</label>
                          <div className="flex flex-wrap gap-2">
                            <input
                              className={SELECT_FIELD.replace(" w-full ", " min-w-[140px] flex-1 ")}
                              inputMode="numeric"
                              placeholder="00000-000"
                              value={applyBrazilMask("cep", formNovo.transporteCep ?? "")}
                              onChange={(e) =>
                                setFormNovo((p) => ({
                                  ...p,
                                  transporteCep: digitsOnly(e.target.value, 8),
                                }))}
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => void buscarCepTransporteVan()}
                              disabled={
                                digitsOnly(formNovo.transporteCep ?? "").length !== 8
                                || cepVanBuscando
                              }
                              isLoading={cepVanBuscando}
                            >
                              Buscar CEP
                            </Button>
                          </div>
                        </div>
                        <Input
                          label="Logradouro *"
                          value={formNovo.transporteLogradouro ?? ""}
                          onChange={(e) =>
                            setFormNovo((p) => ({ ...p, transporteLogradouro: e.target.value }))}
                        />
                        <Input
                          label="Número *"
                          value={formNovo.transporteNumero ?? ""}
                          onChange={(e) =>
                            setFormNovo((p) => ({ ...p, transporteNumero: e.target.value }))}
                        />
                        <Input
                          label="Complemento"
                          value={formNovo.transporteComplemento ?? ""}
                          onChange={(e) =>
                            setFormNovo((p) => ({ ...p, transporteComplemento: e.target.value }))}
                        />
                        <Input
                          label="Bairro *"
                          value={formNovo.transporteBairro ?? ""}
                          onChange={(e) =>
                            setFormNovo((p) => ({ ...p, transporteBairro: e.target.value }))}
                        />
                        <Input
                          label="Cidade *"
                          value={formNovo.transporteCidade ?? ""}
                          onChange={(e) =>
                            setFormNovo((p) => ({ ...p, transporteCidade: e.target.value }))}
                        />
                        <Input
                          label="UF *"
                          inputMode="text"
                          maxLength={2}
                          value={(formNovo.transporteUf ?? "").slice(0, 2)}
                          onChange={(e) =>
                            setFormNovo((p) => ({
                              ...p,
                              transporteUf: e.target.value.toUpperCase(),
                            }))}
                        />
                      </div>
                    )}
                  </div>
                </section>

                {/* Observações */}
                <section className={SECTION_CARD}>
                  <div className={SECTION_HEAD}>
                    <h4 className="text-sm font-semibold text-zinc-800">Observações</h4>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Detalhes da negociação, condições especiais, etc.
                    </p>
                  </div>
                  <div className="p-4">
                    <textarea
                      value={formNovo.observacoesComerciais ?? ""}
                      onChange={(e) =>
                        setFormNovo((p) => ({
                          ...p,
                          observacoesComerciais: e.target.value,
                        }))}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/15"
                      placeholder='Ex.: desconto combinado, indicação de quem indicou em "Outro", horário preferencial…'
                    />
                  </div>
                </section>
              </div>
            )}
        </div>
      </Modal>

      <Modal
        open={preAlunoSubmeter !== null}
        onClose={() => !submetendo && setPreAlunoSubmeter(null)}
        title={
          preAlunoSubmeter
            ? `Enviar para secretaria — ${preAlunoSubmeter.nomeCompletoAluno}`
            : "Enviar para secretaria"
        }
        closeDisabled={submetendo}
        footer={(requestClose) => (
          <>
            <Button type="button" variant="secondary" onClick={requestClose} disabled={submetendo}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void confirmarSubmissao()} isLoading={submetendo}>
              Enviar para secretaria
            </Button>
          </>
        )}
      >
        {preAlunoSubmeter && (
          <div className="space-y-4 text-zinc-900">
            <p className="text-sm font-medium text-zinc-800">
              Anexe os documentos disponíveis (opcional) e confirme o envio para análise da secretaria.
            </p>
            <PreAlunoDocumentosUpload preAlunoId={preAlunoSubmeter.id} disabled={submetendo} />
          </div>
        )}
      </Modal>
    </div>
  );
}
