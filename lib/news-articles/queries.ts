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

export const HOME_FEATURED_ARTICLE_SLUGS = [
  "taoyuan-theatre-troupe-guide",
  "taoyuan-magic-show-guide",
  "taoyuan-performing-group-services",
] as const;

export function getHomeFeaturedArticles(): NewsArticle[] {
  return HOME_FEATURED_ARTICLE_SLUGS.map((slug) =>
    getNewsArticleBySlug(slug),
  ).filter((article): article is NewsArticle => article !== undefined);
}
