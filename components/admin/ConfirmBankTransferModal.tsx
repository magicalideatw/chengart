"use client";

import { X } from "lucide-react";
import { formatFee } from "@/lib/admin/format";
import type { AdminOrderRow } from "@/lib/admin/order-management";
import {
  formatTransferDateDisplay,
  formatTransferTimeDisplay,
} from "@/lib/admin/order-transfer-display";

type ConfirmBankTransferModalProps = {
  order: AdminOrderRow;
  open: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmBankTransferModal({
  order,
  open,
  isSubmitting,
  onClose,
  onConfirm,
}: ConfirmBankTransferModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-bank-transfer-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <h2
            id="confirm-bank-transfer-title"
            className="font-display text-xl font-semibold text-foreground"
          >
            確認收款
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-1 text-muted transition hover:bg-surface hover:text-foreground disabled:opacity-50"
            aria-label="關閉"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-sm text-muted">請確認已收到此筆匯款。</p>

        <dl className="mt-5 divide-y divide-border rounded-2xl border border-border bg-surface px-4 py-1 text-sm">
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-3">
            <dt className="min-w-28 shrink-0 text-muted">訂單編號</dt>
            <dd className="font-mono text-foreground">
              #{order.merchant_trade_no}
            </dd>
          </div>
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-3">
            <dt className="min-w-28 shrink-0 text-muted">課程（活動）</dt>
            <dd className="text-foreground">{order.course_title}</dd>
          </div>
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-3">
            <dt className="min-w-28 shrink-0 text-muted">家長姓名</dt>
            <dd className="text-foreground">{order.name}</dd>
          </div>
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-3">
            <dt className="min-w-28 shrink-0 text-muted">付款方式</dt>
            <dd className="text-foreground">ATM</dd>
          </div>
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-3">
            <dt className="min-w-28 shrink-0 text-muted">金額</dt>
            <dd className="font-medium text-foreground">
              {formatFee(order.amount)}
            </dd>
          </div>
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-3">
            <dt className="min-w-28 shrink-0 text-muted">後五碼</dt>
            <dd className="font-mono text-foreground">
              {order.transfer_last5 ?? "—"}
            </dd>
          </div>
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-3">
            <dt className="min-w-28 shrink-0 text-muted">匯款日期</dt>
            <dd className="text-foreground">
              {formatTransferDateDisplay(order.transfer_date)}
            </dd>
          </div>
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-3">
            <dt className="min-w-28 shrink-0 text-muted">匯款時間</dt>
            <dd className="text-foreground">
              {formatTransferTimeDisplay(order.transfer_time)}
            </dd>
          </div>
        </dl>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">⚠️ 確認後：</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-amber-900/90">
            <li>訂單會變成已付款</li>
            <li>系統會建立正式報名</li>
            <li>名額正式保留</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:bg-surface disabled:opacity-60"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-medium text-white transition hover:bg-gold-light disabled:opacity-60"
          >
            {isSubmitting ? "處理中..." : "確認收款"}
          </button>
        </div>
      </div>
    </div>
  );
}
