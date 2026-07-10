"use client";

import type { EventPageData } from "@/lib/events/types";
import { EventFAQSection } from "@/components/events/EventFAQSection";
import { EventGallery } from "@/components/events/EventGallery";
import { EventHero } from "@/components/events/EventHero";
import { EventHighlights } from "@/components/events/EventHighlights";
import { EventInfoCard } from "@/components/events/EventInfoCard";
import { EventInstructors } from "@/components/events/EventInstructors";
import { EventRegistrationForm } from "@/components/events/EventRegistrationForm";
import { EventRichContent } from "@/components/events/EventRichContent";
import { EventTimeline } from "@/components/events/EventTimeline";
import { FadeIn } from "@/components/ui/FadeIn";

type EventPageContentProps = {
  event: EventPageData;
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
            {event.intro ? (
              <section className="py-12 sm:py-16">
                <FadeIn>
                  <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                    活動簡介
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-muted">{event.intro}</p>
                </FadeIn>
              </section>
            ) : null}

            <EventRichContent html={event.content} />

            {event.highlights?.length ? (
              <EventHighlights items={event.highlights} />
            ) : null}
            {event.timeline?.length ? <EventTimeline items={event.timeline} /> : null}
            {event.instructors?.length ? (
              <EventInstructors items={event.instructors} />
            ) : null}
            {event.gallery?.length ? (
              <EventGallery images={event.gallery} title={event.title} />
            ) : null}
            {event.faq?.length ? <EventFAQSection items={event.faq} /> : null}

            <EventRegistrationForm event={event} />
          </div>
        </div>
      </div>
    </>
  );
}
