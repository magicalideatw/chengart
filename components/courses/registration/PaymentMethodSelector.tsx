"use client";

import type { PaymentMethod } from "@/lib/payment/types";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment/types";

type PaymentMethodSelectorProps = {
  availableMethods: PaymentMethod[];
  value: PaymentMethod | null;
  onChange: (method: PaymentMethod) => void;
  totalAmount: number;
};

export function PaymentMethodSelector({
  availableMethods,
  value,
  onChange,
  totalAmount,
}: PaymentMethodSelectorProps) {
  if (availableMethods.length === 0) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        此課程尚未設定可用的付款方式，請聯絡管理員。
      </p>
    );
  }

  if (availableMethods.length === 1 && availableMethods[0] === "free") {
    return (
      <div className="rounded-2xl border border-border bg-surface px-5 py-4">
        <p className="text-sm font-medium text-foreground">免費活動</p>
        <p className="mt-2 text-sm text-muted">不需要付款，送出後將直接完成報名。</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface px-5 py-4">
      <p className="text-sm font-medium text-foreground">付款方式</p>
      <div className="mt-4 space-y-3">
        {availableMethods.map((method) => (
          <label
            key={method}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
              value === method
                ? "border-gold bg-gold-soft text-gold"
                : "border-border text-foreground hover:border-gold/40"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              checked={value === method}
              onChange={() => onChange(method)}
              className="h-4 w-4 accent-gold"
            />
            <span className="font-medium">{PAYMENT_METHOD_LABELS[method]}</span>
            {method === "free" && totalAmount <= 0 ? (
              <span className="text-xs text-muted">（總金額 $0）</span>
            ) : null}
          </label>
        ))}
      </div>
    </div>
  );
}
