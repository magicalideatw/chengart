"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { EventPageData } from "@/lib/events/types";
import {
  canRegister,
  getClosedRegistrationLabel,
} from "@/lib/events/status";
import { getRemainingSpots } from "@/src/data/events";
import { EventStatusBadge } from "@/components/events/EventStatusBadge";

type EventInfoCardProps = {
  event: EventPageData;
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
  const open = canRegister(event.status);
  const buttonText = event.registrationButtonText || "立即報名";
  const hasCapacity = (event.capacity ?? 0) > 0;
  const remaining = hasCapacity ? getRemainingSpots(event) : 0;
  const progress = hasCapacity
    ? ((event.registered ?? 0) / (event.capacity ?? 1)) * 100
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-2xl border border-border bg-white p-6 shadow-sm"
    >
      <EventStatusBadge status={event.status} />

      <div className="mt-5">
        <InfoRow icon="📅" label="活動日期" value={event.dateLabel} />
        <InfoRow icon="🏷️" label="活動類型" value={event.eventType} />
        {event.time ? (
          <InfoRow icon="🕐" label="活動時間" value={event.time} />
        ) : null}
        {event.location ? (
          <InfoRow icon="📍" label="地點" value={event.location} />
        ) : null}
        {event.age ? <InfoRow icon="👦" label="適合" value={event.age} /> : null}
        {hasCapacity ? (
          <>
            <InfoRow icon="👥" label="名額" value={`${event.capacity} 位`} />
            <InfoRow icon="✅" label="已報名" value={`${event.registered} 位`} />
          </>
        ) : null}
      </div>

      {hasCapacity ? (
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
      ) : null}

      {event.price ? (
        <p className="mt-5 text-sm text-muted">
          費用 <span className="font-medium text-foreground">{event.price}</span>
        </p>
      ) : null}

      {open && event.registrationUrl ? (
        <Link
          href={event.registrationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex w-full items-center justify-center rounded-full bg-foreground py-3.5 text-sm font-medium text-white transition hover:bg-foreground/90"
        >
          {buttonText}
        </Link>
      ) : open ? (
        <Link
          href="#register"
          className="mt-6 flex w-full items-center justify-center rounded-full bg-foreground py-3.5 text-sm font-medium text-white transition hover:bg-foreground/90"
        >
          {buttonText}
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="mt-6 w-full cursor-not-allowed rounded-full bg-surface py-3.5 text-sm font-medium text-mist"
        >
          {getClosedRegistrationLabel(event.status)}
        </button>
      )}
    </motion.div>
  );
}
