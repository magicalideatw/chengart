"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import {
  deleteRegistration,
  updateOrderRegistration,
} from "@/lib/actions/admin/registrations";
import { formatCourseLabel, formatDateTime } from "@/lib/admin/format";
import { formatGender, normalizeGenderValue } from "@/lib/registration/gender";
import type { AdminOrderRegistration } from "@/lib/admin/types";
import type { Course } from "@/lib/courses/types";
import { AdminSearchBar } from "./AdminSearchBar";
import { RegistrationEditModal } from "./RegistrationEditModal";
import { RegistrationStudentBadge } from "./RegistrationStudentBadge";
import { Toast } from "@/components/ui/Toast";

const STATUS_LABELS: Record<AdminOrderRegistration["status"], string> = {
  pending: "待付款",
  paid: "已付款",
  cancelled: "已取消",
};

const STATUS_STYLES: Record<AdminOrderRegistration["status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-surface text-muted",
};

type SortKey = "created_at" | "studentCount";
type SortDirection = "asc" | "desc";

type RegistrationTableProps = {
  registrations: AdminOrderRegistration[];
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
          <ChevronDown className="h-3.5 w-3.5 rotate-180" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<AdminOrderRegistration | null>(null);
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

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const matched = keyword
      ? registrations.filter((item) =>
          [
            item.name,
            item.email,
            item.phone,
            item.courseTitle,
            String(item.studentCount),
            ...item.students.flatMap((student) => [
              student.student_name,
              student.student_age,
              student.note ?? "",
              ...student.sessions.map(
                (session) =>
                  `${session.scheduleLine} ${session.compactLine} ${session.className}`,
              ),
            ]),
          ].some((value) => value.toLowerCase().includes(keyword)),
        )
      : registrations;

    return [...matched].sort((a, b) => {
      let compare = 0;

      if (sortKey === "studentCount") {
        compare = a.studentCount - b.studentCount;
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

  const handleDelete = (item: AdminOrderRegistration) => {
    if (!canMutate) {
      showToast("無法刪除", "請確認已登入管理員");
      return;
    }

    const confirmed = window.confirm(
      `確定要刪除「${item.name}」的整筆訂單（共 ${item.studentCount} 位學生）嗎？此操作無法復原。`,
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
    updated: AdminOrderRegistration,
    students: AdminOrderRegistration["students"],
  ): Promise<{ success: boolean; error?: string }> => {
    if (!canMutate) {
      return {
        success: false,
        error: "請確認已登入管理員",
      };
    }

    const result = await updateOrderRegistration({
      orderId: updated.order_id,
      registrationIds: updated.registrationIds,
      courseId: updated.course_id,
      name: updated.name,
      phone: updated.phone,
      email: updated.email,
      parentNote: updated.parent_note ?? "",
      students: students.map((student) => ({
        id: student.id.startsWith("legacy:") ? undefined : student.id,
        studentName: student.student_name,
        studentAge: student.student_age,
        gender: normalizeGenderValue(student.gender) ?? student.gender ?? "",
        isFirstTime: student.is_first_time,
        note: student.note ?? "",
        sessionIds: student.sessions
          .map((session) => session.sessionId)
          .filter((value): value is string => Boolean(value)),
        registrationIds: student.registrationIds,
      })),
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
          placeholder="搜尋家長、學生、課程、日期…"
        />

        <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-surface">
                <tr>
                  {[
                    { label: "", sortable: false },
                    { label: "家長姓名", sortable: false },
                    { label: "電話", sortable: false },
                    { label: "Email", sortable: false },
                    { label: "課程", sortable: false },
                    { label: "付款狀態", sortable: false },
                    {
                      label: "學生數",
                      sortable: true,
                      key: "studentCount" as const,
                    },
                    { label: "建立時間", sortable: true, key: "created_at" as const },
                    { label: "操作", sortable: false },
                  ].map((column) => (
                    <th
                      key={column.label || "expand"}
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
                      colSpan={9}
                      className="px-6 py-16 text-center text-muted"
                    >
                      {query ? "找不到符合的報名資料" : "目前尚無報名資料"}
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const expanded = expandedIds.has(item.id);

                    return (
                      <Fragment key={item.id}>
                        <tr className="transition hover:bg-surface/60">
                          <td className="whitespace-nowrap px-4 py-4 pl-6">
                            <button
                              type="button"
                              onClick={() => toggleExpanded(item.id)}
                              className="rounded-full border border-border p-1.5 text-muted transition hover:text-foreground"
                              aria-label={expanded ? "收合" : "展開"}
                            >
                              {expanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 font-medium text-foreground">
                            {item.name}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-foreground">
                            {item.phone}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-foreground">
                            {item.email}
                          </td>
                          <td className="min-w-[180px] px-4 py-4 text-foreground">
                            {formatCourseLabel(
                              item.courseTitle,
                              item.courseCategory,
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[item.status]}`}
                            >
                              {STATUS_LABELS[item.status]}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-foreground">
                            <RegistrationStudentBadge
                              registrationType={item.registrationType}
                              studentCount={item.studentCount}
                              studentNames={item.studentNames}
                            />
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
                        {expanded ? (
                          <tr className="bg-surface/40">
                            <td colSpan={9} className="px-6 py-5">
                              <div className="space-y-4">
                                {item.students.map((student, index) => (
                                  <div
                                    key={student.id}
                                    className="rounded-2xl border border-border bg-white px-5 py-4"
                                  >
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                      <p className="font-medium text-foreground">
                                        學生 {index + 1}：{student.student_name}
                                      </p>
                                      <p className="text-sm text-muted">
                                        {student.student_age} 歲 · 性別{" "}
                                        {formatGender(student.gender)}
                                        {student.is_first_time ? " · 第一次參加" : ""}
                                      </p>
                                    </div>
                                    {student.note ? (
                                      <p className="mt-2 text-sm text-muted">
                                        備註：{student.note}
                                      </p>
                                    ) : null}
                                    <div className="mt-3">
                                      <p className="text-sm font-medium text-foreground">
                                        已報：
                                      </p>
                                      <ul className="mt-2 space-y-1 text-sm text-foreground">
                                        {student.sessions.length > 0 ? (
                                          student.sessions.map((session) => (
                                            <li key={session.registrationId}>
                                              ✓ {session.compactLine}
                                              {session.className !== "—"
                                                ? ` · ${session.className}`
                                                : ""}
                                            </li>
                                          ))
                                        ) : (
                                          <li className="text-muted">—</li>
                                        )}
                                      </ul>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })
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
