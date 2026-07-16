import type { TicketTypeRecord } from "@/lib/ticket-types/types";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

function mapTicketTypeRow(row: Record<string, unknown>): TicketTypeRecord {
  return {
    id: String(row.id),
    courseId: String(row.course_id),
    name: String(row.name),
    price: Number(row.price ?? 0),
    description: String(row.description ?? ""),
    isActive: Boolean(row.is_active),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function getTicketTypesByCourseId(
  courseId: string,
): Promise<TicketTypeRecord[]> {
  if (!isSupabaseConfigured() || !courseId) return [];

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("ticket_types")
    .select("*")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (error.code !== "PGRST205") {
      console.error("Failed to fetch ticket types:", error.message);
    }
    return [];
  }

  return (data ?? []).map((row) => mapTicketTypeRow(row));
}

export async function getActiveTicketTypesByCourseId(
  courseId: string,
): Promise<TicketTypeRecord[]> {
  if (!isSupabaseConfigured() || !courseId) return [];

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("ticket_types")
    .select("*")
    .eq("course_id", courseId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (error.code !== "PGRST205") {
      console.error("Failed to fetch active ticket types:", error.message);
    }
    return [];
  }

  return (data ?? []).map((row) => mapTicketTypeRow(row));
}

export async function saveTicketType(input: {
  id?: string;
  courseId: string;
  name: string;
  price: number;
  description: string;
  isActive: boolean;
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  const supabase = await createServerClient();
  const payload = {
    course_id: input.courseId,
    name: input.name.trim(),
    price: input.price,
    description: input.description.trim(),
    is_active: input.isActive,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase
      .from("ticket_types")
      .update(payload)
      .eq("id", input.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  const { data: existing } = await supabase
    .from("ticket_types")
    .select("sort_order")
    .eq("course_id", input.courseId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSortOrder =
    existing && existing.length > 0
      ? Number(existing[0]?.sort_order ?? 0) + 1
      : 0;

  const { error } = await supabase.from("ticket_types").insert({
    ...payload,
    sort_order: nextSortOrder,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteTicketType(
  ticketTypeId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("ticket_types")
    .delete()
    .eq("id", ticketTypeId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
