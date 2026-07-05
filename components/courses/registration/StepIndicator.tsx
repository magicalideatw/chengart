"use client";

import { motion } from "framer-motion";

const steps = ["選擇日期", "選擇班級", "填寫資料", "確認報名"];

type StepIndicatorProps = {
  currentStep: number;
};

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;

        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? "bg-foreground text-white"
                  : isDone
                    ? "bg-gold text-white"
                    : "bg-surface text-muted"
              }`}
            >
              {stepNum}
            </div>
            <span
              className={`hidden text-[10px] sm:block ${
                isActive ? "font-medium text-foreground" : "text-muted"
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

type StepHeaderProps = {
  step: number;
  title: string;
};

export function StepHeader({ step, title }: StepHeaderProps) {
  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
        Step {step}
      </p>
      <h2 className="mt-2 font-display text-xl font-semibold text-foreground sm:text-2xl">
        {title}
      </h2>
    </motion.div>
  );
}
