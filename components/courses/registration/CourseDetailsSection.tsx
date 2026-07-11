"use client";

import { motion } from "framer-motion";

type CourseDetailsSectionProps = {
  courseDetails: string;
};

export function CourseDetailsSection({ courseDetails }: CourseDetailsSectionProps) {
  const content = courseDetails.trim();
  if (!content) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-3xl px-5 py-10 md:px-8"
    >
      <div className="rounded-3xl border border-border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:p-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          課程說明
        </h2>
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted">
          {content}
        </p>
      </div>
    </motion.section>
  );
}
