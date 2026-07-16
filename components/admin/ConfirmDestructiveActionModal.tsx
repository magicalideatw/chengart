"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { BULK_DELETE_CONFIRMATION } from "@/lib/validation/bulk-delete-schema";

type ConfirmDestructiveActionModalProps = {
  open: boolean;
  title: string;
  description: string;
  itemCount?: number;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: (confirmation: string) => Promise<{ success: boolean; error?: string }>;
  onSuccess: (message: string) => void;
};

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

export function ConfirmDestructiveActionModal({
  open,
  title,
  description,
  itemCount,
  confirmLabel = "永久刪除",
  onClose,
  onConfirm,
  onSuccess,
}: ConfirmDestructiveActionModalProps) {
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setConfirmation("");
    setError(null);
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    setError(null);

    startTransition(async () => {
      const result = await onConfirm(confirmation.trim());
      if (!result.success) {
        setError(result.error ?? "操作失敗");
        return;
      }

      onSuccess("資料已清空");
      onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="destructive-action-title"
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
              Admin Tool
            </p>
            <h2
              id="destructive-action-title"
              className="mt-1 font-display text-xl font-semibold text-foreground"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-full border border-border p-2 text-muted transition hover:text-foreground disabled:opacity-50"
            aria-label="關閉"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800">
            此動作不可復原。
          </div>

          <p className="text-sm leading-relaxed text-muted">{description}</p>

          {typeof itemCount === "number" ? (
            <p className="text-sm font-medium text-foreground">
              將刪除 <span className="text-gold">{itemCount}</span> 筆資料。
            </p>
          ) : null}

          <label className="block text-sm text-foreground">
            請輸入{" "}
            <span className="font-mono font-semibold">{BULK_DELETE_CONFIRMATION}</span>{" "}
            確認後才執行
            <input
              type="text"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={isPending}
              className={inputClass}
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:bg-surface disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || confirmation.trim() !== BULK_DELETE_CONFIRMATION}
            className="rounded-full bg-red-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "處理中…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
