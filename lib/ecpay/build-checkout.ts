import { createCheckMacValue } from "@/lib/ecpay/check-mac";
import {
  formatMerchantTradeDate,
  getEcpayConfig,
} from "@/lib/ecpay/config";

export type EcpayCheckoutParams = {
  merchantTradeNo: string;
  amount: number;
  itemName: string;
  tradeDesc: string;
  clientBackUrl: string;
};

export function buildEcpayCheckoutForm(
  input: EcpayCheckoutParams,
): { actionUrl: string; fields: Record<string, string> } | null {
  const config = getEcpayConfig();
  if (!config) return null;

  const fields: Record<string, string> = {
    MerchantID: config.merchantId,
    MerchantTradeNo: input.merchantTradeNo,
    MerchantTradeDate: formatMerchantTradeDate(),
    PaymentType: "aio",
    TotalAmount: String(input.amount),
    TradeDesc: input.tradeDesc,
    ItemName: input.itemName,
    ReturnURL: config.returnUrl,
    OrderResultURL: config.orderResultUrl,
    ClientBackURL: input.clientBackUrl,
    ChoosePayment: "ALL",
    IgnorePayment: "CVS#BARCODE#WebATM#ApplePay#GooglePay#TWQR#BNPL#WeiXin",
    EncryptType: "1",
  };

  fields.CheckMacValue = createCheckMacValue(
    fields,
    config.hashKey,
    config.hashIv,
  );

  return {
    actionUrl: config.actionUrl,
    fields,
  };
}
