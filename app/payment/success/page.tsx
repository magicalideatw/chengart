import Link from "next/link";
import { formatFee } from "@/lib/admin/format";
import { getOrderById } from "@/lib/orders/queries";

export const dynamic = "force-dynamic";

type PaymentSuccessPageProps = {
  searchParams: Promise<{ orderId?: string }>;
};

export default async function PaymentSuccessPage({
  searchParams,
}: PaymentSuccessPageProps) {
  const { orderId } = await searchParams;
  const order = orderId ? await getOrderById(orderId) : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-white p-8 text-center shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
          Payment Success
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-foreground">
          付款成功
        </h1>
        <p className="mt-3 text-sm text-muted">
          感謝您的報名，我們已收到您的付款，確認信將寄送至您的 Email。
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
