"use client";

import { formatFee } from "@/lib/admin/format";

type RegistrationPriceSummaryProps = {
  studentCount: number;
  pricePerStudent: number;
  totalAmount: number;
  variant?: "sidebar" | "inline";
};

export function RegistrationPriceSummary({
  studentCount,
  pricePerStudent,
  totalAmount,
  variant = "sidebar",
}: RegistrationPriceSummaryProps) {
  const containerClass =
    variant === "sidebar"
      ? "sticky top-24 rounded-3xl border border-border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)]"
      : "rounded-2xl border border-border bg-surface px-5 py-4";

  return (
    <aside className={containerClass}>
      <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
        Summary
      </p>
      <h3 className="mt-2 font-display text-lg font-semibold text-foreground">
        費用試算
      </h3>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">學生</dt>
          <dd className="font-medium text-foreground">{studentCount} 位</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">單價</dt>
          <dd className="font-medium text-foreground">{formatFee(pricePerStudent)}</dd>
        </div>
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between gap-4">
            <dt className="font-medium text-foreground">總金額</dt>
            <dd className="font-display text-xl font-semibold text-gold">
              {formatFee(totalAmount)}
            </dd>
          </div>
        </div>
      </dl>
    </aside>
  );
}
