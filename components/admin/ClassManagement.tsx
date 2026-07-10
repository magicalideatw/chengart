"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Pencil, Trash2 } from "lucide-react";
import {
  createClass,
  deleteClass,
  updateClass,
} from "@/lib/actions/admin/classes";
import {
  formatClassTimeRange,
  formatWeekdayLabel,
} from "@/lib/classes/mappers";
import type { CourseClass } from "@/lib/classes/types";
import type { Course } from "@/lib/courses/types";
import { ClassFormModal } from "@/components/admin/ClassFormModal";
import { Toast } from "@/components/ui/Toast";

type ClassManagementProps = {
  course: Course;
  classes: CourseClass[];
  canMutate: boolean;
};

type ToastState = { title: string; message?: string };

export function ClassManagement({
  course,
  classes,
  canMutate,
}: ClassManagementProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<CourseClass | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const sortedClasses = useMemo(
    () =>
      [...classes].sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [classes],
  );

  const showToast = (title: string, message?: string) => setToast({ title, message });

  const handleDelete = (courseClass: CourseClass) => {
    if (!canMutate) {
      showToast("無法刪除", "請確認 Supabase 已設定、已登入，且已執行 migration 011");
      return;
    }

    const confirmed = window.confirm(`確定要刪除「${courseClass.name}」嗎？`);
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteClass(course.id, courseClass.id);
      if (result.success) {
        showToast("已刪除班別");
        router.refresh();
        return;
      }
      showToast("刪除失敗", result.error);
    });
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
            返回課程管理
          </Link>
        </div>
      </div>

      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-end sm:justify-between md:px-8">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
              Admin
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground">
              班別管理
            </h1>
            <p className="mt-2 font-display text-lg text-foreground">{course.title}</p>
            <p className="mt-1 text-sm text-muted">
              管理此課程的班別、上課時間與名額設定
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-border bg-surface px-5 py-3 text-center">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">班別數</p>
              <p className="mt-1 font-display text-2xl font-semibold text-foreground">
                {classes.length}
              </p>
            </div>

            {canMutate ? (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gold-light"
              >
                新增班別
              </button>
            ) : null}

            <Link
              href="/"
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-foreground/20 hover:bg-surface"
            >
              返回網站
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        {!canMutate && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            目前無法修改班別。請確認 Supabase 已設定、已登入管理員，並在 SQL Editor 執行{" "}
            <code className="rounded bg-white/70 px-1.5 py-0.5">
              supabase/migrations/011_create_classes.sql
            </code>
            。
          </div>
        )}

        {sortedClasses.length === 0 ? (
          <div className="rounded-3xl border border-border bg-white px-6 py-16 text-center shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
            <p className="text-muted">尚無班別，請新增第一個班別。</p>
            {canMutate ? (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="mt-4 inline-flex rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gold-light"
              >
                新增班別
              </button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedClasses.map((courseClass) => (
              <article
                key={courseClass.id}
                className="flex flex-col gap-5 rounded-3xl border border-border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      {courseClass.name}
                    </h2>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        courseClass.isOpen
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-surface text-muted"
                      }`}
                    >
                      {courseClass.isOpen ? "開放中" : "已關閉"}
                    </span>
                  </div>

                  <p className="text-sm text-foreground">
                    老師：{courseClass.teacher || "—"}
                  </p>
                  <p className="text-sm text-foreground">
                    {formatWeekdayLabel(courseClass.weekday)}{" "}
                    {formatClassTimeRange(courseClass)}
                  </p>
                  <p className="text-sm text-muted">
                    名額 {courseClass.capacity} · 排序 {courseClass.sortOrder}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditing(courseClass)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-gold hover:text-gold disabled:opacity-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    編輯
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(courseClass)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    刪除
                  </button>
                  <Link
                    href={`/admin/classes/${courseClass.id}/sessions`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-gold hover:text-gold"
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    管理日期
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <ClassFormModal
          onClose={() => setShowCreate(false)}
          isPending={isPending}
          onSubmit={async (input) => {
            const result = await createClass(course.id, input);
            if (result.success) {
              setShowCreate(false);
              showToast("已新增班別");
              router.refresh();
            }
            return result;
          }}
        />
      )}

      {editing && (
        <ClassFormModal
          courseClass={editing}
          onClose={() => setEditing(null)}
          isPending={isPending}
          onSubmit={async (input) => {
            const result = await updateClass(course.id, editing.id, input);
            if (result.success) {
              setEditing(null);
              showToast("已更新班別");
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
