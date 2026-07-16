export type BankTransferSettings = {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  transferDeadlineDays: number;
  reminderText: string;
};

export const DEFAULT_BANK_TRANSFER_SETTINGS: BankTransferSettings = {
  bankName: "台灣銀行",
  bankCode: "004",
  accountNumber: "123456789012",
  accountName: "晟心誠藝劇團",
  transferDeadlineDays: 3,
  reminderText: "請完成匯款後保留收據。",
};

export const SYSTEM_SETTING_KEYS = {
  bankTransfer: "bank_transfer",
  email: "email_settings",
} as const;

export type EmailSettings = {
  senderName: string;
  adminEmail: string;
  replyToEmail: string;
};

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  senderName: "晟心誠藝劇團",
  adminEmail: "",
  replyToEmail: "",
};
