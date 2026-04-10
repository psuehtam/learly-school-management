"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import { IconLogout } from "@/components/icons";
import type { User } from "@/lib/api/types";
import type { MenuEntry } from "@/lib/menu-config";
import { filterMenu, isGroup } from "@/lib/menu-filter";

interface SidebarProps {
  /** Definição completa do menu (não filtrada). */
  menu: MenuEntry[];
  user: User | null;
  onLogout: () => void;
  /** Cor de fundo da sidebar (escola vs super admin). */
  bgColor?: string;
  /** Slot acima do logo (ex.: badge "Super Admin"). */
  topSlot?: React.ReactNode;
}

export function Sidebar({
  menu,
  user,
  onLogout,
  bgColor = "bg-[#1F2A35]",
  topSlot,
}: SidebarProps) {
  const pathname = usePathname();

  const visibleEntries = user ? filterMenu(menu, user) : [];

  return (
    <aside className={cn("w-56 min-h-screen flex flex-col", bgColor)}>
      <div className="px-5 py-6 border-b border-white/10">
        {topSlot}
        <Image
          src="/images/LogoText.svg"
          alt="Learly"
          width={110}
          height={22}
          style={{ filter: "brightness(0) invert(1)" }}
          className={topSlot ? "mt-3" : ""}
        />
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {visibleEntries.map((entry) => {
          if (isGroup(entry)) {
            return (
              <div key={entry.key} className="mt-3 first:mt-0">
                <span className="px-3 mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/30">
                  {entry.label}
                </span>
                {entry.items.map((item) => (
                  <SidebarLink
                    key={item.key}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                  />
                ))}
              </div>
            );
          }

          return (
            <SidebarLink
              key={entry.key}
              href={entry.href}
              icon={entry.icon}
              label={entry.label}
              isActive={pathname === entry.href || pathname.startsWith(`${entry.href}/`)}
            />
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <IconLogout />
          Sair
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  icon,
  label,
  isActive,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-white/15 text-white"
          : "text-white/60 hover:bg-white/10 hover:text-white",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
