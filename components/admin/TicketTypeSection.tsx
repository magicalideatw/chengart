"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteTicketTypeAction,
  saveTicketTypeAction,
} from "@/lib/actions/admin/ticket-types";
import type { TicketTypeRecord } from "@/lib/ticket-types/types";

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

type TicketTypeSectionProps = {
  courseId: string;
  ticketTypes: TicketTypeRecord[];
  canMutate: boolean;
  onChanged: () => void;
};

const emptyForm = {
  name: "",
  price: 0,
  description: "",
  isActive: true,
};

export function TicketTypeSection({
  courseId,
  ticketTypes,
  canMutate,
  onChanged,
}: TicketTypeSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  };

  const startEdit = (ticketType: TicketTypeRecord) => {
    setEditingId(ticketType.id);
    setForm({
      name: ticketType.name,
      price: ticketType.price,
      description: ticketType.description,
      isActive: ticketType.isActive,
    });
  };

  const handleSave = () => {
    if (!canMutate) return;

    setError(null);
    startTransition(async () => {
      const result = await saveTicketTypeAction({
        id: editingId ?? undefined,
        courseId,
        name: form.name,
        price: form.price,
        description: form.description,
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

  const handleDelete = (ticketTypeId: string) => {
    if (!canMutate || !window.confirm("確定要刪除此票種嗎？")) return;

    startTransition(async () => {
      const result = await deleteTicketTypeAction(ticketTypeId);
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
        <h3 className="text-sm font-medium text-foreground">票種</h3>
        <p className="mt-1 text-xs text-muted">
          可建立多種票種。目前僅供資料管理，尚未連動購票流程。
        </p>
      </div>

      {ticketTypes.length > 0 ? (
        <div className="space-y-3">
          {ticketTypes.map((ticketType) => (
            <div
              key={ticketType.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3"
            >
              <div>
                <p className="font-medium text-foreground">{ticketType.name}</p>
                <p className="mt-1 text-xs text-muted">
                  NT$ {ticketType.price.toLocaleString()}
                  {ticketType.description ? ` · ${ticketType.description}` : ""}
                  {" · "}
                  {ticketType.isActive ? "啟用中" : "已停用"}
                </p>
              </div>
              {canMutate ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(ticketType)}
                    className="rounded-full border border-border p-2 text-muted transition hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ticketType.id)}
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
        <p className="text-sm text-muted">尚未建立票種。</p>
      )}

      {canMutate ? (
        <div className="space-y-4 rounded-xl border border-dashed border-border bg-white px-4 py-4">
          <p className="text-sm font-medium text-foreground">
            {editingId ? "編輯票種" : "新增票種"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">名稱</label>
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="例如：一般票、早鳥票"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">售價（NT$）</label>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(event) =>
                  setForm({ ...form, price: Number(event.target.value) })
                }
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">說明（選填）</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              className={`${inputClass} resize-none`}
            />
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
              {isPending ? "儲存中…" : editingId ? "更新票種" : "新增票種"}
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
