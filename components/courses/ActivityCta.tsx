import Link from "next/link";
import {
  resolveActivityCta,
  type ActivityCtaState,
} from "@/lib/courses/activity-status";
import type { ParticipationMethod } from "@/lib/courses/participation-method";

type ActivityCtaProps = {
  isOpen: boolean;
  isFull?: boolean;
  participationMethod: ParticipationMethod;
  externalUrl: string | null;
  actionButtonText: string;
  internalHref: string;
  onInternalAction?: () => void;
  variant?: "card" | "hero";
  className?: string;
};

const cardLinkClass =
  "inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition group-hover:text-gold";

const heroButtonClass =
  "inline-flex items-center justify-center rounded-full bg-gold px-8 py-3.5 text-sm font-medium text-white transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60";

function renderCta(
  cta: ActivityCtaState,
  variant: "card" | "hero",
  onInternalAction: (() => void) | undefined,
  className?: string,
) {
  if (cta.kind === "disabled") {
    if (variant === "hero") {
      return (
        <button
          type="button"
          disabled
          className={`${heroButtonClass} ${className ?? ""}`}
        >
          {cta.label}
        </button>
      );
    }

    return (
      <span
        className={`${cardLinkClass} cursor-not-allowed opacity-50 ${className ?? ""}`}
        aria-disabled="true"
      >
        {cta.label}
      </span>
    );
  }

  if (cta.kind === "external-link") {
    if (variant === "hero") {
      return (
        <a
          href={cta.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${heroButtonClass} ${className ?? ""}`}
        >
          {cta.label}
        </a>
      );
    }

    return (
      <a
        href={cta.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${cardLinkClass} ${className ?? ""}`}
      >
        {cta.label}
        <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </a>
    );
  }

  if (cta.kind === "internal-action" || (variant === "hero" && onInternalAction)) {
    return (
      <button
        type="button"
        onClick={onInternalAction}
        className={`${heroButtonClass} ${className ?? ""}`}
      >
        {cta.label}
      </button>
    );
  }

  return (
    <Link href={cta.href} className={`${cardLinkClass} ${className ?? ""}`}>
      {cta.label}
      <span className="transition-transform group-hover:translate-x-0.5">→</span>
    </Link>
  );
}

export function ActivityCta({
  isOpen,
  isFull,
  participationMethod,
  externalUrl,
  actionButtonText,
  internalHref,
  onInternalAction,
  variant = "card",
  className,
}: ActivityCtaProps) {
  const cta = resolveActivityCta({
    isOpen,
    isFull,
    participationMethod,
    externalUrl,
    actionButtonText,
    internalHref,
  });

  if (cta.kind === "internal-link" && variant === "hero" && onInternalAction) {
    return renderCta(
      { kind: "internal-action", label: cta.label },
      variant,
      onInternalAction,
      className,
    );
  }

  return renderCta(cta, variant, onInternalAction, className);
}
