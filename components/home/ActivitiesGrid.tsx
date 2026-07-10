"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { EventStatusBadge } from "@/components/events/EventStatusBadge";
import { FadeIn } from "@/components/ui/FadeIn";
import type { EventHomepageItem } from "@/lib/events/types";

type ActivitiesGridProps = {
  events: EventHomepageItem[];
};

export function ActivitiesGrid({ events }: ActivitiesGridProps) {
  return (
    <>
      {events.length === 0 ? (
        <FadeIn>
          <p className="mt-10 text-center text-sm leading-relaxed text-muted sm:mt-14">
            目前沒有近期招生與演出，
            <br />
            歡迎追蹤我們的社群，掌握第一手消息。
          </p>
        </FadeIn>
      ) : (
        <div className="mt-10 grid gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {events.map((item, i) => (
            <FadeIn key={item.id} delay={i * 0.08}>
              <motion.article
                whileHover={{ y: -4 }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white transition-shadow hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={item.coverImage}
                    alt={item.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute left-3 top-3 z-10">
                    <EventStatusBadge status={item.status} />
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <time className="text-xs text-gold">{item.dateLabel}</time>
                  <h3 className="mt-2 font-display text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                    {item.subtitle}
                  </p>
                  <Link
                    href={`/events/${item.slug}`}
                    className="mt-4 inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-white transition hover:bg-foreground/90"
                  >
                    了解更多
                  </Link>
                </div>
              </motion.article>
            </FadeIn>
          ))}
        </div>
      )}
    </>
  );
}
