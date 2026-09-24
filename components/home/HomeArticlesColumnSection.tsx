import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getHomeFeaturedArticles } from "@/lib/news-articles/queries";

function formatPublishedDate(isoDate: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(isoDate));
}

export function HomeArticlesColumnSection() {
  const articles = getHomeFeaturedArticles();

  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="bg-surface py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <SectionHeader
            label="Column"
            title="表演藝術專欄"
            description="從劇團演出、校園活動到親子與企業表演，分享實用的演出規劃資訊。"
            headingLevel="h2"
          />
        </FadeIn>

        <div className="mt-10 grid gap-5 sm:mt-14 sm:grid-cols-1 lg:grid-cols-3 lg:gap-6">
          {articles.map((article, index) => (
            <FadeIn key={article.slug} delay={0.05 + index * 0.04}>
              <Link
                href={`/news/${article.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition hover:border-border/80 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)]"
              >
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">
                  {article.category}
                </p>
                <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-foreground transition group-hover:text-gold sm:text-xl">
                  {article.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                  {article.excerpt}
                </p>
                <time
                  dateTime={article.publishedAt}
                  className="mt-5 block text-xs text-muted/70"
                >
                  {formatPublishedDate(article.publishedAt)}
                </time>
              </Link>
            </FadeIn>
          ))}
        </div>

        <FadeIn className="mt-10 flex justify-center sm:mt-14" delay={0.12}>
          <Button href="/news" variant="primary">
            查看全部文章 →
          </Button>
        </FadeIn>
      </div>
    </section>
  );
}
