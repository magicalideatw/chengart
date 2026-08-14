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
  resolveDefaultCheckoutPaymentMethod,
} from "@/lib/payment/types";
import {
  calculateRegistrationPricing,
  courseToPricingRules,
} from "@/lib/pricing/engine";
import type { PromoCodeRecord } from "@/lib/pricing/types";
import type { CourseRegistrationPlan } from "@/lib/registration/queries";
import { planToLegacyClassOptions } from "@/lib/registration/plan-utils";
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
import { CourseMediaDisplaySection } from "@/components/courses/CourseMediaDisplaySection";
import type { CourseMediaRecord } from "@/lib/media/types";
import { ActivityRulesSection } from "./ActivityRulesSection";
import { StepIndicator, StepHeader } from "./StepIndicator";
import { ParentStudentFormStep } from "./ParentStudentFormStep";
import { AdultRegistrationFormStep } from "./AdultRegistrationFormStep";
import { RegistrationTypePicker } from "./RegistrationTypePicker";
import { ConfirmStep } from "./ConfirmStep";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { RegistrationPriceSummary } from "./RegistrationPriceSummary";
import { CourseSessionRadioPicker } from "./CourseSessionRadioPicker";
import { CoursePlanRadioPicker } from "./CoursePlanRadioPicker";
import { SelfScheduledScheduleNotice } from "./SelfScheduledScheduleNotice";
import { formatCoursePlanLabel } from "@/lib/course-plans/mappers";

type CourseRegistrationFlowProps = {
  course: CourseWithEnrollment;
  plan: CourseRegistrationPlan;
  hasPromoCodes?: boolean;
  mediaItems?: CourseMediaRecord[];
};

const steps = ["填寫報名資料", "確認並付款"];

export function CourseRegistrationFlow({
  course,
  plan,
  hasPromoCodes = false,
  mediaItems = [],
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
  const [selectedCourseSessionId, setSelectedCourseSessionId] = useState<string | null>(
    null,
  );
  const [selectedCoursePlanId, setSelectedCoursePlanId] = useState<string | null>(
    null,
  );
  const router = useRouter();

  const usesSessions = plan.usesSessions;
  const usesCoursePlans = plan.usesCoursePlans;
  const showRegistrationSlots = plan.showRegistrationSlots;
  const registrationSlotOptions = plan.registrationSlotOptions;
  const selectedPlan = useMemo(
    () => plan.coursePlans.find((entry) => entry.id === selectedCoursePlanId) ?? null,
    [plan.coursePlans, selectedCoursePlanId],
  );
  const legacyClassOptions = useMemo(
    () => planToLegacyClassOptions(plan),
    [plan],
  );
  const pricingRules = useMemo(() => courseToPricingRules(course), [course]);
  const isFreeCourse = usesCoursePlans
    ? (selectedPlan?.price ?? 0) <= 0
    : pricingRules.pricePerStudent <= 0;

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

  const sessionSlotCount = usesCoursePlans && selectedPlan
    ? selectedPlan.sessionCount * studentCount
    : countRegistrationSessionSlots(pricingStudents, {
        usesSessions,
      });

  const pricing = calculateRegistrationPricing({
    course: pricingRules,
    studentCount,
    sessionSlotCount,
    promoCode: appliedPromoRecord,
    packagePricePerStudent: usesCoursePlans && selectedPlan ? selectedPlan.price : undefined,
  });

  const totalAmount = pricing.total;

  const defaultPaymentMethod = useMemo(
    () =>
      resolveDefaultCheckoutPaymentMethod({
        allowedMethods: course.allowedPaymentMethods,
        totalAmount,
      }),
    [course.allowedPaymentMethods, totalAmount],
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

    if (usesCoursePlans) {
      if (!selectedPlan) {
        setErrorMessage("請選擇課程方案");
        return;
      }

      const primarySessionId = plan.primarySelfScheduledSessionId;
      if (!primarySessionId) {
        setErrorMessage("此課程尚未設定可報名場次，請聯絡管理員");
        return;
      }

      if (activeType === "adult") {
        adultMethods.setValue("sessionIds", [primarySessionId], {
          shouldValidate: true,
        });
      } else {
        const students = parentMethods.getValues("students");
        students.forEach((_, index) => {
          parentMethods.setValue(`students.${index}.sessionIds`, [primarySessionId], {
            shouldValidate: true,
          });
        });
      }
    } else if (showRegistrationSlots) {
      if (!selectedCourseSessionId) {
        setErrorMessage("請選擇報名時段");
        return;
      }

      if (activeType === "adult") {
        adultMethods.setValue("sessionIds", [selectedCourseSessionId], {
          shouldValidate: true,
        });
      } else {
        const students = parentMethods.getValues("students");
        students.forEach((_, index) => {
          parentMethods.setValue(`students.${index}.sessionIds`, [selectedCourseSessionId], {
            shouldValidate: true,
          });
        });
      }

      const orderData = buildOrderFormData();
      const missingSessions = orderData?.students.some(
        (student) => (student.sessionIds?.length ?? 0) === 0,
      );
      if (missingSessions) {
        setErrorMessage("請選擇報名時段");
        return;
      }
    } else if (usesSessions && plan.primarySelfScheduledSessionId) {
      const primarySessionId = plan.primarySelfScheduledSessionId;
      if (activeType === "adult") {
        adultMethods.setValue("sessionIds", [primarySessionId], {
          shouldValidate: true,
        });
      } else {
        const students = parentMethods.getValues("students");
        students.forEach((_, index) => {
          parentMethods.setValue(`students.${index}.sessionIds`, [primarySessionId], {
            shouldValidate: true,
          });
        });
      }
    }

    const orderData = buildOrderFormData();
    if (!orderData) return;

    setConfirmData({
      ...orderData,
      promoCode: appliedPromoCode ?? undefined,
      pricingSnapshot: pricing,
      ...(usesCoursePlans && selectedPlan
        ? {
            coursePlanId: selectedPlan.id,
            coursePlanName: formatCoursePlanLabel(selectedPlan),
            coursePlanSessionCount: selectedPlan.sessionCount,
          }
        : {}),
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
    if (activePaymentMethod === "on_site") return "確認報名";
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
  const showPriceSummary =
    !needsTypeSelection &&
    studentCount > 0 &&
    !isFreeCourse &&
    (!usesCoursePlans || Boolean(selectedPlan));

  const summaryProps = {
    pricing,
    showPromoInput: hasPromoCodes && !isFreeCourse,
    courseId: course.id,
    email: contactEmail,
    appliedPromoCode,
    onPromoApplied: handlePromoApplied,
    showSessionSlots: usesCoursePlans,
    packagePricePerStudent:
      usesCoursePlans && selectedPlan ? selectedPlan.price : undefined,
  };

  return (
    <>
      <CourseRegistrationHero
        course={course}
        plan={plan}
        onRegister={() => {
          const targetId = plan.showRegistrationSlots ? "registration-slots" : "register";
          document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        registrationMode={course.registrationMode}
      />

      <CourseDetailsSection courseDetails={course.courseDetails} />
      <CourseMediaDisplaySection
        sectionTitle="課程介紹影片"
        mediaItems={mediaItems}
      />
      <ActivityRulesSection activityRules={course.activityRules} />

      {canRegister && showRegistrationSlots ? (
        <section
          id="registration-slots"
          className="mx-auto max-w-6xl scroll-mt-20 px-5 py-10 md:px-8"
        >
          <div className="rounded-3xl border border-border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:p-8">
            <h2 className="font-display text-xl font-semibold text-foreground">
              報名時段
            </h2>
            <p className="mt-2 text-sm text-muted">請選擇您要報名的上課時段</p>
            <div className="mt-5">
              <CourseSessionRadioPicker
                sessions={registrationSlotOptions}
                selectedSessionId={selectedCourseSessionId}
                onChange={setSelectedCourseSessionId}
              />
            </div>
          </div>
        </section>
      ) : null}

      {canRegister && usesCoursePlans ? (
        <section className="mx-auto max-w-6xl px-5 py-10 md:px-8">
          <div className="rounded-3xl border border-border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:p-8">
            <h2 className="font-display text-xl font-semibold text-foreground">
              請選擇課程方案
            </h2>
            <div className="mt-5">
              <CoursePlanRadioPicker
                plans={plan.coursePlans}
                selectedPlanId={selectedCoursePlanId}
                onChange={setSelectedCoursePlanId}
              />
            </div>
            <div className="mt-5">
              <SelfScheduledScheduleNotice />
            </div>
          </div>
        </section>
      ) : null}

      {canRegister && !showRegistrationSlots && !usesCoursePlans && usesSessions ? (
        <section className="mx-auto max-w-6xl px-5 py-10 md:px-8">
          <SelfScheduledScheduleNotice />
        </section>
      ) : null}

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
                        <AdultRegistrationFormStep usesSessions={usesSessions} />
                      </FormProvider>
                    ) : activeType === "parent" ? (
                      <FormProvider {...parentMethods}>
                        <ParentStudentFormStep usesSessions={usesSessions} />
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
                        classes={legacyClassOptions}
                        sessions={plan.sessions}
                        formData={confirmData}
                        variant={
                          confirmData.registrationType === "parent" ? "parent" : "adult"
                        }
                        paymentMethod={activePaymentMethod}
                      />

                      <div className="mt-6">
                        <PaymentMethodSelector
                          allowedMethods={course.allowedPaymentMethods}
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
