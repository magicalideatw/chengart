"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteCoursePlanAction,
  saveCoursePlanAction,
} from "@/lib/actions/admin/course-plans";
import { formatFee } from "@/lib/admin/format";
import type { CoursePlan } from "@/lib/course-plans/types";

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

type CoursePlanSectionProps = {
  courseId: string;
  plans: CoursePlan[];
  canMutate: boolean;
  onChanged: () => void;
};

const emptyForm = {
  name: "",
  sessionCount: 1,
  price: 0,
  sortOrder: 0,
  isActive: true,
};

export function CoursePlanSection({
  courseId,
  plans,
  canMutate,
  onChanged,
}: CoursePlanSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  };

  const startEdit = (plan: CoursePlan) => {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      sessionCount: plan.sessionCount,
      price: plan.price,
      sortOrder: plan.sortOrder,
      isActive: plan.isActive,
    });
  };

  const handleSave = () => {
    if (!canMutate) return;

    setError(null);
    startTransition(async () => {
      const result = await saveCoursePlanAction({
        id: editingId ?? undefined,
        courseId,
        ...form,
      });

      if (!result.success) {
        setError(result.error ?? "儲存失敗");
        return;
      }

      resetForm();
      onChanged();
    });
  };

  const handleDelete = (planId: string) => {
    if (!canMutate || !window.confirm("確定要刪除此課程方案嗎？")) return;

    startTransition(async () => {
      const result = await deleteCoursePlanAction(planId, courseId);
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
        <h3 className="text-sm font-medium text-foreground">課程方案</h3>
        <p className="mt-1 text-xs text-muted">
          自行預約課程可設定多種方案（名稱、堂數、價格）。學員報名時選擇方案即可。
        </p>
      </div>

      {plans.length > 0 ? (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">{plan.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {plan.sessionCount} 堂 · {formatFee(plan.price)}
                  {" · "}
                  排序 {plan.sortOrder}
                  {" · "}
                  {plan.isActive ? "啟用中" : "已停用"}
                </p>
              </div>
              {canMutate ? (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(plan)}
                    className="rounded-full border border-border p-2 text-muted transition hover:border-gold hover:text-gold"
                    aria-label="編輯"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(plan.id)}
                    disabled={isPending}
                    className="rounded-full border border-border p-2 text-muted transition hover:border-red-200 hover:text-red-600 disabled:opacity-40"
                    aria-label="刪除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-white px-4 py-3 text-sm text-muted">
          尚無課程方案，請新增第一個方案。
        </p>
      )}

      {canMutate ? (
        <div className="rounded-xl border border-border bg-white px-4 py-4">
          <p className="text-sm font-medium text-foreground">
            {editingId ? "編輯方案" : "新增方案"}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground">方案名稱</label>
              <input
                value={form.name}
                onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                placeholder="例如：體驗方案、基礎方案"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">堂數</label>
              <input
                type="number"
                min={1}
                value={form.sessionCount}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    sessionCount: Number(e.target.value),
                  }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">價格</label>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) =>
                  setForm((current) => ({ ...current, price: Number(e.target.value) }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">排序</label>
              <input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((current) => ({ ...current, sortOrder: Number(e.target.value) }))
                }
                className={inputClass}
              />
            </div>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, isActive: e.target.checked }))
                  }
                  className="h-4 w-4 accent-gold"
                />
                啟用
              </label>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-white transition hover:bg-foreground/90 disabled:opacity-50"
            >
              {isPending ? "儲存中…" : editingId ? "更新方案" : "新增方案"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted transition hover:text-foreground"
              >
                取消編輯
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
