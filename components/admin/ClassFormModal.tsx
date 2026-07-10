"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { WEEKDAYS } from "@/lib/classes/types";
import {
  classRecordToFormInput,
  toTimeInputValue,
} from "@/lib/classes/mappers";
import type { ClassFormInput, CourseClass } from "@/lib/classes/types";

type ClassFormModalProps = {
  courseClass?: CourseClass | null;
  onClose: () => void;
  onSubmit: (input: ClassFormInput) => Promise<{ success: boolean; error?: string }>;
  isPending: boolean;
};

const emptyForm: ClassFormInput = {
  name: "",
  teacher: "",
  weekday: "星期二",
  startTime: "14:00",
  endTime: "15:00",
  capacity: 5,
  fee: null,
  isOpen: true,
  sortOrder: 0,
};

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

function toFormValues(courseClass?: CourseClass | null): ClassFormInput {
  if (!courseClass) return emptyForm;

  const input = classRecordToFormInput(courseClass);
  return {
    ...input,
    startTime: toTimeInputValue(input.startTime) || input.startTime,
    endTime: toTimeInputValue(input.endTime) || input.endTime,
  };
}

export function ClassFormModal({
  courseClass,
  onClose,
  onSubmit,
  isPending,
}: ClassFormModalProps) {
  const [form, setForm] = useState<ClassFormInput>(() => toFormValues(courseClass));
  const [error, setError] = useState<string | null>(null);

  const updateField = <K extends keyof ClassFormInput>(
    key: K,
    value: ClassFormInput[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const result = await onSubmit({
      ...form,
      fee: null,
    });

    if (!result.success) {
      setError(result.error ?? "操作失敗");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-white px-6 py-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
              Class
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-foreground">
              {courseClass ? "編輯班別" : "新增班別"}
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
              <label className="text-sm font-medium text-foreground">班別名稱</label>
              <input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="A班"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">老師</label>
              <input
                value={form.teacher}
                onChange={(e) => updateField("teacher", e.target.value)}
                placeholder="王老師"
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">星期</label>
              <select
                value={form.weekday}
                onChange={(e) => updateField("weekday", e.target.value)}
                className={inputClass}
              >
                {WEEKDAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">排序</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => updateField("sortOrder", Number(e.target.value))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">開始時間</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => updateField("startTime", e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">結束時間</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => updateField("endTime", e.target.value)}
                className={inputClass}
                required
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
                required
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.isOpen}
              onChange={(e) => updateField("isOpen", e.target.checked)}
              className="rounded border-border"
            />
            開放
          </label>

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
              className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gold-light disabled:opacity-50"
            >
              {isPending ? "儲存中…" : courseClass ? "儲存變更" : "新增班別"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
