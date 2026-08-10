import type { Database } from "@/lib/supabase/database.types";
import {
  computeRemainingCapacity,
  resolveSessionStatusFromEnrollment,
} from "@/lib/sessions/enrollment-utils";
import type {
  ClassSession,
  SessionFormInput,
  SessionStatus,
  SessionType,
} from "@/lib/sessions/types";
import { SESSION_STATUSES, SESSION_TYPES } from "@/lib/sessions/types";

type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];

function normalizeStatus(value: unknown): SessionStatus {
  if (typeof value === "string" && SESSION_STATUSES.includes(value as SessionStatus)) {
    return value as SessionStatus;
  }
  return "open";
}

function normalizeSessionType(value: unknown): SessionType {
  if (typeof value === "string" && SESSION_TYPES.includes(value as SessionType)) {
    return value as SessionType;
  }
  return "fixed";
}

function readOptionalString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

export function mapSessionRow(
  row: Record<string, unknown>,
  enrolledCount = 0,
): ClassSession {
  const item = row as SessionRow & {
    course_id?: string | null;
    session_type?: string | null;
    name?: string | null;
    price?: number | null;
    location?: string | null;
    is_open?: boolean | null;
    sort_order?: number | null;
    class_id?: string | null;
  };

  const capacity = Number(item.capacity ?? 5);
  const enrolled = Number.isFinite(enrolledCount) ? enrolledCount : 0;
  const storedStatus = normalizeStatus(item.status);
  const isOpen = item.is_open ?? storedStatus === "open";

  return {
    id: String(item.id),
    courseId: String(item.course_id ?? ""),
    classId: readOptionalString(item.class_id),
    sessionType: normalizeSessionType(item.session_type),
    name: String(item.name ?? ""),
    date: item.date ? String(item.date) : "",
    startTime: String(item.start_time ?? ""),
    endTime: String(item.end_time ?? ""),
    capacity,
    remainingCapacity: computeRemainingCapacity(capacity, enrolled),
    price: Number(item.price ?? 0),
    location: String(item.location ?? ""),
    isOpen,
    sortOrder: Number(item.sort_order ?? 0),
    status: resolveSessionStatusFromEnrollment(storedStatus, capacity, enrolled),
    notes: String(item.notes ?? ""),
    createdAt: String(item.created_at),
    updatedAt: String(item.updated_at),
  };
}

export function mapSessionToDb(
  courseId: string,
  input: SessionFormInput,
  enrolledCount = 0,
  classId?: string | null,
): Database["public"]["Tables"]["sessions"]["Insert"] {
  const enrolled = Number.isFinite(enrolledCount) ? enrolledCount : 0;
  const remainingCapacity = computeRemainingCapacity(input.capacity, enrolled);
  const status =
    input.status === "cancelled" || input.status === "closed"
      ? input.status
      : resolveSessionStatusFromEnrollment(input.status, input.capacity, enrolled);

  const isSelfScheduled = input.sessionType === "self_scheduled";

  return {
    course_id: courseId,
    class_id: classId ?? null,
    session_type: input.sessionType,
    name: input.name.trim(),
    date: isSelfScheduled ? null : input.date,
    start_time: isSelfScheduled ? "" : input.startTime.trim(),
    end_time: isSelfScheduled ? "" : input.endTime.trim(),
    capacity: input.capacity,
    remaining_capacity: remainingCapacity,
    price: input.price,
    location: input.location.trim(),
    is_open: input.isOpen,
    sort_order: input.sortOrder,
    status: input.isOpen ? status : "closed",
    notes: input.notes.trim(),
    updated_at: new Date().toISOString(),
  };
}

export function sessionToFormInput(session: ClassSession): SessionFormInput {
  return {
    sessionType: session.sessionType,
    name: session.name,
    date: session.date,
    startTime: session.startTime,
    endTime: session.endTime,
    capacity: session.capacity,
    remainingCapacity: session.remainingCapacity,
    price: session.price,
    location: session.location,
    isOpen: session.isOpen,
    sortOrder: session.sortOrder,
    status: session.status,
    notes: session.notes,
  };
}

export function formatSessionTimeRange(session: ClassSession): string {
  if (session.sessionType === "self_scheduled") return "";
  if (!session.startTime && !session.endTime) return "";
  if (!session.endTime) return session.startTime;
  return `${session.startTime}–${session.endTime}`;
}

export function buildEmptySessionForm(defaults?: Partial<SessionFormInput>): SessionFormInput {
  return {
    sessionType: "fixed",
    name: "",
    date: "",
    startTime: "",
    endTime: "",
    capacity: 5,
    remainingCapacity: 5,
    price: 0,
    location: "",
    isOpen: true,
    sortOrder: 0,
    status: "open",
    notes: "",
    ...defaults,
  };
}
