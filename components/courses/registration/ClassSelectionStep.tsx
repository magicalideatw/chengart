"use client";

import { motion } from "framer-motion";
import type { CourseClass } from "@/src/data/courses";

type ClassSelectionStepProps = {
  classes: CourseClass[];
  selectedClassId: string | null;
  onSelect: (classId: string) => void;
};

export function ClassSelectionStep({
  classes,
  selectedClassId,
  onSelect,
}: ClassSelectionStepProps) {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4">
      {classes.map((item, i) => {
        const isFull = item.full;
        const isSelected = selectedClassId === item.id;

        return (
          <motion.button
            key={item.id}
            type="button"
            disabled={isFull}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            whileHover={!isFull && !isSelected ? { y: -2 } : undefined}
            onClick={() => !isFull && onSelect(item.id)}
            className={`rounded-2xl border p-5 text-left transition-all ${
              isFull
                ? "cursor-not-allowed border-border bg-surface opacity-50"
                : isSelected
                  ? "border-gold bg-white ring-2 ring-gold/30"
                  : "border-border bg-white hover:border-foreground/20"
            }`}
          >
            <p
              className={`font-display text-lg font-semibold ${isFull ? "text-mist" : "text-foreground"}`}
            >
              {item.name}
            </p>
            <p className={`mt-1 text-sm ${isFull ? "text-mist" : "text-muted"}`}>
              {item.time}
            </p>
            <p className={`mt-4 text-sm font-medium ${isFull ? "text-mist" : "text-emerald-600"}`}>
              {isFull ? "🔴 已額滿" : "🟢 可報名"}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}
