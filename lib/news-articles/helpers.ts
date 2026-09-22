import type { ArticleBlock, ArticleSegment } from "@/lib/news-articles/types";

export function t(text: string): ArticleSegment {
  return { text };
}

export function link(text: string, href: string): ArticleSegment {
  return { text, href };
}

export function h2(text: string): ArticleBlock {
  return { type: "h2", text };
}

export function h3(text: string): ArticleBlock {
  return { type: "h3", text };
}

export function p(...segments: ArticleSegment[]): ArticleBlock {
  return { type: "p", segments };
}
