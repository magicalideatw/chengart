import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatFee } from "@/lib/admin/format";
import { getOrderById } from "@/lib/orders/queries";
import { isOrderPaid } from "@/lib/orders/types";
import { getBankTransferSettings } from "@/lib/settings/queries";

export const dynamic = "force-dynamic";

type BankTransferPageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function BankTransferPage({ params }: BankTransferPageProps) {
  const { orderId } = await params;
  const order = await getOrderById(orderId);

  if (!order) {
    notFound();
  }

  if (isOrderPaid(order)) {
    redirect(`/payment/success?orderId=${order.id}`);
  }

  if (order.payment_method !== "bank_transfer") {
    redirect(`/payment/fail?orderId=${order.id}`);
  }

  const bankSettings = await getBankTransferSettings();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
          Bank Transfer
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-foreground">
          報名成功
        </h1>
        <p className="mt-3 text-sm text-muted">
          請於 {bankSettings.transferDeadlineDays} 天內完成匯款，匯款完成後請保留收據。
        </p>

        <dl className="mt-8 space-y-3 rounded-2xl border border-border bg-surface px-5 py-4 text-sm">
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
          <div className="my-2 border-t border-border" />
          <div className="flex justify-between gap-4">
            <dt className="text-muted">銀行</dt>
            <dd className="font-medium text-foreground">{bankSettings.bankName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">代碼</dt>
            <dd className="font-medium text-foreground">{bankSettings.bankCode}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">帳號</dt>
            <dd className="font-medium text-foreground">{bankSettings.accountNumber}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">戶名</dt>
            <dd className="font-medium text-foreground">{bankSettings.accountName}</dd>
          </div>
        </dl>

        <p className="mt-4 text-sm text-muted">{bankSettings.reminderText}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex flex-1 items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:bg-surface"
          >
            返回首頁
          </Link>
          <Link
            href={`/payment/success?orderId=${order.id}&pending=1`}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-medium text-white transition hover:bg-gold-light"
          >
            查看訂單
          </Link>
        </div>
      </div>
    </div>
  );
}
