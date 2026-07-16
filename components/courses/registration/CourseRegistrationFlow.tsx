"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { createRegistrationOrder } from "@/lib/actions/payment";
import { formatFee, formatSessionDate } from "@/lib/admin/format";
import { isCourseRegistrationOpen } from "@/lib/courses/enrollment";
import { isInternalParticipation } from "@/lib/courses/participation-method";
import {
  resolveActiveRegistrationType,
  type ActiveRegistrationType,
} from "@/lib/courses/registration-mode";
import type { CourseWithEnrollment } from "@/lib/courses/types";
import type { PaymentMethod } from "@/lib/payment/types";
import {
  resolveAvailablePaymentMethods,
  resolveDefaultPaymentMethod,
} from "@/lib/payment/types";
import {
  calculateRegistrationPricing,
  courseToPricingRules,
} from "@/lib/pricing/engine";
import type { PromoCodeRecord } from "@/lib/pricing/types";
import type { CourseRegistrationPlan } from "@/lib/registration/queries";
import { countRegistrationSessionSlots } from "@/lib/registration/pricing";
import type { RegistrationOrderFormValues } from "@/lib/validation/registration-schema";
import {
  adultFormSchema,
  adultFormToOrderData,
  defaultAdultFormValues,
  defaultParentFormValues,
  parentFormSchema,
  parentFormToOrderData,
  type AdultFormValues,
  type ParentFormValues,
} from "@/lib/validation/registration-schema";
import { CourseRegistrationHero } from "./CourseRegistrationHero";
import { CourseDetailsSection } from "./CourseDetailsSection";
import { ActivityRulesSection } from "./ActivityRulesSection";
import { StepIndicator, StepHeader } from "./StepIndicator";
import { ParentStudentFormStep } from "./ParentStudentFormStep";
import { AdultRegistrationFormStep } from "./AdultRegistrationFormStep";
import { RegistrationTypePicker } from "./RegistrationTypePicker";
import { ConfirmStep } from "./ConfirmStep";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { RegistrationPriceSummary } from "./RegistrationPriceSummary";

type CourseRegistrationFlowProps = {
  course: CourseWithEnrollment;
  plan: CourseRegistrationPlan;
  hasPromoCodes?: boolean;
};

const steps = ["填寫報名資料", "確認並付款"];

export function CourseRegistrationFlow({
  course,
  plan,
  hasPromoCodes = false,
}: CourseRegistrationFlowProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const isSubmittingOrderRef = useRef(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedType, setSelectedType] = useState<ActiveRegistrationType | null>(null);
  const [confirmData, setConfirmData] = useState<RegistrationOrderFormValues | null>(null);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [appliedPromoRecord, setAppliedPromoRecord] = useState<PromoCodeRecord | null>(
    null,
  );
  const router = useRouter();

  const usesSessions = plan.usesSessions;
  const pricingRules = useMemo(() => courseToPricingRules(course), [course]);
  const isFreeCourse = pricingRules.pricePerStudent <= 0;

  const activeType = resolveActiveRegistrationType({
    registrationMode: course.registrationMode,
    selectedType,
  });

  const canRegister =
    isInternalParticipation(course.participationMethod) &&
    isCourseRegistrationOpen({
      course,
      usesSessions,
      hasSelectableSessions: plan.hasSelectableSessions,
    });

  const parentMethods = useForm<ParentFormValues>({
    resolver: zodResolver(parentFormSchema),
    defaultValues: defaultParentFormValues,
    mode: "onTouched",
  });

  const adultMethods = useForm<AdultFormValues>({
    resolver: zodResolver(adultFormSchema),
    defaultValues: defaultAdultFormValues,
    mode: "onTouched",
  });

  const watchedParentStudents = useWatch({
    control: parentMethods.control,
    name: "students",
    defaultValue: defaultParentFormValues.students,
  });
  const watchedParentEmail = useWatch({
    control: parentMethods.control,
    name: "email",
    defaultValue: defaultParentFormValues.email,
  });
  const watchedAdultEmail = useWatch({
    control: adultMethods.control,
    name: "email",
    defaultValue: defaultAdultFormValues.email,
  });
  const watchedAdultSessions = useWatch({
    control: adultMethods.control,
    name: "sessionIds",
    defaultValue: defaultAdultFormValues.sessionIds,
  });

  const contactEmail =
    activeType === "adult" ? watchedAdultEmail : watchedParentEmail;

  const studentCount =
    !activeType ? 0 : activeType === "adult" ? 1 : watchedParentStudents.length;

  const pricingStudents =
    !activeType
      ? []
      : activeType === "adult"
        ? [{ sessionIds: watchedAdultSessions ?? [] }]
        : watchedParentStudents.map((student) => ({
            sessionIds: student.sessionIds ?? [],
          }));

  const sessionSlotCount = countRegistrationSessionSlots(pricingStudents, {
    usesSessions,
  });

  const pricing = calculateRegistrationPricing({
    course: pricingRules,
    studentCount,
    sessionSlotCount,
    promoCode: appliedPromoRecord,
  });

  const totalAmount = pricing.total;

  const availablePaymentMethods = useMemo(
    () =>
      resolveAvailablePaymentMethods({
        allowedMethods: course.allowedPaymentMethods,
        totalAmount,
      }),
    [course.allowedPaymentMethods, totalAmount],
  );

  const defaultPaymentMethod = useMemo(
    () => resolveDefaultPaymentMethod(availablePaymentMethods),
    [availablePaymentMethods],
  );

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    defaultPaymentMethod,
  );

  const activePaymentMethod = paymentMethod ?? defaultPaymentMethod;

  const buildOrderFormData = (): RegistrationOrderFormValues | null => {
    if (!activeType) return null;

    if (activeType === "adult") {
      return adultFormToOrderData(adultMethods.getValues(), "adult");
    }

    return parentFormToOrderData(parentMethods.getValues());
  };

  const handlePromoApplied = (
    code: string | null,
    promo: PromoCodeRecord | null,
  ) => {
    setAppliedPromoCode(code);
    setAppliedPromoRecord(promo);
  };

  const handleNextFromForm = async () => {
    if (!activeType) {
      setErrorMessage("請先選擇報名方式");
      return;
    }

    setErrorMessage(null);

    const valid =
      activeType === "adult"
        ? await adultMethods.trigger()
        : await parentMethods.trigger();

    if (!valid) return;

    if (usesSessions) {
      const orderData = buildOrderFormData();
      const missingSessions = orderData?.students.some(
        (student) => (student.sessionIds?.length ?? 0) === 0,
      );
      if (missingSessions) {
        setErrorMessage("請至少選擇一堂上課日期");
        return;
      }
    }

    const orderData = buildOrderFormData();
    if (!orderData) return;

    setConfirmData({
      ...orderData,
      promoCode: appliedPromoCode ?? undefined,
      pricingSnapshot: pricing,
    });
    setPaymentMethod((current) => current ?? defaultPaymentMethod);
    setShowConfirm(true);

    setTimeout(() => {
      document.getElementById("step-confirm")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const submitLabel = useMemo(() => {
    if (!activePaymentMethod) return "確認報名";
    if (activePaymentMethod === "free") return "完成報名";
    if (activePaymentMethod === "bank_transfer") return "確認報名並查看匯款資訊";
    return "前往信用卡付款";
  }, [activePaymentMethod]);

  const handleConfirmRegistration = () => {
    if (isPending || isSubmittingOrderRef.current || !confirmData) return;
    if (!activePaymentMethod) {
      setErrorMessage("請選擇付款方式");
      return;
    }

    setErrorMessage(null);
    isSubmittingOrderRef.current = true;

    startTransition(async () => {
      try {
        const result = await createRegistrationOrder({
          courseId: course.id,
          formData: {
            ...confirmData,
            paymentMethod: activePaymentMethod,
            promoCode: appliedPromoCode ?? undefined,
            pricingSnapshot: pricing,
          },
          paymentMethod: activePaymentMethod,
        });

        if (result.success) {
          router.push(result.redirectPath);
          return;
        }

        setErrorMessage(result.error);
      } finally {
        isSubmittingOrderRef.current = false;
      }
    });
  };

  const currentStep = showConfirm ? 2 : 1;
  const needsTypeSelection = course.registrationMode === "both" && !activeType;
  const showPriceSummary = !needsTypeSelection && studentCount > 0 && !isFreeCourse;

  const summaryProps = {
    pricing,
    showPromoInput: hasPromoCodes && !isFreeCourse,
    courseId: course.id,
    email: contactEmail,
    appliedPromoCode,
    onPromoApplied: handlePromoApplied,
  };

  return (
    <>
      <CourseRegistrationHero
        course={course}
        plan={plan}
        onRegister={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        registrationMode={course.registrationMode}
      />

      <CourseDetailsSection courseDetails={course.courseDetails} />
      <ActivityRulesSection activityRules={course.activityRules} />

      {canRegister && (
        <div ref={formRef} id="register" className="scroll-mt-20">
          <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24 md:px-8">
            <StepIndicator steps={steps} currentStep={currentStep} />

            <div className="mt-12">
              {!showConfirm ? (
                <div
                  className={
                    showPriceSummary
                      ? "grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px]"
                      : "space-y-8"
                  }
                >
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <StepHeader step={1} title="填寫報名資料" />

                    {course.registrationMode === "both" ? (
                      <div className="mt-8">
                        <RegistrationTypePicker
                          value={selectedType}
                          onChange={setSelectedType}
                        />
                      </div>
                    ) : null}

                    {needsTypeSelection ? null : activeType === "adult" ? (
                      <FormProvider {...adultMethods}>
                        <AdultRegistrationFormStep
                          usesSessions={usesSessions}
                          classes={plan.classes}
                        />
                      </FormProvider>
                    ) : activeType === "parent" ? (
                      <FormProvider {...parentMethods}>
                        <ParentStudentFormStep
                          usesSessions={usesSessions}
                          classes={plan.classes}
                        />
                      </FormProvider>
                    ) : null}

                    {!needsTypeSelection ? (
                      <button
                        type="button"
                        onClick={handleNextFromForm}
                        className="mt-8 w-full rounded-full bg-foreground px-6 py-3.5 text-sm font-medium text-white transition hover:bg-foreground/90 sm:w-auto"
                      >
                        確認資料
                      </button>
                    ) : null}
                  </motion.div>

                  {showPriceSummary ? (
                    <RegistrationPriceSummary {...summaryProps} />
                  ) : null}
                </div>
              ) : confirmData ? (
                <motion.div
                  id="step-confirm"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="scroll-mt-24"
                >
                  <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <div>
                      <StepHeader step={2} title="確認並付款" />
                      <ConfirmStep
                        courseTitle={course.title}
                        dateLabel={
                          usesSessions ? undefined : formatSessionDate(course.sessionDate)
                        }
                        classTime={usesSessions ? undefined : course.sessionTime}
                        feeLabel={formatFee(totalAmount)}
                        totalAmount={totalAmount}
                        usesSessions={usesSessions}
                        classes={plan.classes}
                        formData={confirmData}
                        variant={
                          confirmData.registrationType === "parent" ? "parent" : "adult"
                        }
                        paymentMethod={activePaymentMethod}
                      />

                      <div className="mt-6">
                        <PaymentMethodSelector
                          availableMethods={availablePaymentMethods}
                          value={activePaymentMethod}
                          onChange={setPaymentMethod}
                          totalAmount={totalAmount}
                        />
                      </div>

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
                          disabled={isPending || !activePaymentMethod}
                          className="rounded-full bg-gold px-6 py-4 text-sm font-medium text-white transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isPending ? "處理中…" : submitLabel}
                        </button>
                      </div>
                    </div>

                    <RegistrationPriceSummary {...summaryProps} />
                  </div>
                </motion.div>
              ) : null}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
