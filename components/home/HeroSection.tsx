"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { heroImage, siteConfig } from "@/lib/data/site";
import { Button } from "@/components/ui/Button";

export function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden">
      <Image
        src={heroImage.src}
        alt={heroImage.alt}
        fill
        priority
        className="object-cover object-[72%_22%] sm:object-[76%_20%] lg:object-[82%_18%]"
        sizes="100vw"
      />

      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-linear-to-r from-black/45 via-black/38 to-black/20" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 md:px-8">
        <div className="max-w-xl">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
              {siteConfig.name}
            </h1>
            <p className="mt-4 text-sm font-medium uppercase tracking-[0.35em] text-gold sm:text-base">
              {siteConfig.tagline}
            </p>
            <p className="text-balance mt-6 max-w-lg text-base leading-relaxed text-white/85 sm:text-lg">
              {siteConfig.slogan}
            </p>

            <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:gap-4">
              <Button href="#activities" variant="gold">
                最新活動
              </Button>
              <Button href="#courses" variant="outline">
                探索課程
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
