"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

type AdminPageHeaderProps = {
  title: string;
  description: string;
  count?: number;
  countLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
  showAction?: boolean;
};

export function AdminPageHeader({
  title,
  description,
  count,
  countLabel = "總數",
  actionLabel = "新增",
  onAction,
  showAction = false,
}: AdminPageHeaderProps) {
  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-end sm:justify-between md:px-8">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
            Admin
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted">{description}</p>
        </div>

        <div className="flex items-center gap-4">
          {typeof count === "number" && (
            <div className="rounded-2xl border border-border bg-surface px-5 py-3 text-center">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                {countLabel}
              </p>
              <p className="mt-1 font-display text-2xl font-semibold text-foreground">
                {count}
              </p>
            </div>
          )}

          {showAction && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gold-light"
            >
              <Plus className="h-4 w-4" />
              {actionLabel}
            </button>
          )}

          <Link
            href="/"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-foreground/20 hover:bg-surface"
          >
            返回網站
          </Link>
        </div>
      </div>
    </header>
  );
}
