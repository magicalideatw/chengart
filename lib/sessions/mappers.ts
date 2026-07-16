import type { Database } from "@/lib/supabase/database.types";
import {
  computeRemainingCapacity,
  resolveSessionStatusFromEnrollment,
} from "@/lib/sessions/enrollment-utils";
import type {
  ClassSession,
  SessionFormInput,
  SessionStatus,
} from "@/lib/sessions/types";
import { SESSION_STATUSES } from "@/lib/sessions/types";

type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];

function normalizeStatus(value: unknown): SessionStatus {
  if (typeof value === "string" && SESSION_STATUSES.includes(value as SessionStatus)) {
    return value as SessionStatus;
  }
  return "open";
}

export function mapSessionRow(
  row: Record<string, unknown>,
  enrolledCount = 0,
): ClassSession {
  const item = row as SessionRow;
  const capacity = Number(item.capacity ?? 5);
  const enrolled = Number.isFinite(enrolledCount) ? enrolledCount : 0;
  const storedStatus = normalizeStatus(item.status);

  return {
    id: String(item.id),
    classId: String(item.class_id),
    date: String(item.date),
    startTime: String(item.start_time),
    endTime: String(item.end_time),
    capacity,
    remainingCapacity: computeRemainingCapacity(capacity, enrolled),
    status: resolveSessionStatusFromEnrollment(storedStatus, capacity, enrolled),
    notes: String(item.notes ?? ""),
    createdAt: String(item.created_at),
    updatedAt: String(item.updated_at),
  };
}

export function mapSessionToDb(
  classId: string,
  input: SessionFormInput,
  enrolledCount = 0,
): Database["public"]["Tables"]["sessions"]["Insert"] {
  const enrolled = Number.isFinite(enrolledCount) ? enrolledCount : 0;
  const remainingCapacity = computeRemainingCapacity(input.capacity, enrolled);
  const status =
    input.status === "cancelled" || input.status === "closed"
      ? input.status
      : resolveSessionStatusFromEnrollment(input.status, input.capacity, enrolled);

  return {
    class_id: classId,
    date: input.date,
    start_time: input.startTime.trim(),
    end_time: input.endTime.trim(),
    capacity: input.capacity,
    remaining_capacity: remainingCapacity,
    status,
    notes: input.notes.trim(),
    updated_at: new Date().toISOString(),
  };
}

export function sessionToFormInput(session: ClassSession): SessionFormInput {
  return {
    date: session.date,
    startTime: session.startTime,
    endTime: session.endTime,
    capacity: session.capacity,
    remainingCapacity: session.remainingCapacity,
    status: session.status,
    notes: session.notes,
  };
}

export function formatSessionTimeRange(session: ClassSession): string {
  return `${session.startTime}–${session.endTime}`;
}
