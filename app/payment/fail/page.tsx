import Link from "next/link";
import { getOrderById } from "@/lib/orders/queries";

export const dynamic = "force-dynamic";

type PaymentFailPageProps = {
  searchParams: Promise<{ orderId?: string }>;
};

export default async function PaymentFailPage({ searchParams }: PaymentFailPageProps) {
  const { orderId } = await searchParams;
  const order = orderId ? await getOrderById(orderId) : null;
  const canRetry = order?.status === "pending";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-white p-8 text-center shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
          Payment Failed
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-foreground">
          付款未完成
        </h1>
        <p className="mt-3 text-sm text-muted">
          付款未成功，您的報名尚未成立。您可以重新嘗試付款。
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
