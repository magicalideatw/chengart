import type { PaymentMethod } from "@/lib/payment/types";
import type { RegistrationOrderFormData } from "@/lib/registration/types";
import type { TicketPurchaseLine } from "@/lib/validation/ticket-purchase-schema";

export const PERFORMANCE_ORDER_TYPE = "performance" as const;

export type PerformancePricingSnapshot = {
  orderType: typeof PERFORMANCE_ORDER_TYPE;
  totalTickets: number;
  totalAmount: number;
  lines: TicketPurchaseLine[];
};

export type PerformanceOrderFormData = {
  orderType: typeof PERFORMANCE_ORDER_TYPE;
  name: string;
  phone: string;
  email: string;
  paymentMethod?: PaymentMethod;
  ticketLines: TicketPurchaseLine[];
  pricingSnapshot: PerformancePricingSnapshot;
};

export type OrderFormData = RegistrationOrderFormData | PerformanceOrderFormData;

export function isPerformanceOrderFormData(
  formData: OrderFormData | Record<string, unknown>,
): formData is PerformanceOrderFormData {
  console.log("[isPerformanceOrderFormData] received JSON:", formData);

  const result =
    typeof formData === "object" &&
    formData !== null &&
    "orderType" in formData &&
    formData.orderType === PERFORMANCE_ORDER_TYPE;

  console.log("[isPerformanceOrderFormData] result:", result ? "true" : "false");
  return result;
}

export function getPerformanceTicketLines(
  formData: OrderFormData | Record<string, unknown>,
): TicketPurchaseLine[] {
  if (!isPerformanceOrderFormData(formData)) {
    return [];
  }
  return formData.ticketLines ?? [];
}

export function getPerformanceTicketCount(
  formData: OrderFormData | Record<string, unknown>,
): number {
  if (!isPerformanceOrderFormData(formData)) {
    return 0;
  }

  const snapshotTotal = formData.pricingSnapshot?.totalTickets;
  if (typeof snapshotTotal === "number" && snapshotTotal > 0) {
    return snapshotTotal;
  }

  return getPerformanceTicketLines(formData).reduce(
    (sum, line) => sum + line.quantity,
    0,
  );
}

export function formatPerformanceTicketSummary(
  formData: OrderFormData | Record<string, unknown>,
): string {
  const lines = getPerformanceTicketLines(formData);
  if (lines.length === 0) return "—";
  return lines.map((line) => `${line.name} ×${line.quantity}`).join("、");
}
