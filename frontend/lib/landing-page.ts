import type { User } from "@/lib/api/types";
import type { PermissaoNome } from "@/types/permissao";

type LandingRule = {
  permission: PermissaoNome;
  path: string;
};

/**
 * Prioridade centralizada de landing page para usuários de escola.
 * Para incluir novo módulo, adicione uma linha na ordem desejada.
 */
const SCHOOL_LANDING_PRIORITY: LandingRule[] = [
  { permission: "VISUALIZAR_DASHBOARD_GERAL", path: "/dashboard" },
  { permission: "VISUALIZAR_AULA", path: "/professor" }, // "minhas aulas"
  { permission: "VISUALIZAR_AGENDA_GLOBAL", path: "/agenda" },
  { permission: "VISUALIZAR_MATRICULA", path: "/secretaria" },
  { permission: "VISUALIZAR_PRE_ALUNO", path: "/comercial" },
  { permission: "VISUALIZAR_PARCELA", path: "/financeiro" },
  { permission: "VISUALIZAR_TURMA", path: "/turmas" },
  { permission: "VISUALIZAR_LIVRO", path: "/books" },
  { permission: "VISUALIZAR_CALENDARIO", path: "/calendario" },
  { permission: "VISUALIZAR_USUARIO", path: "/usuarios" },
  { permission: "VISUALIZAR_ALUNO", path: "/alunos" },
  { permission: "VISUALIZAR_REPOSICAO", path: "/reposicoes" },
];

export function resolveSchoolLandingByPermissions(
  permissions: readonly string[] | undefined,
): string {
  const set = new Set(permissions ?? []);
  for (const rule of SCHOOL_LANDING_PRIORITY) {
    if (set.has(rule.permission)) return rule.path;
  }
  return "/unauthorized";
}

export function resolveLandingFromUser(user: User): string {
  if (user.isSuperAdmin) return "/super-admin";
  return resolveSchoolLandingByPermissions(user.permissions);
}

