"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { cn } from "@/utils/cn";

const ModalRequestCloseContext = createContext<(() => void) | null>(null);

/** Use dentro do conteúdo/rodapé do mesmo `<Modal>` para o mesmo comportamento de “sair com confirmação”. */
export function useModalRequestClose(): () => void {
  const ctx = useContext(ModalRequestCloseContext);
  return ctx ?? (() => {});
}

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Pode ser nó estático ou função que recebe `requestClose` (com confirmação se `hasUnsavedChanges`). */
  footer?: ReactNode | ((requestClose: () => void) => ReactNode);
  className?: string;
  /** Se true, overlay, ESC, botão X e `requestClose` pedem confirmação antes de chamar `onClose`. */
  hasUnsavedChanges?: boolean;
  /** Confirma ao clicar fora, ESC ou X (padrão: sim). */
  confirmBeforeClose?: boolean;
  confirmDiscardMessage?: string;
  confirmCloseMessage?: string;
  /** Impede qualquer fechamento (ex.: salvando). */
  closeDisabled?: boolean;
};

const DEFAULT_DISCARD_CONFIRM =
  "Deseja sair sem salvar? As informações não salvas serão perdidas.";

const DEFAULT_CLOSE_CONFIRM = "Deseja fechar esta janela?";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
  hasUnsavedChanges = false,
  confirmBeforeClose = true,
  confirmDiscardMessage,
  confirmCloseMessage,
  closeDisabled = false,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const tryClose = useCallback(() => {
    if (closeDisabled) return;

    const deveConfirmar = confirmBeforeClose || hasUnsavedChanges;
    if (!deveConfirmar) {
      onClose();
      return;
    }

    const msg = hasUnsavedChanges
      ? (confirmDiscardMessage ?? DEFAULT_DISCARD_CONFIRM)
      : (confirmCloseMessage ?? DEFAULT_CLOSE_CONFIRM);

    if (typeof window !== "undefined" && window.confirm(msg)) {
      onClose();
    }
  }, [
    closeDisabled,
    confirmBeforeClose,
    hasUnsavedChanges,
    onClose,
    confirmDiscardMessage,
    confirmCloseMessage,
  ]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") tryClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, tryClose]);

  if (!open) return null;

  const footerNode = typeof footer === "function" ? footer(tryClose) : footer;

  return (
    <ModalRequestCloseContext.Provider value={tryClose}>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === overlayRef.current) tryClose();
        }}
      >
        <div
          className={cn(
            "mx-4 flex max-h-[min(92vh,calc(100vh-2rem))] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl animate-in fade-in zoom-in-95",
            className,
          )}
          role="dialog"
          aria-modal="true"
        >
          {title && (
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
              <button
                type="button"
                onClick={tryClose}
                disabled={closeDisabled}
                className="cursor-pointer text-zinc-400 transition-colors hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
            {children}
          </div>
          {footerNode ? (
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-zinc-200 bg-zinc-50 px-6 py-4">
              {footerNode}
            </div>
          ) : null}
        </div>
      </div>
    </ModalRequestCloseContext.Provider>
  );
}
