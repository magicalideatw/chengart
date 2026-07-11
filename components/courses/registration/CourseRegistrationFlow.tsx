"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { createRegistrationOrder } from "@/lib/actions/payment";
import { formatFee, formatSessionDate } from "@/lib/admin/format";
import type { ActiveRegistrationType } from "@/lib/courses/registration-mode";
import { resolveActiveRegistrationType } from "@/lib/courses/registration-mode";
import type { CourseWithEnrollment } from "@/lib/courses/types";
import type { PaymentMethod } from "@/lib/payment/types";
import {
  resolveAvailablePaymentMethods,
  resolveDefaultPaymentMethod,
} from "@/lib/payment/types";
import {
  calculateOrderTotal,
  getEffectivePricePerStudent,
} from "@/lib/registration/pricing";
import type { CourseRegistrationPlan } from "@/lib/registration/queries";
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
};

const steps = ["填寫報名資料", "確認並付款"];

export function CourseRegistrationFlow({ course, plan }: CourseRegistrationFlowProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const isSubmittingOrderRef = useRef(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedType, setSelectedType] = useState<ActiveRegistrationType | null>(null);
  const [confirmData, setConfirmData] = useState<RegistrationOrderFormValues | null>(null);
  const router = useRouter();

  const usesSessions = plan.usesSessions;
  const pricePerStudent = getEffectivePricePerStudent(course);
  const activeType = resolveActiveRegistrationType({
    registrationMode: course.registrationMode,
    selectedType,
  });

  const canRegister = usesSessions
    ? course.isOpen && plan.hasSelectableSessions
    : course.isOpen && !course.isFull;

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

  const watchedParentStudents = parentMethods.watch("students");

  const studentCount = useMemo(() => {
    if (!activeType) return 0;
    if (activeType === "adult") return 1;
    return watchedParentStudents?.length ?? 0;
  }, [activeType, watchedParentStudents]);

  const totalAmount = useMemo(
    () =>
      calculateOrderTotal({
        pricePerStudent,
        studentCount,
      }),
    [pricePerStudent, studentCount],
  );

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

    setConfirmData(orderData);
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
  const showPriceSummary = !needsTypeSelection && studentCount > 0;

  return (
    <>
      <CourseRegistrationHero
        course={course}
        plan={plan}
        onRegister={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        canRegister={canRegister}
        registrationMode={course.registrationMode}
      />

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
                    <RegistrationPriceSummary
                      studentCount={studentCount}
                      pricePerStudent={pricePerStudent}
                      totalAmount={totalAmount}
                    />
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

                    <RegistrationPriceSummary
                      studentCount={studentCount}
                      pricePerStudent={pricePerStudent}
                      totalAmount={totalAmount}
                    />
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
