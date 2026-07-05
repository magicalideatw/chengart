"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { RegistrationCourse } from "@/src/data/courses";

type CourseRegistrationHeroProps = {
  course: RegistrationCourse;
  onRegister: () => void;
};

export function CourseRegistrationHero({
  course,
  onRegister,
}: CourseRegistrationHeroProps) {
  return (
    <section className="relative">
      <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[21/9]">
        <Image
          src={course.coverImage}
          alt={course.title}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/25 to-black/10" />
      </div>

      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-3xl px-5 pb-10 pt-20 text-center sm:pb-14 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold">
            {course.location}
          </p>
          <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">
            {course.title}
          </h1>
          <p className="text-balance mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
            {course.subtitle}
          </p>
          <button
            type="button"
            onClick={onRegister}
            className="mt-8 inline-flex items-center justify-center rounded-full bg-gold px-8 py-3.5 text-sm font-medium text-white transition hover:bg-gold-light"
          >
            立即報名
          </button>
        </motion.div>
      </div>
    </section>
  );
}
