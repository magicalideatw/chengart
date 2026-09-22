import Link from "next/link";
import { ArticleBody } from "@/components/news/ArticleBody";
import { FadeIn } from "@/components/ui/FadeIn";
import type { NewsArticle } from "@/lib/news-articles/types";

function formatPublishedDate(isoDate: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(isoDate));
}

type ArticlePageContentProps = {
  article: NewsArticle;
};

export function ArticlePageContent({ article }: ArticlePageContentProps) {
  return (
    <>
      <section className="border-b border-border bg-surface/40 py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <FadeIn>
            <Link
              href="/news"
              className="text-sm text-muted transition hover:text-foreground"
            >
              ← 返回最新消息
            </Link>
            <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-gold">
              {article.category}
            </p>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {article.title}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
              {article.excerpt}
            </p>
            <p className="mt-4 text-sm text-muted/80">
              {formatPublishedDate(article.publishedAt)}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <FadeIn delay={0.05}>
            <ArticleBody blocks={article.blocks} />
          </FadeIn>
        </div>
      </section>
    </>
  );
}
