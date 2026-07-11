"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import type { AdminActionResult } from "@/lib/admin/types";
import { getOrderById } from "@/lib/orders/queries";
import { isOrderPaid } from "@/lib/orders/types";
import { fulfillOrderById } from "@/lib/payment/fulfill-order";

export async function confirmBankTransferPayment(
  orderId: string,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const order = await getOrderById(orderId);
  if (!order) {
    return { success: false, error: "找不到訂單" };
  }

  if (isOrderPaid(order)) {
    return { success: true };
  }

  if (order.payment_method !== "bank_transfer") {
    return { success: false, error: "此訂單不是銀行轉帳付款" };
  }

  if (order.payment_status !== "waiting_transfer") {
    return { success: false, error: "此訂單狀態不可確認收款" };
  }

  const result = await fulfillOrderById(order.id);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/registrations");
  revalidatePath(`/courses/${order.course_id}`);

  return { success: true };
}
