"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { faculty } from "@/lib/data/faculty";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function FacultySection() {
  return (
    <section id="faculty" className="bg-white py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <SectionHeader
            label="Faculty"
            title="師資團隊"
            description="專業師資，陪伴每位學員的藝術旅程。"
            align="center"
          />
        </FadeIn>

        <div className="mt-10 grid gap-6 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
          {faculty.map((member, i) => (
            <FadeIn key={member.id} delay={i * 0.08}>
              <motion.article
                whileHover={{ y: -4 }}
                transition={{ duration: 0.35 }}
                className="group overflow-hidden rounded-2xl border border-border bg-white"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-surface">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover object-top transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-gold">
                    {member.role}
                  </p>
                  <h3 className="mt-1 font-display text-lg font-semibold text-foreground">
                    {member.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {member.bio}
                  </p>
                </div>
              </motion.article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
