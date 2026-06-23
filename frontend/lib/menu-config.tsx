import type { ReactNode } from "react";
import type { PermissaoNome } from "@/types/permissao";
import {
  IconDashboard,
  IconTrendingUp,
  IconCalendar,
  IconUsers,
  IconFile,
  IconClock,
  IconBook,
  IconDollar,
  IconSettings,
  IconBuilding,
  IconContracts,
} from "@/components/icons";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type MenuItemConfig = {
  type: "item";
  key: string;
  label: string;
  href: string;
  icon: ReactNode;
  /**
   * Permissão(ões) para exibir o item e acessar a rota.
   * Se for um array, basta o usuário ter uma delas (OR).
   */
  permission: PermissaoNome | PermissaoNome[];
};

/** Lista de permissões exigidas pelo item (uma ou várias, OR na filtragem). */
export function itemRequiredPermissions(permission: PermissaoNome | PermissaoNome[]): PermissaoNome[] {
  return Array.isArray(permission) ? permission : [permission];
}

export type MenuGroupConfig = {
  type: "group";
  key: string;
  label: string;
  items: MenuItemConfig[];
};

export type MenuEntry = MenuItemConfig | MenuGroupConfig;

// ─── Menu da Escola (fonte única de verdade) ──────────────────────────────────
//
// Um único array define TODOS os itens. Não existe lista separada por cargo.
// O que cada usuário vê depende exclusivamente de suas permissões.
// Grupos sem itens visíveis são removidos automaticamente pela filtragem.

export const SCHOOL_MENU: MenuEntry[] = [
  {
    type: "item",
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: <IconDashboard />,
    permission: "VISUALIZAR_DASHBOARD_GERAL",
  },

  {
    type: "group",
    key: "comercial",
    label: "Comercial",
    items: [
      {
        type: "item",
        key: "comercial-pre-alunos",
        label: "Pré-alunos",
        href: "/comercial",
        icon: <IconTrendingUp />,
        permission: "VISUALIZAR_PRE_ALUNO",
      },
      {
        type: "item",
        key: "comercial-contratos",
        label: "Contratos",
        href: "/contratos",
        icon: <IconContracts />,
        permission: ["VISUALIZAR_TEMPLATE_CONTRATO", "VISUALIZAR_CONTRATO", "GERAR_CONTRATO"],
      },
    ],
  },

  {
    type: "group",
    key: "academico",
    label: "Acadêmico",
    items: [
      {
        type: "item",
        key: "turmas",
        label: "Turmas",
        href: "/turmas",
        icon: <IconUsers />,
        permission: "VISUALIZAR_TURMA",
      },
      {
        type: "item",
        key: "professor",
        label: "Minha Agenda",
        href: "/professor",
        icon: <IconCalendar />,
        permission: "VISUALIZAR_AULA",
      },
      {
        type: "item",
        key: "reposicoes",
        label: "Reposições",
        href: "/reposicoes",
        icon: <IconClock />,
        permission: "VISUALIZAR_REPOSICAO",
      },
      {
        type: "item",
        key: "livros",
        label: "Livros",
        href: "/books",
        icon: <IconBook />,
        permission: "VISUALIZAR_LIVRO",
      },
    ],
  },

  {
    type: "group",
    key: "secretaria",
    label: "Secretaria",
    items: [
      {
        type: "item",
        key: "secretaria-matriculas",
        label: "Matrículas",
        href: "/secretaria",
        icon: <IconFile />,
        permission: "VISUALIZAR_MATRICULA",
      },
    ],
  },

  {
    type: "group",
    key: "agenda",
    label: "Agenda",
    items: [
      {
        type: "item",
        key: "agenda-global",
        label: "Agenda Global",
        href: "/agenda",
        icon: <IconCalendar />,
        permission: "VISUALIZAR_AGENDA_GLOBAL",
      },
      {
        type: "item",
        key: "calendario",
        label: "Calendário",
        href: "/calendario",
        icon: <IconCalendar />,
        permission: "GERENCIAR_CALENDARIO",
      },
      {
        type: "item",
        key: "compromissos",
        label: "Compromissos",
        href: "/compromissos",
        icon: <IconClock />,
        permission: "VISUALIZAR_COMPROMISSOS",
      },
    ],
  },

  {
    type: "group",
    key: "financeiro",
    label: "Financeiro",
    items: [
      {
        type: "item",
        key: "financeiro-parcelas",
        label: "Financeiro",
        href: "/financeiro",
        icon: <IconDollar />,
        permission: "VISUALIZAR_PARCELA",
      },
    ],
  },

  {
    type: "group",
    key: "administracao",
    label: "Administração",
    items: [
      {
        type: "item",
        key: "usuarios",
        label: "Usuários",
        href: "/usuarios",
        icon: <IconSettings />,
        permission: "VISUALIZAR_USUARIO",
      },
      {
        type: "item",
        key: "horarios-funcionamento",
        label: "Horário de funcionamento",
        href: "/horarios-funcionamento",
        icon: <IconClock />,
        permission: ["VISUALIZAR_USUARIO", "GERENCIAR_CONFIGURACOES_SISTEMA"],
      },
      {
        type: "item",
        key: "configuracoes-sistema",
        label: "Configuração do sistema",
        href: "/configuracoes-sistema",
        icon: <IconSettings />,
        permission: ["VISUALIZAR_USUARIO", "GERENCIAR_CONFIGURACOES_SISTEMA"],
      },
      {
        type: "item",
        key: "dados-escola",
        label: "Dados da escola",
        href: "/dados-escola",
        icon: <IconBuilding />,
        permission: ["VISUALIZAR_USUARIO", "GERENCIAR_CONFIGURACOES_SISTEMA"],
      },
    ],
  },
];

// ─── Menu do Super Admin ──────────────────────────────────────────────────────

export const SUPER_ADMIN_MENU: MenuEntry[] = [
  {
    type: "item",
    key: "escolas",
    label: "Escolas",
    href: "/super-admin/escolas",
    icon: <IconBuilding />,
    permission: "VISUALIZAR_ESCOLAS",
  },
  {
    type: "item",
    key: "templates-permissoes",
    label: "Templates de permissões",
    href: "/super-admin/templates",
    icon: <IconSettings />,
    permission: "VISUALIZAR_ESCOLAS",
  },
];

// ─── Extração de permissões por rota (para route-access.ts) ───────────────────

function collectItems(entries: MenuEntry[]): MenuItemConfig[] {
  const items: MenuItemConfig[] = [];
  for (const entry of entries) {
    if (entry.type === "item") {
      items.push(entry);
    } else {
      items.push(...entry.items);
    }
  }
  return items;
}

/**
 * Gera um mapa rota→permissões a partir do menu.
 * Fonte única: o menu define as permissões de visualização das rotas.
 */
export function buildRoutePermissions(
  entries: MenuEntry[],
): Record<string, PermissaoNome[]> {
  const map: Record<string, PermissaoNome[]> = {};
  for (const item of collectItems(entries)) {
    map[item.href] = itemRequiredPermissions(item.permission);
  }
  return map;
}
