"use client";

export type AdminToastKind = "success" | "danger" | "info";

export interface AdminToast {
  id: number;
  kind: AdminToastKind;
  title: string;
  description?: string;
}

interface Props {
  toasts: AdminToast[];
  onDismiss: (id: number) => void;
}

const toneClasses: Record<AdminToastKind, string> = {
  success: "border-[#2a9154]/30 bg-[#f1fff6] text-[#145932]",
  danger: "border-[#c13636]/30 bg-[#fff3f3] text-[#7f1d1d]",
  info: "border-[#2c6ccf]/30 bg-[#f3f8ff] text-[#18458c]",
};

const iconMap: Record<AdminToastKind, string> = {
  success: "✓",
  danger: "!",
  info: "i",
};

export default function AdminToastStack({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[1000] flex w-[min(92vw,420px)] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`admin-toast-enter pointer-events-auto rounded-2xl border px-4 py-3 shadow-xl backdrop-blur ${toneClasses[toast.kind]}`}
        >
          <div className="flex items-start gap-3">
            <span className="mt-[2px] inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current/20 text-sm font-bold">
              {iconMap[toast.kind]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description ? (
                <p className="mt-1 text-sm opacity-90">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="rounded-md px-2 py-1 text-xs font-medium opacity-70 hover:opacity-100"
            >
              Закрыть
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
