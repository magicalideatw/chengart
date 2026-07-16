import {
  createPaymentClient,
  createServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

export {
  computeRemainingCapacity,
  resolveSessionStatusFromEnrollment,
} from "@/lib/sessions/enrollment-utils";

export async function getEnrollmentCountsBySessionIds(
  sessionIds: string[],
): Promise<Record<string, number>> {
  const uniqueIds = [...new Set(sessionIds.filter(Boolean))];
  if (!isSupabaseConfigured() || uniqueIds.length === 0) {
    return {};
  }

  const supabase = createPaymentClient();
  const { data, error } = await supabase
    .from("registrations")
    .select("session_id")
    .in("session_id", uniqueIds)
    .eq("status", "paid");

  if (error) {
    console.error("Failed to fetch session enrollment counts:", error.message);
    return {};
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    if (!row.session_id) continue;
    const id = String(row.session_id);
    counts[id] = (counts[id] ?? 0) + 1;
  }

  return counts;
}

export async function getEnrollmentCountForSession(
  sessionId: string,
): Promise<number> {
  const counts = await getEnrollmentCountsBySessionIds([sessionId]);
  return counts[sessionId] ?? 0;
}

export async function getEnrollmentCountsBySessionIdsForServer(
  sessionIds: string[],
): Promise<Record<string, number>> {
  const uniqueIds = [...new Set(sessionIds.filter(Boolean))];
  if (!isSupabaseConfigured() || uniqueIds.length === 0) {
    return {};
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("registrations")
    .select("session_id")
    .in("session_id", uniqueIds)
    .eq("status", "paid");

  if (error) {
    console.error("Failed to fetch session enrollment counts:", error.message);
    return {};
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    if (!row.session_id) continue;
    const id = String(row.session_id);
    counts[id] = (counts[id] ?? 0) + 1;
  }

  return counts;
}
