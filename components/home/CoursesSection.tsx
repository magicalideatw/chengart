"use client";

import { motion } from "framer-motion";
import { courseCategories } from "@/lib/data/courses";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function CoursesSection() {
  return (
    <section id="courses" className="bg-surface py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <SectionHeader
            label="Courses"
            title="藝術課程"
            description="Magic · Drama · Dance · Academy — 為各年齡與程度設計的專業藝術教育。"
          />
        </FadeIn>

        <div className="mt-10 grid gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-6">
          {courseCategories.map((cat, i) => (
            <FadeIn key={cat.id} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.35 }}
                className="rounded-2xl border border-border bg-white p-6 sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl" aria-hidden>
                    {cat.icon}
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h3 className="font-display text-xl font-semibold text-foreground">
                        {cat.title}
                      </h3>
                      <span className="text-sm text-muted">{cat.titleEn}</span>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-gold">
                        適合
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {cat.audiences.map((a) => (
                          <span
                            key={a}
                            className="rounded-full bg-gold-soft px-3 py-1 text-xs text-foreground/80"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="text-xs font-medium uppercase tracking-wider text-gold">
                        內容
                      </p>
                      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
                        {cat.items.map((item) => (
                          <li
                            key={item}
                            className="text-sm text-muted before:mr-2 before:text-gold before:content-['·']"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
