import type { Database } from "@/lib/supabase/database.types";
import { formatEventDateLabel } from "@/lib/events/format";
import type {
  EventFormInput,
  EventHomepageItem,
  EventPageData,
  EventRecord,
} from "@/lib/events/types";
import type { EventStatus } from "@/lib/events/constants";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

export function mapEventRow(row: Record<string, unknown>): EventRecord {
  const event = row as EventRow;

  return {
    id: String(event.id),
    slug: String(event.slug),
    title: String(event.title),
    subtitle: String(event.subtitle ?? ""),
    coverImage: String(event.cover_image ?? ""),
    eventType: String(event.event_type ?? "活動"),
    status: event.status as EventStatus,
    startDate: String(event.start_date),
    endDate: event.end_date ? String(event.end_date) : null,
    intro: String(event.intro ?? ""),
    content: String(event.content ?? ""),
    showOnHomepage: Boolean(event.show_on_homepage),
    isFeatured: Boolean(event.is_featured),
    sortOrder: Number(event.sort_order ?? 0),
    registrationButtonText: String(event.registration_button_text ?? "立即報名"),
    registrationUrl: event.registration_url ? String(event.registration_url) : null,
    createdAt: String(event.created_at),
    updatedAt: String(event.updated_at),
  };
}

export function mapEventToDb(
  input: EventFormInput,
): Database["public"]["Tables"]["events"]["Insert"] {
  return {
    slug: input.slug.trim(),
    title: input.title.trim(),
    subtitle: input.subtitle.trim(),
    cover_image: input.coverImage.trim(),
    event_type: input.eventType,
    status: input.status,
    start_date: input.startDate,
    end_date: input.endDate.trim() ? input.endDate : null,
    intro: input.intro.trim(),
    content: input.content,
    show_on_homepage: input.showOnHomepage,
    is_featured: input.isFeatured,
    sort_order: input.sortOrder,
    registration_button_text: input.registrationButtonText.trim() || "立即報名",
    registration_url: input.registrationUrl.trim() || null,
    updated_at: new Date().toISOString(),
  };
}

export function toHomepageItem(event: EventRecord): EventHomepageItem {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    subtitle: event.subtitle,
    status: event.status,
    coverImage: event.coverImage,
    dateLabel: formatEventDateLabel(event.startDate, event.endDate),
  };
}

export function toEventPageData(event: EventRecord): EventPageData {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    subtitle: event.subtitle,
    status: event.status,
    coverImage: event.coverImage,
    eventType: event.eventType,
    startDate: event.startDate,
    endDate: event.endDate,
    intro: event.intro,
    content: event.content,
    registrationButtonText: event.registrationButtonText,
    registrationUrl: event.registrationUrl,
    dateLabel: formatEventDateLabel(event.startDate, event.endDate),
  };
}

export function eventRecordToFormInput(event: EventRecord): EventFormInput {
  return {
    slug: event.slug,
    title: event.title,
    subtitle: event.subtitle,
    coverImage: event.coverImage,
    eventType: event.eventType,
    status: event.status,
    startDate: event.startDate,
    endDate: event.endDate ?? "",
    intro: event.intro,
    content: event.content,
    showOnHomepage: event.showOnHomepage,
    isFeatured: event.isFeatured,
    sortOrder: event.sortOrder,
    registrationButtonText: event.registrationButtonText,
    registrationUrl: event.registrationUrl ?? "",
  };
}
