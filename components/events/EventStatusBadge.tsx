import type { EventStatus } from "@/lib/events/constants";
import { getStatusConfig } from "@/lib/events/status";

type EventStatusBadgeProps = {
  status: EventStatus;
  className?: string;
};

export function EventStatusBadge({ status, className = "" }: EventStatusBadgeProps) {
  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}
