"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
} from "@/lib/actions/admin/announcements";
import { formatDateTime } from "@/lib/admin/format";
import type { AnnouncementRecord } from "@/lib/announcements/types";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Toast } from "@/components/ui/Toast";

type AnnouncementManagementProps = {
  announcements: AnnouncementRecord[];
};

type FormState = {
  title: string;
  content: string;
  isActive: boolean;
  sortOrder: number;
  startsAt: string;
  endsAt: string;
};

const emptyForm: FormState = {
  title: "",
  content: "",
  isActive: true,
  sortOrder: 0,
  startsAt: "",
  endsAt: "",
};

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

function toDatetimeLocalValue(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AnnouncementManagement({
  announcements,
}: AnnouncementManagementProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const openCreate = () => {
    setEditingId(null);
    setIsCreating(true);
    setForm(emptyForm);
  };

  const openEdit = (item: AnnouncementRecord) => {
    setIsCreating(false);
    setEditingId(item.id);
    setForm({
      title: item.title,
      content: item.content,
      isActive: item.is_active,
      sortOrder: item.sort_order,
      startsAt: toDatetimeLocalValue(item.starts_at),
      endsAt: toDatetimeLocalValue(item.ends_at),
    });
  };

  const closeForm = () => {
    setEditingId(null);
    setIsCreating(false);
    setForm(emptyForm);
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const payload = {
        title: form.title,
        content: form.content,
        isActive: form.isActive,
        sortOrder: form.sortOrder,
        startsAt: form.startsAt,
        endsAt: form.endsAt,
      };

      const result = editingId
        ? await updateAnnouncement(editingId, payload)
        : await createAnnouncement(payload);

      if (!result.success) {
        setToast(result.error);
        return;
      }

      setToast(editingId ? "已更新公告" : "已新增公告");
      closeForm();
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("確定要刪除此公告嗎？")) return;

    startTransition(async () => {
      const result = await deleteAnnouncement(id);
      setToast(result.success ? "已刪除公告" : result.error);
      if (result.success) router.refresh();
    });
  };

  const showForm = isCreating || editingId;

  return (
    <>
      <AdminPageHeader
        title="首頁公告"
        description="管理首頁顯示的公告訊息"
        count={announcements.length}
        countLabel="公告數"
      />

      <main className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gold-light"
          >
            <Plus className="h-4 w-4" />
            新增公告
          </button>
        </div>

        {showForm && (
          <div className="mb-8 rounded-3xl border border-border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
            <h2 className="font-display text-lg font-semibold text-foreground">
              {editingId ? "編輯公告" : "新增公告"}
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-foreground">標題</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputClass}
                  disabled={isPending}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-foreground">內容</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={3}
                  className={inputClass}
                  disabled={isPending}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">排序</label>
                <input
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm({ ...form, sortOrder: Number(e.target.value) })
                  }
                  className={inputClass}
                  disabled={isPending}
                />
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    disabled={isPending}
                  />
                  啟用顯示
                </label>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">開始時間（選填）</label>
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  className={inputClass}
                  disabled={isPending}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">結束時間（選填）</label>
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  className={inputClass}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-white transition hover:bg-foreground/90 disabled:opacity-50"
              >
                {isPending ? "儲存中…" : "儲存"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                disabled={isPending}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface"
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-surface">
                <tr>
                  {["標題", "內容", "狀態", "排序", "更新時間", "操作"].map((label) => (
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
                {announcements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-muted">
                      尚無公告，請新增第一則首頁公告
                    </td>
                  </tr>
                ) : (
                  announcements.map((item) => (
                    <tr key={item.id} className="transition hover:bg-surface/60">
                      <td className="px-4 py-4 pl-6 font-medium text-foreground">
                        {item.title}
                      </td>
                      <td className="max-w-xs px-4 py-4 text-foreground">
                        {item.content}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            item.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-surface text-muted"
                          }`}
                        >
                          {item.is_active ? "啟用" : "停用"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-foreground">
                        {item.sort_order}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-muted">
                        {formatDateTime(item.updated_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 pr-6">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-gold hover:text-gold"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            編輯
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-200 hover:bg-red-50"
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

      <Toast
        title={toast ?? ""}
        visible={Boolean(toast)}
        onClose={() => setToast(null)}
      />
    </>
  );
}
