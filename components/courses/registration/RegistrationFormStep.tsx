"use client";

import { useFormContext } from "react-hook-form";
import type { RegistrationFormValues } from "@/lib/validation/registration-schema";

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

export function RegistrationFormStep() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<RegistrationFormValues>();

  const isFirstTime = watch("isFirstTime");

  return (
    <div className="mt-8 space-y-5">
      {(
        [
          { name: "name" as const, label: "姓名", type: "text" },
          { name: "phone" as const, label: "電話", type: "tel" },
          { name: "email" as const, label: "Email", type: "email" },
          { name: "studentName" as const, label: "學員姓名", type: "text" },
          { name: "studentAge" as const, label: "年齡", type: "text" },
        ] as const
      ).map((field) => (
        <div key={field.name}>
          <label htmlFor={field.name} className="text-sm font-medium text-foreground">
            {field.label} <span className="text-gold">*</span>
          </label>
          <input
            id={field.name}
            type={field.type}
            {...register(field.name)}
            className={inputClass}
          />
          {errors[field.name] && (
            <p className="mt-1 text-xs text-red-600">{errors[field.name]?.message}</p>
          )}
        </div>
      ))}

      <div>
        <p className="text-sm font-medium text-foreground">
          是否第一次參加 <span className="text-gold">*</span>
        </p>
        <div className="mt-3 flex gap-4">
          {(["yes", "no"] as const).map((value) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
            >
              <input
                type="radio"
                value={value}
                checked={isFirstTime === value}
                onChange={() => setValue("isFirstTime", value, { shouldValidate: true })}
                className="h-4 w-4 accent-gold"
              />
              {value === "yes" ? "是" : "否"}
            </label>
          ))}
        </div>
        {errors.isFirstTime && (
          <p className="mt-1 text-xs text-red-600">{errors.isFirstTime.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="note" className="text-sm font-medium text-foreground">
          備註
        </label>
        <textarea
          id="note"
          rows={3}
          {...register("note")}
          className={`${inputClass} resize-none`}
        />
      </div>
    </div>
  );
}
