import type { ReactNode } from "react";
import { Clock } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { spaceRentalContent } from "@/lib/data/space-rental";

function formatPrice(amount: number): string {
  return `NT$${amount.toLocaleString("zh-TW")}`;
}

type PricingPlan = (typeof spaceRentalContent.pricing.plans)[number];

function PricingRateBlock({
  label,
  slotPrice,
  fullPrice,
}: {
  label: string;
  slotPrice: number;
  fullPrice: number;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gold">
        {label}
      </p>
      <dl className="mt-2 space-y-1.5 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted">A／B／C 時段</dt>
          <dd className="font-medium text-foreground">{formatPrice(slotPrice)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted">全日</dt>
          <dd className="font-medium text-foreground">{formatPrice(fullPrice)}</dd>
        </div>
      </dl>
    </div>
  );
}

function formatTimeSlotLine(
  slot: (typeof spaceRentalContent.pricing.timeSlots)[number],
): string {
  const shortLabel =
    slot.id === "full" ? "全日" : slot.label.replace(" 時段", "");
  return `${shortLabel}｜${slot.time}`;
}

function PricingTimeSlotsOverview() {
  const { timeSlots, timeSlotsTitle } = spaceRentalContent.pricing;

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface px-5 py-4 text-center sm:px-6 sm:py-5">
      <p className="text-sm font-semibold text-foreground">{timeSlotsTitle}</p>
      <ul className="mt-3 space-y-1 text-sm text-muted">
        {timeSlots.map((slot) => (
          <li key={slot.id}>{formatTimeSlotLine(slot)}</li>
        ))}
      </ul>
    </div>
  );
}

function formatHourlyPrice(amount: number): string {
  return `NT$${amount.toLocaleString("zh-TW")}／小時`;
}

function PricingHourlyBlock({ plan }: { plan: PricingPlan }) {
  const { hourlyPricingLabel } = spaceRentalContent.pricing;

  return (
    <div className="mt-6 border-t border-border/60 pt-4">
      <p className="flex items-center gap-1.5 text-xs text-mist">
        <Clock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
        {hourlyPricingLabel}
      </p>
      <dl className="mt-2 space-y-1 text-xs text-mist">
        <div className="flex items-baseline justify-between gap-3">
          <dt>平日</dt>
          <dd>{formatHourlyPrice(plan.weekday.hourly)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt>假日</dt>
          <dd>{formatHourlyPrice(plan.holiday.hourly)}</dd>
        </div>
      </dl>
    </div>
  );
}

function PricingPlanCard({ plan }: { plan: PricingPlan }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-border/60 bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <h3 className="font-display text-lg font-semibold leading-snug text-foreground">
        {plan.title}
      </h3>
      <p className="mt-2 text-sm text-muted">（{plan.audience}）</p>

      <div className="mt-6 space-y-5 border-t border-border pt-5">
        <PricingRateBlock
          label="平日"
          slotPrice={plan.weekday.slot}
          fullPrice={plan.weekday.full}
        />
        <PricingRateBlock
          label="假日"
          slotPrice={plan.holiday.slot}
          fullPrice={plan.holiday.full}
        />
      </div>

      <PricingHourlyBlock plan={plan} />
    </article>
  );
}

function PricingInfoBox({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-5 py-4 sm:px-6 sm:py-5">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <div className="mt-2 text-sm leading-relaxed text-muted">{children}</div>
    </div>
  );
}

export function SpacePricingSection() {
  const { pricing } = spaceRentalContent;

  return (
    <section className="bg-white py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <SectionHeader
            label={pricing.label}
            title={pricing.title}
            description={pricing.description}
            align="center"
          />
        </FadeIn>

        <FadeIn className="mt-10 sm:mt-14" delay={0.06}>
          <PricingTimeSlotsOverview />
        </FadeIn>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {pricing.plans.map((plan, index) => (
            <FadeIn key={plan.id} delay={0.08 + index * 0.04}>
              <PricingPlanCard plan={plan} />
            </FadeIn>
          ))}
        </div>

        <FadeIn className="mx-auto mt-8 max-w-3xl space-y-4 sm:mt-10" delay={0.2}>
          <PricingInfoBox title={pricing.promoNotice.title}>
            <p>{pricing.promoNotice.description}</p>
          </PricingInfoBox>

          <PricingInfoBox title={pricing.rentalNotice.title}>
            <ul className="space-y-1.5">
              {pricing.rentalNotice.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </PricingInfoBox>
        </FadeIn>
      </div>
    </section>
  );
}
