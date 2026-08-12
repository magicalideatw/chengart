"use client";

import Image from "next/image";
import { aboutContent } from "@/lib/data/about";
import { FadeIn } from "@/components/ui/FadeIn";

export function AboutSection({
  headingLevel = "h2",
}: {
  headingLevel?: "h1" | "h2";
}) {
  const HeadingTag = headingLevel;

  return (
    <section id="about" className="bg-surface py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
          <FadeIn delay={0.05}>
            <div className="group relative aspect-[4/3] overflow-hidden rounded-3xl shadow-[0_12px_48px_rgba(0,0,0,0.12)]">
              <Image
                src={aboutContent.image}
                alt={aboutContent.alt}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </FadeIn>

          <div>
            <FadeIn delay={0.08}>
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold">
                {aboutContent.label}
              </p>
              <HeadingTag className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:mt-5 sm:text-4xl md:text-5xl">
                {aboutContent.title}
              </HeadingTag>
              <p className="mt-5 text-base leading-relaxed text-muted sm:mt-6 sm:text-lg sm:leading-8">
                {aboutContent.subtitle}
              </p>
            </FadeIn>

            <FadeIn className="mt-8 sm:mt-10" delay={0.1}>
              <div className="space-y-6 sm:space-y-8">
                {aboutContent.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 24)}
                    className="text-sm leading-7 text-muted sm:text-base sm:leading-8"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </FadeIn>

            <FadeIn className="mt-10 sm:mt-12" delay={0.12}>
              <div className="border-y border-border py-8 sm:py-10">
                <p className="font-display text-xl italic leading-relaxed text-foreground sm:text-2xl sm:leading-9">
                  <span className="text-gold">「</span>
                  {aboutContent.brandPhilosophy}
                  <span className="text-gold">」</span>
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
