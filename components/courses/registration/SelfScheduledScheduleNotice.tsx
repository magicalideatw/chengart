"use client";

import {
  SELF_SCHEDULED_SCHEDULE_MESSAGE,
  SELF_SCHEDULED_SCHEDULE_TITLE,
} from "@/lib/sessions/format";

export function SelfScheduledScheduleNotice() {
  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-4">
      <p className="text-sm font-medium text-foreground">{SELF_SCHEDULED_SCHEDULE_TITLE}</p>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
        {SELF_SCHEDULED_SCHEDULE_MESSAGE}
      </p>
    </div>
  );
}
