"use client";

import type { RegistrationFormValues } from "@/lib/validation/registration-schema";

type ConfirmStepProps = {
  dateLabel: string;
  schedule: string;
  className: string;
  classTime: string;
  formData: RegistrationFormValues;
};

export function ConfirmStep({
  dateLabel,
  schedule,
  className,
  classTime,
  formData,
}: ConfirmStepProps) {
  const rows = [
    { label: "日期", value: `${dateLabel}（${schedule}）` },
    { label: "班級", value: className },
    { label: "時間", value: classTime },
    { label: "姓名", value: formData.name },
    { label: "電話", value: formData.phone },
    { label: "Email", value: formData.email },
    { label: "學員姓名", value: formData.studentName },
    { label: "學員年齡", value: formData.studentAge },
    {
      label: "第一次參加",
      value: formData.isFirstTime === "yes" ? "是" : "否",
    },
    ...(formData.note ? [{ label: "備註", value: formData.note }] : []),
  ];

  return (
    <div className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <p className="text-sm font-medium text-foreground">確認資料</p>
      <dl className="mt-6 divide-y divide-border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-4"
          >
            <dt className="shrink-0 text-sm text-muted">{row.label}</dt>
            <dd className="text-sm font-medium text-foreground sm:text-right">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
