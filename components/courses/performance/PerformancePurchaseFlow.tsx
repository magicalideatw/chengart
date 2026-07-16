"use client";

import { useRef } from "react";
import { ActivityDetailsSection } from "@/components/courses/ActivityDetailsSection";
import { ActivityRulesSection } from "@/components/courses/registration/ActivityRulesSection";
import { canShowInternalPurchaseForm } from "@/lib/courses/activity-status";
import type { CourseWithEnrollment } from "@/lib/courses/types";
import type { TicketTypeRecord } from "@/lib/ticket-types/types";
import { PerformancePurchaseForm } from "./PerformancePurchaseForm";
import { PerformancePurchaseHero } from "./PerformancePurchaseHero";

type PerformancePurchaseFlowProps = {
  course: CourseWithEnrollment;
  ticketTypes: TicketTypeRecord[];
};

export function PerformancePurchaseFlow({
  course,
  ticketTypes,
}: PerformancePurchaseFlowProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const showPurchaseForm =
    canShowInternalPurchaseForm({
      isOpen: course.isOpen,
      participationMethod: course.participationMethod,
    }) && ticketTypes.length > 0;

  return (
    <>
      <PerformancePurchaseHero
        course={course}
        onPurchase={() =>
          formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      />

      <ActivityDetailsSection content={course.courseDetails} />
      <ActivityRulesSection activityRules={course.activityRules} title="入場規則" />

      {showPurchaseForm ? (
        <div ref={formRef} id="purchase" className="scroll-mt-20">
          <PerformancePurchaseForm course={course} ticketTypes={ticketTypes} />
        </div>
      ) : canShowInternalPurchaseForm({
          isOpen: course.isOpen,
          participationMethod: course.participationMethod,
        }) ? (
        <section className="mx-auto max-w-3xl px-5 py-10 md:px-8">
          <div className="rounded-3xl border border-border bg-white p-6 text-center text-sm text-muted shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:p-8">
            票種尚未開放，請稍後再試。
          </div>
        </section>
      ) : null}
    </>
  );
}
