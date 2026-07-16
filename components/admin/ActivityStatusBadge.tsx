type ActivityStatusBadgeProps = {
  isOpen: boolean;
  className?: string;
};

export function ActivityStatusBadge({ isOpen, className }: ActivityStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        isOpen ? "bg-emerald-50 text-emerald-700" : "bg-surface text-muted"
      } ${className ?? ""}`}
    >
      {isOpen ? "開放報名" : "未開放"}
    </span>
  );
}
