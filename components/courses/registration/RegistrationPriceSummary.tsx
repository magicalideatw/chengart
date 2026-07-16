"use client";

import { useState, useTransition } from "react";
import { formatFee } from "@/lib/admin/format";
import { validatePromoCode } from "@/lib/actions/pricing";
import type { PricingSnapshot, PromoCodeRecord } from "@/lib/pricing/types";

type PromoCodeInputProps = {
  courseId: string;
  studentCount: number;
  sessionSlotCount: number;
  email?: string;
  appliedCode: string | null;
  onApplied: (
    code: string | null,
    promo: PromoCodeRecord | null,
    pricing: PricingSnapshot,
  ) => void;
  disabled?: boolean;
};

export function PromoCodeInput({
  courseId,
  studentCount,
  sessionSlotCount,
  email,
  appliedCode,
  onApplied,
  disabled = false,
}: PromoCodeInputProps) {
  const [input, setInput] = useState(appliedCode ?? "");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleApply = () => {
    if (!input.trim()) {
      setError("請輸入折扣碼");
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await validatePromoCode({
        courseId,
        code: input,
        studentCount,
        sessionSlotCount,
        email,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      onApplied(result.promo.code, result.promo, result.pricing);
      setMessage(`已套用 ${result.promo.code}`);
    });
  };

  const handleClear = () => {
    setInput("");
    setError(null);
    setMessage(null);
    onApplied(null, null, {
      basePricePerStudent: 0,
      studentCount,
      sessionSlotCount,
      subtotal: 0,
      lines: [],
      discountTotal: 0,
      total: 0,
      promoCode: null,
      promoCodeId: null,
      promoCodeName: null,
      isFreeCourse: false,
    });
  };

  return (
    <div className="mt-5 border-t border-border pt-5">
      <label className="text-sm font-medium text-foreground">折扣碼</label>
      <div className="mt-2 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value.toUpperCase())}
          placeholder="輸入折扣碼"
          disabled={disabled || isPending}
          className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={disabled || isPending}
          className="shrink-0 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-gold hover:text-gold disabled:opacity-50"
        >
          {isPending ? "套用中…" : "套用"}
        </button>
      </div>
      {appliedCode ? (
        <button
          type="button"
          onClick={handleClear}
          className="mt-2 text-xs text-muted transition hover:text-foreground"
        >
          清除折扣碼
        </button>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      {message ? <p className="mt-2 text-xs text-emerald-700">{message}</p> : null}
    </div>
  );
}

type RegistrationPriceSummaryProps = {
  pricing: PricingSnapshot;
  showPromoInput?: boolean;
  courseId?: string;
  email?: string;
  appliedPromoCode?: string | null;
  onPromoApplied?: (
    code: string | null,
    promo: PromoCodeRecord | null,
    pricing: PricingSnapshot,
  ) => void;
  variant?: "sidebar" | "inline";
};

export function RegistrationPriceSummary({
  pricing,
  showPromoInput = false,
  courseId,
  email,
  appliedPromoCode,
  onPromoApplied,
  variant = "sidebar",
}: RegistrationPriceSummaryProps) {
  const containerClass =
    variant === "sidebar"
      ? "sticky top-24 rounded-3xl border border-border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)]"
      : "rounded-2xl border border-border bg-surface px-5 py-4";

  if (pricing.isFreeCourse) {
    return (
      <aside className={containerClass}>
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
          Summary
        </p>
        <h3 className="mt-2 font-display text-lg font-semibold text-foreground">
          費用試算
        </h3>
        <p className="mt-5 text-sm text-muted">此為免費活動，無需付款。</p>
      </aside>
    );
  }

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
          <dd className="font-medium text-foreground">{pricing.studentCount} 位</dd>
        </div>
        {pricing.sessionSlotCount !== pricing.studentCount ? (
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">堂數</dt>
            <dd className="font-medium text-foreground">{pricing.sessionSlotCount} 堂</dd>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">單價</dt>
          <dd className="font-medium text-foreground">
            {formatFee(pricing.basePricePerStudent)}
          </dd>
        </div>

        {pricing.lines.map((line) => (
          <div key={line.key} className="flex items-start justify-between gap-4">
            <dt className="text-muted">{line.label}</dt>
            <dd
              className={`text-right font-medium ${
                line.amount < 0 ? "text-emerald-700" : "text-foreground"
              }`}
            >
              {line.amount < 0 ? `- ${formatFee(Math.abs(line.amount))}` : formatFee(line.amount)}
            </dd>
          </div>
        ))}

        {pricing.discountTotal > 0 ? (
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">優惠總額</dt>
            <dd className="font-medium text-emerald-700">
              - {formatFee(pricing.discountTotal)}
            </dd>
          </div>
        ) : null}

        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between gap-4">
            <dt className="font-medium text-foreground">最後付款金額</dt>
            <dd className="font-display text-xl font-semibold text-gold">
              {formatFee(pricing.total)}
            </dd>
          </div>
        </div>
      </dl>

      {showPromoInput && courseId && onPromoApplied ? (
        <PromoCodeInput
          courseId={courseId}
          studentCount={pricing.studentCount}
          sessionSlotCount={pricing.sessionSlotCount}
          email={email}
          appliedCode={appliedPromoCode ?? null}
          onApplied={(code, promo, nextPricing) =>
            onPromoApplied(code, promo, nextPricing)
          }
        />
      ) : null}
    </aside>
  );
}
