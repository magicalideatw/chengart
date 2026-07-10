"use client";

import { motion } from "framer-motion";
import { formatFee } from "@/lib/admin/format";
import type { ClassWithSessionsOption } from "@/lib/registration/queries";
import { isSessionSelectable } from "@/lib/registration/session-utils";
import { formatSessionCheckboxLabel } from "@/lib/sessions/format";
import type { SessionStatus } from "@/lib/sessions/types";

type SessionSelectionPanelProps = {
  classes: ClassWithSessionsOption[];
  selectedSessionIds: string[];
  onToggleSession: (sessionId: string) => void;
  unitPriceLabel: string;
  totalAmount: number;
  onRegister: () => void;
  canRegister: boolean;
};

function sessionStatusLabel(session: {
  status: SessionStatus;
  remainingCapacity: number;
}): string | null {
  if (session.status === "cancelled") return "老師請假";
  if (session.status === "full" || session.remainingCapacity <= 0) return "已額滿";
  return null;
}

export function SessionSelectionPanel({
  classes,
  selectedSessionIds,
  onToggleSession,
  unitPriceLabel,
  totalAmount,
  onRegister,
  canRegister,
}: SessionSelectionPanelProps) {
  const selectedCount = selectedSessionIds.length;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
      <div className="space-y-8">
        {classes.map((item, index) => (
          <motion.section
            key={item.class.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="rounded-3xl border border-border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)]"
          >
            <h2 className="font-display text-xl font-semibold text-foreground">
              {item.class.name}
            </h2>
            {item.class.teacher ? (
              <p className="mt-1 text-sm text-muted">老師：{item.class.teacher}</p>
            ) : null}

            <div className="mt-5 space-y-3">
              {item.sessions.map((session) => {
                const selectable = isSessionSelectable(session);
                const statusLabel = sessionStatusLabel(session);
                const checked = selectedSessionIds.includes(session.id);

                return (
                  <label
                    key={session.id}
                    className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 transition ${
                      selectable
                        ? checked
                          ? "border-gold bg-gold-soft/40"
                          : "border-border bg-surface hover:border-gold/40"
                        : "cursor-not-allowed border-border bg-surface/70 opacity-70"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!selectable}
                        onChange={() => selectable && onToggleSession(session.id)}
                        className="h-4 w-4 rounded border-border text-gold focus:ring-gold"
                      />
                      <span className="text-sm font-medium text-foreground">
                        {formatSessionCheckboxLabel(session.date)}
                      </span>
                    </div>

                    <div className="shrink-0 text-right text-sm">
                      {statusLabel ? (
                        <span className="text-muted">{statusLabel}</span>
                      ) : (
                        <span className="text-muted">剩 {session.remainingCapacity}</span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </motion.section>
        ))}
      </div>

      <aside className="lg:sticky lg:top-24">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
            Summary
          </p>
          <dl className="mt-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-sm text-muted">已選堂數</dt>
              <dd className="text-sm font-medium text-foreground">{selectedCount} 堂</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-sm text-muted">單堂價格</dt>
              <dd className="text-sm font-medium text-foreground">{unitPriceLabel}</dd>
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-sm font-medium text-foreground">總金額</dt>
                <dd className="font-display text-xl font-semibold text-gold">
                  {formatFee(totalAmount)}
                </dd>
              </div>
            </div>
          </dl>

          <button
            type="button"
            onClick={onRegister}
            disabled={!canRegister || selectedCount === 0}
            className="mt-6 w-full rounded-full bg-gold px-6 py-3.5 text-sm font-medium text-white transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            立即報名
          </button>
        </div>
      </aside>
    </div>
  );
}
