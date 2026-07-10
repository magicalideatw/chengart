import { getHomepageEvents } from "@/lib/events/queries";
import { ActivitiesGrid } from "@/components/home/ActivitiesGrid";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeader } from "@/components/ui/SectionHeader";

export async function ActivitiesSection() {
  const events = await getHomepageEvents();

  return (
    <section id="activities" className="bg-white py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <SectionHeader
            label="Activities"
            title="近期招生與演出"
            description="看看晟心誠藝劇團近期的課程、演出與活動，歡迎一起加入我們！"
          />
        </FadeIn>

        <ActivitiesGrid events={events} />
      </div>
    </section>
  );
}
