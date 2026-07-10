"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Building2,
  CalendarDays,
  GraduationCap,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  performanceServices,
  performanceServicesContent,
  type PerformanceServiceItem,
} from "@/lib/data/services";
import { FadeIn } from "@/components/ui/FadeIn";

const serviceIcons: Record<PerformanceServiceItem["icon"], LucideIcon> = {
  school: GraduationCap,
  building: Building2,
  theater: Sparkles,
  festival: CalendarDays,
};

export function PerformanceServicesSection() {
  return (
    <section id="performances" className="bg-white py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
          <FadeIn delay={0.05}>
            <div className="group relative aspect-[4/3] overflow-hidden rounded-3xl shadow-[0_12px_48px_rgba(0,0,0,0.12)]">
              <Image
                src={performanceServicesContent.image}
                alt={performanceServicesContent.alt}
                fill
                priority={false}
                className="object-cover object-[center_35%] transition-transform duration-300 group-hover:scale-[1.03]"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </FadeIn>

          <div>
            <FadeIn delay={0.08}>
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold">
                {performanceServicesContent.label}
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                {performanceServicesContent.title}
              </h2>
              <div className="mt-5 space-y-4">
                {performanceServicesContent.intro.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 20)}
                    className="text-sm leading-relaxed text-muted sm:text-base sm:leading-7"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </FadeIn>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5">
              {performanceServices.map((item, i) => {
                const Icon = serviceIcons[item.icon];

                return (
                  <FadeIn key={item.id} delay={0.12 + i * 0.05}>
                    <motion.article
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                      className="h-full rounded-2xl border border-border/60 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                    >
                      <Icon
                        className="h-5 w-5 text-gold"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      <h3 className="mt-4 font-display text-base font-semibold text-gold">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {item.description}
                      </p>
                    </motion.article>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
