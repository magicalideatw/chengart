"use client";

import { motion } from "framer-motion";
import { CourseCoverImage } from "@/components/courses/CourseCoverImage";
import {
  ACTIVITY_DETAIL_HERO_IMAGE_CLASS,
  ACTIVITY_DETAIL_HERO_IMAGE_SIZES,
  ActivityDetailHeroFrame,
} from "@/components/courses/ActivityDetailHeroFrame";
import { ActivityCta } from "@/components/courses/ActivityCta";
import { formatFee, formatSessionDate } from "@/lib/admin/format";
import {
  getEnrollmentStatusLabel,
} from "@/lib/courses/enrollment";
import type { CourseWithEnrollment } from "@/lib/courses/types";
import type { RegistrationMode } from "@/lib/courses/registration-mode";
import type { CourseRegistrationPlan } from "@/lib/registration/queries";
import { getEffectivePricePerStudent } from "@/lib/registration/pricing";

type CourseRegistrationHeroProps = {
  course: CourseWithEnrollment;
  plan: CourseRegistrationPlan;
  onRegister: () => void;
  registrationMode: RegistrationMode;
};

export function CourseRegistrationHero({
  course,
  plan,
  onRegister,
  registrationMode,
}: CourseRegistrationHeroProps) {
  const usesSessions = plan.usesSessions;
  const pricePerStudent = getEffectivePricePerStudent(course);
  const enrollmentStatus = getEnrollmentStatusLabel({
    course,
    usesSessions,
    hasSelectableSessions: plan.hasSelectableSessions,
  });

  return (
    <section className="relative">
      <ActivityDetailHeroFrame>
        <CourseCoverImage
          src={course.coverImage}
          alt={course.title}
          priority
          sizes={ACTIVITY_DETAIL_HERO_IMAGE_SIZES}
          className={ACTIVITY_DETAIL_HERO_IMAGE_CLASS}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/25 to-black/10" />
      </ActivityDetailHeroFrame>

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
                  依班別報名
                </span>
                <span className="rounded-full border border-white/20 px-3 py-1">
                  每人 {formatFee(pricePerStudent)}
                </span>
              </>
            ) : (
              <>
                <span className="rounded-full border border-white/20 px-3 py-1">
                  {formatSessionDate(course.sessionDate)} · {course.sessionTime}
                </span>
                {course.showRemainingCapacity ? (
                  <span className="rounded-full border border-white/20 px-3 py-1">
                    名額 {course.enrollmentCount}/{course.capacity}
                  </span>
                ) : (
                  <span className="rounded-full border border-white/20 px-3 py-1">
                    {enrollmentStatus}
                  </span>
                )}
                <span className="rounded-full border border-white/20 px-3 py-1">
                  {formatFee(pricePerStudent)}
                </span>
              </>
            )}
            {!usesSessions && course.showRemainingCapacity ? (
              <span className="rounded-full border border-white/20 px-3 py-1">
                {enrollmentStatus}
              </span>
            ) : null}
            {usesSessions && !course.showRemainingCapacity ? (
              <span className="rounded-full border border-white/20 px-3 py-1">
                {enrollmentStatus}
              </span>
            ) : null}
          </div>
          <div className="mt-8">
            <ActivityCta
              isOpen={course.isOpen}
              isFull={course.isFull}
              participationMethod={course.participationMethod}
              externalUrl={course.externalUrl}
              actionButtonText={course.actionButtonText}
              internalHref={`/courses/${course.id}`}
              onInternalAction={onRegister}
              variant="hero"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
