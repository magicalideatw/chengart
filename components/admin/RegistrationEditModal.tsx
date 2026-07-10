"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { formatSessionDate } from "@/lib/admin/format";
import type { AdminRegistration } from "@/lib/admin/types";
import type { Course } from "@/lib/courses/types";

type RegistrationEditModalProps = {
  registration: AdminRegistration;
  courses: Course[];
  onClose: () => void;
  onSave: (
    updated: AdminRegistration,
  ) => Promise<{ success: boolean; error?: string }>;
  isPending: boolean;
};

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

export function RegistrationEditModal({
  registration,
  courses,
  onClose,
  onSave,
  isPending,
}: RegistrationEditModalProps) {
  const [form, setForm] = useState({
    courseId: registration.course_id,
    name: registration.name,
    phone: registration.phone,
    email: registration.email,
    studentName: registration.student_name,
    studentAge: registration.student_age,
    isFirstTime: registration.is_first_time,
    note: registration.note ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  const selectedCourse = courses.find((course) => course.id === form.courseId);
  const multiSessionSlots =
    registration.orderSessionSlots.length > 1
      ? registration.orderSessionSlots
      : [];

  const updateField = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const result = await onSave({
      ...registration,
      course_id: form.courseId,
      name: form.name,
      phone: form.phone,
      email: form.email,
      student_name: form.studentName,
      student_age: form.studentAge,
      is_first_time: form.isFirstTime,
      note: form.note || null,
      courseTitle: selectedCourse?.title ?? registration.courseTitle,
      courseCategory: selectedCourse?.category ?? registration.courseCategory,
      sessionDate: registration.session_id
        ? registration.sessionDate
        : selectedCourse?.sessionDate ?? registration.sessionDate,
      sessionDateLabel: registration.session_id
        ? registration.sessionDateLabel
        : registration.sessionDateLabel,
      sessionTime: registration.session_id
        ? registration.sessionTime
        : selectedCourse?.sessionTime ?? registration.sessionTime,
    });

    if (!result.success) {
      setError(result.error ?? "更新失敗");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-white px-6 py-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
              Edit
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-foreground">
              編輯報名資料
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
          <section className="rounded-2xl border border-border bg-surface px-5 py-4">
            <h3 className="text-sm font-medium text-foreground">報名時段</h3>

            {multiSessionSlots.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm text-foreground">
                {multiSessionSlots.map((slot) => (
                  <li key={`${slot.date}-${slot.timeLabel}`}>
                    • {slot.detailLine}
                  </li>
                ))}
              </ul>
            ) : (
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">日期</dt>
                  <dd className="font-medium text-foreground">
                    {registration.sessionDateLabel}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">時間</dt>
                  <dd className="font-medium text-foreground">
                    {registration.sessionTime}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">班別</dt>
                  <dd className="font-medium text-foreground">
                    {registration.className}
                  </dd>
                </div>
              </dl>
            )}
          </section>

          <div>
            <label className="text-sm font-medium text-foreground">課程</label>
            <select
              value={form.courseId}
              onChange={(event) => updateField("courseId", event.target.value)}
              className={inputClass}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} · {formatSessionDate(course.sessionDate)}{" "}
                  {course.sessionTime}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {(
              [
                { key: "name", label: "姓名", type: "text" },
                { key: "phone", label: "電話", type: "tel" },
                { key: "email", label: "Email", type: "email" },
                { key: "studentName", label: "學生姓名", type: "text" },
                { key: "studentAge", label: "年齡", type: "text" },
              ] as const
            ).map((field) => (
              <div key={field.key}>
                <label className="text-sm font-medium text-foreground">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={form[field.key]}
                  onChange={(event) =>
                    updateField(field.key, event.target.value)
                  }
                  className={inputClass}
                />
              </div>
            ))}
          </div>

          <div>
            <p className="text-sm font-medium text-foreground">是否第一次參加</p>
            <div className="mt-3 flex gap-4">
              {[
                { value: true, label: "是" },
                { value: false, label: "否" },
              ].map((option) => (
                <label
                  key={option.label}
                  className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                >
                  <input
                    type="radio"
                    checked={form.isFirstTime === option.value}
                    onChange={() => updateField("isFirstTime", option.value)}
                    className="h-4 w-4 accent-gold"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">備註</label>
            <textarea
              rows={3}
              value={form.note}
              onChange={(event) => updateField("note", event.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>

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
              {isPending ? "儲存中…" : "儲存變更"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
