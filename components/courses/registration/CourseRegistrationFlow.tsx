"use client";

import { useCallback, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import type { RegistrationCourse } from "@/src/data/courses";
import { findClassById, findDateOption } from "@/src/data/courses";
import {
  registrationFormSchema,
  type RegistrationFormValues,
} from "@/lib/validation/registration-schema";
import { Toast } from "@/components/ui/Toast";
import { CourseRegistrationHero } from "./CourseRegistrationHero";
import { StepIndicator, StepHeader } from "./StepIndicator";
import { DateSelectionStep } from "./DateSelectionStep";
import { ClassSelectionStep } from "./ClassSelectionStep";
import { RegistrationFormStep } from "./RegistrationFormStep";
import { ConfirmStep } from "./ConfirmStep";
import { RegistrationSuccessScreen } from "./RegistrationSuccessScreen";

type CourseRegistrationFlowProps = {
  course: RegistrationCourse;
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

async function submitRegistration(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  if (Math.random() < 0.05) {
    throw new Error("submit failed");
  }
}

function getCurrentStep(
  selectedDate: string | null,
  selectedClassId: string | null,
  showConfirm: boolean,
): number {
  if (showConfirm) return 4;
  if (selectedClassId) return 3;
  if (selectedDate) return 2;
  return 1;
}

export function CourseRegistrationFlow({ course }: CourseRegistrationFlowProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const methods = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues,
    mode: "onTouched",
  });

  const scrollToForm = useCallback(() => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedClassId(null);
    setShowConfirm(false);
  };

  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
    setShowConfirm(false);
  };

  const handleNextFromForm = methods.handleSubmit(() => {
    setShowConfirm(true);
    setTimeout(() => {
      document.getElementById("step-confirm")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  });

  const handleSubmit = async () => {
    if (isSubmitting || !selectedDate || !selectedClassId) return;

    setIsSubmitting(true);
    try {
      await submitRegistration();
      setIsSuccess(true);
    } catch {
      setToastVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dateOption = selectedDate
    ? findDateOption(course, selectedDate)
    : undefined;
  const selectedClass =
    selectedDate && selectedClassId
      ? findClassById(course, selectedDate, selectedClassId)
      : undefined;

  const formData = methods.watch();
  const currentStep = getCurrentStep(
    selectedDate,
    selectedClassId,
    showConfirm,
  );

  return (
    <>
      <CourseRegistrationHero course={course} onRegister={scrollToForm} />

      <div ref={formRef} id="register" className="scroll-mt-20">
        <section className="mx-auto max-w-3xl px-5 py-16 sm:py-24 md:px-8">
          <StepIndicator currentStep={currentStep} />

          <FormProvider {...methods}>
            <div className="mt-12 space-y-16">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <StepHeader step={1} title="請選擇日期" />
                <DateSelectionStep
                  dates={course.dates}
                  selectedDate={selectedDate}
                  onSelect={handleDateSelect}
                />
              </motion.div>

              {selectedDate && dateOption && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="border-t border-border pt-16"
                >
                  <StepHeader step={2} title="請選擇班級" />
                  <ClassSelectionStep
                    classes={dateOption.classes}
                    selectedClassId={selectedClassId}
                    onSelect={handleClassSelect}
                  />
                </motion.div>
              )}

              {selectedClassId && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="border-t border-border pt-16"
                >
                  <StepHeader step={3} title="填寫資料" />
                  <RegistrationFormStep />
                  {!showConfirm && (
                    <button
                      type="button"
                      onClick={handleNextFromForm}
                      className="mt-8 w-full rounded-full bg-foreground px-6 py-3.5 text-sm font-medium text-white transition hover:bg-foreground/90 sm:w-auto"
                    >
                      確認資料
                    </button>
                  )}
                </motion.div>
              )}

              {showConfirm && dateOption && selectedClass && (
                <motion.div
                  id="step-confirm"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="scroll-mt-24 border-t border-border pt-16"
                >
                  <StepHeader step={4} title="確認資料" />
                  <ConfirmStep
                    dateLabel={dateOption.dayLabel}
                    schedule={dateOption.schedule}
                    className={selectedClass.name}
                    classTime={selectedClass.time}
                    formData={formData}
                  />
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setShowConfirm(false)}
                      disabled={isSubmitting}
                      className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:border-foreground/30 disabled:opacity-50"
                    >
                      返回修改
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gold px-6 py-3.5 text-sm font-medium text-white transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          送出中...
                        </>
                      ) : (
                        "立即報名"
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </FormProvider>
        </section>
      </div>

      {isSuccess && <RegistrationSuccessScreen />}

      <Toast
        message="請稍後再試。"
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </>
  );
}
