import { Check, Info, type LucideIcon } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { spaceRentalContent } from "@/lib/data/space-rental";

const noticeIcons: Record<"check" | "info", LucideIcon> = {
  check: Check,
  info: Info,
};

export function SpaceNoticeSection() {
  const { notices } = spaceRentalContent;

  return (
    <section className="bg-surface py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <SectionHeader
            label={notices.label}
            title={notices.title}
            align="center"
          />
        </FadeIn>

        <FadeIn className="mx-auto mt-10 max-w-2xl sm:mt-14" delay={0.08}>
          <ul className="space-y-4 text-sm leading-relaxed text-muted sm:space-y-5 sm:text-base">
            {notices.items.map((notice) => {
              const Icon = noticeIcons[notice.icon];

              return (
                <li key={notice.text} className="flex gap-3 sm:gap-3.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  </span>
                  <span className="pt-0.5">{notice.text}</span>
                </li>
              );
            })}
          </ul>
        </FadeIn>
      </div>
    </section>
  );
}
