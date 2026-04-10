import { cn } from "@/utils/cn";

interface NavbarProps {
  userName?: string;
  userRole?: string;
  userInitials?: string;
  className?: string;
}

export function Navbar({ userName, userRole, userInitials, className }: NavbarProps) {
  return (
    <header className={cn("h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-6", className)}>
      <div />
      <div className="flex items-center gap-2 text-sm text-zinc-700">
        <div className="w-8 h-8 rounded-full bg-[#1F2A35] flex items-center justify-center text-white text-xs font-semibold shrink-0">
          {userInitials ?? "—"}
        </div>
        <div className="flex flex-col items-end min-w-0">
          <span className="font-medium text-zinc-900 truncate max-w-[200px]">
            {userName ?? "…"}
          </span>
          {userRole && (
            <span className="text-xs text-zinc-500 truncate max-w-[200px]">
              {userRole}
            </span>
          )}
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </header>
  );
}
