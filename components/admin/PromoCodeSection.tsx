"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  deletePromoCodeAction,
  savePromoCodeAction,
} from "@/lib/actions/admin/promo-codes";
import type { DiscountType, PromoCodeRecord } from "@/lib/pricing/types";

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

type PromoCodeSectionProps = {
  courseId: string;
  promoCodes: PromoCodeRecord[];
  canMutate: boolean;
  onChanged: () => void;
};

const emptyForm = {
  name: "",
  code: "",
  validFrom: "",
  validUntil: "",
  discountType: "percent" as DiscountType,
  discountValue: 10,
  maxUses: "",
  maxUsesPerPerson: "",
  isActive: true,
};

export function PromoCodeSection({
  courseId,
  promoCodes,
  canMutate,
  onChanged,
}: PromoCodeSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  };

  const startEdit = (promo: PromoCodeRecord) => {
    setEditingId(promo.id);
    setForm({
      name: promo.name,
      code: promo.code,
      validFrom: promo.validFrom ?? "",
      validUntil: promo.validUntil ?? "",
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      maxUses: promo.maxUses == null ? "" : String(promo.maxUses),
      maxUsesPerPerson:
        promo.maxUsesPerPerson == null ? "" : String(promo.maxUsesPerPerson),
      isActive: promo.isActive,
    });
  };

  const handleSave = () => {
    if (!canMutate) return;

    setError(null);
    startTransition(async () => {
      const result = await savePromoCodeAction({
        id: editingId ?? undefined,
        courseId,
        name: form.name,
        code: form.code,
        validFrom: form.validFrom,
        validUntil: form.validUntil,
        discountType: form.discountType,
        discountValue: form.discountValue,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        maxUsesPerPerson: form.maxUsesPerPerson
          ? Number(form.maxUsesPerPerson)
          : null,
        isActive: form.isActive,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      resetForm();
      onChanged();
    });
  };

  const handleDelete = (promoCodeId: string) => {
    if (!canMutate || !window.confirm("確定要刪除此折扣碼嗎？")) return;

    startTransition(async () => {
      const result = await deletePromoCodeAction(promoCodeId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onChanged();
    });
  };

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-surface/40 px-5 py-5">
      <div>
        <h3 className="text-sm font-medium text-foreground">折扣碼</h3>
        <p className="mt-1 text-xs text-muted">
          可建立多組折扣碼，前台報名頁可輸入套用。
        </p>
      </div>

      {promoCodes.length > 0 ? (
        <div className="space-y-3">
          {promoCodes.map((promo) => (
            <div
              key={promo.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3"
            >
              <div>
                <p className="font-medium text-foreground">
                  {promo.name}{" "}
                  <span className="font-mono text-sm text-gold">{promo.code}</span>
                </p>
                <p className="mt-1 text-xs text-muted">
                  {promo.discountType === "percent"
                    ? `${promo.discountValue}%`
                    : `NT$ ${promo.discountValue.toLocaleString()}`}
                  {" · "}
                  已使用 {promo.usedCount}
                  {promo.maxUses != null ? ` / ${promo.maxUses}` : ""}
                  {" · "}
                  {promo.isActive ? "啟用中" : "已停用"}
                </p>
              </div>
              {canMutate ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(promo)}
                    className="rounded-full border border-border p-2 text-muted transition hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(promo.id)}
                    className="rounded-full border border-border p-2 text-muted transition hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">尚未建立折扣碼。</p>
      )}

      {canMutate ? (
        <div className="space-y-4 rounded-xl border border-dashed border-border bg-white px-4 py-4">
          <p className="text-sm font-medium text-foreground">
            {editingId ? "編輯折扣碼" : "新增折扣碼"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">名稱</label>
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Code</label>
              <input
                value={form.code}
                onChange={(event) =>
                  setForm({ ...form, code: event.target.value.toUpperCase() })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">開始日期</label>
              <input
                type="date"
                value={form.validFrom}
                onChange={(event) =>
                  setForm({ ...form, validFrom: event.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">截止日期</label>
              <input
                type="date"
                value={form.validUntil}
                onChange={(event) =>
                  setForm({ ...form, validUntil: event.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">折扣方式</p>
            <div className="flex flex-wrap gap-4">
              {(["fixed", "percent"] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={form.discountType === type}
                    onChange={() => setForm({ ...form, discountType: type })}
                    className="h-4 w-4 accent-gold"
                  />
                  {type === "fixed" ? "固定金額" : "百分比"}
                </label>
              ))}
            </div>
            <input
              type="number"
              min={0}
              value={form.discountValue}
              onChange={(event) =>
                setForm({ ...form, discountValue: Number(event.target.value) })
              }
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">使用次數限制</label>
              <input
                type="number"
                min={1}
                value={form.maxUses}
                onChange={(event) => setForm({ ...form, maxUses: event.target.value })}
                placeholder="留空表示不限"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">每人限制</label>
              <input
                type="number"
                min={1}
                value={form.maxUsesPerPerson}
                onChange={(event) =>
                  setForm({ ...form, maxUsesPerPerson: event.target.value })
                }
                placeholder="留空表示不限"
                className={inputClass}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              className="h-4 w-4 accent-gold"
            />
            啟用
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
              {isPending ? "儲存中…" : editingId ? "更新折扣碼" : "新增折扣碼"}
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
