export function formatEventDateLabel(
  startDate: string,
  endDate: string | null,
): string {
  const format = (value: string) => value.replace(/-/g, "/");

  if (!endDate || endDate === startDate) {
    return format(startDate);
  }

  return `${format(startDate)} — ${format(endDate)}`;
}
