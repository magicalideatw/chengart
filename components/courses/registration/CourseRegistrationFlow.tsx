"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { createRegistrationOrder } from "@/lib/actions/payment";
import { formatFee, formatSessionDate } from "@/lib/admin/format";
import type { CourseWithEnrollment } from "@/lib/courses/types";
import {
  registrationFormSchema,
  type RegistrationFormValues,
} from "@/lib/validation/registration-schema";
import { CourseRegistrationHero } from "./CourseRegistrationHero";
import { StepIndicator, StepHeader } from "./StepIndicator";
import { RegistrationFormStep } from "./RegistrationFormStep";
import { ConfirmStep } from "./ConfirmStep";

type CourseRegistrationFlowProps = {
  course: CourseWithEnrollment;
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

const steps = ["填寫資料", "確認並付款"];

export function CourseRegistrationFlow({ course }: CourseRegistrationFlowProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const canRegister = course.isOpen && !course.isFull;

  const methods = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues,
    mode: "onTouched",
  });

  const scrollToForm = useCallback(() => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

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
    setErrorMessage(null);

    startTransition(async () => {
      const result = await createRegistrationOrder({
        courseId: course.id,
        formData: methods.getValues(),
      });

      if (result.success) {
        router.push(result.checkoutPath);
        return;
      }

      setErrorMessage(result.error);
    });
  };

  const formData = methods.watch();
  const currentStep = showConfirm ? 2 : 1;

  return (
    <>
      <CourseRegistrationHero course={course} onRegister={scrollToForm} />

      {canRegister && (
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
                    <StepHeader step={1} title="填寫資料" />
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
                    <StepHeader step={2} title="確認並付款" />
                    <ConfirmStep
                      dateLabel={formatSessionDate(course.sessionDate)}
                      className={course.title}
                      classTime={course.sessionTime}
                      feeLabel={formatFee(course.fee)}
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
