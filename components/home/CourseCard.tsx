"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CourseCoverImage } from "@/components/courses/CourseCoverImage";
import { ActivityCta } from "@/components/courses/ActivityCta";
import { resolveActivityCta } from "@/lib/courses/activity-status";
import { formatFee } from "@/lib/admin/format";
import type { CourseListing } from "@/lib/courses/types";

type CourseCardProps = {
  course: CourseListing;
  index: number;
};

const cardClassName =
  "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white transition-shadow hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]";

export function CourseCard({ course, index }: CourseCardProps) {
  const cta = resolveActivityCta({
    isOpen: course.isOpen,
    participationMethod: course.participationMethod,
    externalUrl: course.externalUrl,
    actionButtonText: course.actionButtonText,
    internalHref: course.href,
  });

  const isClickable =
    cta.kind === "internal-link" || cta.kind === "external-link";

  const content = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        <CourseCoverImage
          src={course.coverImage}
          alt={course.title}
          className="object-cover object-[center_top] transition duration-700 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {course.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
          {course.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-foreground/70">
            🏷 {course.category}
          </span>
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-foreground/70">
            {formatFee(course.pricePerStudent || course.fee)}
          </span>
        </div>

        <div className="mt-5">
          <ActivityCta
            isOpen={course.isOpen}
            participationMethod={course.participationMethod}
            externalUrl={course.externalUrl}
            actionButtonText={course.actionButtonText}
            internalHref={course.href}
            variant="card"
            staticPresentation={isClickable}
          />
        </div>
      </div>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-5% 0px" }}
      transition={{
        duration: 0.7,
        delay: index * 0.08,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={isClickable ? { y: -4 } : undefined}
      className="h-full"
    >
      {cta.kind === "internal-link" ? (
        <Link
          href={cta.href}
          aria-label={`查看${course.title}`}
          className={`${cardClassName} cursor-pointer`}
        >
          {content}
        </Link>
      ) : cta.kind === "external-link" ? (
        <a
          href={cta.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`查看${course.title}`}
          className={`${cardClassName} cursor-pointer`}
        >
          {content}
        </a>
      ) : (
        <article className={cardClassName}>{content}</article>
      )}
    </motion.div>
  );
}
