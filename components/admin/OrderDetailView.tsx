"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, Mail, RefreshCw } from "lucide-react";
import { formatDateTime, formatFee } from "@/lib/admin/format";
import { getOrderEmailEventLabel } from "@/lib/admin/order-management";
import { ConfirmBankTransferModal } from "@/components/admin/ConfirmBankTransferModal";
import { ManualConfirmBankTransferModal } from "@/components/admin/ManualConfirmBankTransferModal";
import {
  canConfirmBankTransferPayment,
  canConfirmOnSitePayment,
  canManualConfirmBankTransferPayment,
  formatTransferDateDisplay,
  formatTransferTimeDisplay,
  getAdminPaymentStatusLabel,
  getAdminPaymentStatusStyle,
  isBankTransferOrder,
} from "@/lib/admin/order-transfer-display";
import type { AdminOrderDetail } from "@/lib/admin/order-detail";
import {
  cancelAdminOrder,
  confirmBankTransferPayment,
  confirmOnSitePayment,
  markAdminOrderRefunded,
  resendAdminPaymentEmail,
  resendAdminRegistrationEmail,
} from "@/lib/actions/admin/orders";
import { formatGender, normalizeGenderValue } from "@/lib/registration/gender";
import { StudentAttendanceSummary } from "@/components/admin/StudentAttendanceSummary";
import { Toast } from "@/components/ui/Toast";
import {
  formatPricingDiscountSummary,
  parsePricingSnapshot,
} from "@/lib/pricing/engine";
import { getPaymentMethodLabel } from "@/lib/payment/types";

type OrderDetailViewProps = {
  detail: AdminOrderDetail;
  canMutate: boolean;
};

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-white p-5 shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:p-6">
      <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-sm">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/60 pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:gap-4">
      <dt className="min-w-28 shrink-0 text-muted">{label}</dt>
      <dd className="flex-1 text-foreground">{value}</dd>
    </div>
  );
}

export function OrderDetailView({ detail, canMutate }: OrderDetailViewProps) {
  const { order, students, emailLogs } = detail;
  const [isPending, startTransition] = useTransition();
  const [toastVisible, setToastVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [isPaidLocally, setIsPaidLocally] = useState(false);
  const router = useRouter();
  const pricingSnapshot = parsePricingSnapshot(order.pricing_snapshot);
  const isAtm = isBankTransferOrder(order);

  const displayOrder = isPaidLocally
    ? {
        ...order,
        payment_status: "paid" as const,
        status: "paid" as const,
        order_status: "completed" as const,
      }
    : order;

  const canConfirmTransfer = canConfirmBankTransferPayment(displayOrder);
  const canConfirmOnSite = canConfirmOnSitePayment(displayOrder);
  const canManualConfirm = canManualConfirmBankTransferPayment(displayOrder);

  const runAction = (
    action: () => Promise<{ success: boolean; error?: string }>,
    onSuccess?: () => void,
  ) => {
    if (!canMutate) return;

    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        window.alert(result.error ?? "操作失敗");
        return;
      }
      onSuccess?.();
      router.refresh();
    });
  };

  const canCancel =
    displayOrder.payment_status !== "paid" &&
    displayOrder.payment_status !== "cancelled" &&
    displayOrder.payment_status !== "refunded";

  const handleConfirmBankTransfer = async () => {
    if (!canMutate) return;

    startTransition(async () => {
      const result = await confirmBankTransferPayment(order.id);
      if (!result.success) {
        window.alert(result.error ?? "操作失敗");
        return;
      }
      setIsPaidLocally(true);
      setModalOpen(false);
      setManualModalOpen(false);
      setToastVisible(true);
      router.refresh();
    });
  };

  return (
    <>
      <main className="mx-auto max-w-5xl space-y-6 px-5 py-10 md:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-gold"
            >
              <ArrowLeft className="h-4 w-4" />
              返回訂單列表
            </Link>
            <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground">
              訂單詳情
            </h1>
            <p className="mt-1 font-mono text-sm text-muted">
              {order.merchant_trade_no}
            </p>
          </div>

          {canMutate ? (
            <div className="flex flex-wrap gap-2">
              {canConfirmOnSite ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    if (!window.confirm("確認此訂單已完成現場收款？")) return;
                    runAction(() => confirmOnSitePayment(order.id), () => {
                      setIsPaidLocally(true);
                      setToastVisible(true);
                    });
                  }}
                  className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-white transition hover:bg-gold/90 disabled:opacity-50"
                >
                  {isPending ? "處理中..." : "確認現場收款"}
                </button>
              ) : null}
              {canConfirmTransfer ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setModalOpen(true)}
                  className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-white transition hover:bg-gold/90 disabled:opacity-50"
                >
                  {isPending ? "處理中..." : "確認收款"}
                </button>
              ) : null}
              {canManualConfirm ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setManualModalOpen(true)}
                  className="rounded-full border border-gold px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold-soft disabled:opacity-50"
                >
                  {isPending ? "處理中..." : "手動確認收款"}
                </button>
              ) : null}
              {canCancel ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    if (!window.confirm("確定要取消此訂單嗎？")) return;
                    runAction(() => cancelAdminOrder(order.id));
                  }}
                  className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                >
                  取消訂單
                </button>
              ) : null}
              {displayOrder.payment_status === "paid" ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    if (!window.confirm("確定要標記此訂單為已退款嗎？")) return;
                    runAction(() => markAdminOrderRefunded(order.id));
                  }}
                  className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-violet-300 hover:text-violet-700 disabled:opacity-50"
                >
                  標記已退款
                </button>
              ) : null}
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => resendAdminPaymentEmail(order.id),
                    () => window.alert("已重寄付款通知信"),
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-gold hover:text-gold disabled:opacity-50"
              >
                <Mail className="h-4 w-4" />
                重寄付款信
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => resendAdminRegistrationEmail(order.id),
                    () => window.alert("已重寄報名成功信"),
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-gold hover:text-gold disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                重寄報名信
              </button>
              <Link
                href={`/admin/registrations?q=${encodeURIComponent(order.name)}`}
                className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-gold hover:text-gold"
              >
                編輯報名
              </Link>
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="家長 / 成人資料">
            <dl>
              <InfoRow label="姓名" value={order.name} />
              <InfoRow label="Email" value={order.email} />
              <InfoRow label="電話" value={order.phone} />
              <InfoRow label="建立時間" value={formatDateTime(order.created_at)} />
              <InfoRow
                label="付款時間"
                value={formatDateTime(order.paid_at)}
              />
            </dl>
          </SectionCard>

          <SectionCard title="付款資訊">
            <dl>
              <InfoRow label="課程" value={order.course_title} />
              <InfoRow
                label="付款方式"
                value={getPaymentMethodLabel(order.payment_method)}
              />
              <InfoRow
                label="付款狀態"
                value={
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getAdminPaymentStatusStyle(displayOrder)}`}
                  >
                    {getAdminPaymentStatusLabel(displayOrder)}
                  </span>
                }
              />
              <InfoRow label="報名狀態" value={order.registrationStatusLabel} />
              {order.ecpay_trade_no ? (
                <InfoRow label="ECPay 交易號" value={order.ecpay_trade_no} />
              ) : null}
            </dl>
          </SectionCard>
        </div>

        {isAtm ? (
          <SectionCard title="匯款回報資訊">
            <dl>
              <InfoRow
                label="已回報"
                value={order.transfer_reported ? "✅ 是" : "否"}
              />
              {order.transfer_reported ? (
                <>
                  <InfoRow
                    label="後五碼"
                    value={order.transfer_last5 ?? "—"}
                  />
                  <InfoRow
                    label="匯款日期"
                    value={formatTransferDateDisplay(order.transfer_date)}
                  />
                  <InfoRow
                    label="匯款時間"
                    value={formatTransferTimeDisplay(order.transfer_time)}
                  />
                  <InfoRow
                    label="備註"
                    value={order.transfer_note?.trim() || "—"}
                  />
                  {order.transfer_reported_at ? (
                    <InfoRow
                      label="回報時間"
                      value={formatDateTime(order.transfer_reported_at)}
                    />
                  ) : null}
                </>
              ) : null}
            </dl>
          </SectionCard>
        ) : null}

        <SectionCard title="學生資料">
          {students.length === 0 ? (
            <p className="text-muted">尚無學生資料</p>
          ) : (
            <div className="space-y-4">
              {students.map((student, index) => (
                <div
                  key={`${student.studentName}-${index}`}
                  className="rounded-2xl border border-border/70 p-4"
                >
                  <p className="font-medium text-foreground">
                    學生 {index + 1}：{student.studentName}
                  </p>
                  <dl className="mt-3 space-y-2">
                    <InfoRow label="年齡" value={`${student.studentAge} 歲`} />
                    <InfoRow
                      label="性別"
                      value={formatGender(normalizeGenderValue(student.gender))}
                    />
                    {student.note ? (
                      <InfoRow label="備註" value={student.note} />
                    ) : null}
                    <InfoRow
                      label="報名時段"
                      value={
                        student.sessions.length > 0 ? (
                          <ul className="space-y-1">
                            {student.sessions.map((session) => (
                              <li key={session.sessionId}>
                                {session.scheduleLine}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          "—"
                        )
                      }
                    />
                  </dl>
                  <div className="mt-4 border-t border-border/70 pt-4">
                    <p className="text-sm font-medium text-foreground">出席紀錄</p>
                    <div className="mt-2">
                      <StudentAttendanceSummary
                        stats={student.attendanceStats}
                        records={student.attendanceRecords}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="價格計算">
          <dl>
            <InfoRow
              label="原價"
              value={formatFee(
                order.subtotal ?? pricingSnapshot?.subtotal ?? order.amount,
              )}
            />
            <InfoRow
              label="優惠"
              value={
                pricingSnapshot
                  ? formatPricingDiscountSummary(pricingSnapshot)
                  : order.discount_total > 0
                    ? `- ${formatFee(order.discount_total)}`
                    : "—"
              }
            />
            <InfoRow label="折扣碼" value={order.promo_code ?? "—"} />
            <InfoRow label="實付金額" value={formatFee(order.amount)} />
          </dl>
        </SectionCard>

        <SectionCard title="Email 寄送紀錄">
          {emailLogs.length === 0 ? (
            <p className="text-muted">尚無寄送紀錄（新寄送的信件會自動記錄）</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="py-2 pr-4">時間</th>
                    <th className="py-2 pr-4">類型</th>
                    <th className="py-2 pr-4">收件人</th>
                    <th className="py-2 pr-4">主旨</th>
                    <th className="py-2">狀態</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border/60">
                      <td className="whitespace-nowrap py-3 pr-4 text-muted">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="py-3 pr-4">
                        {getOrderEmailEventLabel(log.event)}
                      </td>
                      <td className="py-3 pr-4">{log.recipient}</td>
                      <td className="max-w-[200px] truncate py-3 pr-4">
                        {log.subject}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            log.status === "sent"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {log.status === "sent" ? "已寄送" : "失敗"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </main>

      <ConfirmBankTransferModal
        order={order}
        open={modalOpen}
        isSubmitting={isPending}
        onClose={() => {
          if (isPending) return;
          setModalOpen(false);
        }}
        onConfirm={() => void handleConfirmBankTransfer()}
      />

      <ManualConfirmBankTransferModal
        order={order}
        open={manualModalOpen}
        isSubmitting={isPending}
        onClose={() => {
          if (isPending) return;
          setManualModalOpen(false);
        }}
        onConfirm={() => void handleConfirmBankTransfer()}
      />

      <Toast
        title="✅ 已確認收款"
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </>
  );
}
