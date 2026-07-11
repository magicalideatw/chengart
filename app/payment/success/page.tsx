import Link from "next/link";
import { formatFee } from "@/lib/admin/format";
import { getCourseById } from "@/lib/courses/queries";
import { getCourseTransferDeadlineDays } from "@/lib/courses/enrollment";
import { getOrderById } from "@/lib/orders/queries";
import { isOrderPaid } from "@/lib/orders/types";
import {
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from "@/lib/payment/types";
import { getBankTransferSettings } from "@/lib/settings/queries";

export const dynamic = "force-dynamic";

type PaymentSuccessPageProps = {
  searchParams: Promise<{ orderId?: string; pending?: string }>;
};

export default async function PaymentSuccessPage({
  searchParams,
}: PaymentSuccessPageProps) {
  const { orderId, pending } = await searchParams;
  const order = orderId ? await getOrderById(orderId) : null;
  const isPendingView = pending === "1" && order && !isOrderPaid(order);
  const isFree = order?.payment_method === "free";
  const isBankTransferPending =
    isPendingView && order?.payment_method === "bank_transfer";

  const [bankSettings, course] = order
    ? await Promise.all([
        getBankTransferSettings(),
        getCourseById(order.course_id),
      ])
    : [null, null];

  const transferDeadlineDays =
    order && bankSettings
      ? getCourseTransferDeadlineDays(
          course ?? { transferDeadlineDays: null },
          bankSettings.transferDeadlineDays,
        )
      : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-white p-8 text-center shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
          {isPendingView ? "Order Pending" : "Payment Success"}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-foreground">
          {isPendingView
            ? "訂單已建立"
            : isFree
              ? "報名成功"
              : "付款成功"}
        </h1>
        <p className="mt-3 text-sm text-muted">
          {isPendingView
            ? isBankTransferPending && transferDeadlineDays
              ? `您的訂單已建立，請於 ${transferDeadlineDays} 天內完成匯款。管理員確認收款後，報名才會正式生效。`
              : "您的訂單已建立，請依指示完成匯款。管理員確認收款後，報名才會正式生效。"
            : isFree
              ? "您的報名已完成，確認信將寄送至您的 Email。"
              : "感謝您的報名，我們已收到您的付款，確認信將寄送至您的 Email。"}
        </p>

        {order && (
          <dl className="mt-8 space-y-3 rounded-2xl border border-border bg-surface px-5 py-4 text-left text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">訂單編號</dt>
              <dd className="font-medium text-foreground">{order.merchant_trade_no}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">課程</dt>
              <dd className="font-medium text-foreground">{order.course_title}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">金額</dt>
              <dd className="font-medium text-foreground">{formatFee(order.amount)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">付款方式</dt>
              <dd className="font-medium text-foreground">
                {getPaymentMethodLabel(order.payment_method)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">狀態</dt>
              <dd className="font-medium text-foreground">
                {getPaymentStatusLabel(order.payment_status)}
              </dd>
            </div>
          </dl>
        )}

        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-gold px-6 py-3 text-sm font-medium text-white transition hover:bg-gold-light"
        >
          返回首頁
        </Link>
      </div>
    </div>
  );
}
