"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Copy, Pencil, Trash2 } from "lucide-react";
import {
  createCourseSession,
  deleteCourseSession,
  updateCourseSession,
} from "@/lib/actions/admin/course-sessions";
import { formatFee, formatSessionDate } from "@/lib/admin/format";
import type { Course } from "@/lib/courses/types";
import { getSessionUnitLabel, getSessionManagementTitle } from "@/lib/sessions/labels";
import {
  formatSessionTimeRange,
  sessionToFormInput,
} from "@/lib/sessions/mappers";
import {
  SESSION_STATUS_LABELS,
  type ClassSession,
  type SessionStatus,
} from "@/lib/sessions/types";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SessionFormModal } from "@/components/admin/SessionFormModal";
import { Toast } from "@/components/ui/Toast";

type CourseSessionManagementProps = {
  course: Course;
  sessions: ClassSession[];
  canMutate: boolean;
};

type ToastState = { title: string; message?: string };

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; session: ClassSession }
  | { mode: "copy"; session: ClassSession };

const STATUS_STYLES: Record<SessionStatus, string> = {
  open: "bg-emerald-50 text-emerald-700",
  closed: "bg-surface text-muted",
  cancelled: "bg-red-50 text-red-700",
  full: "bg-amber-50 text-amber-800",
};

export function CourseSessionManagement({
  course,
  sessions,
  canMutate,
}: CourseSessionManagementProps) {
  const [modal, setModal] = useState<ModalState | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const unitLabel = getSessionUnitLabel(course.activityType);
  const sortedSessions = useMemo(
    () =>
      [...sessions].sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    [sessions],
  );

  const showToast = (title: string, message?: string) => setToast({ title, message });

  const handleDelete = (session: ClassSession) => {
    if (!canMutate) {
      showToast("無法刪除", "請確認 Supabase 已設定、已登入，且已執行 migration 036");
      return;
    }

    const confirmed = window.confirm(
      `確定要刪除「${session.name || formatSessionDate(session.date)}」嗎？`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteCourseSession(course.id, session.id);
      if (result.success) {
        showToast(`已刪除${unitLabel}`);
        router.refresh();
        return;
      }
      showToast("刪除失敗", result.error);
    });
  };

  const handleSubmit = async (input: Parameters<typeof createCourseSession>[1]) => {
    if (!modal) return { success: false, error: "無效操作" };

    if (modal.mode === "edit") {
      return updateCourseSession(course.id, modal.session.id, input);
    }

    return createCourseSession(course.id, input);
  };

  return (
    <>
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-5 pt-6 md:px-8">
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            返回活動管理
          </Link>
        </div>
      </div>

      <AdminPageHeader
        title={`${course.title} · ${getSessionManagementTitle(course.activityType)}`}
        description={`管理此活動的${unitLabel}：日期、時間、名額、價格與開放狀態。`}
        count={sessions.length}
        countLabel={`${unitLabel}數`}
        showAction={canMutate}
        actionLabel={`新增${unitLabel}`}
        onAction={() => setModal({ mode: "create" })}
      />

      <main className="mx-auto max-w-7xl space-y-8 px-5 py-10 md:px-8">
        {!canMutate && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            目前無法修改{unitLabel}。請確認 Supabase 已設定、已登入管理員，並在 SQL Editor 執行{" "}
            <code className="rounded bg-white/70 px-1.5 py-0.5">
              supabase/migrations/036_sessions_unified.sql
            </code>
            。
          </div>
        )}

        {sortedSessions.length === 0 ? (
          <div className="rounded-3xl border border-border bg-white p-10 text-center shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
            <CalendarDays className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-4 text-muted">尚無{unitLabel}，請新增第一個{unitLabel}。</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-border bg-surface/60 text-left text-xs uppercase tracking-wider text-muted">
                  <tr>
                    {["名稱", "日期", "時間", "名額", "價格", "地點", "狀態", "操作"].map(
                      (label) => (
                        <th key={label} className="px-5 py-4 font-medium">
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedSessions.map((session) => (
                    <tr key={session.id} className="text-foreground">
                      <td className="px-5 py-4 font-medium">
                        {session.name.trim() || "—"}
                      </td>
                      <td className="px-5 py-4">{formatSessionDate(session.date)}</td>
                      <td className="px-5 py-4">{formatSessionTimeRange(session)}</td>
                      <td className="px-5 py-4">
                        {session.remainingCapacity}/{session.capacity}
                      </td>
                      <td className="px-5 py-4">{formatFee(session.price)}</td>
                      <td className="px-5 py-4 text-muted">
                        {session.location.trim() || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            session.isOpen
                              ? STATUS_STYLES[session.status]
                              : STATUS_STYLES.closed
                          }`}
                        >
                          {session.isOpen
                            ? SESSION_STATUS_LABELS[session.status]
                            : "未開放"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={!canMutate || isPending}
                            onClick={() => setModal({ mode: "edit", session })}
                            className="rounded-full border border-border p-2 text-muted transition hover:border-gold hover:text-gold disabled:opacity-40"
                            aria-label="編輯"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={!canMutate || isPending}
                            onClick={() => setModal({ mode: "copy", session })}
                            className="rounded-full border border-border p-2 text-muted transition hover:border-gold hover:text-gold disabled:opacity-40"
                            aria-label="複製"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={!canMutate || isPending}
                            onClick={() => handleDelete(session)}
                            className="rounded-full border border-border p-2 text-muted transition hover:border-red-200 hover:text-red-600 disabled:opacity-40"
                            aria-label="刪除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {modal ? (
        <SessionFormModal
          session={modal.mode === "edit" ? modal.session : null}
          initialValues={
            modal.mode === "copy"
              ? { ...sessionToFormInput(modal.session), date: "" }
              : undefined
          }
          defaultPrice={course.fee}
          nameLabel={`${unitLabel}名稱`}
          title={
            modal.mode === "edit"
              ? `編輯${unitLabel}`
              : modal.mode === "copy"
                ? `複製${unitLabel}`
                : `新增${unitLabel}`
          }
          onClose={() => setModal(null)}
          onSubmit={async (input) => {
            const result = await handleSubmit(input);
            if (result.success) {
              showToast(modal.mode === "edit" ? "已更新" : "已新增");
              setModal(null);
              router.refresh();
            }
            return result;
          }}
          isPending={isPending}
        />
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
