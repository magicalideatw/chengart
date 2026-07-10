import type { Database } from "@/lib/supabase/database.types";
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

export function mapSessionRow(row: Record<string, unknown>): ClassSession {
  const item = row as SessionRow;

  return {
    id: String(item.id),
    classId: String(item.class_id),
    date: String(item.date),
    startTime: String(item.start_time),
    endTime: String(item.end_time),
    capacity: Number(item.capacity ?? 5),
    remainingCapacity: Number(item.remaining_capacity ?? 0),
    status: normalizeStatus(item.status),
    notes: String(item.notes ?? ""),
    createdAt: String(item.created_at),
    updatedAt: String(item.updated_at),
  };
}

export function mapSessionToDb(
  classId: string,
  input: SessionFormInput,
): Database["public"]["Tables"]["sessions"]["Insert"] {
  const remainingCapacity =
    input.status === "full"
      ? 0
      : Math.min(input.remainingCapacity, input.capacity);

  return {
    class_id: classId,
    date: input.date,
    start_time: input.startTime.trim(),
    end_time: input.endTime.trim(),
    capacity: input.capacity,
    remaining_capacity: remainingCapacity,
    status: input.status,
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
