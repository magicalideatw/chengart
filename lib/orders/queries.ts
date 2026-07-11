import type { OrderListItem, OrderRecord } from "@/lib/orders/types";
import type { PaymentMethod, PaymentStatus } from "@/lib/payment/types";
import { isPaymentMethod } from "@/lib/payment/types";
import type { RegistrationOrderFormData } from "@/lib/registration/types";
import { createPaymentClient, createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import type { Database } from "@/lib/supabase/database.types";

function parsePaymentStatus(value: unknown): PaymentStatus {
  if (
    value === "pending" ||
    value === "waiting_transfer" ||
    value === "paid" ||
    value === "cancelled"
  ) {
    return value;
  }
  return "pending";
}

function mapOrderRow(row: Record<string, unknown>): OrderRecord {
  const paymentMethod = row.payment_method ? String(row.payment_method) : null;

  return {
    id: String(row.id),
    merchant_trade_no: String(row.merchant_trade_no),
    course_id: String(row.course_id),
    course_title: String(row.course_title),
    status: row.status as OrderRecord["status"],
    payment_status: parsePaymentStatus(row.payment_status ?? row.status),
    amount: Number(row.amount),
    payment_method:
      paymentMethod && isPaymentMethod(paymentMethod) ? paymentMethod : null,
    ecpay_trade_no: row.ecpay_trade_no ? String(row.ecpay_trade_no) : null,
    registration_id: row.registration_id ? String(row.registration_id) : null,
    name: String(row.name),
    email: String(row.email),
    phone: String(row.phone),
    form_data: row.form_data as RegistrationOrderFormData,
    paid_at: row.paid_at ? String(row.paid_at) : null,
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

export async function createOrder(input: {
  merchantTradeNo: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  formData: RegistrationOrderFormData;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
}): Promise<{ order: OrderRecord | null; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { order: null, error: "Supabase 尚未設定" };
  }

  const supabase = createPaymentClient();
  const status =
    input.paymentStatus === "waiting_transfer"
      ? "waiting_transfer"
      : input.paymentStatus;

  const { data, error } = await supabase
    .from("orders")
    .insert({
      merchant_trade_no: input.merchantTradeNo,
      course_id: input.courseId,
      course_title: input.courseTitle,
      amount: input.amount,
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
  formData: RegistrationOrderFormData;
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
    payment_status: PaymentStatus;
    payment_method: PaymentMethod | null;
    ecpay_trade_no: string | null;
    registration_id: string | null;
    paid_at: string | null;
  }>,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = createPaymentClient();
  const payload: Database["public"]["Tables"]["orders"]["Update"] = {
    ...patch,
    updated_at: new Date().toISOString(),
  };

  if (patch.payment_status && !patch.status) {
    payload.status =
      patch.payment_status === "waiting_transfer"
        ? "waiting_transfer"
        : patch.payment_status;
  }

  const { error } = await supabase.from("orders").update(payload).eq("id", orderId);

  if (error) {
    console.error("Failed to update order:", error.message);
    return false;
  }

  return true;
}
