import { mapSessionRow } from "@/lib/sessions/mappers";
import type { ClassSession } from "@/lib/sessions/types";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export async function usesSessionsTable(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = await createServerClient();
  const { error } = await supabase.from("sessions").select("id").limit(1);

  if (error) {
    if (error.code === "PGRST205") return false;
    console.error("Failed to check sessions table:", error.message);
    return false;
  }

  return true;
}

export async function getSessionsByClassId(
  classId: string,
): Promise<ClassSession[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("class_id", classId)
    .order("date", { ascending: true });

  if (error) {
    if (error.code === "PGRST205") return [];
    console.error("Failed to fetch sessions:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapSessionRow(row));
}

export async function getSessionDatesByClassId(
  classId: string,
): Promise<Set<string>> {
  const sessions = await getSessionsByClassId(classId);
  return new Set(sessions.map((session) => session.date));
}

export async function getSessionCountsByClassIds(
  classIds: string[],
): Promise<Record<string, number>> {
  if (!isSupabaseConfigured() || classIds.length === 0) return {};

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("class_id")
    .in("class_id", classIds);

  if (error) {
    if (error.code === "PGRST205") return {};
    console.error("Failed to fetch session counts:", error.message);
    return {};
  }

  return (data ?? []).reduce<Record<string, number>>((counts, row) => {
    const id = String(row.class_id);
    counts[id] = (counts[id] ?? 0) + 1;
    return counts;
  }, {});
}
