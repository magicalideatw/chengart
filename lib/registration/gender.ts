import { z } from "zod";

export const GENDER_VALUES = ["male", "female"] as const;

export type GenderValue = (typeof GENDER_VALUES)[number];

export const genderSchema = z.enum(GENDER_VALUES, {
  message: "請選擇性別",
});

export function formatGender(value: string | null | undefined): string {
  if (!value) return "—";

  const normalized = value.trim().toLowerCase();
  if (normalized === "male" || normalized === "男") return "男";
  if (normalized === "female" || normalized === "女") return "女";

  return "—";
}

export function normalizeGenderValue(
  value: string | null | undefined,
): GenderValue | null {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === "male" || normalized === "男") return "male";
  if (normalized === "female" || normalized === "女") return "female";

  return null;
}

export function isGenderValue(value: string): value is GenderValue {
  return GENDER_VALUES.includes(value as GenderValue);
}
