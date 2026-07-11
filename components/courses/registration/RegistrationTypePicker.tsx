"use client";

import type { ActiveRegistrationType } from "@/lib/courses/registration-mode";
import { ACTIVE_REGISTRATION_TYPE_LABELS } from "@/lib/courses/registration-mode";

type RegistrationTypePickerProps = {
  value: ActiveRegistrationType | null;
  onChange: (value: ActiveRegistrationType) => void;
};

export function RegistrationTypePicker({
  value,
  onChange,
}: RegistrationTypePickerProps) {
  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
      <h3 className="font-display text-lg font-semibold text-foreground">
        請選擇報名方式
      </h3>
      <div className="mt-5 space-y-3">
        {(["adult", "parent"] as const).map((type) => (
          <label
            key={type}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-4 text-sm transition ${
              value === type
                ? "border-gold bg-gold-soft text-gold"
                : "border-border text-foreground hover:border-gold/40"
            }`}
          >
            <input
              type="radio"
              name="registrationType"
              checked={value === type}
              onChange={() => onChange(type)}
              className="h-4 w-4 accent-gold"
            />
            <span className="font-medium">{ACTIVE_REGISTRATION_TYPE_LABELS[type]}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
