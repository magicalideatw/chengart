import { getPublicEvents } from "@/lib/events/queries";
import { ActivitiesGrid } from "@/components/home/ActivitiesGrid";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeader } from "@/components/ui/SectionHeader";

type EventsListingSectionProps = {
  headingLevel?: "h1" | "h2";
};

export async function EventsListingSection({
  headingLevel = "h2",
}: EventsListingSectionProps = {}) {
  const events = await getPublicEvents();

  return (
    <section className="bg-white py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <SectionHeader
            label="Events"
            title="最新消息與活動"
            description="查看晟心誠藝劇團近期活動、招生消息與重要公告。"
            headingLevel={headingLevel}
          />
        </FadeIn>

        <ActivitiesGrid events={events} />
      </div>
    </section>
  );
}
