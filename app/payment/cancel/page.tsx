import Link from "next/link";
import { getOrderById } from "@/lib/orders/queries";

export const dynamic = "force-dynamic";

type PaymentCancelPageProps = {
  searchParams: Promise<{ orderId?: string }>;
};

export default async function PaymentCancelPage({
  searchParams,
}: PaymentCancelPageProps) {
  const { orderId } = await searchParams;
  const order = orderId ? await getOrderById(orderId) : null;
  const canRetry = order?.status === "pending";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-white p-8 text-center shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
          Payment Cancelled
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-foreground">
          已取消付款
        </h1>
        <p className="mt-3 text-sm text-muted">
          您已取消付款，訂單仍保留，可稍後重新付款完成報名。
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {canRetry && order && (
            <Link
              href={`/payment/checkout/${order.id}`}
              className="inline-flex rounded-full bg-gold px-6 py-3 text-sm font-medium text-white transition hover:bg-gold-light"
            >
              重新付款
            </Link>
          )}
          <Link
            href="/"
            className="inline-flex rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:bg-surface"
          >
            返回首頁
          </Link>
        </div>
      </div>
    </div>
  );
}
