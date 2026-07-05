"use client";

import { motion, useReducedMotion } from "framer-motion";
import { heroVideo, siteConfig } from "@/lib/data/site";
import { Button } from "@/components/ui/Button";

export function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        poster={heroVideo.poster}
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src={heroVideo.src} type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/60" />

      <div className="relative z-10 mx-auto max-w-4xl px-5 text-center md:px-8">
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
          <p className="text-balance mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/85 sm:text-lg">
            {siteConfig.slogan}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button href="#activities" variant="gold">
              最新活動
            </Button>
            <Button href="#courses" variant="outline">
              探索課程
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
