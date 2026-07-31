import Link from "next/link";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { spaceRentalContent } from "@/lib/data/space-rental";

const primaryButtonClass =
  "inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-foreground/90";

const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-full border border-border bg-white px-6 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:bg-white/90";

export function SpaceLocationSection() {
  const { location } = spaceRentalContent;

  return (
    <section className="bg-surface py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <SectionHeader
            label={location.label}
            title={location.title}
            description={location.description}
            align="center"
          />
        </FadeIn>

        <FadeIn className="mt-10 sm:mt-14" delay={0.08}>
          <div className="rounded-2xl border border-border bg-white px-5 py-5 sm:px-6 sm:py-6">
            <p className="text-sm font-semibold text-foreground sm:text-base">
              📍 {location.addressLabel}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
              {location.address}
            </p>

            <div className="mt-6 overflow-hidden rounded-xl">
              <iframe
                src={location.mapsEmbedUrl}
                title={location.mapsTitle}
                className="h-[420px] w-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={location.mapsNavigationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${primaryButtonClass} w-full sm:w-auto`}
              >
                {location.mapsButtonLabel}
              </a>
              <Link
                href="#inquiry"
                className={`${secondaryButtonClass} w-full sm:w-auto`}
              >
                {location.contactButtonLabel}
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
