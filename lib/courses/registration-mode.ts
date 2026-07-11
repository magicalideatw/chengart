export const REGISTRATION_MODES = ["adult", "parent", "both"] as const;

export type RegistrationMode = (typeof REGISTRATION_MODES)[number];

export type ActiveRegistrationType = "adult" | "parent";

export const REGISTRATION_MODE_LABELS: Record<RegistrationMode, string> = {
  adult: "成人個人報名",
  parent: "家長代學生報名",
  both: "兩種皆可",
};

export const ACTIVE_REGISTRATION_TYPE_LABELS: Record<
  ActiveRegistrationType,
  string
> = {
  adult: "成人本人",
  parent: "家長代學生",
};

export function parseRegistrationMode(value: unknown): RegistrationMode {
  if (value === "adult" || value === "parent" || value === "both") {
    return value;
  }
  return "adult";
}

export function resolveActiveRegistrationType(input: {
  registrationMode: RegistrationMode;
  selectedType?: ActiveRegistrationType | null;
}): ActiveRegistrationType | null {
  if (input.registrationMode === "adult") return "adult";
  if (input.registrationMode === "parent") return "parent";
  return input.selectedType ?? null;
}
