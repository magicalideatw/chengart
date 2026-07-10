type EventRichContentProps = {
  html: string;
};

export function EventRichContent({ html }: EventRichContentProps) {
  if (!html.trim()) return null;

  return (
    <section className="py-12 sm:py-16">
      <div
        className="prose prose-neutral max-w-none text-sm leading-relaxed text-muted prose-headings:font-display prose-headings:text-foreground prose-p:my-4 prose-a:text-gold prose-strong:text-foreground"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
