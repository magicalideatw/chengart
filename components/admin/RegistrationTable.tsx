"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import {
  deleteRegistration,
  updateRegistration,
} from "@/lib/actions/admin/registrations";
import {
  formatCourseLabel,
  formatDateTime,
} from "@/lib/admin/format";
import type { AdminRegistration } from "@/lib/admin/types";
import type { Course } from "@/lib/courses/types";
import { AdminSearchBar } from "./AdminSearchBar";
import { RegistrationEditModal } from "./RegistrationEditModal";
import { Toast } from "@/components/ui/Toast";

const STATUS_LABELS: Record<AdminRegistration["status"], string> = {
  pending: "待付款",
  paid: "已付款",
  cancelled: "已取消",
};

const STATUS_STYLES: Record<AdminRegistration["status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-surface text-muted",
};

type SortKey = "created_at" | "sessionDate" | "className";
type SortDirection = "asc" | "desc";

type RegistrationTableProps = {
  registrations: AdminRegistration[];
  courses: Course[];
  canMutate: boolean;
};

type ToastState = {
  title: string;
  message?: string;
};

function SortButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 transition ${
        active ? "text-foreground" : "text-muted hover:text-foreground"
      }`}
    >
      {label}
      {active ? (
        direction === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5" />
        )
      ) : null}
    </button>
  );
}

export function RegistrationTable({
  registrations,
  courses,
  canMutate,
}: RegistrationTableProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [editing, setEditing] = useState<AdminRegistration | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection(key === "created_at" ? "desc" : "asc");
  };

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const matched = keyword
      ? registrations.filter((item) =>
          [
            item.name,
            item.student_name,
            item.email,
            item.phone,
            item.courseTitle,
            item.sessionScheduleText,
            item.sessionDateLabel,
            item.sessionDate,
            item.sessionTime,
            item.className,
            ...item.sessions.map(
              (session) =>
                `${session.scheduleLine} ${session.compactLine} ${session.className}`,
            ),
          ].some((value) => value.toLowerCase().includes(keyword)),
        )
      : registrations;

    return [...matched].sort((a, b) => {
      let compare = 0;

      if (sortKey === "sessionDate") {
        compare = a.sessionDate.localeCompare(b.sessionDate);
      } else if (sortKey === "className") {
        compare = a.className.localeCompare(b.className, "zh-Hant");
      } else {
        compare =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      return sortDirection === "asc" ? compare : -compare;
    });
  }, [registrations, query, sortDirection, sortKey]);

  const showToast = (title: string, message?: string) => {
    setToast({ title, message });
  };

  const handleDelete = (item: AdminRegistration) => {
    if (!canMutate) {
      showToast("無法刪除", "請確認已登入管理員");
      return;
    }

    const sessionCount = item.sessions.length;
    const confirmed = window.confirm(
      sessionCount > 1
        ? `確定要刪除「${item.name}」的 ${sessionCount} 堂報名資料嗎？此操作無法復原。`
        : `確定要刪除「${item.name}」的報名資料嗎？此操作無法復原。`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteRegistration(item.registrationIds);
      if (result.success) {
        showToast("已刪除報名");
        router.refresh();
        return;
      }
      showToast("刪除失敗", result.error);
    });
  };

  const handleSave = async (
    updated: AdminRegistration,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!canMutate) {
      return {
        success: false,
        error: "請確認已登入管理員",
      };
    }

    const result = await updateRegistration({
      ids: updated.registrationIds,
      courseId: updated.course_id,
      name: updated.name,
      phone: updated.phone,
      email: updated.email,
      studentName: updated.student_name,
      studentAge: updated.student_age,
      isFirstTime: updated.is_first_time,
      note: updated.note ?? "",
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    setEditing(null);
    showToast("已更新報名資料");
    router.refresh();
    return { success: true };
  };

  return (
    <>
      <div className="space-y-6">
        <AdminSearchBar
          value={query}
          onChange={setQuery}
          resultCount={filtered.length}
          placeholder="搜尋姓名、日期、班別、時間…"
        />

        <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-surface">
                <tr>
                  {[
                    { label: "姓名", sortable: false },
                    { label: "電話", sortable: false },
                    { label: "Email", sortable: false },
                    { label: "課程", sortable: false },
                    { label: "付款狀態", sortable: false },
                    {
                      label: "上課日期／時段",
                      sortable: true,
                      key: "sessionDate" as const,
                    },
                    { label: "班別", sortable: true, key: "className" as const },
                    { label: "人數", sortable: false },
                    { label: "建立時間", sortable: true, key: "created_at" as const },
                    { label: "操作", sortable: false },
                  ].map((column) => (
                    <th
                      key={column.label}
                      className="whitespace-nowrap px-4 py-4 font-medium text-muted first:pl-6 last:pr-6"
                    >
                      {column.sortable && column.key ? (
                        <SortButton
                          label={column.label}
                          active={sortKey === column.key}
                          direction={sortDirection}
                          onClick={() => toggleSort(column.key!)}
                        />
                      ) : (
                        column.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-16 text-center text-muted"
                    >
                      {query ? "找不到符合的報名資料" : "目前尚無報名資料"}
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="transition hover:bg-surface/60">
                      <td className="whitespace-nowrap px-4 py-4 pl-6 font-medium text-foreground">
                        <div>{item.name}</div>
                        <div className="mt-1 text-xs text-muted">
                          學生：{item.student_name}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-foreground">
                        {item.phone}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-foreground">
                        {item.email}
                      </td>
                      <td className="min-w-[180px] px-4 py-4 text-foreground">
                        {formatCourseLabel(item.courseTitle, item.courseCategory)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[item.status]}`}
                        >
                          {STATUS_LABELS[item.status]}
                        </span>
                      </td>
                      <td className="min-w-[220px] whitespace-pre-line px-4 py-4 text-foreground">
                        {item.sessionScheduleText || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-foreground">
                        {item.className}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-foreground">
                        <span className="inline-flex rounded-full bg-gold-soft px-2.5 py-1 text-xs font-medium text-gold">
                          {item.slotEnrollment}/{item.maxCapacity}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-muted">
                        {formatDateTime(item.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 pr-6">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditing(item)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-gold hover:text-gold disabled:opacity-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            編輯
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
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
      </div>

      {editing && (
        <RegistrationEditModal
          registration={editing}
          courses={courses}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          isPending={isPending}
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
