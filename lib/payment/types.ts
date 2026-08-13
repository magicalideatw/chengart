export const PAYMENT_METHODS = ["free", "ecpay", "bank_transfer", "on_site"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAID_PAYMENT_METHODS = ["ecpay", "bank_transfer"] as const;

export type PaidPaymentMethod = (typeof PAID_PAYMENT_METHODS)[number];

/** Admin-configurable checkout methods stored in courses.allowed_payment_methods (excludes free). */
export const CHECKOUT_PAYMENT_METHODS = [
  "ecpay",
  "bank_transfer",
  "on_site",
] as const;

export type CheckoutPaymentMethod = (typeof CHECKOUT_PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "waiting_transfer",
  "paid",
  "cancelled",
  "refunded",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  free: "免費",
  ecpay: "信用卡（ECPay）",
  bank_transfer: "銀行轉帳",
  on_site: "現場繳費",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "待付款",
  waiting_transfer: "待匯款",
  paid: "已付款",
  cancelled: "已取消",
  refunded: "已退款",
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
  return parseCheckoutPaymentMethods(value).filter(
    (method): method is PaidPaymentMethod =>
      method === "ecpay" || method === "bank_transfer",
  );
}

export function parseCheckoutPaymentMethods(
  value: unknown,
): CheckoutPaymentMethod[] {
  const methods = parsePaymentMethods(value).filter(
    (method): method is CheckoutPaymentMethod =>
      method === "ecpay" || method === "bank_transfer" || method === "on_site",
  );

  return methods.length > 0 ? methods : ["ecpay"];
}

export function allowsOnSitePayment(
  allowedMethods: PaymentMethod[],
): boolean {
  return allowedMethods.includes("on_site");
}

export function resolveOnlinePaymentMethods(input: {
  allowedMethods: PaymentMethod[];
  totalAmount: number;
}): PaidPaymentMethod[] {
  if (input.totalAmount <= 0) {
    return [];
  }

  return input.allowedMethods.filter(
    (method): method is PaidPaymentMethod =>
      method === "ecpay" || method === "bank_transfer",
  );
}

export function resolveAvailablePaymentMethods(input: {
  allowedMethods: PaymentMethod[];
  totalAmount: number;
}): PaymentMethod[] {
  if (input.totalAmount <= 0) {
    return ["free"];
  }

  const methods: PaymentMethod[] = resolveOnlinePaymentMethods(input);
  if (allowsOnSitePayment(input.allowedMethods)) {
    methods.push("on_site");
  }

  return methods;
}

export function resolveDefaultPaymentMethod(
  availableMethods: PaymentMethod[],
): PaymentMethod | null {
  if (availableMethods.length === 0) return null;
  if (availableMethods.includes("free")) return "free";
  return availableMethods[0];
}

export function resolveDefaultCheckoutPaymentMethod(input: {
  allowedMethods: PaymentMethod[];
  totalAmount: number;
}): PaymentMethod | null {
  if (input.totalAmount <= 0) {
    return "free";
  }

  const availableMethods = resolveAvailablePaymentMethods(input);
  return resolveDefaultPaymentMethod(availableMethods);
}

export function getPaymentMethodLabel(method: string | null | undefined): string {
  if (!method) return "—";
  if (isPaymentMethod(method)) {
    return PAYMENT_METHOD_LABELS[method];
  }
  return method;
}

/** Checkout / registration selector label (display only; does not affect payment logic). */
export function getPaymentMethodCheckoutLabel(method: PaymentMethod): string {
  if (method === "ecpay") {
    return "信用卡";
  }
  if (method === "on_site") {
    return "現場繳費";
  }
  return PAYMENT_METHOD_LABELS[method];
}

/** Display label for the confirmation summary; does not affect checkout flow. */
export function resolvePaymentMethodDisplayLabel(input: {
  totalAmount: number;
  paymentMethod: PaymentMethod | null | undefined;
}): string {
  if (input.totalAmount <= 0) {
    return PAYMENT_METHOD_LABELS.free;
  }

  if (input.paymentMethod === "on_site") {
    return PAYMENT_METHOD_LABELS.on_site;
  }

  if (
    input.paymentMethod === "ecpay" ||
    input.paymentMethod === "bank_transfer"
  ) {
    return getPaymentMethodCheckoutLabel(input.paymentMethod);
  }

  return "請選擇付款方式";
}

export function resolveConfirmStepSubtitle(input: {
  totalAmount: number;
  paymentMethod: PaymentMethod | null | undefined;
}): string {
  if (input.totalAmount <= 0) {
    return "確認無誤後，將直接完成報名。";
  }

  if (input.paymentMethod === "on_site") {
    return "確認無誤後，將直接完成報名，請於上課／活動當日現場繳費。";
  }

  if (input.paymentMethod === "bank_transfer") {
    return "確認無誤後，將顯示銀行匯款資訊。";
  }

  if (input.paymentMethod === "ecpay") {
    return "確認無誤後，將前往安全付款頁面（支援 LINE Pay、信用卡、ATM）。";
  }

  return "請選擇付款方式後，再確認報名。";
}

export function getPaymentStatusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  if (PAYMENT_STATUSES.includes(status as PaymentStatus)) {
    return PAYMENT_STATUS_LABELS[status as PaymentStatus];
  }
  return status;
}

export function isOnlinePaymentMethod(
  method: PaymentMethod | null | undefined,
): method is PaidPaymentMethod {
  return method === "ecpay" || method === "bank_transfer";
}
