"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { CourseListing } from "@/lib/data/course-listings";

type CourseCardProps = {
  course: CourseListing;
  index: number;
};

export function CourseCard({ course, index }: CourseCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-5% 0px" }}
      transition={{
        duration: 0.7,
        delay: index * 0.08,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={{ y: -4 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white transition-shadow hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface">
        <Image
          src={course.coverImage}
          alt={course.title}
          fill
          className="object-cover transition duration-700 group-hover:scale-[1.03]"
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
          {course.audiences.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-foreground/70"
            >
              🏷 {tag}
            </span>
          ))}
        </div>

        <Link
          href={course.href}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition group-hover:text-gold"
        >
          了解更多
          <span className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </div>
    </motion.article>
  );
}
