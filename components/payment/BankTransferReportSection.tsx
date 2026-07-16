"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { reportBankTransfer } from "@/lib/actions/report-bank-transfer";
import { Toast } from "@/components/ui/Toast";

type BankTransferReportSectionProps = {
  orderId: string;
  transferReported: boolean;
  transferLast5: string | null;
  transferDate: string | null;
  transferTime: string | null;
  transferNote: string | null;
};

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

function formatTransferTime(value: string | null): string {
  if (!value) return "—";
  const match = value.match(/^(\d{2}:\d{2})/);
  return match?.[1] ?? value;
}

function formatTransferDate(value: string | null): string {
  if (!value) return "—";
  const normalized = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized.replace(/-/g, "/");
  }
  return value;
}

export function BankTransferReportSection({
  orderId,
  transferReported: initialReported,
  transferLast5: initialLast5,
  transferDate: initialDate,
  transferTime: initialTime,
  transferNote: initialNote,
}: BankTransferReportSectionProps) {
  const [reported, setReported] = useState(initialReported);
  const [last5, setLast5] = useState(initialLast5);
  const [transferDate, setTransferDate] = useState(initialDate);
  const [transferTime, setTransferTime] = useState(initialTime);
  const [transferNote, setTransferNote] = useState(initialNote);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [formLast5, setFormLast5] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formNote, setFormNote] = useState("");

  const openDialog = () => {
    setFormError(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (isPending) return;
    setDialogOpen(false);
    setFormError(null);
  };

  const handleSubmit = () => {
    setFormError(null);

    startTransition(async () => {
      const result = await reportBankTransfer({
        orderId,
        transferLast5: formLast5,
        transferDate: formDate,
        transferTime: formTime,
        transferNote: formNote || undefined,
      });

      if (!result.success) {
        setFormError(result.error);
        return;
      }

      setReported(true);
      setLast5(formLast5);
      setTransferDate(formDate);
      setTransferTime(formTime);
      setTransferNote(formNote.trim() || null);
      setDialogOpen(false);
      setToastVisible(true);
    });
  };

  return (
    <>
      <div className="mt-8 rounded-2xl border border-border bg-surface px-5 py-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">付款方式</dt>
          <dd className="font-medium text-foreground">
            {reported ? "ATM" : "ATM 銀行轉帳"}
          </dd>
        </div>
        <div className="mt-3 flex justify-between gap-4">
          <dt className="text-muted">付款狀態</dt>
          <dd className="font-medium text-foreground">
            {reported ? "🟡 等待核帳" : "等待付款"}
          </dd>
        </div>

        {!reported ? (
          <button
            type="button"
            onClick={openDialog}
            className="mt-5 w-full rounded-full bg-gold px-6 py-3 text-sm font-medium text-white transition hover:bg-gold-light"
          >
            我已完成匯款
          </button>
        ) : (
          <div className="mt-5 space-y-3 border-t border-border pt-4">
            <p className="font-medium text-foreground">已回報匯款</p>
            <div className="flex justify-between gap-4">
              <span className="text-muted">後五碼</span>
              <span className="font-medium text-foreground">{last5 ?? "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted">日期</span>
              <span className="font-medium text-foreground">
                {formatTransferDate(transferDate)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted">時間</span>
              <span className="font-medium text-foreground">
                {formatTransferTime(transferTime)}
              </span>
            </div>
            {transferNote ? (
              <div className="flex justify-between gap-4">
                <span className="text-muted">備註</span>
                <span className="max-w-[60%] text-right font-medium text-foreground">
                  {transferNote}
                </span>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {dialogOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="transfer-report-title"
        >
          <div className="w-full max-w-md rounded-3xl border border-border bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h2
                id="transfer-report-title"
                className="font-display text-xl font-semibold text-foreground"
              >
                匯款回報
              </h2>
              <button
                type="button"
                onClick={closeDialog}
                disabled={isPending}
                className="rounded-full p-1 text-muted transition hover:bg-surface hover:text-foreground disabled:opacity-50"
                aria-label="關閉"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block text-sm text-foreground">
                匯款帳號後五碼（必填）
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={formLast5}
                  onChange={(event) =>
                    setFormLast5(event.target.value.replace(/\D/g, "").slice(0, 5))
                  }
                  className={inputClass}
                  placeholder="12345"
                  autoComplete="off"
                />
              </label>

              <label className="block text-sm text-foreground">
                匯款日期（必填）
                <input
                  type="date"
                  value={formDate}
                  onChange={(event) => setFormDate(event.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="block text-sm text-foreground">
                匯款時間（必填）
                <input
                  type="time"
                  value={formTime}
                  onChange={(event) => setFormTime(event.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="block text-sm text-foreground">
                備註（選填）
                <textarea
                  value={formNote}
                  onChange={(event) => setFormNote(event.target.value)}
                  rows={3}
                  className={inputClass}
                  placeholder="如有需要可補充說明"
                />
              </label>

              {formError ? (
                <p className="text-sm text-red-600">{formError}</p>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={closeDialog}
                disabled={isPending}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:bg-surface disabled:opacity-60"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="inline-flex flex-1 items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-medium text-white transition hover:bg-gold-light disabled:opacity-60"
              >
                {isPending ? "送出中…" : "送出"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Toast
        title="已收到您的匯款回報，我們將盡快為您核帳。"
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </>
  );
}
