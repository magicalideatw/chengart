"use client";

import { motion } from "framer-motion";
import type { EventHighlight } from "@/src/data/events";
import { FadeIn } from "@/components/ui/FadeIn";

type EventHighlightsProps = {
  items: EventHighlight[];
};

export function EventHighlights({ items }: EventHighlightsProps) {
  return (
    <section className="py-12 sm:py-16">
      <FadeIn>
        <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
          課程介紹
        </h2>
      </FadeIn>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {items.map((item, i) => (
          <FadeIn key={item.title} delay={i * 0.06}>
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-border bg-white p-6"
            >
              <span className="text-2xl" aria-hidden>
                {item.icon}
              </span>
              <h3 className="mt-4 font-display text-base font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {item.description}
              </p>
            </motion.div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
