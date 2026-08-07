import type { ClassSession } from "@/lib/sessions/types";
import type { TicketTypeRecord } from "@/lib/ticket-types/types";
import type {
  TicketPurchaseLine,
  TicketPurchaseSummary,
} from "@/lib/validation/ticket-purchase-schema";

export const PERFORMANCE_PURCHASE_MODES = ["ticket", "session"] as const;

export type PerformancePurchaseMode = (typeof PERFORMANCE_PURCHASE_MODES)[number];

/** Ticket types take precedence when present (legacy performances). */
export function resolvePerformancePurchaseMode(input: {
  ticketTypes: TicketTypeRecord[];
  sessions: ClassSession[];
}): PerformancePurchaseMode | null {
  if (input.ticketTypes.length > 0) return "ticket";
  if (input.sessions.length > 0) return "session";
  return null;
}

export function isPaidSession(session: Pick<ClassSession, "price"> | null | undefined): boolean {
  return Number(session?.price ?? 0) > 0;
}

export function calculateSessionPurchaseSummary(
  session: Pick<ClassSession, "id" | "name" | "price">,
  quantity: number,
): TicketPurchaseSummary {
  const qty = Math.max(0, Math.floor(quantity));
  if (qty <= 0) {
    return { lines: [], totalTickets: 0, totalAmount: 0 };
  }

  const unitPrice = Math.max(0, Number(session.price ?? 0));
  const line: TicketPurchaseLine = {
    ticketTypeId: session.id,
    name: session.name.trim() || "場次",
    price: unitPrice,
    quantity: qty,
    subtotal: unitPrice * qty,
  };

  return {
    lines: [line],
    totalTickets: qty,
    totalAmount: unitPrice * qty,
  };
}

export type PerformanceSessionOrderSnapshot = {
  sessionId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  amount: number;
  date: string;
  startTime: string;
  endTime: string;
};

export function buildPerformanceSessionOrderSnapshot(
  session: ClassSession,
  quantity: number,
): PerformanceSessionOrderSnapshot {
  const qty = Math.max(1, Math.floor(quantity));
  const unitPrice = Math.max(0, Number(session.price ?? 0));

  return {
    sessionId: session.id,
    name: session.name.trim() || "場次",
    unitPrice,
    quantity: qty,
    amount: unitPrice * qty,
    date: session.date,
    startTime: session.startTime,
    endTime: session.endTime,
  };
}

export const SESSION_QUANTITY_ERROR = "請至少選擇 1 張。";

export function validateSessionQuantity(quantity: number): boolean {
  return Number.isFinite(quantity) && Math.floor(quantity) >= 1;
}
