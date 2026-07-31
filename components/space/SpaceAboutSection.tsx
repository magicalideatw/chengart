"use client";

import { motion } from "framer-motion";
import { Car, LayoutGrid, MapPinned, Snowflake, type LucideIcon } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { spaceRentalContent } from "@/lib/data/space-rental";

const featureIcons: Record<
  (typeof spaceRentalContent.about.featureItems)[number]["icon"],
  LucideIcon
> = {
  location: MapPinned,
  flexible: LayoutGrid,
  ac: Snowflake,
  parking: Car,
};

export function SpaceAboutSection() {
  const { about } = spaceRentalContent;

  return (
    <section className="bg-white py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <SectionHeader
            label={about.label}
            title={about.title}
            align="center"
          />
        </FadeIn>

        <FadeIn className="mx-auto mt-10 max-w-3xl sm:mt-14" delay={0.08}>
          <div className="space-y-4 text-center text-sm leading-relaxed text-muted sm:text-base sm:leading-8">
            {about.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </FadeIn>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {about.featureItems.map((item, index) => {
            const Icon = featureIcons[item.icon];

            return (
              <FadeIn key={item.id} delay={0.1 + index * 0.04}>
                <motion.article
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  className="flex h-full flex-col rounded-2xl border border-border/60 bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                >
                  <Icon
                    className="h-5 w-5 text-gold"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 line-clamp-1 text-sm leading-relaxed text-muted">
                    {item.description}
                  </p>
                </motion.article>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
