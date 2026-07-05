import { partners } from "@/lib/data/partners";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function PartnersSection() {
  return (
    <section id="partners" className="border-t border-border bg-surface py-16 sm:py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <SectionHeader
            label="Partners"
            title="合作夥伴"
            align="center"
          />
        </FadeIn>

        <FadeIn className="mt-10 sm:mt-12" delay={0.08}>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="flex flex-col items-center justify-center py-4 text-center transition hover:opacity-70"
              >
                <span className="font-display text-xl font-semibold tracking-tight text-foreground/15 sm:text-2xl">
                  {partner.abbr}
                </span>
                <span className="mt-2 text-xs leading-snug text-muted">
                  {partner.name}
                </span>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
