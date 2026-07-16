"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateBankTransferSettings,
  updateEmailSettings,
} from "@/lib/actions/admin/settings";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { BankTransferSettings, EmailSettings } from "@/lib/settings/types";

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

type SettingsManagementProps = {
  bankTransferSettings: BankTransferSettings;
  emailSettings: EmailSettings;
  canMutate: boolean;
};

export function SettingsManagement({
  bankTransferSettings,
  emailSettings,
  canMutate,
}: SettingsManagementProps) {
  const [bankForm, setBankForm] = useState(bankTransferSettings);
  const [emailForm, setEmailForm] = useState(emailSettings);
  const [bankError, setBankError] = useState<string | null>(null);
  const [bankMessage, setBankMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [isBankPending, startBankTransition] = useTransition();
  const [isEmailPending, startEmailTransition] = useTransition();
  const router = useRouter();

  const updateBankField = <K extends keyof BankTransferSettings>(
    key: K,
    value: BankTransferSettings[K],
  ) => {
    setBankForm((current) => ({ ...current, [key]: value }));
  };

  const updateEmailField = <K extends keyof EmailSettings>(
    key: K,
    value: EmailSettings[K],
  ) => {
    setEmailForm((current) => ({ ...current, [key]: value }));
  };

  const handleBankSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canMutate) return;

    setBankError(null);
    setBankMessage(null);

    startBankTransition(async () => {
      const result = await updateBankTransferSettings(bankForm);
      if (!result.success) {
        setBankError(result.error);
        return;
      }
      setBankMessage("已儲存銀行轉帳設定");
      router.refresh();
    });
  };

  const handleEmailSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canMutate) return;

    setEmailError(null);
    setEmailMessage(null);

    startEmailTransition(async () => {
      const result = await updateEmailSettings(emailForm);
      if (!result.success) {
        setEmailError(result.error);
        return;
      }
      setEmailMessage("已儲存 Email 設定");
      router.refresh();
    });
  };

  return (
    <>
      <AdminPageHeader
        title="系統設定"
        description="管理 Email 通知、銀行轉帳等全站設定"
      />

      <main className="mx-auto max-w-3xl space-y-8 px-5 py-10 md:px-8">
        <form
          onSubmit={handleEmailSubmit}
          className="space-y-6 rounded-3xl border border-border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)]"
        >
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Email 設定
            </h2>
            <p className="mt-2 text-sm text-muted">
              設定寄件者名稱、管理員通知信箱與回覆地址。寄信服務目前使用
              Resend（需設定 RESEND_API_KEY 與 RESEND_FROM_EMAIL）。
            </p>
          </div>

          <div className="grid gap-5">
            <div>
              <label className="text-sm font-medium text-foreground">
                寄件者名稱
              </label>
              <input
                value={emailForm.senderName}
                onChange={(event) =>
                  updateEmailField("senderName", event.target.value)
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                管理員 Email
              </label>
              <input
                type="email"
                value={emailForm.adminEmail}
                onChange={(event) =>
                  updateEmailField("adminEmail", event.target.value)
                }
                placeholder="新訂單通知將寄到此信箱"
                className={inputClass}
              />
              <p className="mt-2 text-xs text-muted">
                若留空，將依序使用 ADMIN_NOTIFICATION_EMAIL 環境變數或網站預設信箱。
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                回覆 Email
              </label>
              <input
                type="email"
                value={emailForm.replyToEmail}
                onChange={(event) =>
                  updateEmailField("replyToEmail", event.target.value)
                }
                placeholder="家長回信時使用的地址"
                className={inputClass}
              />
            </div>
          </div>

          {emailError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {emailError}
            </p>
          ) : null}

          {emailMessage ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {emailMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!canMutate || isEmailPending}
            className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-white transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isEmailPending ? "儲存中…" : "儲存 Email 設定"}
          </button>
        </form>

        <form
          onSubmit={handleBankSubmit}
          className="space-y-6 rounded-3xl border border-border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)]"
        >
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              銀行轉帳資訊
            </h2>
            <p className="mt-2 text-sm text-muted">
              前台銀行轉帳頁面與 Email 通知會從這裡讀取匯款資訊。
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">銀行名稱</label>
              <input
                value={bankForm.bankName}
                onChange={(event) => updateBankField("bankName", event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">銀行代碼</label>
              <input
                value={bankForm.bankCode}
                onChange={(event) => updateBankField("bankCode", event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">帳號</label>
              <input
                value={bankForm.accountNumber}
                onChange={(event) =>
                  updateBankField("accountNumber", event.target.value)
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">戶名</label>
              <input
                value={bankForm.accountName}
                onChange={(event) =>
                  updateBankField("accountName", event.target.value)
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">匯款期限（天）</label>
              <input
                type="number"
                min={1}
                value={bankForm.transferDeadlineDays}
                onChange={(event) =>
                  updateBankField("transferDeadlineDays", Number(event.target.value))
                }
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">提醒文字</label>
            <textarea
              rows={3}
              value={bankForm.reminderText}
              onChange={(event) => updateBankField("reminderText", event.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>

          {bankError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {bankError}
            </p>
          ) : null}

          {bankMessage ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {bankMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!canMutate || isBankPending}
            className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-white transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBankPending ? "儲存中…" : "儲存銀行轉帳設定"}
          </button>
        </form>
      </main>
    </>
  );
}
