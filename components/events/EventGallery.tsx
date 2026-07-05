"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { FadeIn } from "@/components/ui/FadeIn";

type EventGalleryProps = {
  images: string[];
  title: string;
};

export function EventGallery({ images, title }: EventGalleryProps) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) return null;

  const prev = () => setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <section className="py-12 sm:py-16">
      <FadeIn>
        <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
          課程照片
        </h2>
      </FadeIn>

      <FadeIn className="mt-8" delay={0.08}>
        <div className="relative overflow-hidden rounded-2xl bg-surface">
          <div className="relative aspect-[16/10] sm:aspect-[21/9]">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0"
              >
                <Image
                  src={images[index]}
                  alt={`${title} 照片 ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 1152px"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="上一張"
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:bg-white sm:left-4"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="下一張"
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:bg-white sm:right-4"
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>

              <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`第 ${i + 1} 張`}
                    onClick={() => setIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? "w-6 bg-gold" : "w-1.5 bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </FadeIn>
    </section>
  );
}
