"use client";

import { motion } from "framer-motion";
import { formatSessionCheckboxLabel } from "@/lib/sessions/format";
import type { ClassWithSessionsOption } from "@/lib/registration/queries";
import type { RegistrationOrderFormValues } from "@/lib/validation/registration-schema";
import type { PaymentMethod } from "@/lib/payment/types";
import {
  resolveConfirmStepSubtitle,
  resolvePaymentMethodDisplayLabel,
} from "@/lib/payment/types";
import { formatGender } from "@/lib/registration/gender";

type ConfirmStepProps = {
  courseTitle: string;
  dateLabel?: string;
  classTime?: string;
  feeLabel: string;
  usesSessions: boolean;
  classes: ClassWithSessionsOption[];
  formData: RegistrationOrderFormValues;
  variant: "adult" | "parent";
  totalAmount: number;
  paymentMethod?: PaymentMethod | null;
};

function findSessionLabel(
  classes: ClassWithSessionsOption[],
  sessionId: string,
): string {
  for (const item of classes) {
    const session = item.sessions.find((entry) => entry.id === sessionId);
    if (session) {
      return `${formatSessionCheckboxLabel(session.date)} ${session.startTime}~${session.endTime}`;
    }
  }
  return sessionId;
}

export function ConfirmStep({
  courseTitle,
  dateLabel,
  classTime,
  feeLabel,
  usesSessions,
  classes,
  formData,
  variant,
  totalAmount,
  paymentMethod,
}: ConfirmStepProps) {
  const contactLabel = variant === "adult" ? "姓名" : "家長姓名";
  const paymentMethodLabel = resolvePaymentMethodDisplayLabel({
    totalAmount,
    paymentMethod,
  });

  const rows = [
    { label: "課程", value: courseTitle },
    ...(dateLabel ? [{ label: "日期", value: dateLabel }] : []),
    ...(classTime ? [{ label: "時間", value: classTime }] : []),
    { label: "費用", value: feeLabel },
    { label: "付款方式", value: paymentMethodLabel },
    { label: contactLabel, value: formData.name },
    { label: "電話", value: formData.phone },
    { label: "Email", value: formData.email },
  ];

  if (variant === "adult" && formData.parentNote?.trim()) {
    rows.push({ label: "備註", value: formData.parentNote.trim() });
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
          {resolveConfirmStepSubtitle({ totalAmount, paymentMethod })}
        </p>
      </div>

      <dl className="divide-y divide-border px-6 py-2 sm:px-8">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 py-4"
          >
            <dt className="shrink-0 text-sm text-muted">{row.label}</dt>
            <dd className="whitespace-pre-line text-right text-sm font-medium text-foreground">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      {variant === "adult" ? (
        <div className="border-t border-border px-6 py-5 sm:px-8">
          <p className="text-sm font-medium text-foreground">報名資料</p>
          <div className="mt-4 rounded-2xl border border-border bg-surface px-4 py-4">
            <p className="font-medium text-foreground">{formData.students[0]?.studentName || "—"}</p>
            <p className="mt-1 text-sm text-muted">
              年齡 {formData.students[0]?.studentAge || "—"} ·{" "}
              性別 {formatGender(formData.students[0]?.gender)}
            </p>
            {usesSessions ? (
              <ul className="mt-3 space-y-1 text-sm text-foreground">
                {(formData.students[0]?.sessionIds ?? []).map((sessionId) => (
                  <li key={sessionId}>✓ {findSessionLabel(classes, sessionId)}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="border-t border-border px-6 py-5 sm:px-8">
          <p className="text-sm font-medium text-foreground">
            報名學生（共 {formData.students.length} 位）
          </p>
          <div className="mt-4 space-y-4">
            {formData.students.map((student, index) => (
              <div
                key={student.clientId ?? index}
                className="rounded-2xl border border-border bg-surface px-4 py-4"
              >
                <p className="font-medium text-foreground">
                  學生 {index + 1}：{student.studentName || "—"}
                </p>
                <p className="mt-1 text-sm text-muted">
                  年齡 {student.studentAge || "—"} · 性別 {formatGender(student.gender)}
                </p>
                {student.note?.trim() ? (
                  <p className="mt-2 text-sm text-muted">備註：{student.note.trim()}</p>
                ) : null}
                {usesSessions ? (
                  <ul className="mt-3 space-y-1 text-sm text-foreground">
                    {(student.sessionIds ?? []).map((sessionId) => (
                      <li key={sessionId}>
                        ✓ {findSessionLabel(classes, sessionId)}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
