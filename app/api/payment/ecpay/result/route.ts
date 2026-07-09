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
    return NextResponse.redirect(redirectUrl("/payment/fail"));
  }

  const formData = await request.formData();
  const params = formBodyToRecord(formData);
  const merchantTradeNo = params.MerchantTradeNo;

  if (!verifyCheckMacValue(params, config.hashKey, config.hashIv)) {
    console.error("ECPay result: invalid CheckMacValue", merchantTradeNo);
    return NextResponse.redirect(redirectUrl("/payment/fail"));
  }

  const order = await getOrderByMerchantTradeNo(merchantTradeNo);
  const orderQuery = order ? `?orderId=${order.id}` : "";

  if (params.RtnCode === "1") {
    const result = await fulfillPaidOrder({
      merchantTradeNo,
      ecpayTradeNo: params.TradeNo ?? null,
      paymentType: params.PaymentType ?? null,
    });

    if (!result.success) {
      console.error("ECPay result fulfill failed:", result.error, merchantTradeNo);
      return NextResponse.redirect(redirectUrl(`/payment/fail${orderQuery}`));
    }

    return NextResponse.redirect(redirectUrl(`/payment/success${orderQuery}`));
  }

  console.warn("ECPay result payment failed:", {
    merchantTradeNo,
    rtnCode: params.RtnCode,
    rtnMsg: params.RtnMsg,
  });

  return NextResponse.redirect(redirectUrl(`/payment/fail${orderQuery}`));
}
