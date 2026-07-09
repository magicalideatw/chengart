"use client";

import { motion } from "framer-motion";
import type { CourseDateOption } from "@/src/data/courses";

type DateSelectionStepProps = {
  dates: CourseDateOption[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
};

export function DateSelectionStep({
  dates,
  selectedDate,
  onSelect,
}: DateSelectionStepProps) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {dates.map((item, i) => {
        const isSelected = selectedDate === item.date;

        return (
          <motion.button
            key={item.date}
            type="button"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: Math.min(i * 0.04, 0.4) }}
            whileHover={!isSelected ? { y: -2 } : undefined}
            whileTap={!isSelected ? { scale: 0.98 } : undefined}
            onClick={() => onSelect(item.date)}
            className={`rounded-2xl border bg-white p-4 text-left transition-all sm:p-5 ${
              isSelected
                ? "border-gold ring-2 ring-gold/30"
                : "border-border hover:border-foreground/20"
            }`}
          >
            <p className="font-display text-base font-semibold text-foreground sm:text-lg">
              {item.dayLabel}
            </p>
            <p className="mt-1 text-xs text-muted sm:text-sm">{item.schedule}</p>
            <div className="mt-3 flex items-center gap-2 sm:mt-4">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                  isSelected
                    ? "border-gold bg-gold"
                    : "border-border bg-white"
                }`}
              >
                {isSelected && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </span>
              <span className="text-xs text-muted">
                {isSelected ? "已選擇" : "選擇"}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
