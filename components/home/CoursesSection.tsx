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
            description="魔術、戲劇、舞蹈與表演培訓 — 依程度與年齡設計的專業藝術教育。"
          />
        </FadeIn>

        <div className="mt-10 divide-y divide-border border-y border-border sm:mt-14">
          {courseCategories.map((cat, i) => (
            <FadeIn key={cat.id} delay={i * 0.06}>
              <motion.div
                whileHover={{ backgroundColor: "rgba(255,255,255,0.6)" }}
                transition={{ duration: 0.3 }}
                className="grid gap-6 py-8 sm:grid-cols-[140px_1fr] sm:py-10"
              >
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                    {cat.title}
                  </h3>
                  <div className="mt-4">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-gold">
                      適合對象
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      {cat.audiences.join(" · ")}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm leading-relaxed text-muted sm:text-base">
                    {cat.description}
                  </p>
                  <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                    {cat.items.map((item) => (
                      <li
                        key={item}
                        className="text-sm text-foreground/80"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
