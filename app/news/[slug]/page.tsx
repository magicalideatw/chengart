import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePageContent } from "@/components/news/ArticlePageContent";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { siteConfig } from "@/lib/data/site";
import {
  getNewsArticleBySlug,
  getNewsArticleSlugs,
} from "@/lib/news-articles/queries";
import { buildArticleJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getNewsArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getNewsArticleBySlug(slug);

  if (!article) {
    return { title: "文章不存在" };
  }

  return buildPageMetadata({
    title: article.seo.title,
    absoluteTitle: true,
    description: article.seo.description,
    path: `/news/${article.slug}`,
    keywords: article.seo.keywords,
    ogType: "article",
  });
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getNewsArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const pageUrl = new URL(`/news/${article.slug}`, siteConfig.url).toString();

  return (
    <>
      <JsonLdScript data={buildArticleJsonLd(article, pageUrl)} />
      <Navbar variant="light" />
      <main className="bg-background pb-16">
        <ArticlePageContent article={article} />
      </main>
      <Footer />
    </>
  );
}
