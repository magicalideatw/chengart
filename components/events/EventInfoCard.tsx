"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Event } from "@/src/data/events";
import {
  canRegister,
  getDisplayStatus,
  getRemainingSpots,
  getStatusConfig,
} from "@/src/data/events";

type EventInfoCardProps = {
  event: Event;
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-border py-4 last:border-b-0">
      <p className="text-xs text-muted">
        {icon} {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export function EventInfoCard({ event }: EventInfoCardProps) {
  const displayStatus = getDisplayStatus(event);
  const statusConfig = getStatusConfig(displayStatus);
  const remaining = getRemainingSpots(event);
  const progress = (event.registered / event.capacity) * 100;
  const isAlmostFull = remaining > 0 && remaining <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-2xl border border-border bg-white p-6 shadow-sm"
    >
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusConfig.className}`}
      >
        {statusConfig.emoji} {statusConfig.label}
      </span>

      {isAlmostFull && (
        <p className="mt-3 text-sm font-medium text-amber-600">
          🔥 即將額滿
        </p>
      )}

      <div className="mt-5">
        <InfoRow icon="📅" label="上課日期" value={event.date} />
        <InfoRow icon="🕐" label="上課時間" value={event.time} />
        <InfoRow icon="📍" label="地點" value={event.location} />
        <InfoRow icon="👦" label="適合" value={event.age} />
        <InfoRow icon="👥" label="名額" value={`${event.capacity} 位`} />
        <InfoRow icon="✅" label="已報名" value={`${event.registered} 位`} />
      </div>

      <div className="mt-6 border-t border-border pt-6">
        <p className="text-xs text-muted">🔥 剩餘名額</p>
        <p className="mt-1 font-display text-4xl font-semibold text-foreground">
          {remaining}
          <span className="ml-1 text-lg font-normal text-muted">位</span>
        </p>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="h-full rounded-full bg-gold"
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          {event.registered} / {event.capacity}
        </p>
      </div>

      <p className="mt-5 text-sm text-muted">
        費用 <span className="font-medium text-foreground">{event.price}</span>
      </p>

      {canRegister(event) ? (
        <Link
          href="#register"
          className="mt-6 flex w-full items-center justify-center rounded-full bg-foreground py-3.5 text-sm font-medium text-white transition hover:bg-foreground/90"
        >
          立即報名
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="mt-6 w-full cursor-not-allowed rounded-full bg-surface py-3.5 text-sm font-medium text-mist"
        >
          已額滿
        </button>
      )}
    </motion.div>
  );
}
