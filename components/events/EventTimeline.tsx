"use client";

import { motion } from "framer-motion";
import type { EventTimelineItem } from "@/src/data/events";
import { FadeIn } from "@/components/ui/FadeIn";

type EventTimelineProps = {
  items: EventTimelineItem[];
};

export function EventTimeline({ items }: EventTimelineProps) {
  return (
    <section className="py-12 sm:py-16">
      <FadeIn>
        <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
          課程流程
        </h2>
      </FadeIn>

      <div className="relative mt-8">
        <div
          aria-hidden
          className="absolute bottom-4 left-[11px] top-4 w-px bg-border sm:left-[15px]"
        />

        <ol className="space-y-0">
          {items.map((item, i) => (
            <FadeIn key={item.session} delay={i * 0.06}>
              <li className="relative flex gap-5 pb-8 last:pb-0 sm:gap-6">
                <div className="relative z-10 flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gold shadow-sm sm:h-8 sm:w-8"
                  />
                  {i < items.length - 1 && (
                    <span className="mt-2 text-xs text-mist">↓</span>
                  )}
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-xs font-medium uppercase tracking-wider text-gold">
                    {item.session}
                  </p>
                  <p className="mt-1 font-display text-base font-semibold text-foreground sm:text-lg">
                    {item.title}
                  </p>
                </div>
              </li>
            </FadeIn>
          ))}
        </ol>
      </div>
    </section>
  );
}
