"use client";

import { useState } from "react";
import { X, Upload } from "lucide-react";
import Image from "next/image";
import {
  EVENT_STATUSES,
  EVENT_TYPES,
  type EventStatus,
} from "@/lib/events/constants";
import { uploadEventCover } from "@/lib/actions/admin/events";
import type { EventFormInput, EventRecord } from "@/lib/events/types";
import { eventRecordToFormInput } from "@/lib/events/mappers";

type EventFormModalProps = {
  event?: EventRecord | null;
  onClose: () => void;
  onSubmit: (input: EventFormInput) => Promise<{ success: boolean; error?: string }>;
  isPending: boolean;
};

const emptyForm: EventFormInput = {
  slug: "",
  title: "",
  subtitle: "",
  coverImage: "",
  eventType: "活動",
  status: "招生中",
  startDate: "",
  endDate: "",
  intro: "",
  content: "",
  showOnHomepage: false,
  isFeatured: false,
  sortOrder: 0,
  registrationButtonText: "立即報名",
  registrationUrl: "",
};

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

function slugifyTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fff\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/[^\x00-\x7F]+/g, "")
    .slice(0, 80);

  return slug || `event-${Date.now()}`;
}

export function EventFormModal({
  event,
  onClose,
  onSubmit,
  isPending,
}: EventFormModalProps) {
  const [form, setForm] = useState<EventFormInput>(
    event ? eventRecordToFormInput(event) : emptyForm,
  );
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const updateField = <K extends keyof EventFormInput>(
    key: K,
    value: EventFormInput[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleTitleChange = (title: string) => {
    setForm((current) => {
      const next = { ...current, title };
      if (!event && !current.slug) {
        next.slug = slugifyTitle(title);
      }
      return next;
    });
  };

  const handleCoverUpload = async (file: File | null) => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadEventCover(formData);
    setIsUploading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    updateField("coverImage", result.url);
  };

  const handleSubmit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();
    setError(null);

    const result = await onSubmit(form);
    if (!result.success) {
      setError(result.error ?? "操作失敗");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
              Event
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-foreground">
              {event ? "編輯活動" : "新增活動"}
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
              <label className="text-sm font-medium text-foreground">標題</label>
              <input
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground">副標題</label>
              <input
                value={form.subtitle}
                onChange={(e) => updateField("subtitle", e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">網址代稱</label>
              <input
                value={form.slug}
                onChange={(e) => updateField("slug", e.target.value)}
                placeholder="summer-camp-2026"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-muted">用於 /events/網址代稱</p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">活動類型</label>
              <select
                value={form.eventType}
                onChange={(e) => updateField("eventType", e.target.value)}
                className={inputClass}
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">狀態</label>
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value as EventStatus)}
                className={inputClass}
              >
                {EVENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
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
              <label className="text-sm font-medium text-foreground">開始日期</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">結束日期</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">封面圖片</label>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              {form.coverImage ? (
                <div className="relative h-24 w-36 overflow-hidden rounded-xl border border-border">
                  <Image
                    src={form.coverImage}
                    alt="封面預覽"
                    fill
                    className="object-cover"
                    sizes="144px"
                  />
                </div>
              ) : null}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface">
                <Upload className="h-4 w-4" />
                {isUploading ? "上傳中…" : "上傳圖片"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={isUploading || isPending}
                  onChange={(e) => handleCoverUpload(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">簡介</label>
            <textarea
              rows={3}
              value={form.intro}
              onChange={(e) => updateField("intro", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              詳細內容（Rich Text / HTML）
            </label>
            <textarea
              rows={8}
              value={form.content}
              onChange={(e) => updateField("content", e.target.value)}
              placeholder="可使用 HTML 標籤排版，例如 <p>、<h3>、<ul>"
              className={`${inputClass} font-mono text-xs`}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">報名按鈕文字</label>
              <input
                value={form.registrationButtonText}
                onChange={(e) => updateField("registrationButtonText", e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">報名網址</label>
              <input
                type="url"
                value={form.registrationUrl}
                onChange={(e) => updateField("registrationUrl", e.target.value)}
                placeholder="https://"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="inline-flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.showOnHomepage}
                onChange={(e) => updateField("showOnHomepage", e.target.checked)}
                className="rounded border-border"
              />
              首頁顯示
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => updateField("isFeatured", e.target.checked)}
                className="rounded border-border"
              />
              精選活動
            </label>
          </div>

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
              disabled={isPending || isUploading}
              className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-white transition hover:bg-foreground/90 disabled:opacity-50"
            >
              {isPending ? "儲存中…" : event ? "儲存變更" : "新增活動"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
