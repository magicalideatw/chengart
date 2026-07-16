import { formatFee } from "@/lib/admin/format";
import {
  formatPricingDiscountSummary,
  parsePricingSnapshot,
} from "@/lib/pricing/engine";
import type { OrderListItem } from "@/lib/orders/types";
import {
  type AdminOrderStatusFilter,
  matchesAdminOrderStatusFilter,
} from "@/lib/admin/order-transfer-display";
import {
  getRegistrationStatusLabel,
} from "@/lib/orders/order-status";
import {
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  type PaymentMethod,
} from "@/lib/payment/types";
import {
  getPerformanceTicketCount,
  getPerformanceTicketLines,
  isPerformanceOrderFormData,
} from "@/lib/orders/order-form-data";
import { normalizeStudentsFromFormData } from "@/lib/registration/types";

export type AdminOrderRow = OrderListItem & {
  studentCount: number;
  registrationStatusLabel: string;
  subtotalDisplay: number;
  discountDisplay: string;
};

export type PaymentStatusFilter = AdminOrderStatusFilter;

export type PaymentMethodFilter = PaymentMethod;

export type OrderSortKey = "created_at" | "paid_at" | "amount";

export type OrderSortDirection = "asc" | "desc";

export type OrderListFilters = {
  query: string;
  paymentStatus: PaymentStatusFilter | "all";
  paymentMethod: PaymentMethodFilter | "all";
  courseId: string | "all";
  dateFrom: string;
  dateTo: string;
  sortKey: OrderSortKey;
  sortDirection: OrderSortDirection;
};

export const DEFAULT_ORDER_FILTERS: OrderListFilters = {
  query: "",
  paymentStatus: "all",
  paymentMethod: "all",
  courseId: "all",
  dateFrom: "",
  dateTo: "",
  sortKey: "created_at",
  sortDirection: "desc",
};

export function enrichOrderListItem(order: OrderListItem): AdminOrderRow {
  const isPerformance = isPerformanceOrderFormData(order.form_data);
  const students = normalizeStudentsFromFormData(order.form_data);
  const pricingSnapshot = parsePricingSnapshot(order.pricing_snapshot);
  const subtotalDisplay =
    order.subtotal ?? pricingSnapshot?.subtotal ?? order.amount;
  const discountDisplay = pricingSnapshot
    ? formatPricingDiscountSummary(pricingSnapshot)
    : order.discount_total > 0
      ? `- ${formatFee(order.discount_total)}`
      : "—";

  const ticketCount = getPerformanceTicketCount(order.form_data);

  return {
    ...order,
    studentCount: isPerformance
      ? ticketCount
      : students.length > 0
        ? students.length
        : 1,
    registrationStatusLabel: getRegistrationStatusLabel(order),
    subtotalDisplay,
    discountDisplay,
  };
}

export function enrichOrderList(orders: OrderListItem[]): AdminOrderRow[] {
  return orders.map(enrichOrderListItem);
}

function matchesDateRange(
  createdAt: string,
  dateFrom: string,
  dateTo: string,
): boolean {
  const createdTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdTime)) return true;

  if (dateFrom) {
    const fromTime = new Date(`${dateFrom}T00:00:00`).getTime();
    if (!Number.isNaN(fromTime) && createdTime < fromTime) return false;
  }

  if (dateTo) {
    const toTime = new Date(`${dateTo}T23:59:59.999`).getTime();
    if (!Number.isNaN(toTime) && createdTime > toTime) return false;
  }

  return true;
}

export function filterAndSortOrders(
  orders: AdminOrderRow[],
  filters: OrderListFilters,
): AdminOrderRow[] {
  const keyword = filters.query.trim().toLowerCase();

  const filtered = orders.filter((order) => {
    if (
      filters.paymentStatus !== "all" &&
      !matchesAdminOrderStatusFilter(order, filters.paymentStatus)
    ) {
      return false;
    }

    if (
      filters.paymentMethod !== "all" &&
      order.payment_method !== filters.paymentMethod
    ) {
      return false;
    }

    if (filters.courseId !== "all" && order.course_id !== filters.courseId) {
      return false;
    }

    if (
      !matchesDateRange(order.created_at, filters.dateFrom, filters.dateTo)
    ) {
      return false;
    }

    if (!keyword) return true;

    const students = normalizeStudentsFromFormData(order.form_data);
    const ticketLines = isPerformanceOrderFormData(order.form_data)
      ? getPerformanceTicketLines(order.form_data)
      : [];
    const searchable = [
      order.merchant_trade_no,
      order.name,
      order.email,
      order.phone,
      order.course_title,
      order.promo_code ?? "",
      ...students.map((student) => student.studentName),
      ...ticketLines.map((line) => line.name),
    ];

    return searchable.some((value) =>
      value.toLowerCase().includes(keyword),
    );
  });

  return [...filtered].sort((a, b) => {
    let compare = 0;

    if (filters.sortKey === "amount") {
      compare = a.amount - b.amount;
    } else if (filters.sortKey === "paid_at") {
      const aTime = a.paid_at ? new Date(a.paid_at).getTime() : 0;
      const bTime = b.paid_at ? new Date(b.paid_at).getTime() : 0;
      compare = aTime - bTime;
    } else {
      compare =
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }

    return filters.sortDirection === "asc" ? compare : -compare;
  });
}

export type OrderExportRow = {
  訂單編號: string;
  建立時間: string;
  課程名稱: string;
  "家長/成人姓名": string;
  Email: string;
  電話: string;
  學生數: number;
  原價: string;
  優惠: string;
  折扣碼: string;
  實付金額: string;
  付款方式: string;
  付款狀態: string;
  報名狀態: string;
  付款時間: string;
};

export function buildOrderExportRows(
  orders: AdminOrderRow[],
  formatDateTime: (iso?: string | null) => string,
): OrderExportRow[] {
  return orders.map((order) => ({
    訂單編號: order.merchant_trade_no,
    建立時間: formatDateTime(order.created_at),
    課程名稱: order.course_title,
    "家長/成人姓名": order.name,
    Email: order.email,
    電話: order.phone,
    學生數: order.studentCount,
    原價: formatFee(order.subtotalDisplay),
    優惠: order.discountDisplay,
    折扣碼: order.promo_code ?? "—",
    實付金額: formatFee(order.amount),
    付款方式: getPaymentMethodLabel(order.payment_method),
    付款狀態: getPaymentStatusLabel(order.payment_status),
    報名狀態: order.registrationStatusLabel,
    付款時間: formatDateTime(order.paid_at),
  }));
}

export function exportOrdersToCsv(rows: OrderExportRow[]): string {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]) as Array<keyof OrderExportRow>;
  const escapeCell = (value: string | number) => {
    const text = String(value);
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((key) => escapeCell(row[key])).join(",")),
  ];

  return `\uFEFF${lines.join("\n")}`;
}

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportOrdersToXlsx(
  rows: OrderExportRow[],
  filename: string,
): Promise<void> {
  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "訂單");
  XLSX.writeFile(workbook, filename);
}

export const ORDER_EMAIL_EVENT_LABELS: Record<string, string> = {
  admin_new_order: "管理員新訂單通知",
  parent_registration_success: "報名成功",
  parent_bank_transfer_pending: "請匯款通知",
  parent_payment_success: "付款成功",
  parent_payment_confirmed: "付款已確認",
};

export function getOrderEmailEventLabel(event: string): string {
  return ORDER_EMAIL_EVENT_LABELS[event] ?? event;
}
