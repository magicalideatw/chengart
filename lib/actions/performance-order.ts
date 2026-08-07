"use server";

import { getCourseWithEnrollment } from "@/lib/courses/queries";
import { isBeforeRegistrationDeadline } from "@/lib/courses/enrollment";
import { isInternalParticipation } from "@/lib/courses/participation-method";
import {
  assertOrderPaymentMethod,
  buildMerchantTradeNoAndPaymentStatus,
  finalizeCreatedOrder,
  type FinalizeOrderResult,
} from "@/lib/orders/finalize-order";
import {
  PERFORMANCE_ORDER_TYPE,
  type PerformanceOrderFormData,
  type PerformancePricingSnapshot,
} from "@/lib/orders/order-form-data";
import {
  buildPerformanceSessionOrderSnapshot,
  calculateSessionPurchaseSummary,
  resolvePerformancePurchaseMode,
  validateSessionQuantity,
  SESSION_QUANTITY_ERROR,
} from "@/lib/performance/purchase";
import { validatePerformanceSessionSelection } from "@/lib/registration/queries";
import { getOpenSessionsByCourseId } from "@/lib/sessions/queries";
import { getActiveTicketTypesByCourseId } from "@/lib/ticket-types/queries";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { PaymentMethod } from "@/lib/payment/types";
import { isPaymentMethod } from "@/lib/payment/types";
import {
  calculateTicketPurchaseSummary,
  ticketPurchaseFormSchema,
  TICKET_SELECTION_ERROR,
  validateTicketSelection,
} from "@/lib/validation/ticket-purchase-schema";

export type CreatePerformanceOrderInput = {
  courseId: string;
  name: string;
  phone: string;
  email: string;
  paymentMethod: PaymentMethod;
  quantities?: Record<string, number>;
  sessionId?: string;
  sessionQuantity?: number;
};

export type CreatePerformanceOrderResult = FinalizeOrderResult;

function buildValidatedTicketLines(
  ticketTypes: Awaited<ReturnType<typeof getActiveTicketTypesByCourseId>>,
  quantities: Record<string, number>,
) {
  const ticketTypeById = new Map(ticketTypes.map((ticketType) => [ticketType.id, ticketType]));
  const sanitizedQuantities: Record<string, number> = {};

  for (const [ticketTypeId, quantity] of Object.entries(quantities)) {
    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) continue;
    if (!ticketTypeById.has(ticketTypeId)) {
      return { success: false as const, error: "票種資料已更新，請重新整理頁面後再試" };
    }
    sanitizedQuantities[ticketTypeId] = Math.floor(parsedQuantity);
  }

  if (!validateTicketSelection(sanitizedQuantities)) {
    return { success: false as const, error: TICKET_SELECTION_ERROR };
  }

  const summary = calculateTicketPurchaseSummary(
    ticketTypes.map((ticketType) => ({
      id: ticketType.id,
      name: ticketType.name,
      price: ticketType.price,
    })),
    sanitizedQuantities,
  );

  if (summary.totalTickets <= 0) {
    return { success: false as const, error: TICKET_SELECTION_ERROR };
  }

  for (const line of summary.lines) {
    const ticketType = ticketTypeById.get(line.ticketTypeId);
    if (!ticketType || ticketType.price !== line.price) {
      return { success: false as const, error: "票種價格已變更，請重新整理頁面後再試" };
    }
  }

  return { success: true as const, summary };
}

export async function createPerformanceOrder(
  input: CreatePerformanceOrderInput,
): Promise<CreatePerformanceOrderResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  if (!isPaymentMethod(input.paymentMethod)) {
    return { success: false, error: "請選擇有效的付款方式" };
  }

  const parsedContact = ticketPurchaseFormSchema.safeParse({
    name: input.name,
    phone: input.phone,
    email: input.email,
    paymentMethod: input.paymentMethod,
  });

  if (!parsedContact.success) {
    return {
      success: false,
      error: parsedContact.error.issues[0]?.message ?? "表單資料有誤",
    };
  }

  const course = await getCourseWithEnrollment(input.courseId);

  if (!course) {
    return { success: false, error: "找不到此活動" };
  }

  if (course.activityType !== "performance") {
    return { success: false, error: "此活動不支援購票" };
  }

  if (!isInternalParticipation(course.participationMethod)) {
    return { success: false, error: "此活動不在本站售票" };
  }

  if (!course.isOpen) {
    return { success: false, error: "此活動目前未開放購票" };
  }

  if (!isBeforeRegistrationDeadline(course)) {
    return { success: false, error: "此活動購票已截止" };
  }

  const [ticketTypes, openSessions] = await Promise.all([
    getActiveTicketTypesByCourseId(course.id),
    getOpenSessionsByCourseId(course.id),
  ]);

  const purchaseMode = resolvePerformancePurchaseMode({
    ticketTypes,
    sessions: openSessions,
  });

  if (!purchaseMode) {
    return { success: false, error: "場次或票種尚未開放，請稍後再試" };
  }

  let amount = 0;
  let pricingSnapshot: PerformancePricingSnapshot;
  let formData: PerformanceOrderFormData;

  if (purchaseMode === "session") {
    if (!input.sessionId) {
      return { success: false, error: "請選擇場次" };
    }

    const quantity = Number(input.sessionQuantity ?? 0);
    if (!validateSessionQuantity(quantity)) {
      return { success: false, error: SESSION_QUANTITY_ERROR };
    }

    const sessionResult = await validatePerformanceSessionSelection(
      course.id,
      input.sessionId,
    );
    if (!sessionResult.success) {
      return { success: false, error: sessionResult.error };
    }

    const session = sessionResult.data.session;
    if (quantity > session.remainingCapacity) {
      return { success: false, error: "所選場次剩餘名額不足，請調整數量" };
    }

    const sessionSnapshot = buildPerformanceSessionOrderSnapshot(session, quantity);
    const summary = calculateSessionPurchaseSummary(session, quantity);
    amount = sessionSnapshot.amount;

    pricingSnapshot = {
      orderType: PERFORMANCE_ORDER_TYPE,
      purchaseMode: "session",
      totalTickets: summary.totalTickets,
      totalAmount: summary.totalAmount,
      lines: summary.lines,
    };

    formData = {
      orderType: PERFORMANCE_ORDER_TYPE,
      purchaseMode: "session",
      name: parsedContact.data.name,
      phone: parsedContact.data.phone,
      email: parsedContact.data.email,
      paymentMethod: input.paymentMethod,
      sessionId: sessionSnapshot.sessionId,
      unitPrice: sessionSnapshot.unitPrice,
      quantity: sessionSnapshot.quantity,
      sessionSnapshot,
      ticketLines: [],
      pricingSnapshot,
    };
  } else {
    const openSessionsForTickets = openSessions;
    const requiresSession = openSessionsForTickets.length > 0;

    if (requiresSession) {
      if (!input.sessionId) {
        return { success: false, error: "請選擇場次" };
      }

      const sessionResult = await validatePerformanceSessionSelection(
        course.id,
        input.sessionId,
      );
      if (!sessionResult.success) {
        return { success: false, error: sessionResult.error };
      }
    }

    const ticketResult = buildValidatedTicketLines(
      ticketTypes,
      input.quantities ?? {},
    );
    if (!ticketResult.success) {
      return { success: false, error: ticketResult.error };
    }

    const { summary } = ticketResult;

    if (requiresSession && input.sessionId) {
      const sessionResult = await validatePerformanceSessionSelection(
        course.id,
        input.sessionId,
      );
      if (
        sessionResult.success &&
        summary.totalTickets > sessionResult.data.session.remainingCapacity
      ) {
        return { success: false, error: "所選場次剩餘名額不足，請調整票數" };
      }
    }

    amount = summary.totalAmount;

    pricingSnapshot = {
      orderType: PERFORMANCE_ORDER_TYPE,
      purchaseMode: "ticket",
      totalTickets: summary.totalTickets,
      totalAmount: summary.totalAmount,
      lines: summary.lines,
    };

    formData = {
      orderType: PERFORMANCE_ORDER_TYPE,
      purchaseMode: "ticket",
      name: parsedContact.data.name,
      phone: parsedContact.data.phone,
      email: parsedContact.data.email,
      paymentMethod: input.paymentMethod,
      sessionId: input.sessionId,
      ticketLines: summary.lines,
      pricingSnapshot,
    };
  }

  const paymentError = assertOrderPaymentMethod({
    course,
    totalAmount: amount,
    paymentMethod: input.paymentMethod,
  });
  if (paymentError) {
    return { success: false, error: paymentError };
  }

  const { merchantTradeNo, paymentStatus } = buildMerchantTradeNoAndPaymentStatus(
    input.paymentMethod,
  );

  return finalizeCreatedOrder({
    course,
    paymentMethod: input.paymentMethod,
    merchantTradeNo,
    amount,
    subtotal: amount,
    discountTotal: 0,
    pricingSnapshot,
    formData,
    paymentStatus: input.paymentMethod === "free" ? "pending" : paymentStatus,
  });
}
