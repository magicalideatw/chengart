"use client";

import { useState } from "react";
import { X, Upload } from "lucide-react";
import { uploadCourseCover } from "@/lib/actions/admin/courses";
import { COURSE_COVER_ACCEPT } from "@/lib/courses/constants";
import { CourseCoverImage } from "@/components/courses/CourseCoverImage";
import { COURSE_CATEGORIES } from "@/lib/courses/types";
import type { Course, CourseFormInput } from "@/lib/courses/types";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/payment/types";
import {
  REGISTRATION_MODES,
  REGISTRATION_MODE_LABELS,
  type RegistrationMode,
} from "@/lib/courses/registration-mode";

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
  allowedPaymentMethods: ["ecpay"],
  registrationMode: "adult",
  pricePerStudent: 0,
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
          allowedPaymentMethods: course.allowedPaymentMethods,
          registrationMode: course.registrationMode,
          pricePerStudent: course.pricePerStudent,
        }
      : emptyForm,
  );
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const updateField = <K extends keyof CourseFormInput>(
    key: K,
    value: CourseFormInput[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleCoverUpload = async (file: File | null) => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadCourseCover(formData);
    setIsUploading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    updateField("coverImage", result.path);
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
            <div>
              <label className="text-sm font-medium text-foreground">
                每位學生價格（NT$）
              </label>
              <input
                type="number"
                min={0}
                value={form.pricePerStudent}
                onChange={(e) => updateField("pricePerStudent", Number(e.target.value))}
                className={inputClass}
              />
              <p className="mt-2 text-xs text-muted">
                總金額 = 每位學生價格 × 學生數
              </p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              課程圖片（選填）
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <div className="relative h-24 w-36 overflow-hidden rounded-xl border border-border">
                <CourseCoverImage
                  src={form.coverImage}
                  alt="課程圖片預覽"
                  fill={false}
                  width={144}
                  height={96}
                  className="h-full w-full object-cover"
                  sizes="144px"
                />
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface">
                <Upload className="h-4 w-4" />
                {isUploading ? "上傳中…" : "上傳圖片"}
                <input
                  type="file"
                  accept={COURSE_COVER_ACCEPT}
                  className="hidden"
                  disabled={isUploading || isPending}
                  onChange={(e) => handleCoverUpload(e.target.files?.[0] ?? null)}
                />
              </label>
              {form.coverImage ? (
                <button
                  type="button"
                  onClick={() => updateField("coverImage", "")}
                  className="text-sm text-muted transition hover:text-foreground"
                >
                  移除圖片
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-muted">
              支援 JPG、PNG、WebP，最大 30MB
            </p>
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

          <div>
            <p className="text-sm font-medium text-foreground">報名模式</p>
            <div className="mt-3 space-y-3">
              {REGISTRATION_MODES.map((mode) => (
                <label
                  key={mode}
                  className="flex cursor-pointer items-center gap-3 text-sm text-foreground"
                >
                  <input
                    type="radio"
                    name="registrationMode"
                    checked={form.registrationMode === mode}
                    onChange={() =>
                      updateField("registrationMode", mode as RegistrationMode)
                    }
                    className="h-4 w-4 accent-gold"
                  />
                  {REGISTRATION_MODE_LABELS[mode]}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground">付款方式</p>
            <div className="mt-3 space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method}
                  className="flex cursor-pointer items-center gap-3 text-sm text-foreground"
                >
                  <input
                    type="checkbox"
                    checked={form.allowedPaymentMethods.includes(method)}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setForm((current) => {
                        const next = checked
                          ? [...new Set([...current.allowedPaymentMethods, method])]
                          : current.allowedPaymentMethods.filter(
                              (item) => item !== method,
                            );
                        return {
                          ...current,
                          allowedPaymentMethods: next as PaymentMethod[],
                        };
                      });
                    }}
                    className="h-4 w-4 accent-gold"
                  />
                  {PAYMENT_METHOD_LABELS[method]}
                </label>
              ))}
            </div>
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
              {isPending ? "儲存中…" : course ? "儲存變更" : "新增課程"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
