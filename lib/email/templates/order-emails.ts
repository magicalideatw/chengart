import type { OrderEmailData, OrderEmailEvent, RenderedEmail } from "@/lib/email/types";
import {
  escapeHtml,
  renderEmailRow,
  renderEmailShell,
} from "@/lib/email/templates/layout";
import { siteConfig } from "@/lib/data/site";

const MUTED = "#6b6b6b";
const FOREGROUND = "#0a0a0a";
const BORDER = "#e8e8e8";

function renderStudentRows(data: OrderEmailData): string {
  if (data.students.length === 0) {
    return renderEmailRow("學生姓名", data.studentNames || "—");
  }

  return data.students
    .map((student, index) =>
      [
        renderEmailRow(`學生 ${index + 1}`, `${student.name}（${student.age} 歲）`),
        renderEmailRow(`上課日期 ${index + 1}`, student.sessionDates),
        renderEmailRow(`上課時間 ${index + 1}`, student.sessionTimes),
      ].join(""),
    )
    .join("");
}

function renderOrderDetailRows(data: OrderEmailData): string {
  return [
    renderEmailRow("課程名稱", data.courseTitle),
    renderEmailRow("家長姓名", data.parentName),
    renderEmailRow("所有學生姓名", data.studentNames || "—"),
    renderStudentRows(data),
    renderEmailRow("上課日期", data.sessionDate),
    renderEmailRow("上課時間", data.sessionTime),
    renderEmailRow("付款方式", data.paymentMethodLabel),
    renderEmailRow("付款狀態", data.paymentStatusLabel),
    renderEmailRow("原價", data.subtotalLabel),
    renderEmailRow("優惠", data.discountLabel),
    renderEmailRow("折扣碼", data.promoCodeLabel),
    renderEmailRow("最後付款金額", data.amountLabel),
    renderEmailRow("訂單編號", data.merchantTradeNo),
    renderEmailRow("報名時間", data.registeredAt),
  ].join("");
}

function renderBankTransferRows(data: OrderEmailData): string {
  if (!data.bankTransfer) return "";

  const bank = data.bankTransfer;

  return [
    `<tr><td colspan="2" style="padding:16px 16px 8px;color:${FOREGROUND};font-size:15px;font-weight:600;">匯款資訊</td></tr>`,
    renderEmailRow("銀行", bank.bankName),
    renderEmailRow("代碼", bank.bankCode),
    renderEmailRow("帳號", bank.accountNumber),
    renderEmailRow("戶名", bank.accountName),
    renderEmailRow("匯款期限", bank.transferDeadlineLabel),
    renderEmailRow("提醒", bank.reminderText),
  ].join("");
}

function renderDetailsTable(data: OrderEmailData, includeBankTransfer = false): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${BORDER};border-radius:16px;overflow:hidden;background:#ffffff;">
      ${renderOrderDetailRows(data)}
      ${includeBankTransfer ? renderBankTransferRows(data) : ""}
    </table>
  `;
}

function renderParentIntro(data: OrderEmailData, message: string): string {
  return `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:${FOREGROUND};">
      親愛的 ${escapeHtml(data.parentName)} 您好，
    </p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:${MUTED};">${escapeHtml(message)}</p>
  `;
}

function renderAdminIntro(): string {
  return `
    <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:${MUTED};">
      有一筆新的課程報名訂單，請查看以下資訊：
    </p>
  `;
}

export function renderOrderEmail(
  event: OrderEmailEvent,
  data: OrderEmailData,
): RenderedEmail {
  switch (event) {
    case "admin_new_order":
      return {
        subject: `【${siteConfig.name}】新訂單通知－${data.courseTitle}`,
        html: renderEmailShell(
          "新訂單通知",
          `${renderAdminIntro()}${renderDetailsTable(data, data.paymentMethod === "bank_transfer")}`,
        ),
      };

    case "parent_registration_success":
      return {
        subject: `【${siteConfig.name}】報名成功`,
        html: renderEmailShell(
          "報名成功",
          `${renderParentIntro(data, "您已成功完成報名，以下為報名資訊：")}${renderDetailsTable(data)}<p style="margin:24px 0 0;font-size:15px;line-height:1.7;color:${FOREGROUND};font-weight:600;">${escapeHtml(siteConfig.name)}</p>`,
          siteConfig.name,
        ),
      };

    case "parent_bank_transfer_pending":
      return {
        subject: `【${siteConfig.name}】請於期限內完成匯款`,
        html: renderEmailShell(
          "請於期限內完成匯款",
          `${renderParentIntro(data, "您的報名已建立，請於期限內完成匯款以保留名額：")}${renderDetailsTable(data, true)}<p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:${MUTED};">完成匯款後請保留收據，管理員確認後即完成報名。</p>`,
          siteConfig.name,
        ),
      };

    case "parent_payment_success":
      return {
        subject: `【${siteConfig.name}】付款成功`,
        html: renderEmailShell(
          "付款成功",
          `${renderParentIntro(data, "您的付款已成功，以下為報名資訊：")}${renderDetailsTable(data)}<p style="margin:24px 0 0;font-size:15px;line-height:1.7;color:${FOREGROUND};font-weight:600;">${escapeHtml(siteConfig.name)}</p>`,
          siteConfig.name,
        ),
      };

    case "parent_payment_confirmed":
      return {
        subject: `【${siteConfig.name}】付款已確認`,
        html: renderEmailShell(
          "付款已確認",
          `${renderParentIntro(data, "我們已確認收到您的匯款，報名已完成：")}${renderDetailsTable(data)}<p style="margin:24px 0 0;font-size:15px;line-height:1.7;color:${FOREGROUND};font-weight:600;">${escapeHtml(siteConfig.name)}</p>`,
          siteConfig.name,
        ),
      };
  }
}
