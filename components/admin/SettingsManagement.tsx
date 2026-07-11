"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBankTransferSettings } from "@/lib/actions/admin/settings";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { BankTransferSettings } from "@/lib/settings/types";

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

type SettingsManagementProps = {
  bankTransferSettings: BankTransferSettings;
  canMutate: boolean;
};

export function SettingsManagement({
  bankTransferSettings,
  canMutate,
}: SettingsManagementProps) {
  const [form, setForm] = useState(bankTransferSettings);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const updateField = <K extends keyof BankTransferSettings>(
    key: K,
    value: BankTransferSettings[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canMutate) return;

    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await updateBankTransferSettings(form);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMessage("已儲存設定");
      router.refresh();
    });
  };

  return (
    <>
      <AdminPageHeader
        title="系統設定"
        description="管理銀行轉帳等全站設定"
      />

      <main className="mx-auto max-w-3xl px-5 py-10 md:px-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)]"
        >
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              銀行轉帳資訊
            </h2>
            <p className="mt-2 text-sm text-muted">
              前台銀行轉帳頁面會從這裡讀取匯款資訊。
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">銀行名稱</label>
              <input
                value={form.bankName}
                onChange={(event) => updateField("bankName", event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">銀行代碼</label>
              <input
                value={form.bankCode}
                onChange={(event) => updateField("bankCode", event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">帳號</label>
              <input
                value={form.accountNumber}
                onChange={(event) => updateField("accountNumber", event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">戶名</label>
              <input
                value={form.accountName}
                onChange={(event) => updateField("accountName", event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">匯款期限（天）</label>
              <input
                type="number"
                min={1}
                value={form.transferDeadlineDays}
                onChange={(event) =>
                  updateField("transferDeadlineDays", Number(event.target.value))
                }
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">提醒文字</label>
            <textarea
              rows={3}
              value={form.reminderText}
              onChange={(event) => updateField("reminderText", event.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!canMutate || isPending}
            className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-white transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "儲存中…" : "儲存設定"}
          </button>
        </form>
      </main>
    </>
  );
}
