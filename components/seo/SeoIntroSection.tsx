import { FadeIn } from "@/components/ui/FadeIn";
import {
  seoIntroContent,
  type SeoIntroPageKey,
} from "@/lib/data/seo-intro";

type SeoIntroSectionProps = {
  pageKey: SeoIntroPageKey;
};

export function SeoIntroSection({ pageKey }: SeoIntroSectionProps) {
  const content = seoIntroContent[pageKey];

  return (
    <section
      className={`${content.bgClassName} py-16 sm:py-20 md:py-24`}
      aria-label={content.title}
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {content.title}
            </h2>
            <div className="mt-6 space-y-5 sm:mt-8 sm:space-y-6">
              {content.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 24)}
                  className="text-sm leading-7 text-muted sm:text-base sm:leading-8"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
