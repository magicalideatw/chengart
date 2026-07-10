const WEEKDAY_SHORT = ["日", "一", "二", "三", "四", "五", "六"] as const;

export function formatSessionCheckboxLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;

  const weekday = WEEKDAY_SHORT[new Date(year, month - 1, day).getDay()];
  return `${month}/${day}（${weekday}）`;
}
