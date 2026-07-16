"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { saveSessionAttendance } from "@/lib/actions/admin/attendance";
import {
  formatAdminSessionScheduleLine,
  formatSessionDate,
} from "@/lib/admin/format";
import type { SessionAttendanceContext } from "@/lib/attendance/types";
import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_STATUS_SHORT,
  type AttendanceMarkStatus,
  type AttendanceStatus,
} from "@/lib/attendance/types";
import { Toast } from "@/components/ui/Toast";

type AttendanceSessionViewProps = {
  context: SessionAttendanceContext;
  canMutate: boolean;
};

type DraftEntry = {
  status: AttendanceMarkStatus;
  note: string;
};

const STATUS_BUTTON_STYLES: Record<AttendanceStatus, string> = {
  present: "border-emerald-200 bg-emerald-50 text-emerald-700",
  absent: "border-red-200 bg-red-50 text-red-700",
  excused: "border-sky-200 bg-sky-50 text-sky-700",
  late: "border-amber-200 bg-amber-50 text-amber-800",
  early_leave: "border-violet-200 bg-violet-50 text-violet-700",
};

const ACTIVE_STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: "border-emerald-500 bg-emerald-500 text-white",
  absent: "border-red-500 bg-red-500 text-white",
  excused: "border-sky-500 bg-sky-500 text-white",
  late: "border-amber-500 bg-amber-500 text-white",
  early_leave: "border-violet-500 bg-violet-500 text-white",
};

export function AttendanceSessionView({
  context,
  canMutate,
}: AttendanceSessionViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ title: string; message?: string } | null>(
    null,
  );

  const initialDraft = useMemo(() => {
    const draft = new Map<string, DraftEntry>();
    for (const student of context.roster) {
      draft.set(student.studentId, {
        status: student.status,
        note: student.note ?? "",
      });
    }
    return draft;
  }, [context.roster]);

  const [draft, setDraft] = useState(initialDraft);
  const [savedComplete, setSavedComplete] = useState(context.isComplete);

  const draftValues = useMemo(() => [...draft.values()], [draft]);
  const markedCount = draftValues.filter((entry) => entry.status !== "unmarked").length;
  const isComplete =
    context.roster.length > 0 && markedCount === context.roster.length;

  const updateStudentStatus = (
    studentId: string,
    status: AttendanceMarkStatus,
  ) => {
    setDraft((current) => {
      const next = new Map(current);
      const existing = next.get(studentId) ?? { status: "unmarked", note: "" };
      next.set(studentId, {
        ...existing,
        status: existing.status === status ? "unmarked" : status,
      });
      return next;
    });
    setSavedComplete(false);
  };

  const handleSaveAll = () => {
    if (!canMutate) {
      setToast({ title: "無法儲存", message: "請確認已登入管理員" });
      return;
    }

    const entries: Array<{
      studentId: string;
      registrationId?: string | null;
      status: AttendanceStatus;
      note?: string | null;
    }> = [];
    const clearStudentIds: string[] = [];

    for (const student of context.roster) {
      const entry = draft.get(student.studentId);
      if (!entry || entry.status === "unmarked") {
        if (student.attendanceId) {
          clearStudentIds.push(student.studentId);
        }
        continue;
      }

      entries.push({
        studentId: student.studentId,
        registrationId: student.registrationId,
        status: entry.status,
        note: entry.note.trim() || null,
      });
    }

    startTransition(async () => {
      const result = await saveSessionAttendance({
        sessionId: context.sessionId,
        entries,
        clearStudentIds,
      });

      if (!result.success) {
        setToast({ title: "儲存失敗", message: result.error });
        return;
      }

      setSavedComplete(isComplete);
      setToast({
        title: isComplete ? "已完成點名" : "已儲存點名",
        message: isComplete
          ? "所有學生皆已點名，仍可重新修改。"
          : `已儲存 ${entries.length} 筆點名紀錄`,
      });
      router.refresh();
    });
  };

  return (
    <>
      <div className="mb-6">
        <Link
          href={`/admin/attendance/courses/${context.courseId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          返回 {context.courseTitle}
        </Link>
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground">
          點名 · {formatSessionDate(context.sessionDate)}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {context.courseTitle} · {context.className} ·{" "}
          {formatAdminSessionScheduleLine(
            context.sessionDate,
            context.startTime,
            context.endTime,
          )}
        </p>
      </div>

      {(savedComplete || context.isComplete) && isComplete ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">已完成點名</p>
            <p className="mt-1 text-emerald-700/90">
              全部 {context.roster.length} 位學生皆已點名。如需修改，調整後再次儲存即可。
            </p>
          </div>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white px-5 py-4 text-sm">
        <div className="flex flex-wrap gap-4 text-muted">
          <span>
            學生數：<span className="font-medium text-foreground">{context.roster.length}</span>
          </span>
          <span>
            已點名：<span className="font-medium text-foreground">{markedCount}</span>
          </span>
          <span>
            未點名：
            <span className="font-medium text-foreground">
              {Math.max(context.roster.length - markedCount, 0)}
            </span>
          </span>
        </div>
        {canMutate ? (
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isPending}
            className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gold/90 disabled:opacity-50"
          >
            {isPending ? "儲存中…" : "儲存全部點名"}
          </button>
        ) : null}
      </div>

      <div className="space-y-4">
        {context.roster.length === 0 ? (
          <div className="rounded-3xl border border-border bg-white px-6 py-16 text-center text-muted shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
            此堂課尚無已付款學生
          </div>
        ) : (
          context.roster.map((student, index) => {
            const entry = draft.get(student.studentId) ?? {
              status: "unmarked" as const,
              note: "",
            };

            return (
              <div
                key={student.studentId}
                className="rounded-3xl border border-border bg-white p-4 shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      學生 {index + 1}：{student.studentName}
                    </p>
                    <p className="mt-1 text-sm text-muted">{student.studentAge} 歲</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {ATTENDANCE_STATUSES.map((status) => {
                      const active = entry.status === status;
                      return (
                        <button
                          key={status}
                          type="button"
                          disabled={!canMutate || isPending}
                          onClick={() => updateStudentStatus(student.studentId, status)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                            active
                              ? ACTIVE_STATUS_STYLES[status]
                              : `${STATUS_BUTTON_STYLES[status]} hover:opacity-90`
                          }`}
                        >
                          {ATTENDANCE_STATUS_SHORT[status]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {entry.status === "unmarked" ? (
                  <p className="mt-3 text-xs text-muted">目前：未點名</p>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {canMutate && context.roster.length > 0 ? (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isPending}
            className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-white transition hover:bg-gold/90 disabled:opacity-50"
          >
            {isPending ? "儲存中…" : "儲存全部點名"}
          </button>
        </div>
      ) : null}

      <Toast
        title={toast?.title ?? ""}
        message={toast?.message}
        visible={Boolean(toast)}
        onClose={() => setToast(null)}
      />
    </>
  );
}
