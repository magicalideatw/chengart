"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { EventInstructor } from "@/src/data/events";
import { FadeIn } from "@/components/ui/FadeIn";

type EventInstructorsProps = {
  items: EventInstructor[];
};

export function EventInstructors({ items }: EventInstructorsProps) {
  return (
    <section className="py-12 sm:py-16">
      <FadeIn>
        <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
          師資
        </h2>
      </FadeIn>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {items.map((instructor, i) => (
          <FadeIn key={instructor.name} delay={i * 0.08}>
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.3 }}
              className="flex gap-4 rounded-2xl border border-border bg-white p-5 sm:p-6"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full sm:h-20 sm:w-20">
                <Image
                  src={instructor.avatar}
                  alt={instructor.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gold">
                  {instructor.role}
                </p>
                <h3 className="mt-1 font-display text-base font-semibold text-foreground">
                  {instructor.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {instructor.bio}
                </p>
              </div>
            </motion.div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
