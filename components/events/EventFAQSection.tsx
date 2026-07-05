"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { EventFAQ } from "@/src/data/events";
import { FadeIn } from "@/components/ui/FadeIn";

type EventFAQSectionProps = {
  items: EventFAQ[];
};

export function EventFAQSection({ items }: EventFAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-12 sm:py-16">
      <FadeIn>
        <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
          FAQ
        </h2>
      </FadeIn>

      <div className="mt-8 divide-y divide-border border-y border-border">
        {items.map((item, i) => {
          const isOpen = openIndex === i;

          return (
            <FadeIn key={item.question} delay={i * 0.04}>
              <div>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="pr-4 text-sm font-medium text-foreground sm:text-base">
                    {item.question}
                  </span>
                  <span
                    className={`shrink-0 text-gold transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                  >
                    +
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 text-sm leading-relaxed text-muted">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
}
