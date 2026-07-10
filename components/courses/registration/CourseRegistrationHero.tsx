"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { formatFee, formatSessionDate } from "@/lib/admin/format";
import type { CourseWithEnrollment } from "@/lib/courses/types";
import type { CourseRegistrationPlan } from "@/lib/registration/queries";

type CourseRegistrationHeroProps = {
  course: CourseWithEnrollment;
  plan: CourseRegistrationPlan;
  onRegister: () => void;
  canRegister: boolean;
  selectedCount?: number;
};

export function CourseRegistrationHero({
  course,
  plan,
  onRegister,
  canRegister,
  selectedCount = 0,
}: CourseRegistrationHeroProps) {
  const usesSessions = plan.usesSessions;

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
            {course.category}
          </p>
          <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">
            {course.title}
          </h1>
          <p className="text-balance mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
            {course.description}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs text-white/80">
            {usesSessions ? (
              <>
                <span className="rounded-full border border-white/20 px-3 py-1">
                  依班別選擇上課日期
                </span>
                <span className="rounded-full border border-white/20 px-3 py-1">
                  單堂 {formatFee(plan.defaultUnitPrice)} 起
                </span>
              </>
            ) : (
              <>
                <span className="rounded-full border border-white/20 px-3 py-1">
                  {formatSessionDate(course.sessionDate)} · {course.sessionTime}
                </span>
                <span className="rounded-full border border-white/20 px-3 py-1">
                  名額 {course.enrollmentCount}/{course.capacity}
                </span>
                <span className="rounded-full border border-white/20 px-3 py-1">
                  {formatFee(course.fee)}
                </span>
              </>
            )}
          </div>
          {canRegister ? (
            usesSessions ? (
              selectedCount > 0 ? (
                <p className="mt-8 text-sm text-white/80">
                  已選 {selectedCount} 堂，請在下方確認後繼續報名
                </p>
              ) : (
                <p className="mt-8 text-sm text-white/80">
                  請先選擇要上課的日期
                </p>
              )
            ) : (
              <button
                type="button"
                onClick={onRegister}
                className="mt-8 inline-flex items-center justify-center rounded-full bg-gold px-8 py-3.5 text-sm font-medium text-white transition hover:bg-gold-light"
              >
                立即報名
              </button>
            )
          ) : (
            <p className="mt-8 inline-flex rounded-full border border-white/20 bg-black/30 px-6 py-3 text-sm text-white/80">
              {!course.isOpen
                ? "目前未開放報名"
                : usesSessions
                  ? "目前沒有可報名的上課日期"
                  : "已額滿"}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
