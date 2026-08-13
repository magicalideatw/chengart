"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import type { AdminActionResult } from "@/lib/admin/types";
import { getCourseWithEnrollment } from "@/lib/courses/queries";
import {
  notifyParentBankTransferPending,
  notifyParentPaymentConfirmed,
  notifyParentPaymentSuccess,
  notifyParentRegistrationSuccess,
} from "@/lib/email/dispatch";
import { getOrderById, updateOrderStatus } from "@/lib/orders/queries";
import { isPerformanceOrderFormData } from "@/lib/orders/order-form-data";
import { isOrderPaid } from "@/lib/orders/types";
import {
  fulfillOnSiteOrderById,
  fulfillOrderById,
} from "@/lib/payment/fulfill-order";

function revalidateOrderPaths(orderId: string, courseId?: string) {
  revalidatePath("/admin/orders");
  revalidatePath("/admin/performance-orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/registrations");
  revalidatePath("/admin");
  if (courseId) {
    revalidatePath(`/courses/${courseId}`);
  }
}

export async function confirmOnSitePayment(
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

  if (order.payment_method !== "on_site") {
    return { success: false, error: "此訂單不是現場繳費" };
  }

  if (order.payment_status !== "pending") {
    return { success: false, error: "此訂單狀態不可確認收款" };
  }

  const course = await getCourseWithEnrollment(order.course_id);
  if (!course) {
    return { success: false, error: "找不到課程" };
  }

  if (isPerformanceOrderFormData(order.form_data)) {
    const result = await fulfillOrderById(order.id);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    revalidateOrderPaths(order.id, order.course_id);
    return { success: true };
  }

  const fulfillment = await fulfillOnSiteOrderById(order.id);
  if (!fulfillment.success) {
    return { success: false, error: fulfillment.error };
  }

  const paidAt = new Date().toISOString();
  const updated = await updateOrderStatus(order.id, {
    status: "paid",
    order_status: "completed",
    payment_status: "paid",
    paid_at: paidAt,
  });

  if (!updated) {
    return { success: false, error: "更新訂單失敗" };
  }

  const paidOrder = await getOrderById(order.id);
  if (paidOrder) {
    await notifyParentPaymentConfirmed({ order: paidOrder, course });
  }

  revalidateOrderPaths(order.id, order.course_id);
  return { success: true };
}

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

  revalidateOrderPaths(order.id, order.course_id);
  return { success: true };
}

export async function cancelAdminOrder(
  orderId: string,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const order = await getOrderById(orderId);
  if (!order) {
    return { success: false, error: "找不到訂單" };
  }

  if (isOrderPaid(order)) {
    return { success: false, error: "已付款訂單不可取消，請改用退款標記" };
  }

  if (
    order.payment_status === "cancelled" ||
    order.order_status === "cancelled"
  ) {
    return { success: true };
  }

  const updated = await updateOrderStatus(orderId, {
    status: "cancelled",
    order_status: "cancelled",
    payment_status: "cancelled",
  });

  if (!updated) {
    return { success: false, error: "取消訂單失敗" };
  }

  revalidateOrderPaths(orderId, order.course_id);
  return { success: true };
}

export async function markAdminOrderRefunded(
  orderId: string,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const order = await getOrderById(orderId);
  if (!order) {
    return { success: false, error: "找不到訂單" };
  }

  if (order.payment_status !== "paid") {
    return { success: false, error: "僅已付款訂單可標記為已退款" };
  }

  const updated = await updateOrderStatus(orderId, {
    payment_status: "refunded",
    order_status: "cancelled",
    status: "cancelled",
  });

  if (!updated) {
    return { success: false, error: "更新退款狀態失敗" };
  }

  revalidateOrderPaths(orderId, order.course_id);
  return { success: true };
}

export async function resendAdminPaymentEmail(
  orderId: string,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const order = await getOrderById(orderId);
  if (!order) {
    return { success: false, error: "找不到訂單" };
  }

  const course = await getCourseWithEnrollment(order.course_id);
  if (!course) {
    return { success: false, error: "找不到課程" };
  }

  if (order.payment_method === "free") {
    return { success: false, error: "免費課程無付款通知信" };
  }

  if (order.payment_method === "bank_transfer") {
    if (
      order.payment_status !== "waiting_transfer" &&
      order.payment_status !== "pending"
    ) {
      if (order.payment_status === "paid") {
        await notifyParentPaymentConfirmed({ order, course });
        revalidateOrderPaths(orderId, order.course_id);
        return { success: true };
      }
      return { success: false, error: "此訂單狀態不可重寄付款通知" };
    }

    await notifyParentBankTransferPending({ order, course });
    revalidateOrderPaths(orderId, order.course_id);
    return { success: true };
  }

  if (order.payment_method === "ecpay") {
    if (order.payment_status === "paid") {
      await notifyParentPaymentSuccess({ order, course });
      revalidateOrderPaths(orderId, order.course_id);
      return { success: true };
    }

    return {
      success: false,
      error: "信用卡待付款訂單請由用戶重新前往付款頁完成付款",
    };
  }

  if (order.payment_method === "on_site") {
    if (order.payment_status === "paid") {
      await notifyParentPaymentConfirmed({ order, course });
      revalidateOrderPaths(orderId, order.course_id);
      return { success: true };
    }

    return {
      success: false,
      error: "現場繳費訂單請待現場收款後，由管理員確認付款",
    };
  }

  return { success: false, error: "不支援的付款方式" };
}

export async function resendAdminRegistrationEmail(
  orderId: string,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const order = await getOrderById(orderId);
  if (!order) {
    return { success: false, error: "找不到訂單" };
  }

  const course = await getCourseWithEnrollment(order.course_id);
  if (!course) {
    return { success: false, error: "找不到課程" };
  }

  if (order.payment_method === "free" || order.order_status === "completed") {
    await notifyParentRegistrationSuccess({ order, course });
    revalidateOrderPaths(orderId, order.course_id);
    return { success: true };
  }

  if (order.payment_status === "paid") {
    if (order.payment_method === "bank_transfer") {
      await notifyParentPaymentConfirmed({ order, course });
    } else {
      await notifyParentPaymentSuccess({ order, course });
    }
    revalidateOrderPaths(orderId, order.course_id);
    return { success: true };
  }

  return { success: false, error: "訂單尚未完成，無法重寄報名成功通知" };
}
