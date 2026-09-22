import Link from "next/link";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getNewsArticles } from "@/lib/news-articles/queries";

function formatPublishedDate(isoDate: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(isoDate));
}

export function NewsArticlesSection() {
  const articles = getNewsArticles();

  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-border bg-surface/30 py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <SectionHeader
            label="Column"
            title="表演藝術專欄"
            description="提供劇團演出、活動規劃與表演形式選擇的實用指南，協助您找到適合的演出方向。"
            headingLevel="h2"
          />
        </FadeIn>

        <div className="mt-10 grid gap-5 sm:mt-14 sm:grid-cols-2 lg:grid-cols-2 lg:gap-6">
          {articles.map((article, index) => (
            <FadeIn key={article.slug} delay={0.05 + index * 0.03}>
              <article className="flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">
                  {article.category}
                </p>
                <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-foreground sm:text-xl">
                  <Link
                    href={`/news/${article.slug}`}
                    className="transition hover:text-gold"
                  >
                    {article.title}
                  </Link>
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                  {article.excerpt}
                </p>
                <div className="mt-5 flex items-center justify-between gap-4 text-sm">
                  <time
                    dateTime={article.publishedAt}
                    className="text-muted/80"
                  >
                    {formatPublishedDate(article.publishedAt)}
                  </time>
                  <Link
                    href={`/news/${article.slug}`}
                    className="font-medium text-foreground transition hover:text-gold"
                  >
                    閱讀全文
                  </Link>
                </div>
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
