export const PAYMENT_METHODS = ["free", "ecpay", "bank_transfer"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAID_PAYMENT_METHODS = ["ecpay", "bank_transfer"] as const;

export type PaidPaymentMethod = (typeof PAID_PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "waiting_transfer",
  "paid",
  "cancelled",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  free: "免費",
  ecpay: "信用卡",
  bank_transfer: "銀行轉帳",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "待付款",
  waiting_transfer: "待匯款",
  paid: "已付款",
  cancelled: "已取消",
};

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return (
    typeof value === "string" &&
    PAYMENT_METHODS.includes(value as PaymentMethod)
  );
}

export function parsePaymentMethods(value: unknown): PaymentMethod[] {
  if (!Array.isArray(value)) {
    return ["ecpay"];
  }

  const methods = value.filter(isPaymentMethod);
  return methods.length > 0 ? methods : ["ecpay"];
}

export function parsePaidPaymentMethods(value: unknown): PaidPaymentMethod[] {
  const methods = parsePaymentMethods(value).filter(
    (method): method is PaidPaymentMethod =>
      method === "ecpay" || method === "bank_transfer",
  );

  return methods.length > 0 ? methods : ["ecpay"];
}

export function resolveAvailablePaymentMethods(input: {
  allowedMethods: PaymentMethod[];
  totalAmount: number;
}): PaymentMethod[] {
  if (input.totalAmount <= 0) {
    return ["free"];
  }

  return input.allowedMethods.filter(
    (method): method is PaidPaymentMethod =>
      method === "ecpay" || method === "bank_transfer",
  );
}

export function resolveDefaultPaymentMethod(
  availableMethods: PaymentMethod[],
): PaymentMethod | null {
  if (availableMethods.length === 0) return null;
  if (availableMethods.includes("free")) return "free";
  return availableMethods[0];
}

export function getPaymentMethodLabel(method: string | null | undefined): string {
  if (!method) return "—";
  if (isPaymentMethod(method)) {
    return PAYMENT_METHOD_LABELS[method];
  }
  return method;
}

export function getPaymentStatusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  if (PAYMENT_STATUSES.includes(status as PaymentStatus)) {
    return PAYMENT_STATUS_LABELS[status as PaymentStatus];
  }
  return status;
}
