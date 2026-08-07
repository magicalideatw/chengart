"use client";

import type { ClassWithSessionsOption } from "@/lib/registration/plan-utils";
import { isSessionSelectable } from "@/lib/registration/session-utils";
import { formatSessionCheckboxLabel } from "@/lib/sessions/format";
import type { SessionStatus } from "@/lib/sessions/types";

type StudentSessionPickerProps = {
  classes: ClassWithSessionsOption[];
  selectedSessionIds: string[];
  onChange: (sessionIds: string[]) => void;
};

function sessionStatusLabel(session: {
  status: SessionStatus;
  remainingCapacity: number;
}): string | null {
  if (session.status === "cancelled") return "老師請假";
  if (session.status === "full" || session.remainingCapacity <= 0) return "已額滿";
  return null;
}

export function StudentSessionPicker({
  classes,
  selectedSessionIds,
  onChange,
}: StudentSessionPickerProps) {
  const toggleSession = (sessionId: string) => {
    onChange(
      selectedSessionIds.includes(sessionId)
        ? selectedSessionIds.filter((id) => id !== sessionId)
        : [...selectedSessionIds, sessionId],
    );
  };

  return (
    <div className="space-y-4">
      {classes.map((item) => (
        <div key={item.class.id} className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-sm font-medium text-foreground">{item.class.name}</p>
          <div className="mt-3 space-y-2">
            {item.sessions.map((session) => {
              const selectable = isSessionSelectable(session);
              const statusLabel = sessionStatusLabel(session);
              const checked = selectedSessionIds.includes(session.id);

              return (
                <label
                  key={session.id}
                  className={`flex items-center justify-between gap-4 rounded-xl border px-3 py-2.5 transition ${
                    selectable
                      ? checked
                        ? "border-gold bg-gold-soft/40"
                        : "border-border bg-white hover:border-gold/40"
                      : "cursor-not-allowed border-border bg-white/70 opacity-70"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!selectable}
                      onChange={() => selectable && toggleSession(session.id)}
                      className="h-4 w-4 rounded border-border text-gold focus:ring-gold"
                    />
                    <span className="text-sm font-medium text-foreground">
                      {formatSessionCheckboxLabel(session.date)}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-muted">
                    {statusLabel ?? `剩 ${session.remainingCapacity}`}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
