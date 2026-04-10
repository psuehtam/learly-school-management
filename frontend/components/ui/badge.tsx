import { cn } from "@/utils/cn";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-zinc-100 text-zinc-700",
  success: "bg-green-50 text-green-700",
  warning: "bg-yellow-50 text-yellow-700",
  danger:  "bg-red-50 text-red-700",
  info:    "bg-blue-50 text-blue-700",
  muted:   "bg-zinc-50 text-zinc-500",
};

const statusMap: Record<string, BadgeVariant> = {
  Ativo: "success",
  Pago: "success",
  Realizada: "success",
  Aprovado: "success",
  Matriculado: "success",
  Concluida: "success",
  "Em Andamento": "info",
  "Em negociacao": "info",
  "Aguardando aprovacao": "info",
  Agendada: "info",
  Pendente: "warning",
  "Em Espera": "warning",
  Vencido: "danger",
  Cancelado: "danger",
  Cancelada: "danger",
  Estornado: "danger",
  Inativo: "muted",
  Inativa: "muted",
  Trancado: "muted",
};

export function Badge({ children, variant, className }: BadgeProps) {
  const label = typeof children === "string" ? children : "";
  const resolved = variant ?? statusMap[label] ?? "default";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full",
        variantStyles[resolved],
        className,
      )}
    >
      {children}
    </span>
  );
}
