"use client";

import { useCallback, useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  atualizarMinhaEscola,
  enviarLogoEscola,
  obterMinhaEscola,
  urlLogoMinhaEscola,
  type MinhaEscolaDto,
} from "@/lib/api/minha-escola";
import { buscarEnderecoPorCep } from "@/lib/viacep";
import { hasPermission } from "@/lib/permissions";
import { applyBrazilMask, digitsOnly } from "@/utils";
import type { User } from "@/lib/api/types";
import { Button } from "@/components/ui/button";

const INPUT =
  "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none focus:border-[#1F2A35] focus:ring-2 focus:ring-[#1F2A35]/20 disabled:cursor-not-allowed disabled:bg-zinc-100";

type FormState = {
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

function dtoParaForm(d: MinhaEscolaDto): FormState {
  return {
    nomeFantasia: d.nomeFantasia ?? "",
    razaoSocial: d.razaoSocial ?? "",
    cnpj: d.cnpj ? applyBrazilMask("cnpj", d.cnpj) : "",
    cep: d.cep ? applyBrazilMask("cep", d.cep) : "",
    logradouro: d.logradouro ?? "",
    numero: d.numero ?? "",
    complemento: d.complemento ?? "",
    bairro: d.bairro ?? "",
    cidade: d.cidade ?? "",
    uf: d.uf ?? "",
  };
}

export function DadosEscolaPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>({
    nomeFantasia: "",
    razaoSocial: "",
    cnpj: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
  });
  const [temLogo, setTemLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const podeEditar = user ? hasPermission(user, "GERENCIAR_CONFIGURACOES_SISTEMA") : false;

  const carregarLogo = useCallback(async (tem: boolean) => {
    if (!tem) {
      setLogoPreview(null);
      return;
    }
    try {
      const res = await fetch(urlLogoMinhaEscola(), { credentials: "include" });
      if (!res.ok) {
        setLogoPreview(null);
        return;
      }
      const blob = await res.blob();
      setLogoPreview(URL.createObjectURL(blob));
    } catch {
      setLogoPreview(null);
    }
  }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await obterMinhaEscola();
      setForm(dtoParaForm(data));
      setTemLogo(data.temLogo);
      await carregarLogo(data.temLogo);
    } catch (e) {
      setErro(getApiErrorMessage(e, "Não foi possível carregar os dados da escola."));
    } finally {
      setLoading(false);
    }
  }, [carregarLogo]);

  useEffect(() => {
    void getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    void carregar();
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [carregar]); // eslint-disable-line react-hooks/exhaustive-deps

  function setCampo<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function buscarCep() {
    const cep = digitsOnly(form.cep);
    if (cep.length !== 8) {
      setErro("Informe um CEP válido com 8 dígitos.");
      return;
    }
    setBuscandoCep(true);
    setErro(null);
    try {
      const end = await buscarEnderecoPorCep(cep);
      setForm((f) => ({
        ...f,
        logradouro: end.logradouro || f.logradouro,
        bairro: end.bairro || f.bairro,
        cidade: end.municipio || f.cidade,
        uf: end.uf || f.uf,
      }));
    } catch {
      setErro("Não foi possível buscar o CEP.");
    } finally {
      setBuscandoCep(false);
    }
  }

  async function salvar() {
    if (!podeEditar) return;
    setSalvando(true);
    setErro(null);
    setSucesso(false);
    try {
      const payload = {
        nomeFantasia: form.nomeFantasia.trim(),
        razaoSocial: form.razaoSocial.trim() || undefined,
        cnpj: digitsOnly(form.cnpj) || undefined,
        cep: digitsOnly(form.cep) || undefined,
        logradouro: form.logradouro.trim() || undefined,
        numero: form.numero.trim() || undefined,
        complemento: form.complemento.trim() || undefined,
        bairro: form.bairro.trim() || undefined,
        cidade: form.cidade.trim() || undefined,
        uf: form.uf.trim().toUpperCase() || undefined,
      };
      const atualizado = await atualizarMinhaEscola(payload);
      setForm(dtoParaForm(atualizado));
      setSucesso(true);
    } catch (e) {
      setErro(getApiErrorMessage(e, "Não foi possível salvar."));
    } finally {
      setSalvando(false);
    }
  }

  async function onLogoChange(file: File | null) {
    if (!file || !podeEditar) return;
    setEnviandoLogo(true);
    setErro(null);
    try {
      await enviarLogoEscola(file);
      setTemLogo(true);
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      setLogoPreview(URL.createObjectURL(file));
      setSucesso(true);
    } catch (e) {
      setErro(getApiErrorMessage(e, "Não foi possível enviar a logo."));
    } finally {
      setEnviandoLogo(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Carregando dados da escola…</p>;
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      {erro ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{erro}</div> : null}
      {sucesso ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Dados salvos com sucesso.
        </div>
      ) : null}

      <section className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
          {logoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoPreview} alt="Logo da escola" className="h-full w-full object-contain" />
          ) : (
            <span className="px-2 text-center text-xs text-zinc-400">Sem logo</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-zinc-800">Logo da escola</p>
          <p className="text-xs text-zinc-500">JPG, PNG ou WEBP. Máximo 2 MB.</p>
          {podeEditar ? (
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={enviandoLogo}
              onChange={(e) => void onLogoChange(e.target.files?.[0] ?? null)}
              className="text-sm text-zinc-600"
            />
          ) : null}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Nome fantasia *</label>
          <input
            disabled={!podeEditar}
            value={form.nomeFantasia}
            onChange={(e) => setCampo("nomeFantasia", e.target.value)}
            className={INPUT}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Razão social</label>
          <input
            disabled={!podeEditar}
            value={form.razaoSocial}
            onChange={(e) => setCampo("razaoSocial", e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">CNPJ</label>
          <input
            disabled={!podeEditar}
            value={form.cnpj}
            onChange={(e) => setCampo("cnpj", applyBrazilMask("cnpj", e.target.value))}
            className={INPUT}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">CEP</label>
          <div className="flex gap-2">
            <input
              disabled={!podeEditar}
              value={form.cep}
              onChange={(e) => setCampo("cep", applyBrazilMask("cep", e.target.value))}
              className={INPUT}
            />
            {podeEditar ? (
              <Button type="button" variant="secondary" size="sm" isLoading={buscandoCep} onClick={() => void buscarCep()}>
                Buscar
              </Button>
            ) : null}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Logradouro</label>
          <input disabled={!podeEditar} value={form.logradouro} onChange={(e) => setCampo("logradouro", e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Número</label>
          <input disabled={!podeEditar} value={form.numero} onChange={(e) => setCampo("numero", e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Complemento</label>
          <input disabled={!podeEditar} value={form.complemento} onChange={(e) => setCampo("complemento", e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Bairro</label>
          <input disabled={!podeEditar} value={form.bairro} onChange={(e) => setCampo("bairro", e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Cidade</label>
          <input disabled={!podeEditar} value={form.cidade} onChange={(e) => setCampo("cidade", e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">UF</label>
          <input
            disabled={!podeEditar}
            maxLength={2}
            value={form.uf}
            onChange={(e) => setCampo("uf", e.target.value.toUpperCase())}
            className={INPUT}
          />
        </div>
      </div>

      {podeEditar ? (
        <div className="flex justify-end border-t border-zinc-100 pt-4">
          <Button type="button" onClick={() => void salvar()} disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar dados"}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Somente quem tem permissão de gerenciar configurações do sistema pode editar.</p>
      )}
    </div>
  );
}
