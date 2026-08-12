import { getActiveAnnouncements } from "@/lib/announcements/queries";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeader } from "@/components/ui/SectionHeader";

export async function NewsSection({
  headingLevel = "h2",
}: {
  headingLevel?: "h1" | "h2";
} = {}) {
  const announcements = await getActiveAnnouncements();

  if (announcements.length === 0) {
    return null;
  }

  return (
    <section id="news" className="bg-white py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <SectionHeader
            label="News"
            title="最新消息"
            description="掌握晟心誠藝劇團的最新動態與重要公告。"
            headingLevel={headingLevel}
          />
        </FadeIn>

        <div className="mt-10 space-y-4 sm:mt-14">
          {announcements.map((item, index) => (
            <FadeIn key={item.id} delay={0.05 + index * 0.04}>
              <article className="rounded-2xl border border-border bg-surface/40 px-5 py-5 sm:px-6 sm:py-6">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted sm:text-base">
                  {item.content}
                </p>
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
