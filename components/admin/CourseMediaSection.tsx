"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteCourseMediaAction,
  saveCourseMediaAction,
} from "@/lib/actions/admin/course-media";
import type { CourseMediaRecord } from "@/lib/media/types";

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

type CourseMediaSectionProps = {
  courseId: string;
  mediaItems: CourseMediaRecord[];
  canMutate: boolean;
  onChanged: () => void;
};

const emptyForm = {
  title: "",
  sourceUrl: "",
  sortOrder: 0,
  isVisible: true,
};

export function CourseMediaSection({
  courseId,
  mediaItems,
  canMutate,
  onChanged,
}: CourseMediaSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  };

  const startEdit = (item: CourseMediaRecord) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      sourceUrl: item.sourceUrl,
      sortOrder: item.sortOrder,
      isVisible: item.isVisible,
    });
  };

  const handleSave = () => {
    if (!canMutate) return;

    setError(null);
    startTransition(async () => {
      const result = await saveCourseMediaAction({
        id: editingId ?? undefined,
        courseId,
        mediaType: "youtube",
        title: form.title,
        sourceUrl: form.sourceUrl,
        sortOrder: form.sortOrder,
        isVisible: form.isVisible,
      });

      if (!result.success) {
        setError(result.error ?? "儲存失敗");
        return;
      }

      resetForm();
      onChanged();
    });
  };

  const handleDelete = (mediaId: string) => {
    if (!canMutate || !window.confirm("確定要刪除此影片嗎？")) return;

    startTransition(async () => {
      const result = await deleteCourseMediaAction(mediaId, courseId);
      if (!result.success) {
        setError(result.error ?? "刪除失敗");
        return;
      }
      onChanged();
    });
  };

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-surface/40 px-5 py-5">
      <div>
        <h3 className="text-sm font-medium text-foreground">媒體管理</h3>
        <p className="mt-1 text-xs text-muted">
          可新增多支 YouTube 影片。只需貼上網址，不需 iframe。
        </p>
      </div>

      {mediaItems.length > 0 ? (
        <div className="space-y-3">
          {mediaItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="mt-1 truncate text-xs text-muted">{item.sourceUrl}</p>
                <p className="mt-1 text-xs text-muted">
                  排序 {item.sortOrder}
                  {" · "}
                  {item.isVisible ? "顯示中" : "已隱藏"}
                </p>
              </div>
              {canMutate ? (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="rounded-full border border-border p-2 text-muted transition hover:text-foreground"
                    aria-label="編輯影片"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-full border border-border p-2 text-muted transition hover:text-red-600"
                    aria-label="刪除影片"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">尚未新增影片。</p>
      )}

      {canMutate ? (
        <div className="space-y-4 rounded-xl border border-dashed border-border bg-white px-4 py-4">
          <p className="text-sm font-medium text-foreground">
            {editingId ? "編輯影片" : "新增影片"}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">標題</label>
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="例如：課程精華片段"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">排序</label>
              <input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(event) =>
                  setForm({ ...form, sortOrder: Number(event.target.value) })
                }
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">YouTube URL</label>
            <input
              type="url"
              value={form.sourceUrl}
              onChange={(event) =>
                setForm({ ...form, sourceUrl: event.target.value })
              }
              placeholder="https://youtu.be/xxxx 或 https://www.youtube.com/watch?v=xxxx"
              className={inputClass}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.isVisible}
              onChange={(event) =>
                setForm({ ...form, isVisible: event.target.checked })
              }
              className="h-4 w-4 accent-gold"
            />
            顯示於前台
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-sm font-medium text-white transition hover:bg-gold-light disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {isPending ? "儲存中…" : editingId ? "更新影片" : "新增影片"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-border px-4 py-2 text-sm text-foreground"
              >
                取消
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
