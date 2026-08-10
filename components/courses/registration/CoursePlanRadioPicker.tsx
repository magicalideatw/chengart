"use client";

import type { CoursePlan } from "@/lib/course-plans/types";
import { formatCoursePlanLabel } from "@/lib/course-plans/mappers";
import { formatSessionDisplayPrice } from "@/lib/sessions/format";

type CoursePlanRadioPickerProps = {
  plans: CoursePlan[];
  selectedPlanId: string | null;
  onChange: (planId: string) => void;
};

export function CoursePlanRadioPicker({
  plans,
  selectedPlanId,
  onChange,
}: CoursePlanRadioPickerProps) {
  if (plans.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted">
        目前尚無可選課程方案。
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {plans.map((plan) => {
        const checked = selectedPlanId === plan.id;
        const label = formatCoursePlanLabel(plan);
        const priceLabel = formatSessionDisplayPrice(plan.price);

        return (
          <label
            key={plan.id}
            className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 transition ${
              checked
                ? "border-gold bg-gold-soft/40"
                : "border-border bg-white hover:border-gold/40"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <input
                type="radio"
                name="course-plan"
                checked={checked}
                onChange={() => onChange(plan.id)}
                className="h-4 w-4 shrink-0 border-border text-gold focus:ring-gold"
              />
              <span className="text-sm font-semibold text-foreground">{label}</span>
            </div>
            <span className="shrink-0 text-sm font-semibold text-gold">{priceLabel}</span>
          </label>
        );
      })}
    </div>
  );
}
