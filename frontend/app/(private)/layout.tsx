import type { ReactNode } from "react";
import { SessionGate } from "./session-gate";

/**
 * Camada base de todas as rotas do grupo `(private)`.
 * {@link SessionGate} valida o JWT no backend (GET /api/me) antes de exibir o app.
 */
export default function PrivateLayout({ children }: { children: ReactNode }) {
  return <SessionGate>{children}</SessionGate>;
}
