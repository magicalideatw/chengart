import { formatEventDateLabel } from "@/lib/events/format";
import type { EventHomepageItem, EventPageData } from "@/lib/events/types";
import { staticEvents } from "@/src/data/events";

function staticEventToPageData(
  event: (typeof staticEvents)[number],
): EventPageData {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    subtitle: event.subtitle,
    status: event.status,
    coverImage: event.heroImage,
    eventType: "活動",
    startDate: event.date.replace(/\//g, "-").slice(0, 10),
    endDate: null,
    intro: event.subtitle,
    content: "",
    registrationButtonText: "立即報名",
    registrationUrl: null,
    dateLabel: event.date,
    time: event.time,
    location: event.location,
    age: event.age,
    audienceType: event.audienceType,
    price: event.price,
    capacity: event.capacity,
    registered: event.registered,
    highlights: event.highlights,
    timeline: event.timeline,
    instructors: event.instructors,
    gallery: event.gallery,
    faq: event.faq,
  };
}

export function getLegacyHomepageEvents(): EventHomepageItem[] {
  return staticEvents.slice(0, 3).map((event) => ({
    id: event.id,
    slug: event.slug,
    title: event.title,
    subtitle: event.subtitle,
    status: event.status,
    coverImage: event.heroImage,
    dateLabel: event.date,
  }));
}

export function getLegacyEventBySlug(slug: string): EventPageData | undefined {
  const event = staticEvents.find((item) => item.slug === slug);
  if (!event) return undefined;
  return staticEventToPageData(event);
}

export function getLegacyEventSlugs(): string[] {
  return staticEvents.map((event) => event.slug);
}

export function getLegacyHomepageEventsFiltered(): EventHomepageItem[] {
  return getLegacyHomepageEvents();
}
