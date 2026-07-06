"use client";

import { motion } from "framer-motion";
import type { RegistrationFormValues } from "@/lib/validation/registration-schema";

type ConfirmStepProps = {
  courseTitle: string;
  dateLabel: string;
  className: string;
  classTime: string;
  formData: RegistrationFormValues;
};

export function ConfirmStep({
  courseTitle,
  dateLabel,
  className,
  classTime,
  formData,
}: ConfirmStepProps) {
  const courseRows = [
    { label: "課程", value: courseTitle },
    { label: "日期", value: dateLabel },
    { label: "班級", value: className },
    { label: "時間", value: classTime },
  ];

  const contactRows = [
    { label: "姓名", value: formData.name },
    { label: "電話", value: formData.phone },
    { label: "Email", value: formData.email },
  ];

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
          報名摘要
        </p>
      </div>

      <div className="px-6 py-6 sm:px-8 sm:py-8">
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
            課程資訊
          </h3>
          <dl className="mt-4 space-y-4">
            {courseRows.map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-4 last:border-0 last:pb-0"
              >
                <dt className="shrink-0 text-sm text-muted">{row.label}</dt>
                <dd className="text-right text-sm font-medium text-foreground">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="my-6 h-px bg-border" />

        <section>
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
            聯絡資訊
          </h3>
          <dl className="mt-4 space-y-4">
            {contactRows.map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-4 last:border-0 last:pb-0"
              >
                <dt className="shrink-0 text-sm text-muted">{row.label}</dt>
                <dd className="text-right text-sm font-medium text-foreground">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </motion.div>
  );
}
