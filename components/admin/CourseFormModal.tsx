"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { COURSE_CATEGORIES } from "@/lib/courses/types";
import type { Course, CourseFormInput } from "@/lib/courses/types";

type CourseFormModalProps = {
  course?: Course | null;
  onClose: () => void;
  onSubmit: (input: CourseFormInput) => Promise<{ success: boolean; error?: string }>;
  isPending: boolean;
};

const emptyForm: CourseFormInput = {
  title: "",
  category: "舞蹈",
  description: "",
  sessionDate: "",
  sessionTime: "",
  capacity: 5,
  fee: 0,
  coverImage: "",
  isOpen: true,
};

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

export function CourseFormModal({
  course,
  onClose,
  onSubmit,
  isPending,
}: CourseFormModalProps) {
  const [form, setForm] = useState<CourseFormInput>(
    course
      ? {
          title: course.title,
          category: course.category,
          description: course.description,
          sessionDate: course.sessionDate,
          sessionTime: course.sessionTime,
          capacity: course.capacity,
          fee: course.fee,
          coverImage: course.coverImage,
          isOpen: course.isOpen,
        }
      : emptyForm,
  );
  const [error, setError] = useState<string | null>(null);

  const updateField = <K extends keyof CourseFormInput>(
    key: K,
    value: CourseFormInput[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const result = await onSubmit(form);
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
              Course
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-foreground">
              {course ? "編輯課程" : "新增課程"}
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
          <div>
            <label className="text-sm font-medium text-foreground">課程名稱</label>
            <input
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">課程分類</label>
            <select
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              className={inputClass}
            >
              {COURSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">課程介紹</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">上課日期</label>
              <input
                type="date"
                value={form.sessionDate}
                onChange={(e) => updateField("sessionDate", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">上課時間</label>
              <input
                value={form.sessionTime}
                onChange={(e) => updateField("sessionTime", e.target.value)}
                placeholder="例如 14:00–15:00"
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
              <label className="text-sm font-medium text-foreground">費用（NT$）</label>
              <input
                type="number"
                min={0}
                value={form.fee}
                onChange={(e) => updateField("fee", Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">封面圖片 URL</label>
            <input
              type="url"
              value={form.coverImage}
              onChange={(e) => updateField("coverImage", e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.isOpen}
              onChange={(e) => updateField("isOpen", e.target.checked)}
              className="h-4 w-4 accent-gold"
            />
            開放報名
          </label>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:bg-surface"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-white transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "儲存中…" : course ? "儲存變更" : "新增課程"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
