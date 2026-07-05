"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Event } from "@/src/data/events";
import { canRegister } from "@/src/data/events";

type EventHeroProps = {
  event: Event;
};

export function EventHero({ event }: EventHeroProps) {
  const open = canRegister(event);

  return (
    <section className="relative">
      <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[21/9]">
        <Image
          src={event.heroImage}
          alt={event.title}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-black/10" />
      </div>

      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-5 pb-10 pt-24 md:px-8 md:pb-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="max-w-2xl text-white"
        >
          <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
            {event.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/80 sm:text-lg">
            {event.subtitle}
          </p>
          {open ? (
            <Link
              href="#register"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-gold px-8 py-3.5 text-sm font-medium text-white transition hover:bg-gold-light"
            >
              立即報名
            </Link>
          ) : (
            <span className="mt-8 inline-flex cursor-not-allowed items-center justify-center rounded-full bg-white/20 px-8 py-3.5 text-sm font-medium text-white/60">
              已額滿
            </span>
          )}
        </motion.div>
      </div>
    </section>
  );
}
