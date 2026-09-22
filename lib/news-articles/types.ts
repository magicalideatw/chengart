export type ArticleSegment = {
  text: string;
  href?: string;
};

export type ArticleBlock =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; segments: ArticleSegment[] };

export type NewsArticleCategory = "劇團專欄";

export type NewsArticleSeo = {
  title: string;
  description: string;
  primaryKeyword: string;
  keywords: string[];
};

export type NewsArticle = {
  slug: string;
  title: string;
  excerpt: string;
  category: NewsArticleCategory;
  publishedAt: string;
  seo: NewsArticleSeo;
  blocks: ArticleBlock[];
};
