"use server";

import { revalidatePath } from "next/cache";
import { getOrderById } from "@/lib/orders/queries";
import { createPaymentClient, isSupabaseConfigured } from "@/lib/supabase";
import { transferReportSchema } from "@/lib/validation/transfer-report-schema";

export type ReportBankTransferResult =
  | { success: true }
  | { success: false; error: string };

export async function reportBankTransfer(
  input: unknown,
): Promise<ReportBankTransferResult> {
  const parsed = transferReportSchema.safeParse(input);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "表單資料有誤";
    return { success: false, error: firstError };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  const { orderId, transferLast5, transferDate, transferTime, transferNote } =
    parsed.data;

  const order = await getOrderById(orderId);

  if (!order) {
    return { success: false, error: "找不到訂單" };
  }

  if (order.payment_method !== "bank_transfer") {
    return { success: false, error: "此訂單不支援匯款回報" };
  }

  if (order.payment_status !== "waiting_transfer") {
    return { success: false, error: "此訂單狀態不可回報匯款" };
  }

  if (order.transfer_reported) {
    return { success: false, error: "您已回報過匯款，請等候核帳" };
  }

  const supabase = createPaymentClient();
  const reportedAt = new Date().toISOString();

  const { error } = await supabase
    .from("orders")
    .update({
      transfer_reported: true,
      transfer_last5: transferLast5,
      transfer_date: transferDate,
      transfer_time: `${transferTime}:00`,
      transfer_note: transferNote?.trim() || null,
      transfer_reported_at: reportedAt,
      updated_at: reportedAt,
    })
    .eq("id", orderId)
    .eq("transfer_reported", false);

  if (error) {
    console.error("reportBankTransfer failed:", error.message);
    return { success: false, error: "送出失敗，請稍後再試" };
  }

  revalidatePath(`/payment/bank-transfer/${orderId}`);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");

  return { success: true };
}
