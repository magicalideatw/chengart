import type { OrderEmailEvent } from "@/lib/email/types";
import { createPaymentClient, createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export type OrderEmailLogRecord = {
  id: string;
  order_id: string;
  event: OrderEmailEvent | string;
  recipient: string;
  subject: string;
  status: "sent" | "failed";
  error_message: string | null;
  created_at: string;
};

function mapEmailLogRow(row: Record<string, unknown>): OrderEmailLogRecord {
  return {
    id: String(row.id),
    order_id: String(row.order_id),
    event: String(row.event),
    recipient: String(row.recipient),
    subject: String(row.subject),
    status: row.status === "failed" ? "failed" : "sent",
    error_message: row.error_message ? String(row.error_message) : null,
    created_at: String(row.created_at),
  };
}

export async function logOrderEmail(input: {
  orderId: string;
  event: OrderEmailEvent | string;
  recipient: string;
  subject: string;
  status: "sent" | "failed";
  errorMessage?: string | null;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = createPaymentClient();
  const { error } = await supabase.from("order_email_logs").insert({
    order_id: input.orderId,
    event: input.event,
    recipient: input.recipient,
    subject: input.subject,
    status: input.status,
    error_message: input.errorMessage ?? null,
  });

  if (error) {
    console.error("Failed to log order email:", error.message);
  }
}

export async function getOrderEmailLogs(
  orderId: string,
): Promise<OrderEmailLogRecord[]> {
  if (!isSupabaseConfigured() || !orderId) return [];

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("order_email_logs")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch order email logs:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapEmailLogRow(row));
}
