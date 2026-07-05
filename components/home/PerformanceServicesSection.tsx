"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { performanceServices } from "@/lib/data/services";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function PerformanceServicesSection() {
  return (
    <section id="performances" className="bg-white py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <SectionHeader
            label="Performances"
            title="演出"
            description="校園巡演、企業活動、劇場演出與大型活動 — 專業策劃與執行。"
          />
        </FadeIn>

        <div className="mt-10 grid gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {performanceServices.map((item, i) => (
            <FadeIn key={item.id} delay={i * 0.06}>
              <motion.article
                whileHover={{ y: -4 }}
                transition={{ duration: 0.35 }}
                className="group overflow-hidden rounded-2xl border border-border bg-white"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                  <h3 className="absolute inset-x-0 bottom-0 p-5 font-display text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                </div>
                <div className="p-5">
                  <p className="text-sm leading-relaxed text-muted">
                    {item.description}
                  </p>
                  <Link
                    href={item.href}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold transition hover:text-gold-light"
                  >
                    立即詢價
                    <span className="transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
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
