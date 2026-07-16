import { NextResponse } from "next/server";
import {
  formBodyToRecord,
  verifyCheckMacValue,
} from "@/lib/ecpay/check-mac";
import { getEcpayConfig } from "@/lib/ecpay/config";
import { fulfillPaidOrder } from "@/lib/payment/fulfill-order";

export async function POST(request: Request) {
  const config = getEcpayConfig();

  if (!config) {
    console.error("[ECPay callback] configuration missing");
    return new NextResponse("0|ConfigError", { status: 500 });
  }

  const formData = await request.formData();
  const params = formBodyToRecord(formData);

  console.log("[ECPay callback] received payment", {
    merchantTradeNo: params.MerchantTradeNo,
    RtnCode: params.RtnCode,
    TradeNo: params.TradeNo,
    TradeAmt: params.TradeAmt,
  });

  if (!verifyCheckMacValue(params, config.hashKey, config.hashIv)) {
    console.error("[ECPay callback] invalid CheckMacValue", {
      merchantTradeNo: params.MerchantTradeNo,
      message: "CheckMacValue verification failed",
    });
    return new NextResponse("0|CheckMacError", { status: 400 });
  }

  const rtnCode = params.RtnCode;
  const merchantTradeNo = params.MerchantTradeNo;

  if (rtnCode === "1") {
    console.log("[ECPay callback] Calling fulfillPaidOrder", { merchantTradeNo });

    const result = await fulfillPaidOrder({
      merchantTradeNo,
      ecpayTradeNo: params.TradeNo ?? null,
      paymentType: params.PaymentType ?? null,
    });

    console.log("[ECPay callback] Fulfill Result", {
      merchantTradeNo,
      success: result.success,
      error: result.success ? undefined : result.error,
      alreadyPaid: result.success ? result.alreadyPaid : undefined,
    });

    if (!result.success) {
      console.error("[ECPay callback] fulfill failed", {
        merchantTradeNo,
        error: result.error,
      });
      return new NextResponse("0|FulfillError", { status: 500 });
    }

    return new NextResponse("1|OK");
  }

  console.warn("[ECPay callback] payment not successful", {
    merchantTradeNo,
    rtnCode,
    rtnMsg: params.RtnMsg,
  });

  return new NextResponse("1|OK");
}
