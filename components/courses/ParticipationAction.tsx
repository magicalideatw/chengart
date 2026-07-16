"use client";

import Link from "next/link";
import type { ParticipationMethod } from "@/lib/courses/participation-method";
import { COMING_SOON_BUTTON_TEXT } from "@/lib/courses/participation-method";

type ParticipationActionProps = {
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

export function ParticipationAction({
  participationMethod,
  externalUrl,
  actionButtonText,
  internalHref,
  onInternalAction,
  variant = "card",
  className,
}: ParticipationActionProps) {
  if (participationMethod === "coming_soon") {
    if (variant === "hero") {
      return (
        <button
          type="button"
          disabled
          className={`${heroButtonClass} ${className ?? ""}`}
        >
          {COMING_SOON_BUTTON_TEXT}
        </button>
      );
    }

    return (
      <span
        className={`${cardLinkClass} cursor-not-allowed opacity-50 ${className ?? ""}`}
        aria-disabled="true"
      >
        {COMING_SOON_BUTTON_TEXT}
      </span>
    );
  }

  if (participationMethod === "external" && externalUrl) {
    if (variant === "hero") {
      return (
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${heroButtonClass} ${className ?? ""}`}
        >
          {actionButtonText}
        </a>
      );
    }

    return (
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${cardLinkClass} ${className ?? ""}`}
      >
        {actionButtonText}
        <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </a>
    );
  }

  if (variant === "hero" && onInternalAction) {
    return (
      <button
        type="button"
        onClick={onInternalAction}
        className={`${heroButtonClass} ${className ?? ""}`}
      >
        {actionButtonText}
      </button>
    );
  }

  return (
    <Link href={internalHref} className={`${cardLinkClass} ${className ?? ""}`}>
      {actionButtonText}
      <span className="transition-transform group-hover:translate-x-0.5">→</span>
    </Link>
  );
}
