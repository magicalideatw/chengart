import { NextResponse } from "next/server";
import {
  formBodyToRecord,
  verifyCheckMacValue,
} from "@/lib/ecpay/check-mac";
import { getEcpayConfig, getPublicSiteUrl } from "@/lib/ecpay/config";
import { getOrderByMerchantTradeNo } from "@/lib/orders/queries";
import { fulfillPaidOrder } from "@/lib/payment/fulfill-order";

function redirectUrl(path: string): string {
  return `${getPublicSiteUrl()}${path}`;
}

export async function POST(request: Request) {
  const config = getEcpayConfig();

  if (!config) {
    console.error("[ECPay result] Config missing -> Redirect -> /payment/fail");
    return NextResponse.redirect(redirectUrl("/payment/fail"));
  }

  const formData = await request.formData();
  const params = formBodyToRecord(formData);
  const merchantTradeNo = params.MerchantTradeNo;

  console.log("[ECPay result] received payment", {
    merchantTradeNo,
    RtnCode: params.RtnCode,
    TradeNo: params.TradeNo,
    TradeAmt: params.TradeAmt,
  });

  if (!verifyCheckMacValue(params, config.hashKey, config.hashIv)) {
    console.error("[ECPay result] invalid CheckMacValue", {
      merchantTradeNo,
      message: "CheckMacValue verification failed",
    });
    console.error("[ECPay result] Redirect -> /payment/fail");
    return NextResponse.redirect(redirectUrl("/payment/fail"));
  }

  const order = await getOrderByMerchantTradeNo(merchantTradeNo);
  const orderQuery = order ? `?orderId=${order.id}` : "";

  if (params.RtnCode === "1") {
    console.log("[ECPay result] Calling fulfillPaidOrder", { merchantTradeNo });

    const result = await fulfillPaidOrder({
      merchantTradeNo,
      ecpayTradeNo: params.TradeNo ?? null,
      paymentType: params.PaymentType ?? null,
    });

    console.log("[ECPay result] fulfillPaidOrder result", {
      success: result.success,
      error: result.success ? undefined : result.error,
      alreadyPaid: result.success ? result.alreadyPaid : undefined,
    });

    if (!result.success) {
      console.error("[ECPay result] Redirect -> /payment/fail", {
        merchantTradeNo,
        orderId: order?.id,
        error: result.error,
      });
      return NextResponse.redirect(redirectUrl(`/payment/fail${orderQuery}`));
    }

    console.log("[ECPay result] Redirect -> /payment/success", {
      merchantTradeNo,
      orderId: order?.id,
    });
    return NextResponse.redirect(redirectUrl(`/payment/success${orderQuery}`));
  }

  console.warn("[ECPay result] payment not successful", {
    merchantTradeNo,
    RtnCode: params.RtnCode,
    RtnMsg: params.RtnMsg,
  });
  console.warn("[ECPay result] Redirect -> /payment/fail", {
    merchantTradeNo,
    orderId: order?.id,
  });

  return NextResponse.redirect(redirectUrl(`/payment/fail${orderQuery}`));
}
