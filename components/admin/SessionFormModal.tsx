"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  SESSION_STATUSES,
  SESSION_STATUS_LABELS,
  type SessionFormInput,
  type SessionStatus,
} from "@/lib/sessions/types";
import { sessionToFormInput } from "@/lib/sessions/mappers";
import type { ClassSession } from "@/lib/sessions/types";

type SessionFormModalProps = {
  session?: ClassSession | null;
  initialValues?: SessionFormInput;
  defaultCapacity?: number;
  defaultStartTime?: string;
  defaultEndTime?: string;
  title?: string;
  onClose: () => void;
  onSubmit: (input: SessionFormInput) => Promise<{ success: boolean; error?: string }>;
  isPending: boolean;
};

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

function buildEmptyForm(
  defaultCapacity = 5,
  defaultStartTime = "",
  defaultEndTime = "",
): SessionFormInput {
  return {
    date: "",
    startTime: defaultStartTime,
    endTime: defaultEndTime,
    capacity: defaultCapacity,
    remainingCapacity: defaultCapacity,
    status: "open",
    notes: "",
  };
}

export function SessionFormModal({
  session,
  initialValues,
  defaultCapacity = 5,
  defaultStartTime = "",
  defaultEndTime = "",
  title,
  onClose,
  onSubmit,
  isPending,
}: SessionFormModalProps) {
  const [form, setForm] = useState<SessionFormInput>(
    session
      ? sessionToFormInput(session)
      : initialValues ?? buildEmptyForm(defaultCapacity, defaultStartTime, defaultEndTime),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(
      session
        ? sessionToFormInput(session)
        : initialValues ?? buildEmptyForm(defaultCapacity, defaultStartTime, defaultEndTime),
    );
  }, [session, initialValues, defaultCapacity, defaultStartTime, defaultEndTime]);

  const updateField = <K extends keyof SessionFormInput>(
    key: K,
    value: SessionFormInput[K],
  ) => {
    setForm((current) => {
      const next = { ...current, [key]: value };

      if (key === "capacity" && typeof value === "number") {
        next.remainingCapacity = Math.min(current.remainingCapacity, value);
      }

      if (key === "status" && value === "full") {
        next.remainingCapacity = 0;
      }

      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const result = await onSubmit(form);
    if (!result.success) {
      setError(result.error ?? "操作失敗");
    }
  };

  const modalTitle =
    title ?? (session ? "編輯上課日期" : initialValues ? "複製上課日期" : "新增上課日期");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-white px-6 py-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
              Session
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-foreground">
              {modalTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border p-2 text-muted transition hover:text-foreground"
            aria-label="關閉"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">上課日期</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => updateField("date", e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">狀態</label>
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value as SessionStatus)}
                className={inputClass}
              >
                {SESSION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {SESSION_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">開始時間</label>
              <input
                value={form.startTime}
                onChange={(e) => updateField("startTime", e.target.value)}
                placeholder="14:00"
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">結束時間</label>
              <input
                value={form.endTime}
                onChange={(e) => updateField("endTime", e.target.value)}
                placeholder="15:30"
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">名額</label>
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => updateField("capacity", Number(e.target.value))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">剩餘名額</label>
              <input
                type="number"
                min={0}
                max={form.capacity}
                value={form.remainingCapacity}
                onChange={(e) =>
                  updateField("remainingCapacity", Number(e.target.value))
                }
                disabled={form.status === "full"}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">備註</label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="例：老師請假、調課說明"
            />
          </div>

          {form.status === "cancelled" ? (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              狀態為「已取消」時，前台將不可選取此日期。
            </p>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-3 border-t border-border pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted transition hover:text-foreground"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-white transition hover:bg-foreground/90 disabled:opacity-50"
            >
              {isPending ? "儲存中…" : "儲存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
