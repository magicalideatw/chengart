"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import {
  archiveActivityAction,
  deleteActivityCascadeAction,
  fetchActivityDeleteSummary,
} from "@/lib/actions/admin/activity-delete";
import type { ActivityDeleteSummary } from "@/lib/admin/activity-delete";
import { ACTIVITY_DELETE_CONFIRMATION } from "@/lib/validation/activity-delete-schema";
import type { Course } from "@/lib/courses/types";

type DeleteActivityModalProps = {
  course: Course;
  open: boolean;
  onClose: () => void;
  onCompleted: (message: string) => void;
};

type DeleteMode = "archive" | "permanent";

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-foreground">{value} 筆</span>
    </div>
  );
}

export function DeleteActivityModal({
  course,
  open,
  onClose,
  onCompleted,
}: DeleteActivityModalProps) {
  const [summary, setSummary] = useState<ActivityDeleteSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [mode, setMode] = useState<DeleteMode>("archive");
  const [step, setStep] = useState<"choose" | "confirm">("choose");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    setMode("archive");
    setStep("choose");
    setConfirmation("");
    setError(null);
    setLoadingSummary(true);
    setSummary(null);

    void fetchActivityDeleteSummary(course.id).then((result) => {
      setLoadingSummary(false);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSummary(result.summary);
    });
  }, [course.id, open]);

  if (!open) return null;

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  const handlePrimaryAction = () => {
    setError(null);

    if (mode === "archive") {
      startTransition(async () => {
        const result = await archiveActivityAction(course.id);
        if (!result.success) {
          setError(result.error ?? "封存活動失敗");
          return;
        }
        onCompleted("活動已封存");
        onClose();
      });
      return;
    }

    setStep("confirm");
  };

  const handlePermanentDelete = () => {
    setError(null);

    startTransition(async () => {
      const result = await deleteActivityCascadeAction({
        courseId: course.id,
        confirmation,
      });

      if (!result.success) {
        setError(
          result.error?.startsWith("刪除活動失敗")
            ? result.error
            : `刪除活動失敗：${result.error ?? "永久刪除失敗"}`,
        );
        return;
      }

      onCompleted("活動已永久刪除");
      onClose();
    });
  };

  const displayTitle = summary?.title ?? course.title;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-activity-title"
    >
      <div className="absolute inset-0" onClick={handleClose} aria-hidden="true" />
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-border bg-white px-6 py-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
              Activity
            </p>
            <h2
              id="delete-activity-title"
              className="mt-1 font-display text-xl font-semibold text-foreground"
            >
              {step === "confirm" ? "確認永久刪除" : "刪除活動"}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="rounded-full border border-border p-2 text-muted transition hover:text-foreground disabled:opacity-50"
            aria-label="關閉"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          {loadingSummary ? (
            <p className="text-sm text-muted">載入活動資料中…</p>
          ) : (
            <>
              <div className="rounded-2xl border border-border bg-surface/60 px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                  活動名稱
                </p>
                <p className="mt-2 font-display text-lg font-semibold text-foreground">
                  {displayTitle}
                </p>
              </div>

              {summary ? (
                <div className="rounded-2xl border border-border bg-white px-5 py-4">
                  <p className="text-sm font-medium text-foreground">此活動包含</p>
                  <div className="mt-3 divide-y divide-border">
                    <SummaryRow label="課程報名" value={summary.registrationCount} />
                    <SummaryRow label="演出購票" value={summary.performanceOrderCount} />
                    <SummaryRow label="訂單" value={summary.orderCount} />
                    <SummaryRow label="Session" value={summary.sessionCount} />
                    <div className="flex items-center justify-between gap-4 py-2 text-sm">
                      <span className="text-muted">票種</span>
                      <span className="font-medium text-foreground">
                        {summary.ticketTypeCount} 種
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}

          {step === "choose" ? (
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground">請選擇</p>

              <label className="block cursor-pointer rounded-2xl border border-border bg-surface/40 p-4 transition hover:border-gold/40">
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="deleteMode"
                    checked={mode === "archive"}
                    onChange={() => setMode("archive")}
                    className="mt-1 h-4 w-4 accent-gold"
                  />
                  <div>
                    <p className="font-medium text-foreground">封存（推薦）</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      前台將不再顯示，但所有報名、訂單、付款紀錄仍完整保留。
                    </p>
                  </div>
                </div>
              </label>

              <label className="block cursor-pointer rounded-2xl border border-border bg-surface/40 p-4 transition hover:border-red-200">
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="deleteMode"
                    checked={mode === "permanent"}
                    onChange={() => setMode("permanent")}
                    className="mt-1 h-4 w-4 accent-gold"
                  />
                  <div>
                    <p className="font-medium text-foreground">永久刪除</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      將一併刪除此活動所有相關資料，包含 Course、Session、Registration、Student（若無其他
                      Registration 使用）、Performance Orders、Ticket Types、Orders、Promo Code
                      Redemption（若有）與相關設定。此動作無法復原。
                    </p>
                  </div>
                </div>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800">
                永久刪除後無法復原。請再次確認這是測試資料，而非正式活動。
              </div>

              <label className="block text-sm text-foreground">
                請輸入 <span className="font-mono font-semibold">{ACTIVITY_DELETE_CONFIRMATION}</span>{" "}
                才能真正刪除
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
            </div>
          )}

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-border bg-white px-6 py-5 sm:flex-row sm:justify-end">
          {step === "confirm" ? (
            <button
              type="button"
              onClick={() => {
                setStep("choose");
                setConfirmation("");
                setError(null);
              }}
              disabled={isPending}
              className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:bg-surface disabled:opacity-50"
            >
              返回
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:bg-surface disabled:opacity-50"
            >
              取消
            </button>
          )}

          {step === "choose" ? (
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={isPending || loadingSummary}
              className={`rounded-full px-6 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                mode === "permanent"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-gold hover:bg-gold-light"
              }`}
            >
              {isPending
                ? "處理中…"
                : mode === "archive"
                  ? "封存活動"
                  : "下一步"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePermanentDelete}
              disabled={
                isPending || confirmation.trim() !== ACTIVITY_DELETE_CONFIRMATION
              }
              className="rounded-full bg-red-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "刪除中…" : "永久刪除"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
