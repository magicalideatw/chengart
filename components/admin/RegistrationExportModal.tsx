"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { getRegistrationExportSource } from "@/lib/actions/admin/export-registrations";
import { downloadRegistrationExportExcel } from "@/lib/admin/registration-export-excel";
import {
  collectAvailableSessionDates,
  filterRegistrationExportRows,
  flattenRegistrationExportRows,
  sanitizeExportFilename,
  type RegistrationExportPaymentFilter,
  type RegistrationExportSortBy,
} from "@/lib/admin/registration-export";
import type { Course } from "@/lib/courses/types";

type RegistrationExportModalProps = {
  course: Course | null;
  open: boolean;
  onClose: () => void;
  onExported: () => void;
};

export function RegistrationExportModal({
  course,
  open,
  onClose,
  onExported,
}: RegistrationExportModalProps) {
  const [paymentFilter, setPaymentFilter] =
    useState<RegistrationExportPaymentFilter>("all");
  const [sessionMode, setSessionMode] = useState<"all" | "selected">("all");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<RegistrationExportSortBy>("created_at");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceSessionDate, setSourceSessionDate] = useState("");
  const [flatRows, setFlatRows] = useState<
    ReturnType<typeof flattenRegistrationExportRows>
  >([]);

  useEffect(() => {
    if (!open) return;

    setPaymentFilter("all");
    setSessionMode("all");
    setSelectedDates([]);
    setSortBy("created_at");
    setError(null);
    setIsLoading(true);

    void (async () => {
      const result = await getRegistrationExportSource(course?.id);
      if (!result.success) {
        setError(result.error);
        setFlatRows([]);
        setIsLoading(false);
        return;
      }

      const rows = flattenRegistrationExportRows(
        result.data.registrations,
        result.data.orders,
      );
      setFlatRows(rows);
      setSourceTitle(result.data.courseTitle);
      setSourceSessionDate(result.data.courseSessionDate);
      setIsLoading(false);
    })();
  }, [course, open]);

  const availableDates = useMemo(
    () => collectAvailableSessionDates(flatRows),
    [flatRows],
  );

  const toggleDate = (isoDate: string) => {
    setSelectedDates((current) =>
      current.includes(isoDate)
        ? current.filter((value) => value !== isoDate)
        : [...current, isoDate],
    );
  };

  const handleDownload = async () => {
    setError(null);

    if (sessionMode === "selected" && selectedDates.length === 0) {
      setError("請至少選擇一個 Session 日期");
      return;
    }

    setIsExporting(true);

    try {
      const filtered = filterRegistrationExportRows(flatRows, {
        paymentFilter,
        sessionDates: sessionMode === "all" ? "all" : selectedDates,
        sortBy,
      });

      const title = course?.title ?? sourceTitle ?? "全部活動報名";
      const filename = sanitizeExportFilename(title);

      await downloadRegistrationExportExcel({
        courseTitle: title,
        courseSessionDate: course?.sessionDate ?? sourceSessionDate,
        rows: filtered,
        filename,
      });

      onExported();
      onClose();
    } catch (downloadError) {
      console.error("Registration export failed:", downloadError);
      setError("匯出失敗，請稍後再試");
    } finally {
      setIsExporting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="registration-export-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="registration-export-title"
              className="font-display text-xl font-semibold text-foreground"
            >
              匯出報名資料
            </h2>
            {course ? (
              <p className="mt-1 text-sm text-muted">{course.title}</p>
            ) : (
              <p className="mt-1 text-sm text-muted">全部活動報名</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="rounded-full p-1 text-muted transition hover:bg-surface hover:text-foreground disabled:opacity-50"
            aria-label="關閉"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <p className="mt-8 text-sm text-muted">載入報名資料中…</p>
        ) : (
          <div className="mt-6 space-y-6">
            <section>
              <div className="space-y-2">
                {(
                  [
                    ["all", "全部報名"],
                    ["paid", "僅已付款"],
                    ["unpaid", "僅未付款"],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                  >
                    <input
                      type="radio"
                      name="paymentFilter"
                      checked={paymentFilter === value}
                      onChange={() => setPaymentFilter(value)}
                      className="h-4 w-4 border-border text-gold focus:ring-gold"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </section>

            <section>
              <p className="text-sm font-medium text-foreground">Session</p>
              <div className="mt-3 space-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input
                    type="radio"
                    name="sessionMode"
                    checked={sessionMode === "all"}
                    onChange={() => setSessionMode("all")}
                    className="h-4 w-4 border-border text-gold focus:ring-gold"
                  />
                  全部日期
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input
                    type="radio"
                    name="sessionMode"
                    checked={sessionMode === "selected"}
                    onChange={() => setSessionMode("selected")}
                    disabled={availableDates.length === 0}
                    className="h-4 w-4 border-border text-gold focus:ring-gold disabled:opacity-40"
                  />
                  指定日期
                </label>
              </div>

              {sessionMode === "selected" && availableDates.length > 0 ? (
                <div className="mt-3 space-y-2 rounded-2xl border border-border bg-surface px-4 py-3">
                  {availableDates.map(({ isoDate, label }) => (
                    <label
                      key={isoDate}
                      className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDates.includes(isoDate)}
                        onChange={() => toggleDate(isoDate)}
                        className="h-4 w-4 rounded border-border text-gold focus:ring-gold"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              ) : null}

              {sessionMode === "selected" && availableDates.length === 0 ? (
                <p className="mt-2 text-xs text-muted">目前沒有可篩選的 Session 日期</p>
              ) : null}
            </section>

            <section>
              <p className="text-sm font-medium text-foreground">排序方式</p>
              <div className="mt-3 space-y-2">
                {(
                  [
                    ["created_at", "報名時間"],
                    ["name", "學生姓名"],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                  >
                    <input
                      type="radio"
                      name="sortBy"
                      checked={sortBy === value}
                      onChange={() => setSortBy(value)}
                      className="h-4 w-4 border-border text-gold focus:ring-gold"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </section>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:bg-surface disabled:opacity-60"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={isLoading || isExporting}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-medium text-white transition hover:bg-gold-light disabled:opacity-60"
          >
            {isExporting ? "匯出中…" : "下載 Excel"}
          </button>
        </div>
      </div>
    </div>
  );
}
