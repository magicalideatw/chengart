"use client";

import {
  formatPerformanceSessionDate,
  formatSessionDisplayPrice,
} from "@/lib/sessions/format";
import { formatSessionTimeRange } from "@/lib/sessions/mappers";
import type { ClassSession } from "@/lib/sessions/types";
import { isSessionSelectable } from "@/lib/sessions/session-utils";

type PerformanceSessionPickerProps = {
  sessions: ClassSession[];
  selectedSessionId: string | null;
  showRemainingCapacity?: boolean;
  onChange: (sessionId: string) => void;
};

function sessionStatusLabel(session: ClassSession): string | null {
  if (session.status === "cancelled") return "已取消";
  if (session.status === "full" || session.remainingCapacity <= 0) return "已額滿";
  if (!session.isOpen) return "未開放";
  return null;
}

function isSessionFull(session: ClassSession): boolean {
  return session.status === "full" || session.remainingCapacity <= 0;
}

export function PerformanceSessionPicker({
  sessions,
  selectedSessionId,
  showRemainingCapacity = true,
  onChange,
}: PerformanceSessionPickerProps) {
  if (sessions.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted">
        目前尚無可選場次。
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => {
        const selectable = isSessionSelectable(session);
        const statusLabel = sessionStatusLabel(session);
        const isFull = isSessionFull(session);
        const isSelected = selectedSessionId === session.id;
        const priceLabel = formatSessionDisplayPrice(session.price);

        return (
          <button
            key={session.id}
            type="button"
            disabled={!selectable}
            aria-pressed={isSelected}
            onClick={() => selectable && onChange(session.id)}
            className={`w-full rounded-2xl border p-5 text-left transition-all duration-200 ${
              selectable
                ? isSelected
                  ? "cursor-pointer border-gold bg-gold-soft/30 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                  : "cursor-pointer border-border bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)]"
                : "cursor-not-allowed border-border bg-white/70 opacity-60 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {formatPerformanceSessionDate(session.date)}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {formatSessionTimeRange(session)}
                </p>
                {session.location.trim() ? (
                  <p className="mt-1 text-xs text-muted">{session.location}</p>
                ) : null}
              </div>

              <div className="shrink-0 text-right">
                <p
                  className={`text-sm font-semibold ${
                    isFull ? "text-muted" : "text-gold"
                  }`}
                >
                  {priceLabel}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              {statusLabel ? (
                <p className="text-xs font-medium text-muted">{statusLabel}</p>
              ) : showRemainingCapacity ? (
                <p className="text-xs text-muted">
                  剩餘 {session.remainingCapacity} 位
                </p>
              ) : (
                <span />
              )}

              {isSelected && selectable ? (
                <p className="text-xs font-medium text-gold">✓ 已選擇</p>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
