"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, useModalRequestClose } from "@/components/ui/modal";
import type { PreAlunoListItem } from "@/types/comercial";
import {
  aprovarMatricula,
  getApiErrorMessage,
  prepararConversaoPreAluno,
  reprovarMatricula,
  urlDocumentoPreAluno,
  type AprovarPreAlunoPayload,
  type PrepararConversaoPreAluno,
  type ResponsavelDadosSugeridos,
} from "@/lib/api";
import { calcularIdadeAnos, dataHojeIsoLocal } from "@/lib/dates";
import { buscarEnderecoPorCep } from "@/lib/viacep";
import { applyBrazilMask, digitsOnly } from "@/utils";

const SELECT =
  "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-900 shadow-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/20";

const CARD = "rounded-xl border border-zinc-200 bg-white p-4";
const SECTION_TITLE = "mb-3 text-sm font-semibold text-zinc-900";

type Etapa = "revisao" | "aluno" | "responsavel" | "complementos";

type FormAceite = {
  sexo: string;
  dataIngresso: string;
  cpf: string;
  telefoneAluno: string;
  cep: string;
  tipoLogradouro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  respNome: string;
  respSobrenome: string;
  respCpf: string;
  respTelefone: string;
  respSexo: string;
  respCep: string;
  respTipoLog: string;
  respLog: string;
  respNumero: string;
  respComplemento: string;
  respBairro: string;
  respMunicipio: string;
  respGrauParentesco: string;
  respEstadoCivil: string;
  respCorRaca: string;
  respNacionalidade: string;
  respDataNascimento: string;
  respNaturalidadeCidade: string;
  respNaturalidadeEstado: string;
  respRgNumero: string;
  respRgExpedicao: string;
  respRgOrgao: string;
  corRaca: string;
  estadoCivil: string;
  profissao: string;
  registroEscolar: string;
  nacionalidade: string;
  dataEntradaPais: string;
  naturalidadeCidade: string;
  naturalidadeEstado: string;
  rgNumero: string;
  rgExpedicao: string;
  rgOrgao: string;
};

function formInicial(resp?: ResponsavelDadosSugeridos | null, prep?: PrepararConversaoPreAluno | null): FormAceite {
  const r = resp;
  return {
    sexo: "Masculino",
    dataIngresso: dataHojeIsoLocal(),
    cpf: prep?.alunoCpfSugerido ? applyBrazilMask("cpf", prep.alunoCpfSugerido) : "",
    telefoneAluno: prep?.telefoneAluno ? applyBrazilMask("phone", prep.telefoneAluno) : "",
    cep: prep?.usaTransporteVan && prep.transporteCep ? applyBrazilMask("cep", prep.transporteCep) : "",
    tipoLogradouro: "Rua",
    logradouro: prep?.usaTransporteVan ? (prep.transporteLogradouro ?? "") : "",
    numero: prep?.usaTransporteVan ? (prep.transporteNumero ?? "") : "",
    complemento: prep?.usaTransporteVan ? (prep.transporteComplemento ?? "") : "",
    bairro: prep?.usaTransporteVan ? (prep.transporteBairro ?? "") : "",
    municipio: prep?.usaTransporteVan ? (prep.transporteCidade ?? "") : "",
    respNome: r?.nome ?? "",
    respSobrenome: r?.sobrenome ?? "",
    respCpf: r?.cpfCnpj ? applyBrazilMask("cpf", r.cpfCnpj) : "",
    respTelefone: r?.telefone ? applyBrazilMask("phone", r.telefone) : "",
    respSexo: r?.sexo ?? "Feminino",
    respCep: r?.cep ? applyBrazilMask("cep", r.cep) : "",
    respTipoLog: r?.tipoLogradouro ?? "Rua",
    respLog: r?.logradouro ?? "",
    respNumero: r?.numero ?? "",
    respComplemento: r?.complemento ?? "",
    respBairro: r?.bairro ?? "",
    respMunicipio: r?.municipio ?? "",
    respGrauParentesco: r?.grauParentesco ?? "",
    respEstadoCivil: r?.estadoCivil ?? "",
    respCorRaca: r?.corRaca ?? "",
    respNacionalidade: r?.nacionalidade ?? "",
    respDataNascimento: r?.dataNascimento ?? "",
    respNaturalidadeCidade: r?.naturalidadeCidade ?? "",
    respNaturalidadeEstado: r?.naturalidadeEstado ?? "",
    respRgNumero: r?.rgNumero ?? "",
    respRgExpedicao: r?.rgExpedicao ?? "",
    respRgOrgao: r?.rgOrgao ?? "",
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
  };
}

type Props = {
  preAluno: PreAlunoListItem | null;
  open: boolean;
  onClose: () => void;
  onAprovado: () => void;
  onReprovado: () => void;
  podeReprovar?: boolean;
};

export function ModalAprovarPreAluno({
  preAluno,
  open,
  onClose,
  onAprovado,
  onReprovado,
  podeReprovar = false,
}: Props) {
  const requestClose = useModalRequestClose();
  const [dados, setDados] = useState<PrepararConversaoPreAluno | null>(null);
  const [etapa, setEtapa] = useState<Etapa>("revisao");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [reprovando, setReprovando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [baseline, setBaseline] = useState("");
  const [motivoReprova, setMotivoReprova] = useState("");
  const [mostrarReprovar, setMostrarReprovar] = useState(false);
  const [buscandoCepAluno, setBuscandoCepAluno] = useState(false);
  const [buscandoCepResp, setBuscandoCepResp] = useState(false);
  const [msgCepAluno, setMsgCepAluno] = useState<string | null>(null);
  const [msgCepResp, setMsgCepResp] = useState<string | null>(null);
  const [form, setForm] = useState<FormAceite>(() => formInicial());

  const patch = (p: Partial<FormAceite>) => setForm((prev) => ({ ...prev, ...p }));

  const eProprio = dados?.eProprioResponsavelSugerido ?? false;
  const idade = dados
    ? calcularIdadeAnos(dados.dataNascimentoAluno, dataHojeIsoLocal())
    : null;
  const menor = idade !== null && idade < 18;
  const temAlteracao = open && baseline !== "" && JSON.stringify(form) !== baseline;

  const etapas = useMemo((): Etapa[] => {
    const list: Etapa[] = ["revisao", "aluno"];
    if (!eProprio) list.push("responsavel");
    list.push("complementos");
    return list;
  }, [eProprio]);

  const indiceEtapa = etapas.indexOf(etapa);

  const carregar = useCallback(async () => {
    if (!preAluno || !open) return;
    setCarregando(true);
    setErro(null);
    setEtapa("revisao");
    setMostrarReprovar(false);
    setMotivoReprova("");
    try {
      const prep = await prepararConversaoPreAluno(preAluno.id);
      setDados(prep);
      const next = formInicial(prep.responsavel, prep);
      setForm(next);
      setBaseline(JSON.stringify(next));
    } catch (e) {
      setErro(getApiErrorMessage(e, "Falha ao carregar dados do pré-aluno."));
      setDados(null);
    } finally {
      setCarregando(false);
    }
  }, [preAluno, open]);

  useEffect(() => {
    if (open) void carregar();
    else {
      setDados(null);
      setBaseline("");
    }
  }, [open, carregar]);

  const buscarCepAluno = async () => {
    setBuscandoCepAluno(true);
    setMsgCepAluno(null);
    try {
      const r = await buscarEnderecoPorCep(form.cep);
      patch({
        cep: r.cepFormatado,
        tipoLogradouro: r.tipoLogradouro,
        logradouro: r.logradouro,
        complemento: r.complemento || form.complemento,
        bairro: r.bairro,
        municipio: r.municipio,
      });
    } catch (e) {
      setMsgCepAluno(e instanceof Error ? e.message : "CEP não encontrado.");
    } finally {
      setBuscandoCepAluno(false);
    }
  };

  const buscarCepResp = async () => {
    setBuscandoCepResp(true);
    setMsgCepResp(null);
    try {
      const r = await buscarEnderecoPorCep(form.respCep);
      patch({
        respCep: r.cepFormatado,
        respTipoLog: r.tipoLogradouro,
        respLog: r.logradouro,
        respBairro: r.bairro,
        respMunicipio: r.municipio,
      });
    } catch (e) {
      setMsgCepResp(e instanceof Error ? e.message : "CEP não encontrado.");
    } finally {
      setBuscandoCepResp(false);
    }
  };

  const validarEtapaAtual = (): string | null => {
    if (etapa === "aluno") {
      if (!form.sexo) return "Informe o sexo do aluno.";
      if (!form.dataIngresso) return "Informe a data de ingresso.";
      if (eProprio && digitsOnly(form.cpf).length !== 11) return "CPF do aluno inválido.";
      if (eProprio && digitsOnly(form.telefoneAluno).length < 10) return "Telefone do aluno é obrigatório.";
      if (digitsOnly(form.cep).length !== 8) return "CEP do aluno inválido.";
      if (!form.logradouro.trim() || !form.numero.trim() || !form.bairro.trim() || !form.municipio.trim()) {
        return "Preencha o endereço do aluno.";
      }
    }
    if (etapa === "responsavel") {
      if (!form.respNome.trim() || !form.respSobrenome.trim()) return "Nome do responsável é obrigatório.";
      if (digitsOnly(form.respCpf).length !== 11) return "CPF do responsável inválido.";
      if (digitsOnly(form.respTelefone).length < 10) return "Telefone do responsável é obrigatório.";
      if (digitsOnly(form.respCep).length !== 8) return "CEP do responsável inválido.";
      if (!form.respLog.trim() || !form.respNumero.trim() || !form.respBairro.trim() || !form.respMunicipio.trim()) {
        return "Preencha o endereço do responsável.";
      }
    }
    return null;
  };

  const avancar = () => {
    const msg = validarEtapaAtual();
    if (msg) {
      setErro(msg);
      return;
    }
    setErro(null);
    if (indiceEtapa < etapas.length - 1) setEtapa(etapas[indiceEtapa + 1]);
  };

  const voltar = () => {
    setErro(null);
    if (indiceEtapa > 0) setEtapa(etapas[indiceEtapa - 1]);
  };

  const onAceitar = async () => {
    if (!preAluno || !dados) return;
    const msg = validarEtapaAtual();
    if (msg) {
      setErro(msg);
      return;
    }

    setSalvando(true);
    setErro(null);
    const payload: AprovarPreAlunoPayload = {
      eProprioResponsavel: eProprio,
      sexo: form.sexo,
      dataIngresso: form.dataIngresso,
      cpf: eProprio ? digitsOnly(form.cpf) : null,
      cep: digitsOnly(form.cep),
      tipoLogradouro: form.tipoLogradouro,
      logradouro: form.logradouro.trim(),
      numero: form.numero.trim(),
      complemento: form.complemento.trim() || null,
      bairro: form.bairro.trim(),
      municipio: form.municipio.trim(),
      alunoTelefone: form.telefoneAluno ? digitsOnly(form.telefoneAluno) : null,
      responsavelNome: eProprio ? null : form.respNome.trim(),
      responsavelSobrenome: eProprio ? null : form.respSobrenome.trim(),
      responsavelCpf: eProprio ? null : digitsOnly(form.respCpf),
      responsavelSexo: eProprio ? null : form.respSexo || null,
      responsavelTelefone: eProprio ? null : digitsOnly(form.respTelefone),
      responsavelCep: eProprio ? null : digitsOnly(form.respCep),
      responsavelTipoLogradouro: eProprio ? null : form.respTipoLog,
      responsavelLogradouro: eProprio ? null : form.respLog.trim(),
      responsavelNumero: eProprio ? null : form.respNumero.trim(),
      responsavelComplemento: eProprio ? null : form.respComplemento.trim() || null,
      responsavelBairro: eProprio ? null : form.respBairro.trim(),
      responsavelMunicipio: eProprio ? null : form.respMunicipio.trim(),
      corRaca: form.corRaca || null,
      estadoCivil: form.estadoCivil || null,
      profissao: form.profissao.trim() || null,
      registroEscolar: form.registroEscolar.trim() || null,
      nacionalidade: form.nacionalidade.trim() || null,
      dataEntradaPais: form.dataEntradaPais || null,
      naturalidadeCidade: form.naturalidadeCidade.trim() || null,
      naturalidadeEstado: form.naturalidadeEstado.trim() || null,
      rgNumero: form.rgNumero.trim() || null,
      rgExpedicao: form.rgExpedicao || null,
      rgOrgao: form.rgOrgao.trim() || null,
    };

    try {
      await aprovarMatricula(preAluno.id, payload);
      onAprovado();
      onClose();
    } catch (e) {
      setErro(getApiErrorMessage(e, "Falha ao dar aceite e matricular aluno."));
    } finally {
      setSalvando(false);
    }
  };

  const onReprovar = async () => {
    if (!preAluno || motivoReprova.trim().length < 3) {
      setErro("Informe o motivo da recusa (mínimo 3 caracteres).");
      return;
    }
    setReprovando(true);
    setErro(null);
    try {
      await reprovarMatricula(preAluno.id, motivoReprova.trim());
      onReprovado();
      onClose();
    } catch (e) {
      setErro(getApiErrorMessage(e, "Falha ao recusar pré-aluno."));
    } finally {
      setReprovando(false);
    }
  };

  if (!open || !preAluno) return null;

  const labelEtapa: Record<Etapa, string> = {
    revisao: "Revisão",
    aluno: "Aluno",
    responsavel: "Responsável",
    complementos: "Complementos",
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Matricular — ${preAluno.nomeCompletoAluno}`}
      className="max-w-3xl"
      hasUnsavedChanges={temAlteracao || motivoReprova.length > 0}
      closeDisabled={salvando || reprovando}
      footer={
        etapa === "revisao" && mostrarReprovar ? (
          <>
            <Button type="button" variant="secondary" onClick={() => setMostrarReprovar(false)} disabled={reprovando}>
              Voltar
            </Button>
            <Button type="button" variant="danger" onClick={() => void onReprovar()} isLoading={reprovando}>
              Confirmar recusa
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="secondary" onClick={requestClose} disabled={salvando || reprovando}>
              Fechar
            </Button>
            {indiceEtapa > 0 && (
              <Button type="button" variant="secondary" onClick={voltar} disabled={salvando}>
                Voltar
              </Button>
            )}
            {etapa !== "complementos" ? (
              <Button type="button" onClick={avancar} disabled={carregando || !dados}>
                Próximo
              </Button>
            ) : (
              <Button type="button" onClick={() => void onAceitar()} isLoading={salvando} disabled={carregando || !dados}>
                Dar aceite e matricular
              </Button>
            )}
          </>
        )
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {etapas.map((e, i) => (
          <Badge key={e} variant={e === etapa ? "info" : "muted"}>
            {i + 1}. {labelEtapa[e]}
          </Badge>
        ))}
      </div>

      {erro && <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">{erro}</p>}
      {carregando && <p className="text-sm font-medium text-zinc-800">Carregando ficha…</p>}

      {dados && etapa === "revisao" && !mostrarReprovar && (
        <div className="space-y-4 text-zinc-900">
          <div className={CARD}>
            <p className={SECTION_TITLE}>Resumo</p>
            <dl className="grid gap-1 text-sm text-zinc-800">
              <div>
                <span className="font-semibold">Aluno:</span> {dados.nomeAluno} {dados.sobrenomeAluno}
                {idade !== null && <span className="text-zinc-600"> ({idade} anos)</span>}
              </div>
              <div>
                <span className="font-semibold">Responsável:</span> {dados.responsavelNomeCompleto}
              </div>
              {dados.responsavel.telefone && (
                <div>
                  <span className="font-semibold">Telefone do responsável:</span>{" "}
                  {applyBrazilMask("phone", dados.responsavel.telefone)}
                </div>
              )}
              <div>
                <span className="font-semibold">Livro:</span> {preAluno.nomeLivroInteresse}
              </div>
            </dl>
          </div>

          <div className={CARD}>
            <p className={SECTION_TITLE}>Documentos</p>
            {dados.documentos.length === 0 ? (
              <p className="text-sm text-zinc-700">Nenhum documento anexado pelo comercial.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {dados.documentos.map((doc) => (
                  <li key={doc.id}>
                    <a
                      href={urlDocumentoPreAluno(preAluno.id, doc.urlDownload)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#1F2A35] underline"
                    >
                      {doc.nomeExibicao}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-sm text-zinc-700">
            Nas próximas etapas você confirma os dados do aluno
            {menor ? " e do responsável" : ""} para criar a matrícula <strong>Em Espera</strong> (sem turma).
          </p>

          {podeReprovar && (
            <Button type="button" variant="danger" className="w-full sm:w-auto" onClick={() => setMostrarReprovar(true)}>
              Recusar pré-aluno
            </Button>
          )}
        </div>
      )}

      {dados && etapa === "revisao" && mostrarReprovar && (
        <div className={`${CARD} space-y-3`}>
          <p className={SECTION_TITLE}>Motivo da recusa</p>
          <p className="text-sm text-zinc-700">O pré-aluno voltará para o comercial (Em negociação) com este motivo registrado.</p>
          <textarea
            className="min-h-[100px] w-full rounded-lg border border-zinc-300 p-3 text-sm font-medium text-zinc-900"
            value={motivoReprova}
            onChange={(e) => setMotivoReprova(e.target.value)}
            placeholder="Descreva o motivo da recusa…"
          />
        </div>
      )}

      {dados && etapa === "aluno" && (
        <div className="space-y-4">
          <div className={CARD}>
            <p className={SECTION_TITLE}>Dados do aluno</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-900">Sexo *</label>
                <select className={SELECT} value={form.sexo} onChange={(e) => patch({ sexo: e.target.value })}>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <Input label="Data de ingresso *" type="date" value={form.dataIngresso} onChange={(e) => patch({ dataIngresso: e.target.value })} />
              {eProprio && (
                <>
                  <Input label="CPF *" value={form.cpf} onChange={(e) => patch({ cpf: applyBrazilMask("cpf", e.target.value) })} />
                  <Input
                    label="Telefone celular *"
                    value={form.telefoneAluno}
                    onChange={(e) => patch({ telefoneAluno: applyBrazilMask("phone", e.target.value) })}
                  />
                </>
              )}
              {!eProprio && (
                <div className="sm:col-span-2">
                  <Input
                    label="Telefone do aluno (opcional)"
                    value={form.telefoneAluno}
                    onChange={(e) => patch({ telefoneAluno: applyBrazilMask("phone", e.target.value) })}
                  />
                </div>
              )}
            </div>
          </div>

          <div className={CARD}>
            <p className={SECTION_TITLE}>Endereço do aluno *</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-sm font-semibold text-zinc-900">CEP</label>
                <div className="flex gap-2">
                  <div className="min-w-0 flex-1">
                    <Input value={form.cep} onChange={(e) => { setMsgCepAluno(null); patch({ cep: applyBrazilMask("cep", e.target.value) }); }} />
                  </div>
                  <Button type="button" variant="secondary" size="sm" className="shrink-0 self-end" isLoading={buscandoCepAluno} onClick={() => void buscarCepAluno()}>
                    Buscar CEP
                  </Button>
                </div>
                {msgCepAluno && <p className="text-xs font-medium text-red-700">{msgCepAluno}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-900">Tipo logradouro</label>
                <select className={SELECT} value={form.tipoLogradouro} onChange={(e) => patch({ tipoLogradouro: e.target.value })}>
                  {["Rua", "Avenida", "Travessa", "Alameda", "Estrada", "Rodovia", "Outro"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <Input label="Número *" value={form.numero} onChange={(e) => patch({ numero: e.target.value })} />
              <div className="sm:col-span-2">
                <Input label="Logradouro *" value={form.logradouro} onChange={(e) => patch({ logradouro: e.target.value })} />
              </div>
              <Input label="Complemento" value={form.complemento} onChange={(e) => patch({ complemento: e.target.value })} />
              <Input label="Bairro *" value={form.bairro} onChange={(e) => patch({ bairro: e.target.value })} />
              <Input label="Município *" value={form.municipio} onChange={(e) => patch({ municipio: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      {dados && etapa === "responsavel" && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-zinc-800">
            Menor de idade — confirme os dados do responsável financeiro cadastrados pelo comercial.
          </p>
          <div className={CARD}>
            <p className={SECTION_TITLE}>Responsável financeiro</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Nome *" value={form.respNome} onChange={(e) => patch({ respNome: e.target.value })} />
              <Input label="Sobrenome *" value={form.respSobrenome} onChange={(e) => patch({ respSobrenome: e.target.value })} />
              <Input label="CPF *" value={form.respCpf} onChange={(e) => patch({ respCpf: applyBrazilMask("cpf", e.target.value) })} />
              <Input
                label="Telefone celular *"
                value={form.respTelefone}
                onChange={(e) => patch({ respTelefone: applyBrazilMask("phone", e.target.value) })}
                helperText="Preenchido automaticamente se informado no cadastro comercial."
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-900">Sexo</label>
                <select className={SELECT} value={form.respSexo} onChange={(e) => patch({ respSexo: e.target.value })}>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>
          </div>

          <div className={CARD}>
            <p className={SECTION_TITLE}>Endereço do responsável *</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-sm font-semibold text-zinc-900">CEP</label>
                <div className="flex gap-2">
                  <div className="min-w-0 flex-1">
                    <Input value={form.respCep} onChange={(e) => { setMsgCepResp(null); patch({ respCep: applyBrazilMask("cep", e.target.value) }); }} />
                  </div>
                  <Button type="button" variant="secondary" size="sm" className="shrink-0 self-end" isLoading={buscandoCepResp} onClick={() => void buscarCepResp()}>
                    Buscar CEP
                  </Button>
                </div>
                {msgCepResp && <p className="text-xs font-medium text-red-700">{msgCepResp}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-900">Tipo logradouro</label>
                <select className={SELECT} value={form.respTipoLog} onChange={(e) => patch({ respTipoLog: e.target.value })}>
                  {["Rua", "Avenida", "Travessa", "Alameda", "Estrada", "Rodovia", "Outro"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <Input label="Número *" value={form.respNumero} onChange={(e) => patch({ respNumero: e.target.value })} />
              <div className="sm:col-span-2">
                <Input label="Logradouro *" value={form.respLog} onChange={(e) => patch({ respLog: e.target.value })} />
              </div>
              <Input label="Complemento" value={form.respComplemento} onChange={(e) => patch({ respComplemento: e.target.value })} />
              <Input label="Bairro *" value={form.respBairro} onChange={(e) => patch({ respBairro: e.target.value })} />
              <Input label="Município *" value={form.respMunicipio} onChange={(e) => patch({ respMunicipio: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      {dados && etapa === "complementos" && (
        <div className="space-y-4">
          <div className={CARD}>
            <p className={SECTION_TITLE}>Dados complementares do aluno (opcional)</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-900">Cor / raça</label>
                <select className={SELECT} value={form.corRaca} onChange={(e) => patch({ corRaca: e.target.value })}>
                  <option value="">Não informado</option>
                  <option value="Branca">Branca</option>
                  <option value="Preta">Preta</option>
                  <option value="Parda">Parda</option>
                  <option value="Amarela">Amarela</option>
                  <option value="Indigena">Indígena</option>
                  <option value="Nao Declarado">Não declarado</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-900">Estado civil</label>
                <select className={SELECT} value={form.estadoCivil} onChange={(e) => patch({ estadoCivil: e.target.value })}>
                  <option value="">Não informado</option>
                  <option value="Solteiro">Solteiro</option>
                  <option value="Casado">Casado</option>
                  <option value="Divorciado">Divorciado</option>
                  <option value="Viuvo">Viúvo</option>
                  <option value="Uniao Estavel">União estável</option>
                </select>
              </div>
              <Input label="Profissão" value={form.profissao} onChange={(e) => patch({ profissao: e.target.value })} />
              <Input label="Registro escolar" value={form.registroEscolar} onChange={(e) => patch({ registroEscolar: e.target.value })} />
              <Input label="Nacionalidade" value={form.nacionalidade} onChange={(e) => patch({ nacionalidade: e.target.value })} />
              <Input label="Data entrada no país" type="date" value={form.dataEntradaPais} onChange={(e) => patch({ dataEntradaPais: e.target.value })} />
              <Input label="Naturalidade (cidade)" value={form.naturalidadeCidade} onChange={(e) => patch({ naturalidadeCidade: e.target.value })} />
              <Input label="Naturalidade (UF)" maxLength={2} value={form.naturalidadeEstado} onChange={(e) => patch({ naturalidadeEstado: e.target.value.toUpperCase() })} />
              <Input label="RG" value={form.rgNumero} onChange={(e) => patch({ rgNumero: e.target.value })} />
              <Input label="Expedição RG" type="date" value={form.rgExpedicao} onChange={(e) => patch({ rgExpedicao: e.target.value })} />
              <Input label="Órgão emissor RG" value={form.rgOrgao} onChange={(e) => patch({ rgOrgao: e.target.value })} />
              {!eProprio && (
                <div className="sm:col-span-2">
                  <Input
                    label="CPF do aluno (opcional)"
                    value={form.cpf}
                    onChange={(e) => patch({ cpf: applyBrazilMask("cpf", e.target.value) })}
                  />
                </div>
              )}
            </div>
          </div>

          {!eProprio && (
            <div className={CARD}>
              <p className={SECTION_TITLE}>Dados complementares do responsável (opcional)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-zinc-900">Grau de parentesco</label>
                  <select className={SELECT} value={form.respGrauParentesco} onChange={(e) => patch({ respGrauParentesco: e.target.value })}>
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
                <Input label="Data de nascimento" type="date" value={form.respDataNascimento} onChange={(e) => patch({ respDataNascimento: e.target.value })} />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-zinc-900">Estado civil</label>
                  <select className={SELECT} value={form.respEstadoCivil} onChange={(e) => patch({ respEstadoCivil: e.target.value })}>
                    <option value="">Não informado</option>
                    <option value="Solteiro">Solteiro</option>
                    <option value="Casado">Casado</option>
                    <option value="Divorciado">Divorciado</option>
                    <option value="Viuvo">Viúvo</option>
                    <option value="Uniao Estavel">União estável</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-zinc-900">Cor / raça</label>
                  <select className={SELECT} value={form.respCorRaca} onChange={(e) => patch({ respCorRaca: e.target.value })}>
                    <option value="">Não informado</option>
                    <option value="Branca">Branca</option>
                    <option value="Preta">Preta</option>
                    <option value="Parda">Parda</option>
                    <option value="Amarela">Amarela</option>
                    <option value="Indigena">Indígena</option>
                    <option value="Nao Declarado">Não declarado</option>
                  </select>
                </div>
                <Input label="Nacionalidade" value={form.respNacionalidade} onChange={(e) => patch({ respNacionalidade: e.target.value })} />
                <Input label="Naturalidade (cidade)" value={form.respNaturalidadeCidade} onChange={(e) => patch({ respNaturalidadeCidade: e.target.value })} />
                <Input label="Naturalidade (UF)" maxLength={2} value={form.respNaturalidadeEstado} onChange={(e) => patch({ respNaturalidadeEstado: e.target.value.toUpperCase() })} />
                <Input label="RG" value={form.respRgNumero} onChange={(e) => patch({ respRgNumero: e.target.value })} />
                <Input label="Expedição RG" type="date" value={form.respRgExpedicao} onChange={(e) => patch({ respRgExpedicao: e.target.value })} />
                <Input label="Órgão emissor RG" value={form.respRgOrgao} onChange={(e) => patch({ respRgOrgao: e.target.value })} />
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
