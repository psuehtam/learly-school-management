import type { MenuEntry, MenuGroupConfig, MenuItemConfig } from "@/lib/menu-config";
import type { User } from "@/lib/api/types";

/**
 * Filtra o menu com base nas permissões do usuário.
 *
 * Regras:
 * 1. Item sem permissão correspondente → removido.
 * 2. Grupo cujos itens ficaram todos vazios → grupo removido.
 * 3. Recursivo para menus aninhados.
 */
export function filterMenu(entries: MenuEntry[], user: User): MenuEntry[] {
  const permissions = new Set(user.permissions);
  const result: MenuEntry[] = [];

  for (const entry of entries) {
    if (entry.type === "item") {
      if (permissions.has(entry.permission)) {
        result.push(entry);
      }
    } else {
      const visibleItems = entry.items.filter((item) =>
        permissions.has(item.permission),
      );
      if (visibleItems.length > 0) {
        result.push({ ...entry, items: visibleItems });
      }
    }
  }

  return result;
}

/** Extrai todos os itens visíveis (flatten) após a filtragem. */
export function flattenMenu(entries: MenuEntry[]): MenuItemConfig[] {
  const flat: MenuItemConfig[] = [];
  for (const entry of entries) {
    if (entry.type === "item") {
      flat.push(entry);
    } else {
      flat.push(...entry.items);
    }
  }
  return flat;
}

/**
 * Verifica se um grupo tem conteúdo ou se é um item top-level.
 * Útil para decidir se renderiza separador/label de seção.
 */
export function isGroup(entry: MenuEntry): entry is MenuGroupConfig {
  return entry.type === "group";
}
