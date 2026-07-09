import type { AnnouncementRecord } from "@/lib/announcements/types";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

function mapRow(row: Record<string, unknown>): AnnouncementRecord {
  return {
    id: String(row.id),
    title: String(row.title),
    content: String(row.content),
    is_active: Boolean(row.is_active),
    sort_order: Number(row.sort_order ?? 0),
    starts_at: row.starts_at ? String(row.starts_at) : null,
    ends_at: row.ends_at ? String(row.ends_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function isWithinSchedule(
  announcement: AnnouncementRecord,
  now = new Date(),
): boolean {
  if (!announcement.is_active) return false;

  if (announcement.starts_at && new Date(announcement.starts_at) > now) {
    return false;
  }

  if (announcement.ends_at && new Date(announcement.ends_at) < now) {
    return false;
  }

  return true;
}

export async function getAllAnnouncements(): Promise<AnnouncementRecord[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("homepage_announcements")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "PGRST205") return [];
    console.error("Failed to fetch announcements:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapRow(row));
}

export async function getActiveAnnouncements(): Promise<AnnouncementRecord[]> {
  const all = await getAllAnnouncements();
  return all.filter((item) => isWithinSchedule(item));
}

export async function countActiveAnnouncements(): Promise<number> {
  const active = await getActiveAnnouncements();
  return active.length;
}
