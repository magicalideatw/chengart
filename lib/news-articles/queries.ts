import { newsArticles } from "@/lib/news-articles/catalog";
import type { NewsArticle } from "@/lib/news-articles/types";

export function getNewsArticles(): NewsArticle[] {
  return [...newsArticles].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function getNewsArticleSlugs(): string[] {
  return getNewsArticles().map((article) => article.slug);
}

export function getNewsArticleBySlug(slug: string): NewsArticle | undefined {
  return newsArticles.find((article) => article.slug === slug);
}
