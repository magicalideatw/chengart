"use client";

import { useState, useTransition } from "react";
import type { PricingLineItem, PricingSnapshot, PromoCodeRecord } from "@/lib/pricing/types";
import { validatePromoCode } from "@/lib/actions/pricing";

function formatSummaryAmount(amount: number): string {
  const value = typeof amount === "number" && Number.isFinite(amount) ? Math.max(0, amount) : 0;
  return `NT$${value.toLocaleString()}`;
}

function formatSummaryDiscount(amount: number): string {
  const value = Math.abs(amount);
  return `-NT$${value.toLocaleString()}`;
}

function getDiscountDisplayLabel(line: PricingLineItem): string {
  switch (line.key) {
    case "early_bird":
      return "早鳥優惠";
    case "group":
      return "團報優惠";
    case "promo": {
      const match = line.label.match(/折扣碼\s+(\S+)/);
      return match ? `折扣碼 ${match[1]}` : "折扣碼優惠";
    }
    default:
      return line.label;
  }
}

type PromoCodeInputProps = {
  courseId: string;
  studentCount: number;
  sessionSlotCount: number;
  email?: string;
  appliedCode: string | null;
  packagePricePerStudent?: number;
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
  packagePricePerStudent,
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
        packagePricePerStudent,
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
  showSessionSlots?: boolean;
  packagePricePerStudent?: number;
};

function SummaryRow({
  label,
  value,
  valueClassName = "font-medium text-foreground",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted">{label}</span>
      <span className={valueClassName}>{value}</span>
    </div>
  );
}

function SummaryDivider() {
  return <div className="border-t border-border" />;
}

export function RegistrationPriceSummary({
  pricing,
  showPromoInput = false,
  courseId,
  email,
  appliedPromoCode,
  onPromoApplied,
  variant = "sidebar",
  showSessionSlots = false,
  packagePricePerStudent,
}: RegistrationPriceSummaryProps) {
  const containerClass =
    variant === "sidebar"
      ? "sticky top-24 rounded-3xl border border-border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)]"
      : "rounded-2xl border border-border bg-surface px-5 py-4";

  const discountLines = pricing.lines.filter(
    (line) => line.key !== "subtotal" && line.amount < 0,
  );

  if (pricing.isFreeCourse) {
    return (
      <aside className={containerClass}>
        <h3 className="font-display text-lg font-semibold text-foreground">費用試算</h3>
        <p className="mt-5 text-sm text-muted">此為免費活動，無需付款。</p>
      </aside>
    );
  }

  return (
    <aside className={containerClass}>
      <h3 className="font-display text-lg font-semibold text-foreground">費用試算</h3>

      <div className="mt-5 space-y-4">
        <SummaryRow
          label="報名人數"
          value={`${pricing.studentCount} 位`}
        />
        {showSessionSlots || pricing.sessionSlotCount !== pricing.studentCount ? (
          <SummaryRow label="堂數" value={`${pricing.sessionSlotCount} 堂`} />
        ) : null}

        <SummaryDivider />

        <SummaryRow
          label="單價"
          value={formatSummaryAmount(pricing.basePricePerStudent)}
        />

        {discountLines.map((line) => (
          <SummaryRow
            key={line.key}
            label={getDiscountDisplayLabel(line)}
            value={formatSummaryDiscount(line.amount)}
            valueClassName="font-medium text-emerald-700"
          />
        ))}

        <SummaryDivider />

        <div className="flex items-end justify-between gap-4 pt-1">
          <span className="text-sm font-medium text-foreground">應付金額</span>
          <span className="font-display text-2xl font-semibold leading-none text-gold">
            {formatSummaryAmount(pricing.total)}
          </span>
        </div>
      </div>

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
          packagePricePerStudent={packagePricePerStudent}
        />
      ) : null}
    </aside>
  );
}
