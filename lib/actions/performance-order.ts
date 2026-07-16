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
  quantities: Record<string, number>;
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

  const ticketTypes = await getActiveTicketTypesByCourseId(course.id);
  if (ticketTypes.length === 0) {
    return { success: false, error: "票種尚未開放，請稍後再試" };
  }

  const ticketResult = buildValidatedTicketLines(ticketTypes, input.quantities);
  if (!ticketResult.success) {
    return { success: false, error: ticketResult.error };
  }

  const { summary } = ticketResult;
  const amount = summary.totalAmount;

  const paymentError = assertOrderPaymentMethod({
    course,
    totalAmount: amount,
    paymentMethod: input.paymentMethod,
  });
  if (paymentError) {
    return { success: false, error: paymentError };
  }

  const pricingSnapshot: PerformancePricingSnapshot = {
    orderType: PERFORMANCE_ORDER_TYPE,
    totalTickets: summary.totalTickets,
    totalAmount: summary.totalAmount,
    lines: summary.lines,
  };

  const formData: PerformanceOrderFormData = {
    orderType: PERFORMANCE_ORDER_TYPE,
    name: parsedContact.data.name,
    phone: parsedContact.data.phone,
    email: parsedContact.data.email,
    paymentMethod: input.paymentMethod,
    ticketLines: summary.lines,
    pricingSnapshot,
  };

  console.log("[createPerformanceOrder] PerformanceOrderFormData:", formData);
  console.log("[createPerformanceOrder] formData.orderType:", formData.orderType);

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
