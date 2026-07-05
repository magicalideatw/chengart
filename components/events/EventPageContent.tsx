"use client";

import type { Event } from "@/src/data/events";
import { EventFAQSection } from "@/components/events/EventFAQSection";
import { EventGallery } from "@/components/events/EventGallery";
import { EventHero } from "@/components/events/EventHero";
import { EventHighlights } from "@/components/events/EventHighlights";
import { EventInfoCard } from "@/components/events/EventInfoCard";
import { EventInstructors } from "@/components/events/EventInstructors";
import { EventRegistrationForm } from "@/components/events/EventRegistrationForm";
import { EventTimeline } from "@/components/events/EventTimeline";

type EventPageContentProps = {
  event: Event;
};

export function EventPageContent({ event }: EventPageContentProps) {
  return (
    <>
      <EventHero event={event} />

      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_340px] lg:gap-14">
          <aside className="order-1 lg:sticky lg:top-24 lg:order-2 lg:self-start">
            <EventInfoCard event={event} />
          </aside>

          <div className="order-2 lg:order-1">
            <EventHighlights items={event.highlights} />
            <EventTimeline items={event.timeline} />
            <EventInstructors items={event.instructors} />
            <EventGallery images={event.gallery} title={event.title} />
            <EventFAQSection items={event.faq} />
            <EventRegistrationForm event={event} />
          </div>
        </div>
      </div>
    </>
  );
}
