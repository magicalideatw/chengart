import { z } from "zod";
import { PAYMENT_METHODS } from "@/lib/payment/types";

export const ticketPurchaseFormSchema = z.object({
  name: z.string().min(1, "請填寫姓名"),
  phone: z
    .string()
    .min(1, "請填寫手機")
    .regex(/^[\d\-+()\s]{8,20}$/, "請輸入有效的手機號碼"),
  email: z.string().min(1, "請填寫 Email").email("請輸入有效的 Email"),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
});

export type TicketPurchaseFormValues = z.infer<typeof ticketPurchaseFormSchema>;

export const TICKET_SELECTION_ERROR = "請至少選擇一張票。";

export function validateTicketSelection(
  quantities: Record<string, number>,
): boolean {
  return Object.values(quantities).some((quantity) => quantity > 0);
}

export function isPaidPerformance(
  ticketTypes: Array<{ price: number }>,
): boolean {
  return ticketTypes.some((ticketType) => ticketType.price > 0);
}

export function hasSelectedTickets(summary: Pick<TicketPurchaseSummary, "totalTickets">): boolean {
  return summary.totalTickets > 0;
}

export type TicketPurchaseLine = {
  ticketTypeId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export type TicketPurchaseSummary = {
  lines: TicketPurchaseLine[];
  totalTickets: number;
  totalAmount: number;
};

export function calculateTicketPurchaseSummary(
  ticketTypes: Array<{ id: string; name: string; price: number }>,
  quantities: Record<string, number>,
): TicketPurchaseSummary {
  const lines: TicketPurchaseLine[] = ticketTypes
    .map((ticketType) => {
      const quantity = quantities[ticketType.id] ?? 0;
      if (quantity <= 0) return null;

      return {
        ticketTypeId: ticketType.id,
        name: ticketType.name,
        price: ticketType.price,
        quantity,
        subtotal: ticketType.price * quantity,
      };
    })
    .filter((line): line is TicketPurchaseLine => line !== null);

  const totalTickets = lines.reduce((sum, line) => sum + line.quantity, 0);
  const totalAmount = lines.reduce((sum, line) => sum + line.subtotal, 0);

  return { lines, totalTickets, totalAmount };
}
