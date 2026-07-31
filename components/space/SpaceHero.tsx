"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { spaceRentalContent } from "@/lib/data/space-rental";

const spaceHeroImage = {
  src: "/images/space/hero.jpg",
  alt: "二階藝術空間場地租借",
};

export function SpaceHero() {
  const reduceMotion = useReducedMotion();
  const { hero } = spaceRentalContent;

  return (
    <section className="relative flex min-h-[72svh] items-center overflow-hidden sm:min-h-[80svh]">
      <Image
        src={spaceHeroImage.src}
        alt={spaceHeroImage.alt}
        fill
        priority
        className="object-cover object-[72%_22%] sm:object-[76%_20%] lg:object-[82%_18%]"
        sizes="100vw"
      />

      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-linear-to-r from-black/50 via-black/40 to-black/20" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pt-24 pb-16 md:px-8 md:pb-20">
        <motion.div
          className="max-w-2xl"
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold">
            {hero.label}
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
            {hero.title}
          </h1>
          <ul className="mt-4 flex flex-wrap gap-2 sm:mt-5 sm:gap-2.5">
            {hero.badges.map((badge) => (
              <li
                key={badge}
                className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs leading-snug text-white/90 backdrop-blur-sm sm:px-3.5 sm:py-2 sm:text-sm"
              >
                {badge}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-lg font-medium text-gold sm:mt-5 sm:text-xl">
            {hero.subtitle}
          </p>
          <p className="text-balance mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            {hero.description}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
