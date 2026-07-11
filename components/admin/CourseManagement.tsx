"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Layers, Pencil, Trash2 } from "lucide-react";
import {
  createCourse,
  deleteCourse,
  updateCourse,
} from "@/lib/actions/admin/courses";
import { formatDateTime, formatFee, formatSessionDate } from "@/lib/admin/format";
import type { Course } from "@/lib/courses/types";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CourseFormModal } from "@/components/admin/CourseFormModal";
import { Toast } from "@/components/ui/Toast";

type CourseManagementProps = {
  courses: Course[];
  enrollmentCounts: Record<string, number>;
  classCounts?: Record<string, number>;
  canMutate: boolean;
};

type ToastState = { title: string; message?: string };

export function CourseManagement({
  courses,
  enrollmentCounts,
  classCounts = {},
  canMutate,
}: CourseManagementProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
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

  const showToast = (title: string, message?: string) => setToast({ title, message });

  const handleDelete = (course: Course) => {
    if (!canMutate) {
      showToast("無法刪除", "請確認 Supabase 已設定、已登入，且已執行 migration 004");
      return;
    }

    const confirmed = window.confirm(`確定要刪除「${course.title}」嗎？`);
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteCourse(course.id);
      if (result.success) {
        showToast("已刪除課程");
        router.refresh();
        return;
      }
      showToast("刪除失敗", result.error);
    });
  };

  return (
    <>
      <AdminPageHeader
        title="課程管理"
        description="新增、編輯與刪除課程，首頁會即時顯示已開放報名的課程"
        count={courses.length}
        countLabel="課程數"
        showAction={canMutate}
        actionLabel="新增課程"
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

        <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-surface">
                <tr>
                  {[
                    "課程名稱",
                    "分類",
                    "上課日期",
                    "時間",
                    "名額",
                    "費用",
                    "報名",
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
                    <td colSpan={9} className="px-6 py-16 text-center text-muted">
                      尚無課程，請新增第一堂課程
                    </td>
                  </tr>
                ) : (
                  sortedCourses.map((course) => {
                    const enrolled = enrollmentCounts[course.id] ?? 0;

                    return (
                      <tr key={course.id} className="transition hover:bg-surface/60">
                        <td className="min-w-[160px] px-4 py-4 pl-6">
                          <p className="font-medium text-foreground">{course.title}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-muted">
                            {course.description}
                          </p>
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
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              course.isOpen
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-surface text-muted"
                            }`}
                          >
                            {course.isOpen ? "開放中" : "已關閉"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-muted">
                          {formatDateTime(course.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 pr-6">
                          <div className="flex items-center gap-2">
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
                              onClick={() => handleDelete(course)}
                              disabled={isPending}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              刪除
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
