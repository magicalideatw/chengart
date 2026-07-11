"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { createRegistrationOrder } from "@/lib/actions/payment";
import { formatFee, formatSessionDate } from "@/lib/admin/format";
import type { CourseWithEnrollment } from "@/lib/courses/types";
import type { CourseRegistrationPlan } from "@/lib/registration/queries";
import {
  registrationFormSchema,
  type RegistrationFormValues,
} from "@/lib/validation/registration-schema";
import { CourseRegistrationHero } from "./CourseRegistrationHero";
import { StepIndicator, StepHeader } from "./StepIndicator";
import { RegistrationFormStep } from "./RegistrationFormStep";
import { ConfirmStep } from "./ConfirmStep";
import { SessionSelectionPanel } from "./SessionSelectionPanel";

type CourseRegistrationFlowProps = {
  course: CourseWithEnrollment;
  plan: CourseRegistrationPlan;
};

const defaultValues: RegistrationFormValues = {
  name: "",
  phone: "",
  email: "",
  studentName: "",
  studentAge: "",
  isFirstTime: "yes",
  note: "",
};

const legacySteps = ["填寫資料", "確認並付款"];
const sessionSteps = ["選擇上課日期", "填寫資料", "確認並付款"];

export function CourseRegistrationFlow({ course, plan }: CourseRegistrationFlowProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const selectedSessionIdsRef = useRef<string[]>([]);
  const isSubmittingOrderRef = useRef(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(!plan.usesSessions);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const usesSessions = plan.usesSessions;
  const steps = usesSessions ? sessionSteps : legacySteps;

  const canRegister = usesSessions
    ? course.isOpen && plan.hasSelectableSessions
    : course.isOpen && !course.isFull;

  const methods = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues,
    mode: "onTouched",
  });

  const sessionPriceMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of plan.classes) {
      for (const session of item.sessions) {
        map.set(session.id, item.unitPrice);
      }
    }
    return map;
  }, [plan.classes]);

  const totalAmount = useMemo(
    () =>
      selectedSessionIds.reduce(
        (sum, sessionId) => sum + (sessionPriceMap.get(sessionId) ?? plan.defaultUnitPrice),
        0,
      ),
    [selectedSessionIds, sessionPriceMap, plan.defaultUnitPrice],
  );

  const unitPriceLabel = useMemo(() => {
    if (selectedSessionIds.length === 0) {
      const prices = [...new Set(plan.classes.map((item) => item.unitPrice))];
      return prices.length === 1 ? formatFee(prices[0]) : "依班別計價";
    }

    const prices = selectedSessionIds.map(
      (sessionId) => sessionPriceMap.get(sessionId) ?? plan.defaultUnitPrice,
    );
    const uniquePrices = [...new Set(prices)];
    return uniquePrices.length === 1 ? formatFee(uniquePrices[0]) : "依班別計價";
  }, [selectedSessionIds, sessionPriceMap, plan.classes, plan.defaultUnitPrice]);

  const selectedSessionSummaries = useMemo(() => {
    return plan.classes.flatMap((item) =>
      item.sessions
        .filter((session) => selectedSessionIds.includes(session.id))
        .map(
          (session) =>
            `${item.class.name} ${session.date} ${session.startTime}~${session.endTime}`,
        ),
    );
  }, [plan.classes, selectedSessionIds]);

  const scrollToForm = useCallback(() => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const toggleSession = useCallback((sessionId: string) => {
    setSelectedSessionIds((current) => {
      const next = current.includes(sessionId)
        ? current.filter((id) => id !== sessionId)
        : [...current, sessionId];
      selectedSessionIdsRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    selectedSessionIdsRef.current = selectedSessionIds;
  }, [selectedSessionIds]);

  const handleStartRegistration = () => {
    if (usesSessions && selectedSessionIds.length === 0) return;
    setShowForm(true);
    setShowConfirm(false);
    setErrorMessage(null);
    setTimeout(scrollToForm, 100);
  };

  const handleNextFromForm = methods.handleSubmit(() => {
    setShowConfirm(true);
    setErrorMessage(null);
    setTimeout(() => {
      document.getElementById("step-confirm")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  });

  const handleConfirmRegistration = () => {
    if (isPending || isSubmittingOrderRef.current) return;

    setErrorMessage(null);

    const sessionIds = usesSessions ? [...selectedSessionIdsRef.current] : [];

    if (usesSessions && sessionIds.length === 0) {
      setErrorMessage("請至少選擇一堂上課日期");
      return;
    }

    isSubmittingOrderRef.current = true;

    startTransition(async () => {
      try {
        const result = await createRegistrationOrder({
          courseId: course.id,
          formData: {
            ...methods.getValues(),
            sessionIds: usesSessions ? sessionIds : undefined,
          },
          sessionIds: usesSessions ? sessionIds : undefined,
        });

        if (result.success) {
          router.push(result.checkoutPath);
          return;
        }

        setErrorMessage(result.error);
      } finally {
        isSubmittingOrderRef.current = false;
      }
    });
  };

  const formData = methods.watch();
  const currentStep = showConfirm ? steps.length : showForm ? (usesSessions ? 2 : 1) : 1;

  return (
    <>
      <CourseRegistrationHero
        course={course}
        plan={plan}
        onRegister={usesSessions ? handleStartRegistration : scrollToForm}
        canRegister={canRegister}
        selectedCount={selectedSessionIds.length}
      />

      {usesSessions && canRegister && (
        <section className="mx-auto max-w-5xl px-5 py-12 md:px-8">
          <StepHeader step={1} title="選擇上課日期" />
          <SessionSelectionPanel
            classes={plan.classes}
            selectedSessionIds={selectedSessionIds}
            onToggleSession={toggleSession}
            unitPriceLabel={unitPriceLabel}
            totalAmount={totalAmount}
            onRegister={handleStartRegistration}
            canRegister={canRegister}
          />
        </section>
      )}

      {canRegister && showForm && (
        <div ref={formRef} id="register" className="scroll-mt-20">
          <section className="mx-auto max-w-3xl px-5 py-16 sm:py-24 md:px-8">
            <StepIndicator steps={steps} currentStep={currentStep} />

            <FormProvider {...methods}>
              <div className="mt-12 space-y-16">
                {!showConfirm && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <StepHeader
                      step={usesSessions ? 2 : 1}
                      title="填寫資料"
                    />
                    <RegistrationFormStep />
                    <button
                      type="button"
                      onClick={handleNextFromForm}
                      className="mt-8 w-full rounded-full bg-foreground px-6 py-3.5 text-sm font-medium text-white transition hover:bg-foreground/90 sm:w-auto"
                    >
                      確認資料
                    </button>
                  </motion.div>
                )}

                {showConfirm && (
                  <motion.div
                    id="step-confirm"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="scroll-mt-24"
                  >
                    <StepHeader step={steps.length} title="確認並付款" />
                    <ConfirmStep
                      dateLabel={
                        usesSessions
                          ? undefined
                          : formatSessionDate(course.sessionDate)
                      }
                      className={course.title}
                      classTime={usesSessions ? undefined : course.sessionTime}
                      feeLabel={
                        usesSessions ? formatFee(totalAmount) : formatFee(course.fee)
                      }
                      sessionSummaries={
                        usesSessions ? selectedSessionSummaries : undefined
                      }
                      formData={formData}
                    />

                    {errorMessage && (
                      <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errorMessage}
                      </p>
                    )}

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setShowConfirm(false)}
                        className="rounded-full border border-border px-6 py-4 text-sm font-medium text-foreground transition hover:bg-surface"
                      >
                        返回修改
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmRegistration}
                        disabled={isPending}
                        className="rounded-full bg-gold px-6 py-4 text-sm font-medium text-white transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isPending ? "建立訂單中…" : "前往綠界付款"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </FormProvider>
          </section>
        </div>
      )}
    </>
  );
}
