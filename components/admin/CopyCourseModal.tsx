"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { copyCourse } from "@/lib/actions/admin/copy-course";
import { suggestCourseCopySlug } from "@/lib/courses/copy-slug";
import type { Course } from "@/lib/courses/types";

type CopyCourseModalProps = {
  course: Course;
  open: boolean;
  onClose: () => void;
  onCopied: (course: Course) => void;
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

export function CopyCourseModal({
  course,
  open,
  onClose,
  onCopied,
}: CopyCourseModalProps) {
  const [title, setTitle] = useState(`${course.title}（複製）`);
  const [slug, setSlug] = useState(() =>
    suggestCourseCopySlug(`${course.title}-copy`),
  );
  const [slugTouched, setSlugTouched] = useState(false);
  const [options, setOptions] = useState<CopyOptions>(defaultOptions);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const nextTitle = `${course.title}（複製）`;
    setTitle(nextTitle);
    setSlug(suggestCourseCopySlug(`${course.title}-copy`));
    setSlugTouched(false);
    setOptions(defaultOptions);
    setError(null);
  }, [course, open]);

  useEffect(() => {
    if (slugTouched) return;
    setSlug(suggestCourseCopySlug(title));
  }, [title, slugTouched]);

  if (!open) return null;

  const toggleOption = (key: keyof CopyOptions) => {
    setOptions((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleSubmit = () => {
    setError(null);

    startTransition(async () => {
      const result = await copyCourse({
        sourceCourseId: course.id,
        title: title.trim(),
        ...options,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      onCopied(result.course);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="copy-course-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <h2
            id="copy-course-title"
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
              placeholder="原名稱（複製）"
            />
          </label>

          <label className="block text-sm text-foreground">
            新的活動代稱（Slug）
            <input
              type="text"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
              className={inputClass}
              placeholder="自動產生，可修改"
            />
            <p className="mt-1.5 text-xs text-muted">
              報名網址為{" "}
              <span className="font-mono">/courses/系統ID</span>
              ，代稱供內部識別（建立後可於編輯頁調整設定）
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
                    className="h-4 w-4 rounded border-border text-gold focus:ring-gold"
                  />
                  {label}
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
            disabled={isPending || !title.trim()}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-medium text-white transition hover:bg-gold-light disabled:opacity-60"
          >
            {isPending ? "建立中…" : "建立副本"}
          </button>
        </div>
      </div>
    </div>
  );
}
