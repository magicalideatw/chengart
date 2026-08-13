"use client";

import type { PaidPaymentMethod, PaymentMethod } from "@/lib/payment/types";
import {
  getPaymentMethodCheckoutLabel,
  resolveOnlinePaymentMethods,
} from "@/lib/payment/types";

type PaymentMethodSelectorProps = {
  allowedMethods: PaymentMethod[];
  value: PaymentMethod | null;
  onChange: (method: PaymentMethod) => void;
  totalAmount: number;
};

export function PaymentMethodSelector({
  allowedMethods,
  value,
  onChange,
  totalAmount,
}: PaymentMethodSelectorProps) {
  const onlineMethods = resolveOnlinePaymentMethods({
    allowedMethods,
    totalAmount,
  });

  if (totalAmount <= 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-5 py-4">
        <p className="text-sm font-medium text-foreground">免費活動</p>
        <p className="mt-2 text-sm text-muted">不需要付款，送出後將直接完成報名。</p>
      </div>
    );
  }

  if (onlineMethods.length === 0) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        此課程尚未設定可用的線上付款方式，請聯絡管理員。
      </p>
    );
  }

  const selectedChannel =
    value === "on_site" ? "on_site" : "online";
  const selectedOnlineMethod: PaidPaymentMethod =
    value === "ecpay" || value === "bank_transfer"
      ? value
      : onlineMethods[0];

  const setOnlineChannel = (method: PaidPaymentMethod) => {
    onChange(method);
  };

  const setOnSiteChannel = () => {
    onChange("on_site");
  };

  return (
    <div className="rounded-2xl border border-border bg-surface px-5 py-4">
      <p className="text-sm font-medium text-foreground">付款方式</p>
      <div className="mt-4 space-y-3">
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${
            selectedChannel === "online"
              ? "border-gold bg-gold-soft text-gold"
              : "border-border text-foreground hover:border-gold/40"
          }`}
        >
          <input
            type="radio"
            name="paymentChannel"
            checked={selectedChannel === "online"}
            onChange={() => setOnlineChannel(selectedOnlineMethod)}
            className="mt-0.5 h-4 w-4 accent-gold"
          />
          <span className="space-y-1">
            <span className="block font-medium">線上付款</span>
            {onlineMethods.length > 1 ? (
              <span className="mt-3 block space-y-2">
                {onlineMethods.map((method) => (
                  <label
                    key={method}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                      selectedChannel === "online" && selectedOnlineMethod === method
                        ? "border-gold/60 bg-white/70"
                        : "border-border/70 bg-white/40"
                    }`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <input
                      type="radio"
                      name="onlinePaymentMethod"
                      checked={
                        selectedChannel === "online" && selectedOnlineMethod === method
                      }
                      onChange={() => setOnlineChannel(method)}
                      className="h-3.5 w-3.5 accent-gold"
                    />
                    <span>{getPaymentMethodCheckoutLabel(method)}</span>
                  </label>
                ))}
              </span>
            ) : (
              <span className="block text-xs text-muted">
                {getPaymentMethodCheckoutLabel(onlineMethods[0])}
              </span>
            )}
          </span>
        </label>

        <label
          className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${
            selectedChannel === "on_site"
              ? "border-gold bg-gold-soft text-gold"
              : "border-border text-foreground hover:border-gold/40"
          }`}
        >
          <input
            type="radio"
            name="paymentChannel"
            checked={selectedChannel === "on_site"}
            onChange={setOnSiteChannel}
            className="mt-0.5 h-4 w-4 accent-gold"
          />
          <span className="space-y-1">
            <span className="block font-medium">現場繳費</span>
            <span className="block text-xs leading-relaxed text-muted">
              報名完成後，請於上課／活動當日現場繳費。
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}
