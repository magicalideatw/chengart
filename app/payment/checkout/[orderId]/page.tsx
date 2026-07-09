import { notFound, redirect } from "next/navigation";
import { buildEcpayCheckoutForm } from "@/lib/ecpay/build-checkout";
import { getPublicSiteUrl } from "@/lib/ecpay/config";
import { siteConfig } from "@/lib/data/site";
import { getOrderById } from "@/lib/orders/queries";
import { EcpayCheckoutForm } from "@/components/payment/EcpayCheckoutForm";

export const dynamic = "force-dynamic";

type CheckoutPageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function PaymentCheckoutPage({ params }: CheckoutPageProps) {
  const { orderId } = await params;
  const order = await getOrderById(orderId);

  if (!order) {
    notFound();
  }

  if (order.status === "paid") {
    redirect(`/payment/success?orderId=${order.id}`);
  }

  if (order.status !== "pending") {
    redirect(`/payment/fail?orderId=${order.id}`);
  }

  const siteUrl = getPublicSiteUrl();
  const checkout = buildEcpayCheckoutForm({
    merchantTradeNo: order.merchant_trade_no,
    amount: order.amount,
    itemName: order.course_title.slice(0, 200),
    tradeDesc: `${siteConfig.name}課程報名`,
    clientBackUrl: `${siteUrl}/payment/cancel?orderId=${order.id}`,
  });

  if (!checkout) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5">
        <div className="max-w-md rounded-3xl border border-border bg-white p-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            金流尚未設定
          </h1>
          <p className="mt-3 text-sm text-muted">請聯絡管理員完成金流設定後再試。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="max-w-md rounded-3xl border border-border bg-white p-8 text-center shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
          Payment
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-foreground">
          正在前往綠界付款
        </h1>
        <p className="mt-3 text-sm text-muted">
          請稍候，系統將自動跳轉至安全付款頁面…
        </p>
        <p className="mt-6 text-xs text-muted">若未自動跳轉，請稍後重新整理此頁。</p>
        <EcpayCheckoutForm actionUrl={checkout.actionUrl} fields={checkout.fields} />
      </div>
    </div>
  );
}
