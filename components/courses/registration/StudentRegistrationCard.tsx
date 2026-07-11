"use client";

import { useFormContext } from "react-hook-form";
import { Trash2 } from "lucide-react";
import type { ClassWithSessionsOption } from "@/lib/registration/queries";
import type { ParentFormValues } from "@/lib/validation/registration-schema";
import { StudentSessionPicker } from "./StudentSessionPicker";

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

type StudentRegistrationCardProps = {
  index: number;
  usesSessions: boolean;
  classes: ClassWithSessionsOption[];
  canRemove: boolean;
  onRemove: () => void;
};

export function StudentRegistrationCard({
  index,
  usesSessions,
  classes,
  canRemove,
  onRemove,
}: StudentRegistrationCardProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ParentFormValues>();

  const selectedSessionIds = watch(`students.${index}.sessionIds`) ?? [];
  const studentErrors = errors.students?.[index];

  return (
    <article className="rounded-3xl border border-border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <h4 className="font-display text-base font-semibold text-foreground">
          學生 {index + 1}
        </h4>
        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-red-600 transition hover:border-red-200 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            移除
          </button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-foreground">
            學生姓名 <span className="text-gold">*</span>
          </label>
          <input
            {...register(`students.${index}.studentName`)}
            className={inputClass}
          />
          {studentErrors?.studentName ? (
            <p className="mt-1 text-xs text-red-600">
              {studentErrors.studentName.message}
            </p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">
            年齡 <span className="text-gold">*</span>
          </label>
          <input
            {...register(`students.${index}.studentAge`)}
            className={inputClass}
          />
          {studentErrors?.studentAge ? (
            <p className="mt-1 text-xs text-red-600">
              {studentErrors.studentAge.message}
            </p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">性別</label>
          <select
            {...register(`students.${index}.gender`)}
            className={inputClass}
          >
            <option value="">不填</option>
            <option value="male">男</option>
            <option value="female">女</option>
            <option value="other">其他</option>
          </select>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">是否第一次參加</p>
          <div className="mt-3 flex gap-4">
            {(["yes", "no"] as const).map((value) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
              >
                <input
                  type="radio"
                  value={value}
                  {...register(`students.${index}.isFirstTime`)}
                  className="h-4 w-4 accent-gold"
                />
                {value === "yes" ? "是" : "否"}
              </label>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-foreground">備註</label>
          <textarea
            rows={2}
            {...register(`students.${index}.note`)}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {usesSessions ? (
        <div className="mt-6 border-t border-border pt-6">
          <p className="mb-4 text-sm font-medium text-foreground">可報名時段</p>
          <StudentSessionPicker
            classes={classes}
            selectedSessionIds={selectedSessionIds}
            onChange={(next) =>
              setValue(`students.${index}.sessionIds`, next, {
                shouldValidate: true,
              })
            }
          />
        </div>
      ) : null}
    </article>
  );
}
