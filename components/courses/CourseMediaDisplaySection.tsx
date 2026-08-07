"use client";

import { motion } from "framer-motion";
import { resolveMediaEmbedUrl } from "@/lib/media/providers";
import type { CourseMediaRecord } from "@/lib/media/types";

type CourseMediaDisplaySectionProps = {
  sectionTitle: string;
  mediaItems: CourseMediaRecord[];
};

function MediaEmbed({
  item,
  iframeTitle,
}: {
  item: CourseMediaRecord;
  iframeTitle: string;
}) {
  const embedUrl = resolveMediaEmbedUrl(item.mediaType, item.sourceUrl);
  if (!embedUrl) return null;

  return (
    <div className="overflow-hidden rounded-xl shadow-sm">
      <div className="relative aspect-video w-full">
        <iframe
          src={embedUrl}
          title={iframeTitle}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}

export function CourseMediaDisplaySection({
  sectionTitle,
  mediaItems,
}: CourseMediaDisplaySectionProps) {
  const playableItems = mediaItems.filter(
    (item) => resolveMediaEmbedUrl(item.mediaType, item.sourceUrl) !== null,
  );

  if (playableItems.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-3xl px-5 py-10 md:px-8"
    >
      <div className="rounded-3xl border border-border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:p-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          {sectionTitle}
        </h2>

        <div className="mt-8 space-y-10">
          {playableItems.map((item) => {
            const title = item.title.trim();
            const description = item.description?.trim() ?? "";

            return (
              <article key={item.id} className="space-y-3">
                {title ? (
                  <h3 className="text-base font-medium text-foreground">{title}</h3>
                ) : null}
                {description ? (
                  <p className="text-sm leading-relaxed text-muted">{description}</p>
                ) : null}
                <MediaEmbed
                  item={item}
                  iframeTitle={title || sectionTitle}
                />
              </article>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
