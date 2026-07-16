"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatFee } from "@/lib/admin/format";
import { createPerformanceOrder } from "@/lib/actions/performance-order";
import type { CourseWithEnrollment } from "@/lib/courses/types";
import type { PaymentMethod } from "@/lib/payment/types";
import {
  resolveAvailablePaymentMethods,
  resolveDefaultPaymentMethod,
} from "@/lib/payment/types";
import type { TicketTypeRecord } from "@/lib/ticket-types/types";
import {
  calculateTicketPurchaseSummary,
  hasSelectedTickets,
  isPaidPerformance,
  ticketPurchaseFormSchema,
  TICKET_SELECTION_ERROR,
  validateTicketSelection,
} from "@/lib/validation/ticket-purchase-schema";
import { PaymentMethodSelector } from "@/components/courses/registration/PaymentMethodSelector";

type PerformancePurchaseFormProps = {
  course: CourseWithEnrollment;
  ticketTypes: TicketTypeRecord[];
};

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

const sectionClass =
  "rounded-3xl border border-border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:p-8";

function createInitialQuantities(ticketTypes: TicketTypeRecord[]) {
  return Object.fromEntries(ticketTypes.map((ticketType) => [ticketType.id, 0]));
}

export function PerformancePurchaseForm({
  course,
  ticketTypes,
}: PerformancePurchaseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    createInitialQuantities(ticketTypes),
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const summary = useMemo(
    () => calculateTicketPurchaseSummary(ticketTypes, quantities),
    [ticketTypes, quantities],
  );

  const paidPerformance = isPaidPerformance(ticketTypes);
  const ticketsSelected = hasSelectedTickets(summary);
  const showCheckoutDetails = !paidPerformance || ticketsSelected;

  const availablePaymentMethods = useMemo(() => {
    if (!paidPerformance) {
      return ["free"] as PaymentMethod[];
    }

    if (!ticketsSelected) {
      return [];
    }

    return resolveAvailablePaymentMethods({
      allowedMethods: course.allowedPaymentMethods,
      totalAmount: summary.totalAmount,
    });
  }, [
    course.allowedPaymentMethods,
    paidPerformance,
    summary.totalAmount,
    ticketsSelected,
  ]);

  const resolvedPaymentMethod =
    paymentMethod && availablePaymentMethods.includes(paymentMethod)
      ? paymentMethod
      : resolveDefaultPaymentMethod(availablePaymentMethods);

  const updateQuantity = (ticketTypeId: string, delta: number) => {
    setQuantities((current) => {
      const next = Math.max(0, (current[ticketTypeId] ?? 0) + delta);
      return { ...current, [ticketTypeId]: next };
    });
    setFormError(null);
  };

  const handleSubmit = () => {
    setFieldErrors({});
    setFormError(null);

    if (!validateTicketSelection(quantities)) {
      setFormError(TICKET_SELECTION_ERROR);
      return;
    }

    const parsed = ticketPurchaseFormSchema.safeParse({
      name,
      phone,
      email,
      paymentMethod: resolvedPaymentMethod ?? undefined,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    if (summary.totalAmount > 0 && !resolvedPaymentMethod) {
      setFormError("請選擇付款方式");
      return;
    }

    startTransition(async () => {
      const result = await createPerformanceOrder({
        courseId: course.id,
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email,
        paymentMethod: resolvedPaymentMethod ?? "free",
        quantities,
      });

      if (!result.success) {
        setFormError(result.error);
        return;
      }

      router.push(result.redirectPath);
    });
  };

  return (
    <section className="mx-auto max-w-3xl space-y-8 px-5 py-10 md:px-8">
      <div className={sectionClass}>
        <h2 className="font-display text-lg font-semibold text-foreground">票種</h2>
        <div className="mt-6 space-y-0 divide-y divide-border">
          {ticketTypes.map((ticketType) => {
            const quantity = quantities[ticketType.id] ?? 0;

            return (
              <div
                key={ticketType.id}
                className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{ticketType.name}</p>
                  <p className="mt-1 text-sm text-gold">{formatFee(ticketType.price)}</p>
                  {ticketType.description.trim() ? (
                    <p className="mt-2 text-sm text-muted">{ticketType.description}</p>
                  ) : null}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateQuantity(ticketType.id, -1)}
                    disabled={quantity <= 0 || isPending}
                    aria-label={`減少 ${ticketType.name}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-lg text-foreground transition hover:border-gold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-medium text-foreground">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(ticketType.id, 1)}
                    disabled={isPending}
                    aria-label={`增加 ${ticketType.name}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-lg text-foreground transition hover:border-gold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className="font-display text-lg font-semibold text-foreground">
          購票人資訊
        </h2>
        <div className="mt-5 space-y-5">
          <div>
            <label className="text-sm font-medium text-foreground">
              姓名 <span className="text-gold">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isPending}
              className={inputClass}
            />
            {fieldErrors.name ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              手機 <span className="text-gold">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              disabled={isPending}
              className={inputClass}
            />
            {fieldErrors.phone ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Email <span className="text-gold">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isPending}
              className={inputClass}
            />
            {fieldErrors.email ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
            ) : null}
          </div>
        </div>
      </div>

      {paidPerformance && !ticketsSelected ? (
        <div className="rounded-2xl border border-border bg-surface px-5 py-4">
          <p className="text-sm text-muted">請先選擇票種。</p>
        </div>
      ) : !paidPerformance ? (
        <div className="rounded-2xl border border-border bg-surface px-5 py-4">
          <p className="text-sm font-medium text-foreground">免費活動</p>
          <p className="mt-2 text-sm text-muted">
            不需要付款，送出後將直接完成報名。
          </p>
        </div>
      ) : (
        <PaymentMethodSelector
          availableMethods={availablePaymentMethods}
          value={resolvedPaymentMethod}
          onChange={setPaymentMethod}
          totalAmount={summary.totalAmount}
        />
      )}

      {showCheckoutDetails ? (
        <div className={sectionClass}>
          <h2 className="font-display text-lg font-semibold text-foreground">總金額</h2>
          <div className="mt-5 space-y-3 text-sm">
            <p className="text-foreground">
              共：<span className="font-medium">{summary.totalTickets} 張</span>
            </p>
            {summary.lines.map((line) => (
              <p key={line.ticketTypeId} className="text-muted">
                {line.name} ×{line.quantity}
              </p>
            ))}
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium text-foreground">總金額</span>
                <span className="font-display text-xl font-semibold text-gold">
                  {formatFee(summary.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {formError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </p>
      ) : null}

      {showCheckoutDetails ? (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full rounded-full bg-gold px-6 py-3.5 text-sm font-medium text-white transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "處理中…" : course.actionButtonText}
        </button>
      ) : null}
    </section>
  );
}
