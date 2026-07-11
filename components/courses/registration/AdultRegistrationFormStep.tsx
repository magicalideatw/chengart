"use client";

import { useFormContext } from "react-hook-form";
import type { ClassWithSessionsOption } from "@/lib/registration/queries";
import type { AdultFormValues } from "@/lib/validation/registration-schema";
import { StudentSessionPicker } from "./StudentSessionPicker";

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

type AdultRegistrationFormStepProps = {
  usesSessions: boolean;
  classes: ClassWithSessionsOption[];
};

export function AdultRegistrationFormStep({
  usesSessions,
  classes,
}: AdultRegistrationFormStepProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<AdultFormValues>();

  const selectedSessionIds = watch("sessionIds") ?? [];

  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-3xl border border-border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
        <h3 className="font-display text-lg font-semibold text-foreground">
          報名資料
        </h3>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {(
            [
              { name: "name" as const, label: "姓名", type: "text" },
              { name: "phone" as const, label: "電話", type: "tel" },
              { name: "email" as const, label: "Email", type: "email" },
              { name: "age" as const, label: "年齡", type: "text" },
            ] as const
          ).map((field) => (
            <div
              key={field.name}
              className={field.name === "email" ? "sm:col-span-2" : ""}
            >
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

          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-foreground">
              性別 <span className="text-gold">*</span>
            </p>
            <div className="mt-3 flex gap-4">
              {(["male", "female"] as const).map((value) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                >
                  <input
                    type="radio"
                    value={value}
                    {...register("gender")}
                    className="h-4 w-4 accent-gold"
                  />
                  {value === "male" ? "男" : "女"}
                </label>
              ))}
            </div>
            {errors.gender ? (
              <p className="mt-1 text-xs text-red-600">{errors.gender.message}</p>
            ) : null}
          </div>

          <div className="sm:col-span-2">
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
                    {...register("isFirstTime")}
                    className="h-4 w-4 accent-gold"
                  />
                  {value === "yes" ? "是" : "否"}
                </label>
              ))}
            </div>
            {errors.isFirstTime ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.isFirstTime.message}
              </p>
            ) : null}
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-foreground">備註</label>
            <textarea
              rows={2}
              {...register("note")}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </section>

      {usesSessions ? (
        <section className="rounded-3xl border border-border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
          <h3 className="font-display text-lg font-semibold text-foreground">
            可報名時段
          </h3>
          <div className="mt-4">
            <StudentSessionPicker
              classes={classes}
              selectedSessionIds={selectedSessionIds}
              onChange={(next) =>
                setValue("sessionIds", next, { shouldValidate: true })
              }
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
