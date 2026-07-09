const PAYMENT_METHOD_LABELS: Record<string, string> = {
  Credit: "信用卡",
  Credit_CreditCard: "信用卡",
  ATM: "ATM 轉帳",
  ATM_BOT: "ATM 轉帳",
  ATM_CHINATRUST: "ATM 轉帳",
  ATM_FIRST: "ATM 轉帳",
  ATM_LAND: "ATM 轉帳",
  ATM_TAISHIN: "ATM 轉帳",
  LINEPay: "LINE Pay",
  LINEPAY: "LINE Pay",
  LinePay: "LINE Pay",
};

export function formatEcpayPaymentMethod(paymentType?: string | null): string {
  if (!paymentType) return "—";
  return PAYMENT_METHOD_LABELS[paymentType] ?? paymentType;
}
