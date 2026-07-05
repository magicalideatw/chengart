"use client";

import Image from "next/image";
import Link from "next/link";
import { aboutContent, stats } from "@/lib/data/about";
import { CountUp } from "@/components/ui/CountUp";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function AboutSection() {
  return (
    <section id="about" className="bg-surface py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <SectionHeader label="About" title="劇團介紹" />
        </FadeIn>

        <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-2 lg:items-center lg:gap-16">
          <FadeIn delay={0.05}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl lg:aspect-[3/4]">
              <Image
                src={aboutContent.image}
                alt={aboutContent.alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div>
              <h3 className="text-xs font-medium uppercase tracking-[0.24em] text-gold">
                {aboutContent.headline}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base sm:leading-7">
                {aboutContent.body}
              </p>

              <h3 className="mt-8 text-xs font-medium uppercase tracking-[0.24em] text-gold">
                {aboutContent.spirit}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base sm:leading-7">
                專業、創意、有溫度 — 我們以藝術教育與演出服務，連結舞台與生活。
              </p>

              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-8">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                      <CountUp value={stat.value} suffix={stat.suffix} />
                    </p>
                    <p className="mt-1 text-xs text-muted">{stat.label}</p>
                  </div>
                ))}
              </div>

              <Link
                href={aboutContent.href}
                className="mt-8 inline-flex items-center gap-1.5 rounded-full border border-foreground px-6 py-2.5 text-sm font-medium text-foreground transition hover:bg-foreground hover:text-white"
              >
                了解更多
                <span>→</span>
              </Link>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
