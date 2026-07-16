"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Layers, Copy, Download, Pencil, Trash2 } from "lucide-react";
import {
  createCourse,
  updateCourse,
} from "@/lib/actions/admin/courses";
import { DeleteActivityModal } from "@/components/admin/DeleteActivityModal";
import { BatchDeleteActivityModal } from "@/components/admin/BatchDeleteActivityModal";
import { formatDateTime, formatFee, formatSessionDate } from "@/lib/admin/format";
import type { Course } from "@/lib/courses/types";
import { ACTIVITY_TYPE_LABELS } from "@/lib/courses/activity-type";
import { ActivityStatusBadge } from "@/components/admin/ActivityStatusBadge";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CopyCourseModal } from "@/components/admin/CopyCourseModal";
import { CourseFormModal } from "@/components/admin/CourseFormModal";
import { RegistrationExportModal } from "@/components/admin/RegistrationExportModal";
import { Toast } from "@/components/ui/Toast";

type CourseManagementProps = {
  courses: Course[];
  enrollmentCounts: Record<string, number>;
  soldTicketCounts: Record<string, number>;
  classCounts?: Record<string, number>;
  canMutate: boolean;
};

type ToastState = { title: string; message?: string };

const TABLE_COLUMN_COUNT = 11;

export function CourseManagement({
  courses,
  enrollmentCounts,
  soldTicketCounts,
  classCounts = {},
  canMutate,
}: CourseManagementProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [copying, setCopying] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState<Course | null>(null);
  const [batchDeleting, setBatchDeleting] = useState<Course[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState<Course | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const sortedCourses = useMemo(
    () =>
      [...courses].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [courses],
  );

  const visibleIds = useMemo(
    () => sortedCourses.map((course) => course.id),
    [sortedCourses],
  );
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        const next = new Set(current);
        for (const id of visibleIds) next.delete(id);
        return next;
      }

      const next = new Set(current);
      for (const id of visibleIds) next.add(id);
      return next;
    });
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedCourses = useMemo(
    () => sortedCourses.filter((course) => selectedIds.has(course.id)),
    [selectedIds, sortedCourses],
  );

  const handleDeleteSelected = () => {
    if (!canMutate || selectedCourses.length === 0) return;
    setBatchDeleting(selectedCourses);
  };

  const clearSelection = () => setSelectedIds(new Set());

  const showToast = (title: string, message?: string) => setToast({ title, message });

  return (
    <>
      <AdminPageHeader
        title="活動管理"
        description="管理所有活動（課程、演出等），首頁會依活動類型分類顯示已開放項目"
        count={courses.length}
        countLabel="活動數"
        showAction={canMutate}
        actionLabel="新增活動"
        onAction={() => setShowCreate(true)}
      />

      <main className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        {!canMutate && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            目前無法修改課程。請確認 Supabase 已設定、已登入管理員，並在 SQL Editor 執行{" "}
            <code className="rounded bg-white/70 px-1.5 py-0.5">
              supabase/migrations/004_admin_auth_policies.sql
            </code>
            。
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {selectedIds.size > 0 ? (
              <>
                <span className="text-sm text-muted">已選 {selectedIds.size} 筆</span>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  disabled={isPending || !canMutate}
                  className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  刪除選取
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface disabled:opacity-50"
                >
                  取消選取
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-surface">
                <tr>
                  <th className="whitespace-nowrap px-4 py-4 pl-6 font-medium text-muted">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      disabled={sortedCourses.length === 0 || !canMutate}
                      aria-label="全選"
                      className="h-4 w-4 accent-gold"
                    />
                  </th>
                  {[
                    "活動名稱",
                    "活動類型",
                    "分類",
                    "日期",
                    "時間",
                    "名額",
                    "費用",
                    "狀態",
                    "建立時間",
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
                {sortedCourses.length === 0 ? (
                  <tr>
                    <td colSpan={TABLE_COLUMN_COUNT} className="px-6 py-16 text-center text-muted">
                      尚無活動，請新增第一個活動
                    </td>
                  </tr>
                ) : (
                  sortedCourses.map((course) => {
                    const enrolled =
                      course.activityType === "performance"
                        ? soldTicketCounts[course.id] ?? 0
                        : enrollmentCounts[course.id] ?? 0;

                    return (
                      <tr key={course.id} className="transition hover:bg-surface/60">
                        <td className="whitespace-nowrap px-4 py-4 pl-6">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(course.id)}
                            onChange={() => toggleSelected(course.id)}
                            disabled={!canMutate || isPending}
                            aria-label={`選取 ${course.title}`}
                            className="h-4 w-4 accent-gold"
                          />
                        </td>
                        <td className="min-w-[160px] px-4 py-4">
                          <p className="font-medium text-foreground">{course.title}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-muted">
                            {course.description}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground">
                            {ACTIVITY_TYPE_LABELS[course.activityType]}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs">
                            {course.category}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-foreground">
                          {formatSessionDate(course.sessionDate)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-foreground">
                          {course.sessionTime}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span className="inline-flex rounded-full bg-gold-soft px-2.5 py-1 text-xs font-medium text-gold">
                            {enrolled}/{course.capacity}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-foreground">
                          {formatFee(course.pricePerStudent || course.fee)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <ActivityStatusBadge isOpen={course.isOpen} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-muted">
                          {formatDateTime(course.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 pr-6">
                          <div className="flex items-center gap-2">
                            {course.activityType === "course" ? (
                              <Link
                                href={`/admin/courses/${course.id}/classes`}
                                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-gold hover:text-gold"
                              >
                                <Layers className="h-3.5 w-3.5" />
                                班別管理
                                {classCounts[course.id]
                                  ? ` (${classCounts[course.id]})`
                                  : ""}
                              </Link>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => setExporting(course)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-gold hover:text-gold"
                            >
                              <Download className="h-3.5 w-3.5" />
                              匯出 Excel
                            </button>
                            <button
                              type="button"
                              onClick={() => setCopying(course)}
                              disabled={isPending || !canMutate}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-gold hover:text-gold disabled:opacity-50"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              複製活動
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditing(course)}
                              disabled={isPending}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-gold hover:text-gold disabled:opacity-50"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              編輯
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!canMutate) {
                                  showToast(
                                    "無法刪除",
                                    "請確認 Supabase 已設定、已登入，且已執行 migration 004",
                                  );
                                  return;
                                }
                                setDeleting(course);
                              }}
                              disabled={isPending}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              刪除活動
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {exporting ? (
        <RegistrationExportModal
          course={exporting}
          open={Boolean(exporting)}
          onClose={() => setExporting(null)}
          onExported={() => showToast("Excel 已下載。")}
        />
      ) : null}

      {deleting ? (
        <DeleteActivityModal
          course={deleting}
          open={Boolean(deleting)}
          onClose={() => setDeleting(null)}
          onCompleted={(message) => {
            setSelectedIds(new Set());
            showToast(message);
            router.refresh();
          }}
        />
      ) : null}

      {batchDeleting ? (
        <BatchDeleteActivityModal
          courses={batchDeleting}
          open={Boolean(batchDeleting)}
          onClose={() => setBatchDeleting(null)}
          onCompleted={(message) => {
            setBatchDeleting(null);
            setSelectedIds(new Set());
            showToast(message);
            router.refresh();
          }}
        />
      ) : null}

      {copying ? (
        <CopyCourseModal
          course={copying}
          open={Boolean(copying)}
          onClose={() => setCopying(null)}
          onCopied={(course) => {
            setCopying(null);
            setEditing(course);
            showToast("已建立活動副本", "請調整日期、招生時間與其他設定");
            router.refresh();
          }}
        />
      ) : null}

      {showCreate && (
        <CourseFormModal
          onClose={() => setShowCreate(false)}
          isPending={isPending}
          onSubmit={async (input) => {
            const result = await createCourse(input);
            if (result.success) {
              setShowCreate(false);
              showToast("已新增課程");
              router.refresh();
            }
            return result;
          }}
        />
      )}

      {editing && (
        <CourseFormModal
          course={editing}
          onClose={() => setEditing(null)}
          isPending={isPending}
          onSubmit={async (input) => {
            const result = await updateCourse(editing.id, input);
            if (result.success) {
              setEditing(null);
              showToast("已更新課程");
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
