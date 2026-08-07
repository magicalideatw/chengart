import type { PaymentMethod } from "@/lib/payment/types";
import type { RegistrationOrderFormData } from "@/lib/registration/types";
import type {
  PerformancePurchaseMode,
  PerformanceSessionOrderSnapshot,
} from "@/lib/performance/purchase";
import type { TicketPurchaseLine } from "@/lib/validation/ticket-purchase-schema";

export const PERFORMANCE_ORDER_TYPE = "performance" as const;

export type PerformancePricingSnapshot = {
  orderType: typeof PERFORMANCE_ORDER_TYPE;
  purchaseMode: PerformancePurchaseMode;
  totalTickets: number;
  totalAmount: number;
  lines: TicketPurchaseLine[];
};

export type PerformanceOrderFormData = {
  orderType: typeof PERFORMANCE_ORDER_TYPE;
  purchaseMode: PerformancePurchaseMode;
  name: string;
  phone: string;
  email: string;
  paymentMethod?: PaymentMethod;
  sessionId?: string;
  unitPrice?: number;
  quantity?: number;
  sessionSnapshot?: PerformanceSessionOrderSnapshot;
  ticketLines: TicketPurchaseLine[];
  pricingSnapshot: PerformancePricingSnapshot;
};

export type OrderFormData = RegistrationOrderFormData | PerformanceOrderFormData;

export function isPerformanceOrderFormData(
  formData: OrderFormData | Record<string, unknown>,
): formData is PerformanceOrderFormData {
  return (
    typeof formData === "object" &&
    formData !== null &&
    "orderType" in formData &&
    formData.orderType === PERFORMANCE_ORDER_TYPE
  );
}

function resolvePerformanceLines(
  formData: PerformanceOrderFormData,
): TicketPurchaseLine[] {
  if (formData.ticketLines.length > 0) {
    return formData.ticketLines;
  }

  if (formData.sessionSnapshot) {
    const { sessionSnapshot } = formData;
    return [
      {
        ticketTypeId: sessionSnapshot.sessionId,
        name: sessionSnapshot.name,
        price: sessionSnapshot.unitPrice,
        quantity: sessionSnapshot.quantity,
        subtotal: sessionSnapshot.amount,
      },
    ];
  }

  return formData.pricingSnapshot?.lines ?? [];
}

export function getPerformanceTicketLines(
  formData: OrderFormData | Record<string, unknown>,
): TicketPurchaseLine[] {
  if (!isPerformanceOrderFormData(formData)) {
    return [];
  }
  return resolvePerformanceLines(formData);
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

  if (typeof formData.quantity === "number" && formData.quantity > 0) {
    return formData.quantity;
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

export function getPerformanceSessionSnapshot(
  formData: OrderFormData | Record<string, unknown>,
): PerformanceSessionOrderSnapshot | null {
  if (!isPerformanceOrderFormData(formData)) return null;
  return formData.sessionSnapshot ?? null;
}
