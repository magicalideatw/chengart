"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  SESSION_STATUSES,
  SESSION_STATUS_LABELS,
  SESSION_TYPES,
  SESSION_TYPE_LABELS,
  type SessionFormInput,
  type SessionStatus,
} from "@/lib/sessions/types";
import { buildEmptySessionForm, sessionToFormInput } from "@/lib/sessions/mappers";
import type { ClassSession } from "@/lib/sessions/types";

type SessionFormModalProps = {
  session?: ClassSession | null;
  initialValues?: SessionFormInput;
  defaultCapacity?: number;
  defaultStartTime?: string;
  defaultEndTime?: string;
  defaultPrice?: number;
  nameLabel?: string;
  title?: string;
  allowSessionType?: boolean;
  onClose: () => void;
  onSubmit: (input: SessionFormInput) => Promise<{ success: boolean; error?: string }>;
  isPending: boolean;
};

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

function buildInitialForm({
  session,
  initialValues,
  defaultCapacity,
  defaultStartTime,
  defaultEndTime,
  defaultPrice,
}: Pick<
  SessionFormModalProps,
  | "session"
  | "initialValues"
  | "defaultCapacity"
  | "defaultStartTime"
  | "defaultEndTime"
  | "defaultPrice"
>): SessionFormInput {
  if (session) return sessionToFormInput(session);
  return (
    initialValues ??
    buildEmptySessionForm({
      capacity: defaultCapacity,
      remainingCapacity: defaultCapacity,
      startTime: defaultStartTime,
      endTime: defaultEndTime,
      price: defaultPrice ?? 0,
    })
  );
}

function SessionFormModalBody({
  session,
  initialValues,
  defaultCapacity = 5,
  defaultStartTime = "",
  defaultEndTime = "",
  defaultPrice = 0,
  nameLabel = "名稱",
  title,
  allowSessionType = false,
  onClose,
  onSubmit,
  isPending,
}: SessionFormModalProps) {
  const [form, setForm] = useState<SessionFormInput>(() =>
    buildInitialForm({
      session,
      initialValues,
      defaultCapacity,
      defaultStartTime,
      defaultEndTime,
      defaultPrice,
    }),
  );
  const [error, setError] = useState<string | null>(null);

  const updateField = <K extends keyof SessionFormInput>(
    key: K,
    value: SessionFormInput[K],
  ) => {
    setForm((current) => {
      const next = { ...current, [key]: value };

      if (key === "capacity" && typeof value === "number") {
        next.remainingCapacity = value;
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

  const modalTitle = title ?? (session ? "編輯場次" : initialValues ? "複製場次" : "新增場次");
  const isSelfScheduled = form.sessionType === "self_scheduled";

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
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground">{nameLabel}</label>
              <input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="例如：A班、下午場、第一梯"
                className={inputClass}
                required
              />
            </div>

            {allowSessionType ? (
              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-foreground">Session 類型</p>
                <div className="mt-3 flex flex-wrap gap-4">
                  {SESSION_TYPES.map((type) => (
                    <label
                      key={type}
                      className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                    >
                      <input
                        type="radio"
                        name="session-type"
                        checked={form.sessionType === type}
                        onChange={() => {
                          if (type === "self_scheduled") {
                            setForm((current) => ({
                              ...current,
                              sessionType: type,
                              date: "",
                              startTime: "",
                              endTime: "",
                            }));
                            return;
                          }
                          updateField("sessionType", type);
                        }}
                        className="h-4 w-4 border-border text-gold focus:ring-gold"
                      />
                      {SESSION_TYPE_LABELS[type]}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {!isSelfScheduled ? (
              <div>
                <label className="text-sm font-medium text-foreground">日期</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            ) : null}

            <div className={isSelfScheduled ? "sm:col-span-2" : undefined}>
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

            {!isSelfScheduled ? (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground">開始時間</label>
                  <input
                    value={form.startTime}
                    onChange={(e) => updateField("startTime", e.target.value)}
                    placeholder="14:00"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">結束時間</label>
                  <input
                    value={form.endTime}
                    onChange={(e) => updateField("endTime", e.target.value)}
                    placeholder="15:30"
                    className={inputClass}
                    required
                  />
                </div>
              </>
            ) : (
              <div className="sm:col-span-2 rounded-xl bg-surface px-4 py-3 text-sm text-muted">
                自行預約場次不需設定日期與時間；學員報名後將由老師聯繫協調上課時間。
              </div>
            )}

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
                readOnly
                disabled
                className={`${inputClass} bg-surface/80 text-muted`}
              />
              <p className="mt-1 text-xs text-muted">依已付款報名自動計算</p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">價格</label>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => updateField("price", Number(e.target.value))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">排序</label>
              <input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => updateField("sortOrder", Number(e.target.value))}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground">地點（選填）</label>
              <input
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={form.isOpen}
                  onChange={(e) => updateField("isOpen", e.target.checked)}
                  className="h-4 w-4 rounded border-border text-gold focus:ring-gold"
                />
                開放報名
              </label>
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
              狀態為「已取消」時，前台將不可選取此場次。
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

export function SessionFormModal(props: SessionFormModalProps) {
  const resetKey = [
    props.session?.id ?? "new",
    props.initialValues?.date ?? "",
    props.defaultCapacity ?? 5,
    props.defaultStartTime ?? "",
    props.defaultEndTime ?? "",
    props.defaultPrice ?? 0,
  ].join(":");

  return <SessionFormModalBody key={resetKey} {...props} />;
}
