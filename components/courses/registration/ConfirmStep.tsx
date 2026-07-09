"use client";

import { motion } from "framer-motion";
import type { RegistrationFormValues } from "@/lib/validation/registration-schema";

type ConfirmStepProps = {
  dateLabel: string;
  className: string;
  classTime: string;
  feeLabel: string;
  formData: RegistrationFormValues;
};

export function ConfirmStep({
  dateLabel,
  className,
  classTime,
  feeLabel,
  formData,
}: ConfirmStepProps) {
  const rows = [
    { label: "日期", value: dateLabel },
    { label: "班級", value: className },
    { label: "時間", value: classTime },
    { label: "費用", value: feeLabel },
    { label: "姓名", value: formData.name },
    { label: "學生姓名", value: formData.studentName },
    { label: "電話", value: formData.phone },
    { label: "Email", value: formData.email },
  ];

  if (formData.note?.trim()) {
    rows.push({ label: "備註", value: formData.note.trim() });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="mt-8 overflow-hidden rounded-3xl border border-border bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)]"
    >
      <div className="border-b border-border bg-surface px-6 py-5 sm:px-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
          Summary
        </p>
        <p className="mt-1 font-display text-lg font-semibold text-foreground">
          確認資料
        </p>
        <p className="mt-2 text-sm text-muted">
          確認無誤後，將前往綠界安全付款頁面（支援 LINE Pay、信用卡、ATM）。
        </p>
      </div>

      <dl className="divide-y divide-border px-6 py-2 sm:px-8">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 py-4"
          >
            <dt className="shrink-0 text-sm text-muted">{row.label}</dt>
            <dd className="text-right text-sm font-medium text-foreground">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </motion.div>
  );
}
