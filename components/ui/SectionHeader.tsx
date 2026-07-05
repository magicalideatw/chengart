type SectionHeaderProps = {
  label?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeader({
  label,
  title,
  description,
  align = "left",
}: SectionHeaderProps) {
  const alignClass = align === "center" ? "mx-auto text-center" : "text-left";

  return (
    <div className={`max-w-2xl ${alignClass}`}>
      {label && (
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold">
          {label}
        </p>
      )}
      <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}
