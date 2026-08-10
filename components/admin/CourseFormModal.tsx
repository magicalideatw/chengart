"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Upload } from "lucide-react";
import { uploadCourseCover, getCourseScheduleForFormAction } from "@/lib/actions/admin/courses";
import { getPromoCodesForCourseAction } from "@/lib/actions/admin/promo-codes";
import { COURSE_COVER_ACCEPT } from "@/lib/courses/constants";
import { CourseCoverImage } from "@/components/courses/CourseCoverImage";
import { PromoCodeSection } from "@/components/admin/PromoCodeSection";
import { TicketTypeSection } from "@/components/admin/TicketTypeSection";
import { CourseMediaSection } from "@/components/admin/CourseMediaSection";
import { CoursePlanSection } from "@/components/admin/CoursePlanSection";
import { getCourseMediaForCourseAction } from "@/lib/actions/admin/course-media";
import { getCoursePlansForCourseAction } from "@/lib/actions/admin/course-plans";
import { getTicketTypesForCourseAction } from "@/lib/actions/admin/ticket-types";
import {
  COURSE_CATEGORIES,
  TRANSFER_DEADLINE_DAY_OPTIONS,
  type Course,
  type CourseFormInput,
} from "@/lib/courses/types";
import {
  REGISTRATION_MODES,
  REGISTRATION_MODE_LABELS,
  type RegistrationMode,
} from "@/lib/courses/registration-mode";
import {
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABELS,
  type ActivityType,
} from "@/lib/courses/activity-type";
import {
  PARTICIPATION_METHODS,
  PARTICIPATION_METHOD_LABELS,
  getDefaultActionButtonText,
  type ParticipationMethod,
} from "@/lib/courses/participation-method";
import {
  PAID_PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type PaidPaymentMethod,
} from "@/lib/payment/types";
import type { PromoCodeRecord } from "@/lib/pricing/types";
import type { TicketTypeRecord } from "@/lib/ticket-types/types";
import type { CourseMediaRecord } from "@/lib/media/types";
import type { CoursePlan } from "@/lib/course-plans/types";
import { formatCourseSessionTimeRange } from "@/lib/courses/session-time";
import {
  SESSION_TYPES,
  SESSION_TYPE_LABELS,
  type SessionType,
} from "@/lib/sessions/types";

type CourseFormModalProps = {
  course?: Course | null;
  onClose: () => void;
  onSubmit: (input: CourseFormInput) => Promise<{ success: boolean; error?: string }>;
  isPending: boolean;
};

const emptyForm: CourseFormInput = {
  title: "",
  category: "舞蹈",
  description: "",
  courseDetails: "",
  activityType: "course",
  activityRules: "",
  participationMethod: "internal",
  externalUrl: "",
  actionButtonText: getDefaultActionButtonText("course"),
  isOpen: true,
  scheduleMode: "fixed",
  sessionDate: "",
  sessionStartTime: "",
  sessionEndTime: "",
  sessionTime: "",
  capacity: 5,
  coverImage: "",
  allowedPaymentMethods: ["ecpay"],
  registrationMode: "adult",
  pricePerStudent: 0,
  registrationDeadline: "",
  showRemainingCapacity: true,
  transferDeadlineDays: 7,
  earlyBirdEnabled: false,
  earlyBirdDeadline: "",
  earlyBirdDiscountType: "percent",
  earlyBirdDiscountValue: 0,
  groupDiscountEnabled: false,
  groupDiscountMinStudents: 2,
  groupDiscountType: "percent",
  groupDiscountValue: 0,
};

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-surface/40 px-5 py-5">
      <div>
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs text-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function courseToFormInput(course: Course): CourseFormInput {
  return {
    title: course.title,
    category: course.category,
    description: course.description,
    courseDetails: course.courseDetails,
    activityType: course.activityType,
    activityRules: course.activityRules,
    participationMethod: course.participationMethod,
    externalUrl: course.externalUrl ?? "",
  actionButtonText: course.actionButtonText,
  isOpen: course.isOpen,
  scheduleMode: "fixed",
  sessionDate: course.sessionDate,
  sessionStartTime: "",
  sessionEndTime: "",
  sessionTime: course.sessionTime,
    capacity: course.capacity,
    coverImage: course.coverImage,
    allowedPaymentMethods: course.allowedPaymentMethods.filter(
      (method): method is PaidPaymentMethod =>
        method === "ecpay" || method === "bank_transfer",
    ),
    registrationMode: course.registrationMode,
    pricePerStudent: course.pricePerStudent,
    registrationDeadline: course.registrationDeadline ?? "",
    showRemainingCapacity: course.showRemainingCapacity,
    transferDeadlineDays: course.transferDeadlineDays,
    earlyBirdEnabled: course.earlyBirdEnabled,
    earlyBirdDeadline: course.earlyBirdDeadline ?? "",
    earlyBirdDiscountType: course.earlyBirdDiscountType ?? "percent",
    earlyBirdDiscountValue: course.earlyBirdDiscountValue,
    groupDiscountEnabled: course.groupDiscountEnabled,
    groupDiscountMinStudents: course.groupDiscountMinStudents ?? 2,
    groupDiscountType: course.groupDiscountType ?? "percent",
    groupDiscountValue: course.groupDiscountValue,
  };
}

export function CourseFormModal({
  course,
  onClose,
  onSubmit,
  isPending,
}: CourseFormModalProps) {
  const [form, setForm] = useState<CourseFormInput>(
    course ? courseToFormInput(course) : emptyForm,
  );
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [promoCodes, setPromoCodes] = useState<PromoCodeRecord[]>([]);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeRecord[]>([]);
  const [mediaItems, setMediaItems] = useState<CourseMediaRecord[]>([]);
  const [coursePlans, setCoursePlans] = useState<CoursePlan[]>([]);
  const router = useRouter();

  const isFreeCourse = form.pricePerStudent <= 0;
  const usesBankTransfer = form.allowedPaymentMethods.includes("bank_transfer");

  const updateField = <K extends keyof CourseFormInput>(
    key: K,
    value: CourseFormInput[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const paidMethodOptions = useMemo(
    () =>
      PAID_PAYMENT_METHODS.map((method) => ({
        method,
        label: PAYMENT_METHOD_LABELS[method],
      })),
    [],
  );

  useEffect(() => {
    if (!course?.id) return;

    void getPromoCodesForCourseAction(course.id).then(setPromoCodes);
    void getTicketTypesForCourseAction(course.id).then(setTicketTypes);
    void getCourseMediaForCourseAction(course.id).then(setMediaItems);
    void getCoursePlansForCourseAction(course.id).then(setCoursePlans);
    void getCourseScheduleForFormAction(course.id).then((schedule) => {
      if (!schedule) return;
      setForm((current) => ({ ...current, ...schedule }));
    });
  }, [course?.id]);

  const renderDiscountTypeRadios = (
    value: "fixed" | "percent" | null,
    onChange: (next: "fixed" | "percent") => void,
  ) => (
    <div className="flex flex-wrap gap-4">
      {(["fixed", "percent"] as const).map((type) => (
        <label key={type} className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="radio"
            checked={value === type}
            onChange={() => onChange(type)}
            className="h-4 w-4 accent-gold"
          />
          {type === "fixed" ? "固定金額" : "百分比"}
        </label>
      ))}
    </div>
  );

  const handleCoverUpload = async (file: File | null) => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadCourseCover(formData);
    setIsUploading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    updateField("coverImage", result.path);
  };

  const isCourseActivity = form.activityType === "course";
  const isSelfScheduled = isCourseActivity && form.scheduleMode === "self_scheduled";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const payload: CourseFormInput = {
      ...form,
      sessionTime: isSelfScheduled
        ? ""
        : isCourseActivity
          ? formatCourseSessionTimeRange(form.sessionStartTime, form.sessionEndTime)
          : form.sessionTime,
      allowedPaymentMethods: isFreeCourse ? [] : form.allowedPaymentMethods,
      transferDeadlineDays:
        isFreeCourse || !usesBankTransfer ? null : form.transferDeadlineDays,
    };

    const result = await onSubmit(payload);
    if (!result.success) {
      setError(result.error ?? "操作失敗");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
              Course
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-foreground">
              {course ? "編輯課程" : "新增課程"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border p-2 text-muted transition hover:text-foreground"
            aria-label="關閉"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          <Section title="基本資訊">
            <div>
              <label className="text-sm font-medium text-foreground">活動類型</label>
              <div className="mt-3 space-y-2">
                {ACTIVITY_TYPES.map((type) => (
                  <label
                    key={type}
                    className="flex cursor-pointer items-center gap-3 text-sm text-foreground"
                  >
                    <input
                      type="radio"
                      name="activityType"
                      checked={form.activityType === type}
                      onChange={() => updateField("activityType", type as ActivityType)}
                      className="h-4 w-4 accent-gold"
                    />
                    {ACTIVITY_TYPE_LABELS[type]}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">課程名稱</label>
              <input
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">課程分類</label>
              <select
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className={inputClass}
              >
                {COURSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">課程介紹</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="簡短介紹，顯示於列表與頁面頂部"
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">活動規則</label>
              <textarea
                rows={4}
                value={form.activityRules}
                onChange={(e) => updateField("activityRules", e.target.value)}
                placeholder="例如：每位入場者皆須購票。不分成人、兒童。一人一票。"
                className={`${inputClass} resize-none`}
              />
              <p className="mt-2 text-xs text-muted">
                選填。若有填寫，前台活動頁會顯示「活動規則」區塊。
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">課程說明</label>
              <textarea
                rows={4}
                value={form.courseDetails}
                onChange={(e) => updateField("courseDetails", e.target.value)}
                placeholder="詳細說明（選填），顯示於報名頁"
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                課程圖片（選填）
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <div className="relative h-24 w-36 overflow-hidden rounded-xl border border-border">
                  <CourseCoverImage
                    src={form.coverImage}
                    alt="課程圖片預覽"
                    fill={false}
                    width={144}
                    height={96}
                    className="h-full w-full object-cover"
                    sizes="144px"
                  />
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface">
                  <Upload className="h-4 w-4" />
                  {isUploading ? "上傳中…" : "上傳圖片"}
                  <input
                    type="file"
                    accept={COURSE_COVER_ACCEPT}
                    className="hidden"
                    disabled={isUploading || isPending}
                    onChange={(e) => handleCoverUpload(e.target.files?.[0] ?? null)}
                  />
                </label>
                {form.coverImage ? (
                  <button
                    type="button"
                    onClick={() => updateField("coverImage", "")}
                    className="text-sm text-muted transition hover:text-foreground"
                  >
                    移除圖片
                  </button>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-muted">
                支援 JPG、PNG、WebP，最大 30MB
              </p>
            </div>
          </Section>

          <Section title="參加方式">
            <div>
              <label className="text-sm font-medium text-foreground">參加方式</label>
              <div className="mt-3 space-y-2">
                {PARTICIPATION_METHODS.map((method) => (
                  <label
                    key={method}
                    className="flex cursor-pointer items-center gap-3 text-sm text-foreground"
                  >
                    <input
                      type="radio"
                      name="participationMethod"
                      checked={form.participationMethod === method}
                      onChange={() => updateField("participationMethod", method as ParticipationMethod)}
                      className="h-4 w-4 accent-gold"
                    />
                    {PARTICIPATION_METHOD_LABELS[method]}
                  </label>
                ))}
              </div>
            </div>

            {form.participationMethod === "external" ? (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground">外部網址</label>
                  <input
                    type="url"
                    value={form.externalUrl}
                    onChange={(e) => updateField("externalUrl", e.target.value)}
                    placeholder="https://..."
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">按鈕文字</label>
                  <input
                    value={form.actionButtonText}
                    onChange={(e) => updateField("actionButtonText", e.target.value)}
                    placeholder={getDefaultActionButtonText(form.activityType)}
                    className={inputClass}
                  />
                  <p className="mt-2 text-xs text-muted">
                    例如：查看詳情、前往報名、立即購票、立即報名
                  </p>
                </div>
              </>
            ) : form.participationMethod === "internal" ? (
              <div>
                <label className="text-sm font-medium text-foreground">按鈕文字</label>
                <input
                  value={form.actionButtonText}
                  onChange={(e) => updateField("actionButtonText", e.target.value)}
                  placeholder={getDefaultActionButtonText(form.activityType)}
                  className={inputClass}
                />
                <p className="mt-2 text-xs text-muted">
                  預設：課程為「立即報名」、演出為「立即購票」
                </p>
              </div>
            ) : null}
          </Section>

          <Section
            title="報名設定"
            description="控制前台報名表單顯示方式"
          >
            <div className="space-y-3">
              {REGISTRATION_MODES.map((mode) => (
                <label
                  key={mode}
                  className="flex cursor-pointer items-center gap-3 text-sm text-foreground"
                >
                  <input
                    type="radio"
                    name="registrationMode"
                    checked={form.registrationMode === mode}
                    onChange={() =>
                      updateField("registrationMode", mode as RegistrationMode)
                    }
                    className="h-4 w-4 accent-gold"
                  />
                  {REGISTRATION_MODE_LABELS[mode]}
                </label>
              ))}
            </div>
          </Section>

          <Section title="價格設定">
            <div>
              <label className="text-sm font-medium text-foreground">
                每人價格（NT$）
              </label>
              <input
                type="number"
                min={0}
                value={form.pricePerStudent}
                onChange={(e) =>
                  updateField("pricePerStudent", Number(e.target.value))
                }
                className={inputClass}
              />
              <p className="mt-2 text-xs text-muted">
                成人模式固定 1 位學生；家長模式總金額 = 每人價格 × 學生數。
                設為 0 時自動視為免費活動。
              </p>
            </div>
          </Section>

          {!isFreeCourse ? (
            <>
              <Section title="早鳥">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={form.earlyBirdEnabled}
                    onChange={(event) =>
                      updateField("earlyBirdEnabled", event.target.checked)
                    }
                    className="h-4 w-4 accent-gold"
                  />
                  啟用
                </label>
                {form.earlyBirdEnabled ? (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">截止日期</label>
                      <input
                        type="date"
                        value={form.earlyBirdDeadline}
                        onChange={(event) =>
                          updateField("earlyBirdDeadline", event.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                    {renderDiscountTypeRadios(
                      form.earlyBirdDiscountType,
                      (type) => updateField("earlyBirdDiscountType", type),
                    )}
                    <div>
                      <label className="text-sm font-medium text-foreground">折扣值</label>
                      <input
                        type="number"
                        min={0}
                        value={form.earlyBirdDiscountValue}
                        onChange={(event) =>
                          updateField("earlyBirdDiscountValue", Number(event.target.value))
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                ) : null}
              </Section>

              <Section title="團報">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={form.groupDiscountEnabled}
                    onChange={(event) =>
                      updateField("groupDiscountEnabled", event.target.checked)
                    }
                    className="h-4 w-4 accent-gold"
                  />
                  啟用
                </label>
                {form.groupDiscountEnabled ? (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">人數門檻</label>
                      <input
                        type="number"
                        min={2}
                        value={form.groupDiscountMinStudents ?? 2}
                        onChange={(event) =>
                          updateField(
                            "groupDiscountMinStudents",
                            Number(event.target.value),
                          )
                        }
                        className={inputClass}
                      />
                    </div>
                    {renderDiscountTypeRadios(
                      form.groupDiscountType,
                      (type) => updateField("groupDiscountType", type),
                    )}
                    <div>
                      <label className="text-sm font-medium text-foreground">折扣值</label>
                      <input
                        type="number"
                        min={0}
                        value={form.groupDiscountValue}
                        onChange={(event) =>
                          updateField("groupDiscountValue", Number(event.target.value))
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                ) : null}
              </Section>
            </>
          ) : null}

          <Section
            title="付款方式"
            description="每堂課可獨立設定，價格為 0 時自動免費完成報名"
          >
            {isFreeCourse ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                目前為免費活動，不需設定付款方式。
              </p>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {paidMethodOptions.map(({ method, label }) => (
                    <label
                      key={method}
                      className="flex cursor-pointer items-center gap-3 text-sm text-foreground"
                    >
                      <input
                        type="checkbox"
                        checked={form.allowedPaymentMethods.includes(method)}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          setForm((current) => {
                            const next = checked
                              ? [...new Set([...current.allowedPaymentMethods, method])]
                              : current.allowedPaymentMethods.filter(
                                  (item) => item !== method,
                                );
                            return {
                              ...current,
                              allowedPaymentMethods: next as PaidPaymentMethod[],
                            };
                          });
                        }}
                        className="h-4 w-4 accent-gold"
                      />
                      {label}
                    </label>
                  ))}
                </div>

                {usesBankTransfer ? (
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      匯款期限（天數）
                    </label>
                    <select
                      value={form.transferDeadlineDays ?? 7}
                      onChange={(e) =>
                        updateField("transferDeadlineDays", Number(e.target.value))
                      }
                      className={inputClass}
                    >
                      {TRANSFER_DEADLINE_DAY_OPTIONS.map((days) => (
                        <option key={days} value={days}>
                          {days} 天
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-muted">
                      用於銀行轉帳付款頁、訂單頁與 Email 提醒
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </Section>

          <Section title="招生設定">
            <div className="grid gap-5 sm:grid-cols-2">
              {isCourseActivity ? (
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-foreground">上課方式</p>
                  <div className="mt-3 flex flex-wrap gap-4">
                    {SESSION_TYPES.map((type) => (
                      <label
                        key={type}
                        className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                      >
                        <input
                          type="radio"
                          name="course-schedule-mode"
                          checked={form.scheduleMode === type}
                          onChange={() => {
                            if (type === "self_scheduled") {
                              setForm((current) => ({
                                ...current,
                                scheduleMode: type,
                                sessionDate: "",
                                sessionStartTime: "",
                                sessionEndTime: "",
                                sessionTime: "",
                              }));
                              return;
                            }
                            updateField("scheduleMode", type as SessionType);
                          }}
                          className="h-4 w-4 accent-gold"
                        />
                        {SESSION_TYPE_LABELS[type]}
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {!isSelfScheduled ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-foreground">上課日期</label>
                    <input
                      type="date"
                      value={form.sessionDate}
                      onChange={(e) => updateField("sessionDate", e.target.value)}
                      className={inputClass}
                      required={isCourseActivity}
                    />
                  </div>
                  {isCourseActivity ? (
                    <>
                      <div>
                        <label className="text-sm font-medium text-foreground">開始時間</label>
                        <input
                          value={form.sessionStartTime}
                          onChange={(e) => updateField("sessionStartTime", e.target.value)}
                          placeholder="14:00"
                          className={inputClass}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">結束時間</label>
                        <input
                          value={form.sessionEndTime}
                          onChange={(e) => updateField("sessionEndTime", e.target.value)}
                          placeholder="15:30"
                          className={inputClass}
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="text-sm font-medium text-foreground">上課時間</label>
                      <input
                        value={form.sessionTime}
                        onChange={(e) => updateField("sessionTime", e.target.value)}
                        placeholder="例如 14:00–15:00"
                        className={inputClass}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="sm:col-span-2 rounded-xl bg-surface px-4 py-3 text-sm text-muted">
                  此課程採自行預約，報名完成後由老師與學員協調上課日期與時間。
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground">名額</label>
                <input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) => updateField("capacity", Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  報名截止日期
                </label>
                <input
                  type="date"
                  value={form.registrationDeadline}
                  onChange={(e) =>
                    updateField("registrationDeadline", e.target.value)
                  }
                  className={inputClass}
                />
                <p className="mt-2 text-xs text-muted">留空表示不限截止日期</p>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.isOpen}
                onChange={(e) => updateField("isOpen", e.target.checked)}
                className="h-4 w-4 accent-gold"
              />
              開放報名
            </label>

            <label className="flex cursor-pointer items-center gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.showRemainingCapacity}
                onChange={(e) =>
                  updateField("showRemainingCapacity", e.target.checked)
                }
                className="h-4 w-4 accent-gold"
              />
              顯示剩餘名額
            </label>
            <p className="text-xs text-muted">
              若不顯示，前台僅顯示「招生中」或「已額滿」
            </p>
          </Section>

          {course?.id && isSelfScheduled ? (
            <CoursePlanSection
              courseId={course.id}
              plans={coursePlans}
              canMutate
              onChanged={() => {
                void getCoursePlansForCourseAction(course.id).then(setCoursePlans);
                router.refresh();
              }}
            />
          ) : null}

          {course?.id ? (
            <CourseMediaSection
              courseId={course.id}
              mediaItems={mediaItems}
              canMutate
              onChanged={() => {
                void getCourseMediaForCourseAction(course.id).then(setMediaItems);
                router.refresh();
              }}
            />
          ) : null}

          {course?.id ? (
            <TicketTypeSection
              courseId={course.id}
              ticketTypes={ticketTypes}
              canMutate
              onChanged={() => {
                void getTicketTypesForCourseAction(course.id).then(setTicketTypes);
                router.refresh();
              }}
            />
          ) : null}

          {course?.id && !isFreeCourse ? (
            <PromoCodeSection
              courseId={course.id}
              promoCodes={promoCodes}
              canMutate
              onChanged={() => {
                void getPromoCodesForCourseAction(course.id).then(setPromoCodes);
                router.refresh();
              }}
            />
          ) : null}

          {error && (
            <p className="whitespace-pre-wrap rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:bg-surface"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isPending || isUploading}
              className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-white transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "儲存中…" : course ? "儲存變更" : "新增課程"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
