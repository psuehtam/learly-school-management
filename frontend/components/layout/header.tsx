import { cn } from "@/utils/cn";

interface HeaderProps {
  title?: string;
  breadcrumb?: string[];
  className?: string;
}

export function PageHeader({ title, breadcrumb, className }: HeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="text-xs text-zinc-400 mb-1">
          {breadcrumb.map((item, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-1">/</span>}
              {item}
            </span>
          ))}
        </nav>
      )}
      {title && <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>}
    </div>
  );
}
