"use client";

import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Copy, Pencil, Trash2 } from "lucide-react";
import {
  bulkGenerateSessions,
  createSession,
  deleteSession,
  updateSession,
} from "@/lib/actions/admin/sessions";
import { formatClassSchedule } from "@/lib/classes/mappers";
import type { CourseClass } from "@/lib/classes/types";
import { generateWeekdayDates } from "@/lib/sessions/generate-dates";
import { formatSessionTimeRange, sessionToFormInput } from "@/lib/sessions/mappers";
import {
  SESSION_STATUS_LABELS,
  type ClassSession,
  type SessionStatus,
} from "@/lib/sessions/types";
import { WEEKDAYS } from "@/lib/classes/types";
import { formatSessionDate } from "@/lib/admin/format";
import type { Course } from "@/lib/courses/types";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SessionFormModal } from "@/components/admin/SessionFormModal";
import { Toast } from "@/components/ui/Toast";

type SessionManagementProps = {
  course: Course;
  courseClass: CourseClass;
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

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

export function SessionManagement({
  course,
  courseClass,
  sessions,
  canMutate,
}: SessionManagementProps) {
  const [modal, setModal] = useState<ModalState | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [bulkWeekday, setBulkWeekday] = useState(courseClass.weekday);
  const [bulkStartDate, setBulkStartDate] = useState("");
  const [bulkEndDate, setBulkEndDate] = useState("");
  const [bulkError, setBulkError] = useState<string | null>(null);

  const sortedSessions = useMemo(
    () =>
      [...sessions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    [sessions],
  );

  const previewDates = useMemo(() => {
    if (!bulkStartDate || !bulkEndDate) return [];
    return generateWeekdayDates(bulkWeekday, bulkStartDate, bulkEndDate);
  }, [bulkWeekday, bulkStartDate, bulkEndDate]);

  const showToast = (title: string, message?: string) => setToast({ title, message });

  const handleDelete = (session: ClassSession) => {
    if (!canMutate) {
      showToast("無法刪除", "請確認 Supabase 已設定、已登入，且已執行 migration 012");
      return;
    }

    const confirmed = window.confirm(
      `確定要刪除 ${formatSessionDate(session.date)} 的上課日期嗎？`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteSession(courseClass.id, session.id);
      if (result.success) {
        showToast("已刪除上課日期");
        router.refresh();
        return;
      }
      showToast("刪除失敗", result.error);
    });
  };

  const handleCopy = (session: ClassSession) => {
    if (!canMutate) {
      showToast("無法複製", "請確認 Supabase 已設定、已登入，且已執行 migration 012");
      return;
    }
    setModal({ mode: "copy", session });
  };

  const handleBulkGenerate = () => {
    if (!canMutate) {
      showToast("無法建立", "請確認 Supabase 已設定、已登入，且已執行 migration 012");
      return;
    }

    setBulkError(null);

    startTransition(async () => {
      const result = await bulkGenerateSessions(courseClass.id, {
        weekday: bulkWeekday,
        startDate: bulkStartDate,
        endDate: bulkEndDate,
      });

      if (result.success) {
        showToast(
          "已快速建立日期",
          `新增 ${result.created ?? 0} 筆${
            result.skipped ? `，略過 ${result.skipped} 筆已存在日期` : ""
          }`,
        );
        router.refresh();
        return;
      }

      setBulkError(result.error ?? "快速建立失敗");
    });
  };

  return (
    <>
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-5 pt-6 md:px-8">
          <Link
            href={`/admin/courses/${course.id}/classes`}
            className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            返回 {course.title} · 班別管理
          </Link>
        </div>
      </div>

      <AdminPageHeader
        title={`${courseClass.name} · 上課日期管理`}
        description={`${formatClassSchedule(courseClass)}${courseClass.teacher ? ` · ${courseClass.teacher}` : ""}。報名流程尚未連結上課日期，現有課程仍可正常運作。`}
        count={sessions.length}
        countLabel="日期數"
        showAction={canMutate}
        actionLabel="新增日期"
        onAction={() => setModal({ mode: "create" })}
      />

      <main className="mx-auto max-w-7xl space-y-8 px-5 py-10 md:px-8">
        {!canMutate && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            目前無法修改上課日期。請確認 Supabase 已設定、已登入管理員，並在 SQL Editor 執行{" "}
            <code className="rounded bg-white/70 px-1.5 py-0.5">
              supabase/migrations/012_create_sessions.sql
            </code>
            。
          </div>
        )}

        <section className="rounded-3xl border border-border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-gold-soft p-3 text-gold">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-lg font-semibold text-foreground">
                快速建立日期
              </h2>
              <p className="mt-1 text-sm text-muted">
                依星期自動產生區間內的所有上課日期，時間與名額沿用班別設定。
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium text-foreground">星期</label>
              <select
                value={bulkWeekday}
                onChange={(e) => setBulkWeekday(e.target.value)}
                disabled={!canMutate || isPending}
                className={inputClass}
              >
                {WEEKDAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">開始</label>
              <input
                type="date"
                value={bulkStartDate}
                onChange={(e) => setBulkStartDate(e.target.value)}
                disabled={!canMutate || isPending}
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">結束</label>
              <input
                type="date"
                value={bulkEndDate}
                onChange={(e) => setBulkEndDate(e.target.value)}
                disabled={!canMutate || isPending}
                className={inputClass}
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleBulkGenerate}
                disabled={!canMutate || isPending || previewDates.length === 0}
                className="w-full rounded-full bg-gold px-5 py-3 text-sm font-medium text-white transition hover:bg-gold-light disabled:opacity-50"
              >
                {isPending ? "產生中…" : "產生日期"}
              </button>
            </div>
          </div>

          {previewDates.length > 0 ? (
            <div className="mt-5 rounded-2xl bg-surface px-4 py-4">
              <p className="text-sm font-medium text-foreground">
                預覽：共 {previewDates.length} 筆
              </p>
              <p className="mt-2 text-sm text-muted">
                {previewDates
                  .slice(0, 8)
                  .map((date) => formatSessionDate(date))
                  .join("、")}
                {previewDates.length > 8 ? ` … ${formatSessionDate(previewDates.at(-1)!)}` : ""}
              </p>
            </div>
          ) : null}

          {bulkError ? <p className="mt-4 text-sm text-red-600">{bulkError}</p> : null}
        </section>

        <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-surface">
                <tr>
                  {[
                    "日期",
                    "時間",
                    "名額",
                    "剩餘",
                    "狀態",
                    "備註",
                    "操作",
                  ].map((label) => (
                    <th
                      key={label}
                      className="whitespace-nowrap px-4 py-4 font-medium text-muted first:pl-6 last:pr-6"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedSessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-muted">
                      尚無上課日期，請新增或使用快速建立。
                    </td>
                  </tr>
                ) : (
                  sortedSessions.map((session) => (
                    <tr key={session.id} className="transition hover:bg-surface/60">
                      <td className="whitespace-nowrap px-4 py-4 pl-6 font-medium text-foreground">
                        {formatSessionDate(session.date)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-foreground">
                        {formatSessionTimeRange(session)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span className="inline-flex rounded-full bg-gold-soft px-2.5 py-1 text-xs font-medium text-gold">
                          {session.capacity}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-foreground">
                        {session.remainingCapacity}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[session.status]}`}
                        >
                          {SESSION_STATUS_LABELS[session.status]}
                        </span>
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-4 text-muted">
                        {session.notes || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 pr-6">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/attendance/sessions/${session.id}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-gold hover:text-gold"
                          >
                            <ClipboardCheck className="h-3.5 w-3.5" />
                            點名
                          </Link>
                          <button
                            type="button"
                            onClick={() => setModal({ mode: "edit", session })}
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-gold hover:text-gold disabled:opacity-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            編輯
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(session)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-gold hover:text-gold disabled:opacity-50"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            複製
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(session)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {modal?.mode === "create" && (
        <SessionFormModal
          defaultCapacity={courseClass.capacity}
          defaultStartTime={courseClass.startTime}
          defaultEndTime={courseClass.endTime}
          onClose={() => setModal(null)}
          isPending={isPending}
          onSubmit={async (input) => {
            const result = await createSession(courseClass.id, input);
            if (result.success) {
              setModal(null);
              showToast("已新增上課日期");
              router.refresh();
            }
            return result;
          }}
        />
      )}

      {modal?.mode === "edit" && (
        <SessionFormModal
          session={modal.session}
          onClose={() => setModal(null)}
          isPending={isPending}
          onSubmit={async (input) => {
            const result = await updateSession(
              courseClass.id,
              modal.session.id,
              input,
            );
            if (result.success) {
              setModal(null);
              showToast("已更新上課日期");
              router.refresh();
            }
            return result;
          }}
        />
      )}

      {modal?.mode === "copy" && (
        <SessionFormModal
          initialValues={{
            ...sessionToFormInput(modal.session),
            date: "",
            status: "open",
            remainingCapacity: modal.session.capacity,
          }}
          title="複製上課日期"
          onClose={() => setModal(null)}
          isPending={isPending}
          onSubmit={async (input) => {
            const result = await createSession(courseClass.id, {
              ...input,
              notes: input.notes || "（複製）",
            });
            if (result.success) {
              setModal(null);
              showToast("已複製上課日期");
              router.refresh();
            }
            return result;
          }}
        />
      )}

      <Toast
        title={toast?.title ?? ""}
        message={toast?.message}
        visible={Boolean(toast)}
        onClose={() => setToast(null)}
      />
    </>
  );
}
