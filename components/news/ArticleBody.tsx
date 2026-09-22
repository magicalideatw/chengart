import Link from "next/link";
import type { ArticleBlock } from "@/lib/news-articles/types";

const inlineLinkClass =
  "text-foreground underline decoration-gold/35 underline-offset-[3px] transition hover:text-gold hover:decoration-gold/70";

type ArticleBodyProps = {
  blocks: ArticleBlock[];
};

export function ArticleBody({ blocks }: ArticleBodyProps) {
  return (
    <div className="space-y-8">
      {blocks.map((block, index) => {
        if (block.type === "h2") {
          return (
            <h2
              key={`${block.text}-${index}`}
              className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              {block.text}
            </h2>
          );
        }

        if (block.type === "h3") {
          return (
            <h3
              key={`${block.text}-${index}`}
              className="font-display text-lg font-semibold text-foreground"
            >
              {block.text}
            </h3>
          );
        }

        return (
          <p
            key={`p-${index}`}
            className="text-sm leading-7 text-muted sm:text-base sm:leading-8"
          >
            {block.segments.map((segment, segmentIndex) =>
              segment.href ? (
                <Link
                  key={`${segment.text}-${segmentIndex}`}
                  href={segment.href}
                  className={inlineLinkClass}
                >
                  {segment.text}
                </Link>
              ) : (
                <span key={`${segment.text}-${segmentIndex}`}>
                  {segment.text}
                </span>
              ),
            )}
          </p>
        );
      })}
    </div>
  );
}
