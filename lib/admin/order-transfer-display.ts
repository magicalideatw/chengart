import type { OrderRecord } from "@/lib/orders/types";

export type AdminOrderStatusFilter =
  | "all"
  | "waiting_payment"
  | "waiting_review"
  | "paid"
  | "cancelled";

export function isBankTransferOrder(
  order: Pick<OrderRecord, "payment_method">,
): boolean {
  return order.payment_method === "bank_transfer";
}

export function isWaitingCustomerTransfer(
  order: Pick<
    OrderRecord,
    "payment_method" | "payment_status" | "transfer_reported"
  >,
): boolean {
  return (
    order.payment_method === "bank_transfer" &&
    order.payment_status === "waiting_transfer" &&
    !order.transfer_reported
  );
}

export function isWaitingTransferReview(
  order: Pick<
    OrderRecord,
    "payment_method" | "payment_status" | "transfer_reported"
  >,
): boolean {
  return (
    order.payment_method === "bank_transfer" &&
    order.payment_status === "waiting_transfer" &&
    order.transfer_reported
  );
}

export function canConfirmBankTransferPayment(
  order: Pick<
    OrderRecord,
    "payment_method" | "payment_status" | "transfer_reported"
  >,
): boolean {
  return (
    order.payment_method === "bank_transfer" &&
    order.payment_status !== "paid" &&
    order.transfer_reported
  );
}

export function canManualConfirmBankTransferPayment(
  order: Pick<
    OrderRecord,
    "payment_method" | "payment_status" | "transfer_reported"
  >,
): boolean {
  return isWaitingCustomerTransfer(order);
}

export function matchesAdminOrderStatusFilter(
  order: Pick<
    OrderRecord,
    "payment_method" | "payment_status" | "transfer_reported"
  >,
  filter: AdminOrderStatusFilter,
): boolean {
  switch (filter) {
    case "waiting_payment":
      return (
        (order.payment_status === "pending" ||
          order.payment_status === "waiting_transfer") &&
        !isWaitingTransferReview(order)
      );
    case "waiting_review":
      return isWaitingTransferReview(order);
    case "paid":
      return order.payment_status === "paid";
    case "cancelled":
      return (
        order.payment_status === "cancelled" ||
        order.payment_status === "refunded"
      );
    default:
      return true;
  }
}

export function getAdminPaymentStatusLabel(
  order: Pick<
    OrderRecord,
    "payment_method" | "payment_status" | "transfer_reported"
  >,
): string {
  if (order.payment_status === "paid") {
    return "🟢 已付款";
  }

  if (
    order.payment_status === "cancelled" ||
    order.payment_status === "refunded"
  ) {
    return order.payment_status === "refunded" ? "已退款" : "已取消";
  }

  if (isWaitingTransferReview(order)) {
    return "🟡 等待核帳";
  }

  if (isWaitingCustomerTransfer(order)) {
    return "⏳ 等待付款（尚未回報匯款）";
  }

  if (
    order.payment_method === "bank_transfer" &&
    order.payment_status === "waiting_transfer"
  ) {
    return "等待付款";
  }

  if (order.payment_status === "waiting_transfer") {
    return "待匯款";
  }

  if (order.payment_status === "pending") {
    return "待付款";
  }

  return "—";
}

export function getAdminPaymentStatusStyle(
  order: Pick<
    OrderRecord,
    "payment_method" | "payment_status" | "transfer_reported"
  >,
): string {
  if (order.payment_status === "paid") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (isWaitingTransferReview(order)) {
    return "bg-amber-50 text-amber-800";
  }

  if (isWaitingCustomerTransfer(order)) {
    return "bg-sky-50 text-sky-700";
  }

  if (
    order.payment_status === "pending" ||
    order.payment_status === "waiting_transfer"
  ) {
    return "bg-sky-50 text-sky-700";
  }

  if (order.payment_status === "refunded") {
    return "bg-violet-50 text-violet-700";
  }

  return "bg-surface text-muted";
}

export function formatTransferTimeDisplay(value: string | null): string {
  if (!value) return "—";
  const match = value.match(/^(\d{2}:\d{2})/);
  return match?.[1] ?? value;
}

export function formatTransferDateDisplay(value: string | null): string {
  if (!value) return "—";
  const normalized = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized.replace(/-/g, "/");
  }
  return value;
}
