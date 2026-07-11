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
    console.error("ECPay callback: configuration missing");
    return new NextResponse("0|ConfigError", { status: 500 });
  }

  const formData = await request.formData();
  const params = formBodyToRecord(formData);

  if (!verifyCheckMacValue(params, config.hashKey, config.hashIv)) {
    console.error("ECPay callback: invalid CheckMacValue", params.MerchantTradeNo);
    return new NextResponse("0|CheckMacError", { status: 400 });
  }

  const rtnCode = params.RtnCode;
  const merchantTradeNo = params.MerchantTradeNo;

  if (rtnCode === "1") {
    console.log("ECPay callback payment success", { merchantTradeNo });

    const result = await fulfillPaidOrder({
      merchantTradeNo,
      ecpayTradeNo: params.TradeNo ?? null,
      paymentType: params.PaymentType ?? null,
    });

    if (!result.success) {
      console.error("ECPay callback fulfill failed:", result.error, merchantTradeNo);
      return new NextResponse("0|FulfillError", { status: 500 });
    }

    return new NextResponse("1|OK");
  }

  console.warn("ECPay callback payment not successful:", {
    merchantTradeNo,
    rtnCode,
    rtnMsg: params.RtnMsg,
  });

  return new NextResponse("1|OK");
}
