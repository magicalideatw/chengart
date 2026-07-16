import type { PricingSnapshot } from "@/lib/pricing/types";
import { parsePricingSnapshot } from "@/lib/pricing/engine";
import { parseOrderFulfillmentStatus } from "@/lib/orders/order-status";
import type { OrderFormData } from "@/lib/orders/order-form-data";
import {
  getPerformanceTicketCount,
  isPerformanceOrderFormData,
} from "@/lib/orders/order-form-data";
import { isOrderPaid, type OrderListItem, type OrderRecord } from "@/lib/orders/types";
import type { PaymentMethod, PaymentStatus } from "@/lib/payment/types";
import { isPaymentMethod } from "@/lib/payment/types";
import { createPaymentClient, createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import type { Database } from "@/lib/supabase/database.types";

function parsePaymentStatus(value: unknown): PaymentStatus {
  if (
    value === "pending" ||
    value === "waiting_transfer" ||
    value === "paid" ||
    value === "cancelled" ||
    value === "refunded"
  ) {
    return value;
  }
  return "pending";
}

export function mapOrderRow(row: Record<string, unknown>): OrderRecord {
  const paymentMethod = row.payment_method ? String(row.payment_method) : null;

  return {
    id: String(row.id),
    merchant_trade_no: String(row.merchant_trade_no),
    course_id: String(row.course_id),
    course_title: String(row.course_title),
    status: row.status as OrderRecord["status"],
    order_status: parseOrderFulfillmentStatus(
      row.order_status ??
        (row.payment_status === "paid" || row.status === "paid"
          ? "completed"
          : row.payment_status === "cancelled" || row.status === "cancelled"
            ? "cancelled"
            : "pending"),
    ),
    payment_status: parsePaymentStatus(row.payment_status ?? row.status),
    amount: Number(row.amount),
    subtotal: row.subtotal == null ? null : Number(row.subtotal),
    discount_total: Number(row.discount_total ?? 0),
    promo_code: row.promo_code ? String(row.promo_code) : null,
    pricing_snapshot:
      parsePricingSnapshot(row.pricing_snapshot) ??
      (row.pricing_snapshot as PricingSnapshot | Record<string, unknown>) ??
      {},
    payment_method:
      paymentMethod && isPaymentMethod(paymentMethod) ? paymentMethod : null,
    ecpay_trade_no: row.ecpay_trade_no ? String(row.ecpay_trade_no) : null,
    registration_id: row.registration_id ? String(row.registration_id) : null,
    name: String(row.name),
    email: String(row.email),
    phone: String(row.phone),
    form_data: row.form_data as OrderFormData,
    paid_at: row.paid_at ? String(row.paid_at) : null,
    transfer_reported: Boolean(row.transfer_reported),
    transfer_last5: row.transfer_last5 ? String(row.transfer_last5) : null,
    transfer_date: row.transfer_date ? String(row.transfer_date) : null,
    transfer_time: row.transfer_time ? String(row.transfer_time) : null,
    transfer_note: row.transfer_note ? String(row.transfer_note) : null,
    transfer_reported_at: row.transfer_reported_at
      ? String(row.transfer_reported_at)
      : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function getOrderById(id: string): Promise<OrderRecord | null> {
  if (!isSupabaseConfigured() || !id) return null;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Failed to fetch order:", error.message);
    return null;
  }

  return mapOrderRow(data);
}

export async function getOrderByMerchantTradeNo(
  merchantTradeNo: string,
): Promise<OrderRecord | null> {
  if (!isSupabaseConfigured() || !merchantTradeNo) return null;

  const supabase = createPaymentClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("merchant_trade_no", merchantTradeNo)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Failed to fetch order by trade no:", error.message);
    return null;
  }

  return mapOrderRow(data);
}

export async function getAllOrders(): Promise<OrderListItem[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch orders:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapOrderRow(row));
}

export async function getSoldTicketCountsByCourseIds(
  courseIds: string[],
): Promise<Record<string, number>> {
  const { unstable_noStore: noStore } = await import("next/cache");
  noStore();

  if (!isSupabaseConfigured() || courseIds.length === 0) {
    return {};
  }

  const courseIdSet = new Set(courseIds);
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("course_id, payment_status, status, order_status, form_data")
    .in("course_id", courseIds)
    .or("payment_status.eq.paid,status.eq.paid");

  if (error) {
    console.error("Failed to fetch sold ticket counts:", error.message);
    return {};
  }

  const counts: Record<string, number> = {};

  for (const row of data ?? []) {
    const courseId = row.course_id ? String(row.course_id) : "";
    if (!courseId || !courseIdSet.has(courseId)) continue;

    const order = mapOrderRow(row as Record<string, unknown>);
    if (!isOrderPaid(order)) continue;

    const formData = order.form_data as OrderFormData | Record<string, unknown>;
    if (!isPerformanceOrderFormData(formData)) continue;

    const ticketCount = getPerformanceTicketCount(formData);
    if (ticketCount <= 0) continue;

    counts[courseId] = (counts[courseId] ?? 0) + ticketCount;
  }

  return counts;
}

export async function createOrder(input: {
  merchantTradeNo: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  subtotal?: number;
  discountTotal?: number;
  promoCode?: string | null;
  pricingSnapshot?: PricingSnapshot | Record<string, unknown>;
  formData: OrderFormData;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
}): Promise<{ order: OrderRecord | null; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { order: null, error: "Supabase 尚未設定" };
  }

  const supabase = createPaymentClient();
  // RLS orders_insert_public only allows status = 'pending'.
  // Bank transfer uses payment_status = 'waiting_transfer' until admin confirms.
  const status: OrderRecord["status"] = "pending";

  console.log("[createOrder] form_data (insert payload):", input.formData);

  const { data, error } = await supabase
    .from("orders")
    .insert({
      merchant_trade_no: input.merchantTradeNo,
      course_id: input.courseId,
      course_title: input.courseTitle,
      amount: input.amount,
      subtotal: input.subtotal ?? input.amount,
      discount_total: input.discountTotal ?? 0,
      promo_code: input.promoCode ?? null,
      pricing_snapshot: (input.pricingSnapshot ?? {}) as Database["public"]["Tables"]["orders"]["Insert"]["pricing_snapshot"],
      status,
      payment_status: input.paymentStatus,
      payment_method: input.paymentMethod,
      name: input.formData.name,
      email: input.formData.email,
      phone: input.formData.phone,
      form_data: input.formData,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Failed to create order:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      courseId: input.courseId,
    });

    if (error.code === "PGRST205") {
      return {
        order: null,
        error: "訂單系統初始化中，請稍候 1 分鐘後再試",
      };
    }

    if (error.code === "42501" || error.message.includes("row-level security")) {
      return {
        order: null,
        error: "訂單權限設定未完成，請聯絡管理員",
      };
    }

    if (error.code === "23503") {
      return {
        order: null,
        error: "找不到此課程，請重新整理頁面",
      };
    }

    return { order: null, error: "建立訂單失敗，請稍後再試" };
  }

  return { order: mapOrderRow(data) };
}

/** @deprecated use createOrder */
export async function createPendingOrder(input: {
  merchantTradeNo: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  formData: OrderFormData;
}): Promise<{ order: OrderRecord | null; error?: string }> {
  return createOrder({
    ...input,
    paymentMethod: "ecpay",
    paymentStatus: "pending",
  });
}

export async function updateOrderStatus(
  orderId: string,
  patch: Partial<{
    status: OrderRecord["status"];
    order_status: OrderRecord["order_status"];
    payment_status: PaymentStatus;
    payment_method: PaymentMethod | null;
    ecpay_trade_no: string | null;
    registration_id: string | null;
    paid_at: string | null;
  }>,
): Promise<boolean> {
  console.log("[updateOrderStatus] start", { orderId, patch });

  if (!isSupabaseConfigured()) {
    console.error("[updateOrderStatus] Supabase not configured");
    return false;
  }

  const supabase = createPaymentClient();
  const payload: Database["public"]["Tables"]["orders"]["Update"] = {
    ...patch,
    updated_at: new Date().toISOString(),
  };

  if (patch.payment_status && !patch.status) {
    payload.status =
      patch.payment_status === "waiting_transfer"
        ? "waiting_transfer"
        : patch.payment_status === "refunded"
          ? "cancelled"
          : patch.payment_status;
  }

  console.log("[updateOrderStatus] payload", payload);

  const { error } = await supabase.from("orders").update(payload).eq("id", orderId);

  if (error) {
    console.error("[updateOrderStatus] FAILED", {
      orderId,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return false;
  }

  console.log("[updateOrderStatus] OK", { orderId });
  return true;
}
