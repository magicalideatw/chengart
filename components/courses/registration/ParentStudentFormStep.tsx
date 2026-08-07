"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Plus } from "lucide-react";
import {
  createDefaultStudent,
  type ParentFormValues,
} from "@/lib/validation/registration-schema";
import { StudentRegistrationCard } from "./StudentRegistrationCard";

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

type ParentStudentFormStepProps = {
  usesSessions: boolean;
};

export function ParentStudentFormStep({
  usesSessions: _usesSessions,
}: ParentStudentFormStepProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ParentFormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "students",
  });

  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-3xl border border-border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
        <h3 className="font-display text-lg font-semibold text-foreground">
          家長資料
        </h3>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {(
            [
              { name: "name" as const, label: "家長姓名", type: "text" },
              { name: "phone" as const, label: "電話", type: "tel" },
              { name: "email" as const, label: "Email", type: "email" },
            ] as const
          ).map((field) => (
            <div key={field.name} className={field.name === "email" ? "sm:col-span-2" : ""}>
              <label className="text-sm font-medium text-foreground">
                {field.label} <span className="text-gold">*</span>
              </label>
              <input
                type={field.type}
                {...register(field.name)}
                className={inputClass}
              />
              {errors[field.name] && (
                <p className="mt-1 text-xs text-red-600">
                  {errors[field.name]?.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-display text-lg font-semibold text-foreground">
            報名學生
          </h3>
          <button
            type="button"
            onClick={() => append(createDefaultStudent(fields.length))}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-gold hover:text-gold"
          >
            <Plus className="h-4 w-4" />
            新增學生
          </button>
        </div>

        {errors.students?.message ? (
          <p className="mt-2 text-sm text-red-600">{errors.students.message}</p>
        ) : null}

        <div className="mt-5 space-y-5">
          {fields.map((field, index) => (
            <StudentRegistrationCard
              key={field.id}
              index={index}
              canRemove={fields.length > 1}
              onRemove={() => remove(index)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
