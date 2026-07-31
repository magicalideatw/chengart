"use client";

import { motion } from "framer-motion";
import {
  Camera,
  Dice5,
  GraduationCap,
  Leaf,
  MicVocal,
  Music4,
  Palette,
  Sparkles,
  Theater,
  Users,
  type LucideIcon,
} from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { spaceRentalContent } from "@/lib/data/space-rental";

const usageIcons: Record<
  (typeof spaceRentalContent.usageItems)[number]["icon"],
  LucideIcon
> = {
  drama: Theater,
  dance: Music4,
  magic: Sparkles,
  yoga: Leaf,
  class: GraduationCap,
  workshop: Palette,
  photo: Camera,
  performance: MicVocal,
  boardgames: Dice5,
  community: Users,
};

export function SpaceUsageSection() {
  const { usage, usageItems } = spaceRentalContent;

  return (
    <section className="bg-surface py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <SectionHeader
            label={usage.label}
            title={usage.title}
            description={usage.description}
            align="center"
          />
        </FadeIn>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-5 lg:grid-cols-5">
          {usageItems.map((item, index) => {
            const Icon = usageIcons[item.icon];

            return (
              <FadeIn key={item.id} delay={0.05 + index * 0.04}>
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
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
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
