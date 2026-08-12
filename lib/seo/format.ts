/** Combine YYYY-MM-DD date and HH:mm time into ISO 8601 with Taiwan offset. */
export function toIsoDateTime(
  date?: string | null,
  time?: string | null,
): string | undefined {
  if (!date?.trim()) return undefined;

  const timeValue = time?.trim() || "00:00";
  const normalized =
    timeValue.length === 5 ? `${timeValue}:00` : timeValue.slice(0, 8);

  return `${date}T${normalized}+08:00`;
}

export function truncateDescription(
  value: string,
  maxLength = 160,
): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trim()}…`;
}
