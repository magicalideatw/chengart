const WEEKDAY_SHORT = ["日", "一", "二", "三", "四", "五", "六"] as const;

export function formatSessionCheckboxLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;

  const weekday = WEEKDAY_SHORT[new Date(year, month - 1, day).getDay()];
  return `${month}/${day}（${weekday}）`;
}

/** Performance session card: 2026/08/10（六） */
export function formatPerformanceSessionDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;

  const weekday = WEEKDAY_SHORT[new Date(year, month - 1, day).getDay()];
  return `${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}（${weekday}）`;
}

/** NT$299 or 免費 — never NT$0 */
export function formatSessionDisplayPrice(price: number): string {
  const value = Number.isFinite(price) ? Math.max(0, price) : 0;
  return value > 0 ? `NT$${value.toLocaleString()}` : "免費";
}
