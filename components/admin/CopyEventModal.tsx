"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { copyEvent } from "@/lib/actions/admin/copy-event";
import { suggestEventCopySlug } from "@/lib/events/slug";
import type { EventRecord } from "@/lib/events/types";

type CopyEventModalProps = {
  event: EventRecord;
  open: boolean;
  onClose: () => void;
  onCopied: (event: EventRecord) => void;
};

type CopyOptions = {
  copyIntro: boolean;
  copyCoverImage: boolean;
  copySessions: boolean;
  copyPricing: boolean;
  copyRegistrationSettings: boolean;
  copyPaymentMethods: boolean;
};

const defaultOptions: CopyOptions = {
  copyIntro: true,
  copyCoverImage: true,
  copySessions: true,
  copyPricing: true,
  copyRegistrationSettings: true,
  copyPaymentMethods: true,
};

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

export function CopyEventModal({
  event,
  open,
  onClose,
  onCopied,
}: CopyEventModalProps) {
  const [title, setTitle] = useState(`${event.title}（複製）`);
  const [slug, setSlug] = useState(() =>
    suggestEventCopySlug(`${event.title}（複製）`, event.slug),
  );
  const [slugTouched, setSlugTouched] = useState(false);
  const [options, setOptions] = useState<CopyOptions>(defaultOptions);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const nextTitle = `${event.title}（複製）`;
    setTitle(nextTitle);
    setSlug(suggestEventCopySlug(nextTitle, event.slug));
    setSlugTouched(false);
    setOptions(defaultOptions);
    setError(null);
  }, [event, open]);

  useEffect(() => {
    if (slugTouched) return;
    setSlug(suggestEventCopySlug(title, event.slug));
  }, [title, slugTouched, event.slug]);

  if (!open) return null;

  const toggleOption = (key: keyof CopyOptions) => {
    setOptions((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleSubmit = () => {
    setError(null);

    startTransition(async () => {
      const result = await copyEvent({
        sourceEventId: event.id,
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        ...options,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      onCopied(result.event);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="copy-event-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <h2
            id="copy-event-title"
            className="font-display text-xl font-semibold text-foreground"
          >
            複製活動
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-full p-1 text-muted transition hover:bg-surface hover:text-foreground disabled:opacity-50"
            aria-label="關閉"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block text-sm text-foreground">
            新的活動名稱
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block text-sm text-foreground">
            新的活動代稱（Slug）
            <input
              type="text"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value.toLowerCase());
              }}
              className={inputClass}
              placeholder="自動產生，可修改"
            />
            <p className="mt-1.5 text-xs text-muted">
              活動頁網址：<span className="font-mono">/events/{slug || "…"}</span>
            </p>
          </label>

          <div className="rounded-2xl border border-border bg-surface px-4 py-4 text-sm">
            <p className="font-medium text-foreground">是否複製</p>
            <div className="mt-3 space-y-2">
              {(
                [
                  ["copyIntro", "活動介紹"],
                  ["copyCoverImage", "活動圖片"],
                  ["copySessions", "Sessions（日期）"],
                  ["copyPricing", "價格"],
                  ["copyRegistrationSettings", "報名設定"],
                  ["copyPaymentMethods", "付款方式"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 text-foreground"
                >
                  <input
                    type="checkbox"
                    checked={options[key]}
                    onChange={() => toggleOption(key)}
                    disabled={key === "copyPricing" || key === "copyPaymentMethods"}
                    className="h-4 w-4 rounded border-border text-gold focus:ring-gold disabled:opacity-40"
                  />
                  {label}
                  {key === "copyPricing" || key === "copyPaymentMethods" ? (
                    <span className="text-xs text-muted">（CMS 活動不適用）</span>
                  ) : null}
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface/60 px-4 py-3 text-xs text-muted">
            <p className="font-medium text-foreground">不會複製</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>訂單</li>
              <li>報名者</li>
              <li>registration</li>
              <li>已付款資料</li>
            </ul>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:bg-surface disabled:opacity-60"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !title.trim() || !slug.trim()}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-medium text-white transition hover:bg-gold-light disabled:opacity-60"
          >
            {isPending ? "建立中…" : "建立副本"}
          </button>
        </div>
      </div>
    </div>
  );
}
