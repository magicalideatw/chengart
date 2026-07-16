import type { OrderRecord } from "@/lib/orders/types";
import { isPerformanceOrderFormData } from "@/lib/orders/order-form-data";
import type { PaymentStatus } from "@/lib/payment/types";

export const ORDER_FULFILLMENT_STATUSES = [
  "pending",
  "completed",
  "cancelled",
] as const;

export type OrderFulfillmentStatus = (typeof ORDER_FULFILLMENT_STATUSES)[number];

export const ORDER_FULFILLMENT_STATUS_LABELS: Record<
  OrderFulfillmentStatus,
  string
> = {
  pending: "待完成",
  completed: "已完成",
  cancelled: "已取消",
};

export function parseOrderFulfillmentStatus(
  value: unknown,
): OrderFulfillmentStatus {
  if (
    value === "pending" ||
    value === "completed" ||
    value === "cancelled"
  ) {
    return value;
  }
  return "pending";
}

export function getOrderFulfillmentStatusLabel(
  status: OrderFulfillmentStatus | string | null | undefined,
): string {
  if (!status) return "—";
  if (ORDER_FULFILLMENT_STATUSES.includes(status as OrderFulfillmentStatus)) {
    return ORDER_FULFILLMENT_STATUS_LABELS[status as OrderFulfillmentStatus];
  }
  return status;
}

export function deriveOrderFulfillmentStatus(
  order: Pick<OrderRecord, "order_status" | "payment_status">,
): OrderFulfillmentStatus {
  if (order.order_status) {
    return parseOrderFulfillmentStatus(order.order_status);
  }

  if (order.payment_status === "paid") return "completed";
  if (order.payment_status === "cancelled" || order.payment_status === "refunded") {
    return "cancelled";
  }

  return "pending";
}

export function getRegistrationStatusLabel(
  order: Pick<
    OrderRecord,
    "order_status" | "payment_status" | "payment_method" | "form_data"
  >,
): string {
  if (isPerformanceOrderFormData(order.form_data)) {
    if (order.payment_status === "refunded") return "已退款";

    const fulfillmentStatus = deriveOrderFulfillmentStatus(order);

    if (fulfillmentStatus === "completed") return "購票完成";
    if (fulfillmentStatus === "cancelled") return "已取消";

    if (order.payment_method === "free") return "購票完成";
    if (
      order.payment_status === "waiting_transfer" ||
      order.payment_status === "pending"
    ) {
      return "待付款";
    }

    return "處理中";
  }

  if (order.payment_status === "refunded") return "已退款";

  const fulfillmentStatus = deriveOrderFulfillmentStatus(order);

  if (fulfillmentStatus === "completed") return "報名完成";
  if (fulfillmentStatus === "cancelled") return "已取消";

  if (order.payment_method === "free") return "報名完成";
  if (
    order.payment_status === "waiting_transfer" ||
    order.payment_status === "pending"
  ) {
    return "待付款";
  }

  return "處理中";
}

export function isPendingPaymentForFilter(status: PaymentStatus): boolean {
  return status === "pending" || status === "waiting_transfer";
}
