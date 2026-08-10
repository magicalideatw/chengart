"use client";

import type { ClassSession } from "@/lib/sessions/types";
import { isSessionSelectable } from "@/lib/sessions/session-utils";
import {
  formatCourseSessionScheduleLines,
  formatSessionDisplayPrice,
  isSelfScheduledSession,
} from "@/lib/sessions/format";

type CourseSessionRadioPickerProps = {
  sessions: ClassSession[];
  selectedSessionId: string | null;
  onChange: (sessionId: string) => void;
  unitLabel?: string;
};

function sessionStatusLabel(session: ClassSession): string | null {
  if (session.status === "cancelled") return "已取消";
  if (session.status === "full" || session.remainingCapacity <= 0) return "已額滿";
  if (!session.isOpen) return "未開放";
  return null;
}

export function CourseSessionRadioPicker({
  sessions,
  selectedSessionId,
  onChange,
  unitLabel = "班別",
}: CourseSessionRadioPickerProps) {
  if (sessions.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted">
        目前尚無可選{unitLabel}。
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => {
        const selectable = isSessionSelectable(session);
        const statusLabel = sessionStatusLabel(session);
        const checked = selectedSessionId === session.id;
        const label = session.name.trim() || unitLabel;
        const schedule = formatCourseSessionScheduleLines(session);
        const priceLabel = formatSessionDisplayPrice(session.price);

        return (
          <label
            key={session.id}
            className={`block rounded-2xl border p-4 transition ${
              selectable
                ? checked
                  ? "border-gold bg-gold-soft/40"
                  : "cursor-pointer border-border bg-white hover:border-gold/40"
                : "cursor-not-allowed border-border bg-white/70 opacity-70"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <input
                  type="radio"
                  name="course-session"
                  checked={checked}
                  disabled={!selectable}
                  onChange={() => selectable && onChange(session.id)}
                  className="mt-1 h-4 w-4 shrink-0 border-border text-gold focus:ring-gold"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="mt-1 text-sm text-foreground">{schedule.primary}</p>
                  {schedule.secondary ? (
                    <p
                      className={`mt-1 text-sm ${
                        isSelfScheduledSession(session) ? "text-muted" : "text-muted"
                      }`}
                    >
                      {schedule.secondary}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-gold">{priceLabel}</p>
                <p className="mt-2 text-xs text-muted">
                  {statusLabel ?? `剩 ${session.remainingCapacity} 位`}
                </p>
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}
