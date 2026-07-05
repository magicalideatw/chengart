"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { activities } from "@/lib/data/activities";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function ActivitiesSection() {
  return (
    <section id="activities" className="bg-white py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <SectionHeader
            label="Activities"
            title="最新活動"
            description="夏令營、工作坊與短期課程，歡迎立即報名。"
          />
        </FadeIn>

        <div className="mt-10 grid gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {activities.map((item, i) => (
            <FadeIn key={item.id} delay={i * 0.08}>
              <motion.article
                whileHover={{ y: -4 }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white transition-shadow hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <time className="text-xs text-gold">{item.date}</time>
                  <h3 className="mt-2 font-display text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                    {item.description}
                  </p>
                  <Link
                    href={item.href}
                    className="mt-4 inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-white transition hover:bg-foreground/90"
                  >
                    立即報名
                  </Link>
                </div>
              </motion.article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
