import Link from "next/link";
import { newsItems } from "@/lib/data/news";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function NewsSection() {
  return (
    <section id="news" className="bg-white py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <SectionHeader
            label="News"
            title="最新消息"
            description="公告、新聞與演出資訊。"
          />
        </FadeIn>

        <div className="mt-10 divide-y divide-border border-y border-border sm:mt-14">
          {newsItems.map((item, i) => (
            <FadeIn key={item.id} delay={i * 0.05}>
              <Link
                href={item.href}
                className="group flex flex-col gap-2 py-5 transition hover:bg-surface/50 sm:flex-row sm:items-center sm:gap-6 sm:py-6 sm:px-2"
              >
                <time className="shrink-0 text-sm tabular-nums text-muted">
                  {item.date}
                </time>
                <span className="w-fit shrink-0 rounded-full bg-gold-soft px-3 py-1 text-xs font-medium text-gold">
                  {item.category}
                </span>
                <h3 className="flex-1 text-sm font-medium text-foreground transition group-hover:text-gold sm:text-base">
                  {item.title}
                  <span className="ml-2 inline-block opacity-0 transition group-hover:opacity-100">
                    →
                  </span>
                </h3>
              </Link>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
