import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { spaceRentalContent } from "@/lib/data/space-rental";

const CALENDAR_EMBED_URL =
  "https://calendar.google.com/calendar/embed?src=56b774f3ff7d61cce27554ef322d7aa4acc1fc33b5da6ee3c9f3d3c28ed689fd%40group.calendar.google.com&ctz=Asia%2FTaipei";

export function SpaceCalendarSection() {
  const { calendar } = spaceRentalContent;

  return (
    <section className="bg-white py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <SectionHeader
            label={calendar.label}
            title={calendar.title}
            description={calendar.description}
            align="center"
          />
        </FadeIn>

        <FadeIn className="mt-10 sm:mt-14" delay={0.08}>
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
            <iframe
              src={CALENDAR_EMBED_URL}
              title={calendar.title}
              className="h-[500px] w-full border-0 md:h-[700px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-surface px-5 py-4 text-sm leading-relaxed text-muted sm:px-6 sm:py-5 sm:text-base">
            {calendar.disclaimer}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
