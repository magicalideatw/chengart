import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  getLegacyEventBySlug,
  getLegacyEventSlugs,
  getLegacyHomepageEventsFiltered,
} from "@/lib/events/legacy";
import {
  mapEventRow,
  toEventPageData,
  toHomepageItem,
} from "@/lib/events/mappers";
import type {
  EventHomepageItem,
  EventPageData,
  EventRecord,
} from "@/lib/events/types";

const HOMEPAGE_EVENT_LIMIT = 3;

async function fetchAllEvents(): Promise<EventRecord[] | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "PGRST205") return null;
    console.error("Failed to fetch events:", error.message);
    return null;
  }

  return (data ?? []).map((row) => mapEventRow(row));
}

export async function usesEventsCms(): Promise<boolean> {
  const events = await fetchAllEvents();
  return events !== null;
}

export async function getAllEvents(): Promise<EventRecord[]> {
  const events = await fetchAllEvents();
  return events ?? [];
}

export async function getHomepageEvents(): Promise<EventHomepageItem[]> {
  const events = await fetchAllEvents();

  if (!events) {
    return getLegacyHomepageEventsFiltered();
  }

  return events
    .filter((event) => event.showOnHomepage)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, HOMEPAGE_EVENT_LIMIT)
    .map(toHomepageItem);
}

export async function getEventBySlug(
  slug: string,
): Promise<EventPageData | undefined> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (!error && data) {
      return toEventPageData(mapEventRow(data));
    }

    if (error && error.code !== "PGRST205") {
      console.error("Failed to fetch event:", error.message);
    }
  }

  return getLegacyEventBySlug(slug);
}

export async function getEventSlugs(): Promise<string[]> {
  const events = await fetchAllEvents();
  if (events && events.length > 0) {
    return events.map((event) => event.slug);
  }
  return getLegacyEventSlugs();
}
