"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { getAdminCourseSessionOptions } from "@/lib/actions/admin/registrations";
import { formatFee, formatSessionDate } from "@/lib/admin/format";
import type { AdminOrderRegistration, AdminOrderStudent } from "@/lib/admin/types";
import type { Course } from "@/lib/courses/types";
import {
  calculateOrderTotal,
  getEffectivePricePerStudent,
} from "@/lib/registration/pricing";
import { createDefaultStudent } from "@/lib/validation/registration-schema";
import {
  isGenderValue,
  normalizeGenderValue,
} from "@/lib/registration/gender";

type SessionOption = {
  id: string;
  label: string;
  date: string;
  startTime: string;
  endTime: string;
  remainingCapacity: number;
  status: string;
};

type ClassSessionGroup = {
  classId: string;
  className: string;
  weekday: string;
  unitPrice: number;
  sessions: SessionOption[];
};

type RegistrationEditModalProps = {
  registration: AdminOrderRegistration;
  courses: Course[];
  onClose: () => void;
  onSave: (
    updated: AdminOrderRegistration,
    students: AdminOrderStudent[],
  ) => Promise<{ success: boolean; error?: string }>;
  isPending: boolean;
};

type EditableStudent = {
  key: string;
  id?: string;
  studentName: string;
  studentAge: string;
  gender: "male" | "female" | "";
  isFirstTime: boolean;
  note: string;
  sessionIds: string[];
  registrationIds: string[];
};

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

function toEditableStudent(student: AdminOrderStudent, index: number): EditableStudent {
  return {
    key: student.id || `student-${index}`,
    id: student.id.startsWith("legacy:") ? undefined : student.id,
    studentName: student.student_name,
    studentAge: student.student_age,
    gender: normalizeGenderValue(student.gender) ?? "",
    isFirstTime: student.is_first_time,
    note: student.note ?? "",
    sessionIds: student.sessions
      .map((session) => session.sessionId)
      .filter((value): value is string => Boolean(value)),
    registrationIds: student.registrationIds,
  };
}

function toOrderStudent(student: EditableStudent): AdminOrderStudent {
  return {
    id: student.id ?? student.key,
    student_name: student.studentName,
    student_age: student.studentAge,
    gender: student.gender || null,
    is_first_time: student.isFirstTime,
    note: student.note || null,
    sessions: student.sessionIds.map((sessionId, index) => ({
      registrationId: student.registrationIds[index] ?? `${student.key}-${sessionId}`,
      sessionId,
      date: "",
      start_time: "",
      end_time: "",
      className: "—",
      scheduleLine: sessionId,
      compactLine: sessionId,
    })),
    registrationIds: student.registrationIds,
  };
}

export function RegistrationEditModal({
  registration,
  courses,
  onClose,
  onSave,
  isPending,
}: RegistrationEditModalProps) {
  const [parentForm, setParentForm] = useState({
    courseId: registration.course_id,
    name: registration.name,
    phone: registration.phone,
    email: registration.email,
    parentNote: registration.parent_note ?? "",
  });
  const [students, setStudents] = useState<EditableStudent[]>(() =>
    registration.students.map(toEditableStudent),
  );
  const [sessionGroups, setSessionGroups] = useState<ClassSessionGroup[]>([]);
  const [usesSessions, setUsesSessions] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCourse = courses.find((course) => course.id === parentForm.courseId);
  const isAdult = registration.registrationType === "adult";
  const canAddStudents = Boolean(registration.order_id) && !isAdult;
  const pricePerStudent = getEffectivePricePerStudent(selectedCourse ?? {});
  const totalAmount = useMemo(
    () =>
      calculateOrderTotal({
        pricePerStudent,
        studentCount: students.length,
      }),
    [pricePerStudent, students.length],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSessions() {
      setLoadingSessions(true);
      const result = await getAdminCourseSessionOptions(parentForm.courseId);
      if (cancelled) return;

      if (result.usesSessions) {
        setUsesSessions(true);
        setSessionGroups(result.classes);
      } else {
        setUsesSessions(false);
        setSessionGroups([]);
      }
      setLoadingSessions(false);
    }

    void loadSessions();
    return () => {
      cancelled = true;
    };
  }, [parentForm.courseId]);

  const updateParent = <K extends keyof typeof parentForm>(
    key: K,
    value: (typeof parentForm)[K],
  ) => {
    setParentForm((current) => ({ ...current, [key]: value }));
  };

  const updateStudent = (
    key: string,
    patch: Partial<EditableStudent>,
  ) => {
    setStudents((current) =>
      current.map((student) =>
        student.key === key ? { ...student, ...patch } : student,
      ),
    );
  };

  const addStudent = () => {
    const next = createDefaultStudent(students.length);
    setStudents((current) => [
      ...current,
      {
        key: `new-${Date.now()}`,
        studentName: next.studentName,
        studentAge: next.studentAge,
        gender: "",
        isFirstTime: false,
        note: next.note ?? "",
        sessionIds: [],
        registrationIds: [],
      },
    ]);
  };

  const removeStudent = (key: string) => {
    if (isAdult || students.length <= 1) return;
    setStudents((current) => current.filter((student) => student.key !== key));
  };

  const toggleSession = (studentKey: string, sessionId: string) => {
    setStudents((current) =>
      current.map((student) => {
        if (student.key !== studentKey) return student;

        const exists = student.sessionIds.includes(sessionId);
        return {
          ...student,
          sessionIds: exists
            ? student.sessionIds.filter((id) => id !== sessionId)
            : [...student.sessionIds, sessionId],
        };
      }),
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const missingGender = students.some((student) => !isGenderValue(student.gender));
    if (missingGender) {
      setError("請為每位學生選擇性別");
      return;
    }

    const finalStudents = (isAdult
      ? students.map((student) => ({
          ...toOrderStudent(student),
          student_name: parentForm.name,
        }))
      : students.map(toOrderStudent));

    const updated: AdminOrderRegistration = {
      ...registration,
      course_id: parentForm.courseId,
      name: parentForm.name,
      phone: parentForm.phone,
      email: parentForm.email,
      parent_note: parentForm.parentNote || null,
      courseTitle: selectedCourse?.title ?? registration.courseTitle,
      courseCategory: selectedCourse?.category ?? registration.courseCategory,
      students: finalStudents,
      studentCount: finalStudents.length,
      orderAmount: totalAmount,
    };

    const result = await onSave(updated, updated.students);

    if (!result.success) {
      setError(result.error ?? "更新失敗");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
              Edit
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-foreground">
              編輯訂單報名資料
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
          <section className="space-y-4 rounded-2xl border border-border bg-surface px-5 py-4">
            <h3 className="text-sm font-medium text-foreground">
              {isAdult ? "報名資料" : "家長資料"}
            </h3>

            <div>
              <label className="text-sm font-medium text-foreground">課程</label>
              <select
                value={parentForm.courseId}
                onChange={(event) => updateParent("courseId", event.target.value)}
                className={inputClass}
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title} · {formatSessionDate(course.sessionDate)}{" "}
                    {course.sessionTime}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  {
                    key: "name" as const,
                    label: isAdult ? "姓名" : "家長姓名",
                    type: "text",
                  },
                  { key: "phone" as const, label: "電話", type: "tel" },
                  { key: "email" as const, label: "Email", type: "email" },
                ] as const
              ).map((field) => (
                <div key={field.key}>
                  <label className="text-sm font-medium text-foreground">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={parentForm[field.key]}
                    onChange={(event) =>
                      updateParent(field.key, event.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">備註</label>
              <textarea
                rows={2}
                value={parentForm.parentNote}
                onChange={(event) => updateParent("parentNote", event.target.value)}
                className={`${inputClass} resize-none`}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface px-5 py-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted">學生</dt>
                <dd className="mt-1 font-medium text-foreground">{students.length} 位</dd>
              </div>
              <div>
                <dt className="text-muted">單價</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {formatFee(pricePerStudent)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">總金額</dt>
                <dd className="mt-1 font-display text-lg font-semibold text-gold">
                  {formatFee(totalAmount)}
                </dd>
              </div>
            </dl>
            {registration.orderAmount != null &&
            registration.orderAmount !== totalAmount ? (
              <p className="mt-3 text-xs text-muted">
                原訂單金額 {formatFee(registration.orderAmount)}，儲存後將更新為{" "}
                {formatFee(totalAmount)}
              </p>
            ) : null}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">
                {isAdult ? "學員資料" : "報名學生"}
              </h3>
              {canAddStudents ? (
                <button
                  type="button"
                  onClick={addStudent}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-gold hover:text-gold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  新增學生
                </button>
              ) : null}
            </div>

            {students.map((student, index) => (
              <div
                key={student.key}
                className="space-y-4 rounded-2xl border border-border px-5 py-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">
                    {isAdult ? "學員" : `學生 ${index + 1}`}
                  </h4>
                  {!isAdult && students.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeStudent(student.key)}
                      className="inline-flex items-center gap-1 text-xs text-red-600 transition hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      刪除
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      {isAdult ? "年齡" : "學生姓名"}
                    </label>
                    {isAdult ? (
                      <input
                        type="text"
                        value={student.studentAge}
                        onChange={(event) =>
                          updateStudent(student.key, {
                            studentAge: event.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    ) : (
                      <input
                        type="text"
                        value={student.studentName}
                        onChange={(event) =>
                          updateStudent(student.key, {
                            studentName: event.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    )}
                  </div>
                {!isAdult ? (
                  <div>
                    <label className="text-sm font-medium text-foreground">年齡</label>
                    <input
                      type="text"
                      value={student.studentAge}
                      onChange={(event) =>
                        updateStudent(student.key, {
                          studentAge: event.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                ) : null}
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground">
                    性別 <span className="text-gold">*</span>
                  </p>
                  <div className="mt-3 flex gap-4">
                    {(["male", "female"] as const).map((value) => (
                      <label
                        key={value}
                        className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                      >
                        <input
                          type="radio"
                          name={`gender-${student.key}`}
                          checked={student.gender === value}
                          onChange={() =>
                            updateStudent(student.key, { gender: value })
                          }
                          className="h-4 w-4 accent-gold"
                        />
                        {value === "male" ? "男" : "女"}
                      </label>
                    ))}
                  </div>
                  {!student.gender ? (
                    <p className="mt-1 text-xs text-muted">請選擇性別</p>
                  ) : null}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">備註</label>
                  <textarea
                    rows={2}
                    value={student.note}
                    onChange={(event) =>
                      updateStudent(student.key, { note: event.target.value })
                    }
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {usesSessions ? (
                  <div>
                    <p className="text-sm font-medium text-foreground">可報名時段</p>
                    {loadingSessions ? (
                      <p className="mt-2 text-sm text-muted">載入時段中…</p>
                    ) : (
                      <div className="mt-3 space-y-4">
                        {sessionGroups.map((group) => (
                          <div key={group.classId}>
                            <p className="text-xs font-medium text-muted">
                              {group.className} · {group.weekday}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {group.sessions.map((session) => {
                                const checked = student.sessionIds.includes(session.id);
                                return (
                                  <label
                                    key={session.id}
                                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                                      checked
                                        ? "border-gold bg-gold-soft text-gold"
                                        : "border-border text-foreground hover:border-gold/40"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() =>
                                        toggleSession(student.key, session.id)
                                      }
                                      className="sr-only"
                                    />
                                    {session.label}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </section>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
              disabled={isPending}
              className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-white transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "儲存中…" : "儲存變更"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
