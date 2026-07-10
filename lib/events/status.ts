import type { EventStatus } from "@/lib/events/constants";

export function canRegister(status: EventStatus): boolean {
  return status === "招生中" || status === "即將開始";
}

export function getClosedRegistrationLabel(status: EventStatus): string {
  switch (status) {
    case "已額滿":
      return "已額滿";
    case "已結束":
      return "已結束";
    case "演出中":
      return "演出進行中";
    default:
      return "無法報名";
  }
}

export function getStatusConfig(status: EventStatus) {
  const configs: Record<EventStatus, { label: string; className: string }> = {
    招生中: { label: "招生中", className: "bg-emerald-50 text-emerald-700" },
    即將開始: { label: "即將開始", className: "bg-amber-50 text-amber-700" },
    演出中: { label: "演出中", className: "bg-blue-50 text-blue-700" },
    已額滿: { label: "已額滿", className: "bg-red-50 text-red-700" },
    已結束: { label: "已結束", className: "bg-neutral-100 text-neutral-600" },
  };
  return configs[status];
}
