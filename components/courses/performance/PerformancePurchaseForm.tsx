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
import {
  calculateSessionPurchaseSummary,
  isPaidSession,
  resolvePerformancePurchaseMode,
  SESSION_QUANTITY_ERROR,
  validateSessionQuantity,
} from "@/lib/performance/purchase";
import { formatSessionDisplayPrice } from "@/lib/sessions/format";
import type { ClassSession } from "@/lib/sessions/types";
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
import { PerformanceSessionPicker } from "./PerformanceSessionPicker";

type PerformancePurchaseFormProps = {
  course: CourseWithEnrollment;
  ticketTypes: TicketTypeRecord[];
  sessions: ClassSession[];
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
  sessions,
}: PerformancePurchaseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const purchaseMode = resolvePerformancePurchaseMode({ ticketTypes, sessions });
  const usesSessionPurchase = purchaseMode === "session";
  const usesTicketPurchase = purchaseMode === "ticket";

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionQuantity, setSessionQuantity] = useState(1);
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    createInitialQuantities(ticketTypes),
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
  );

  const ticketSummary = useMemo(
    () => calculateTicketPurchaseSummary(ticketTypes, quantities),
    [ticketTypes, quantities],
  );

  const sessionSummary = useMemo(() => {
    if (!selectedSession) {
      return { lines: [], totalTickets: 0, totalAmount: 0 };
    }
    return calculateSessionPurchaseSummary(selectedSession, sessionQuantity);
  }, [selectedSession, sessionQuantity]);

  const summary = usesSessionPurchase ? sessionSummary : ticketSummary;

  const awaitingSessionSelection = usesSessionPurchase && !selectedSession;

  const isPaid = usesSessionPurchase
    ? selectedSession
      ? isPaidSession(selectedSession)
      : false
    : isPaidPerformance(ticketTypes);

  const requiresSessionSelection = usesSessionPurchase || sessions.length > 0;
  const hasValidSelection = usesSessionPurchase
    ? Boolean(selectedSession) && validateSessionQuantity(sessionQuantity)
    : hasSelectedTickets(ticketSummary);

  const showCheckoutDetails =
    hasValidSelection && (!requiresSessionSelection || selectedSessionId);

  const availablePaymentMethods = useMemo(() => {
    if (!isPaid) {
      return ["free"] as PaymentMethod[];
    }

    if (!hasValidSelection) {
      return [];
    }

    return resolveAvailablePaymentMethods({
      allowedMethods: course.allowedPaymentMethods,
      totalAmount: summary.totalAmount,
    });
  }, [
    course.allowedPaymentMethods,
    hasValidSelection,
    isPaid,
    summary.totalAmount,
  ]);

  const resolvedPaymentMethod =
    paymentMethod && availablePaymentMethods.includes(paymentMethod)
      ? paymentMethod
      : resolveDefaultPaymentMethod(availablePaymentMethods);

  const updateTicketQuantity = (ticketTypeId: string, delta: number) => {
    setQuantities((current) => {
      const next = Math.max(0, (current[ticketTypeId] ?? 0) + delta);
      return { ...current, [ticketTypeId]: next };
    });
    setFormError(null);
  };

  const updateSessionQuantity = (delta: number) => {
    setSessionQuantity((current) => Math.max(1, current + delta));
    setFormError(null);
  };

  const handleSubmit = () => {
    setFieldErrors({});
    setFormError(null);

    if (requiresSessionSelection && !selectedSessionId) {
      setFormError("請選擇場次");
      return;
    }

    if (usesSessionPurchase) {
      if (!validateSessionQuantity(sessionQuantity)) {
        setFormError(SESSION_QUANTITY_ERROR);
        return;
      }
    } else if (!validateTicketSelection(quantities)) {
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
        sessionId: selectedSessionId ?? undefined,
        sessionQuantity: usesSessionPurchase ? sessionQuantity : undefined,
        quantities: usesTicketPurchase ? quantities : undefined,
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
      {sessions.length > 0 ? (
        <div className={sectionClass}>
          <h2 className="font-display text-lg font-semibold text-foreground">
            場次選擇
          </h2>
          <div className="mt-6">
            <PerformanceSessionPicker
              sessions={sessions}
              selectedSessionId={selectedSessionId}
              showRemainingCapacity={course.showRemainingCapacity}
              onChange={(sessionId) => {
                setSelectedSessionId(sessionId);
                setSessionQuantity(1);
                setFormError(null);
              }}
            />
          </div>
        </div>
      ) : null}

      {usesSessionPurchase && selectedSession ? (
        <div className={sectionClass}>
          <h2 className="font-display text-lg font-semibold text-foreground">
            活動費用
          </h2>
          <div className="mt-6 space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-muted">單價</p>
                <p className="mt-1 text-lg font-semibold text-gold">
                  {formatSessionDisplayPrice(selectedSession.price)}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted">數量</p>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateSessionQuantity(-1)}
                    disabled={sessionQuantity <= 1 || isPending}
                    aria-label="減少數量"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-lg text-foreground transition hover:border-gold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-medium text-foreground">
                    {sessionQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateSessionQuantity(1)}
                    disabled={
                      isPending ||
                      sessionQuantity >= selectedSession.remainingCapacity
                    }
                    aria-label="增加數量"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-lg text-foreground transition hover:border-gold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                {course.showRemainingCapacity ? (
                  <p className="mt-2 text-xs text-muted">
                    剩餘 {selectedSession.remainingCapacity} 位
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-border pt-5">
              <span className="text-sm font-medium text-foreground">總金額</span>
              <span className="font-display text-xl font-semibold text-gold">
                {isPaidSession(selectedSession)
                  ? formatFee(sessionSummary.totalAmount)
                  : "免費"}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {usesTicketPurchase ? (
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
                      onClick={() => updateTicketQuantity(ticketType.id, -1)}
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
                      onClick={() => updateTicketQuantity(ticketType.id, 1)}
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
      ) : null}

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

      {awaitingSessionSelection ? (
        <div className="rounded-2xl border border-border bg-surface px-5 py-4">
          <p className="text-sm text-muted">
            請先選擇場次，系統將自動顯示活動費用與付款方式。
          </p>
        </div>
      ) : usesSessionPurchase && selectedSession ? (
        isPaidSession(selectedSession) ? (
          <PaymentMethodSelector
            availableMethods={availablePaymentMethods}
            value={resolvedPaymentMethod}
            onChange={setPaymentMethod}
            totalAmount={summary.totalAmount}
          />
        ) : (
          <div className="rounded-2xl border border-border bg-surface px-5 py-4">
            <p className="text-sm font-medium text-foreground">免費活動</p>
            <p className="mt-2 text-sm text-muted">
              不需要付款，送出後將直接完成報名。
            </p>
          </div>
        )
      ) : isPaid && !hasValidSelection ? (
        <div className="rounded-2xl border border-border bg-surface px-5 py-4">
          <p className="text-sm text-muted">請先選擇票種。</p>
        </div>
      ) : !isPaid ? (
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
                  {usesSessionPurchase && selectedSession && !isPaidSession(selectedSession)
                    ? "免費"
                    : formatFee(summary.totalAmount)}
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
