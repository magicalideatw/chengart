import Link from "next/link";
import { FadeIn } from "@/components/ui/FadeIn";

const inlineLinkClass =
  "text-foreground underline decoration-gold/35 underline-offset-[3px] transition hover:text-gold hover:decoration-gold/70";

export function HomeSeoIntroSection() {
  return (
    <section
      className="bg-white py-16 sm:py-20 md:py-24"
      aria-label="中壢藝術課程、夏令營與表演藝術"
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              中壢藝術課程、夏令營與表演藝術
            </h2>
            <div className="mt-6 space-y-5 sm:mt-8 sm:space-y-6">
              <p className="text-sm leading-7 text-muted sm:text-base sm:leading-8">
                晟心誠藝劇團以魔術、戲劇、舞蹈與表演藝術教育為核心，從中壢出發，提供
                <Link href="/courses" className={inlineLinkClass}>
                  兒童藝術課程
                </Link>
                、表演藝術活動、夏令營與多元舞台演出。
              </p>
              <p className="text-sm leading-7 text-muted sm:text-base sm:leading-8">
                我們透過魔術、戲劇、舞蹈與創意活動，讓孩子在學習與參與中培養自信、表達能力、創造力與團體合作。除了平時課程，也規劃中壢夏令營、兒童營隊與暑期活動，讓孩子在假期中接觸更多不同的藝術體驗。
              </p>
              <p className="text-sm leading-7 text-muted sm:text-base sm:leading-8">
                同時提供中壢與桃園地區的
                <Link href="/performances" className={inlineLinkClass}>
                  魔術表演、戲劇演出、舞蹈演出與活動表演
                </Link>
                ，適合校園、企業、親子活動、節慶活動及各類藝文活動。
              </p>
              <p className="text-sm leading-7 text-muted sm:text-base sm:leading-8">
                從學習藝術，到站上舞台，讓每一次參與，都成為值得記住的經驗。
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
