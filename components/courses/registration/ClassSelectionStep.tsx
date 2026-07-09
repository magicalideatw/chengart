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
                ? "cursor-not-allowed border-border bg-surface opacity-60"
                : isSelected
                  ? "border-gold bg-white ring-2 ring-gold/30"
                  : "border-border bg-white hover:border-foreground/20"
            }`}
          >
            {isFull ? (
              <>
                <p className="font-display text-lg font-semibold text-mist">
                  {item.name}
                </p>
                <p className="mt-3 flex items-center gap-2 text-sm text-mist">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                  已額滿
                </p>
              </>
            ) : (
              <p className="font-display text-lg font-semibold text-foreground">
                {item.name}｜{item.time}
              </p>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
