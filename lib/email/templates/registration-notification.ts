import type { RegistrationEmailData } from "@/lib/email/types";

const GOLD = "#c5a059";
const FOREGROUND = "#0a0a0a";
const MUTED = "#6b6b6b";
const BORDER = "#e8e8e8";
const SURFACE = "#f7f7f7";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid ${BORDER};color:${MUTED};font-size:14px;width:120px;vertical-align:top;">
        ${escapeHtml(label)}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid ${BORDER};color:${FOREGROUND};font-size:14px;vertical-align:top;">
        ${escapeHtml(value)}
      </td>
    </tr>
  `;
}

function renderEmailShell(
  title: string,
  bodyHtml: string,
  footer = "晟心誠藝劇團 · 此為系統自動通知，請勿直接回覆",
): string {
  return `
<!DOCTYPE html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${SURFACE};font-family:'Helvetica Neue',Helvetica,Arial,'PingFang TC','Microsoft JhengHei',sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${SURFACE};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid ${BORDER};border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 12px;text-align:center;">
                <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.24em;color:${GOLD};text-transform:uppercase;">Cheng Art</p>
                <h1 style="margin:0;font-size:24px;line-height:1.4;color:${FOREGROUND};font-weight:600;">${escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 28px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;text-align:center;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};">${footer}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

function renderAdminDetailRows(data: RegistrationEmailData): string {
  return [
    renderRow("課程名稱", data.courseTitle),
    renderRow("姓名", data.name),
    renderRow("Email", data.email),
    renderRow("電話", data.phone),
    renderRow("人數", data.enrollmentLabel),
    renderRow("備註", data.note),
    renderRow("報名時間", data.registeredAt),
  ].join("");
}

export function buildAdminRegistrationEmail(data: RegistrationEmailData): {
  subject: string;
  html: string;
} {
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:${MUTED};">有新的課程報名，請查看以下資訊：</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${BORDER};border-radius:16px;overflow:hidden;background:#ffffff;">
      ${renderAdminDetailRows(data)}
    </table>
  `;

  return {
    subject: `【晟心誠藝劇團】收到新的課程報名－${data.courseTitle}`,
    html: renderEmailShell("收到新的課程報名", bodyHtml),
  };
}

export function buildParentRegistrationEmail(data: RegistrationEmailData): {
  subject: string;
  html: string;
} {
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:${FOREGROUND};">
      親愛的 ${escapeHtml(data.name)} 您好，
    </p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:${MUTED};">您已成功報名：</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${BORDER};border-radius:16px;overflow:hidden;background:#ffffff;">
      ${renderRow("課程名稱", data.courseTitle)}
      ${renderRow("日期", data.sessionDate)}
      ${renderRow("時間", data.sessionTime)}
      ${renderRow("人數", data.enrollmentLabel)}
    </table>
    <p style="margin:24px 0 8px;font-size:14px;line-height:1.7;color:${MUTED};">若有問題歡迎回信。</p>
    <p style="margin:0;font-size:15px;line-height:1.7;color:${FOREGROUND};font-weight:600;">晟心誠藝劇團</p>
  `;

  return {
    subject: "【晟心誠藝劇團】報名成功通知",
    html: renderEmailShell("報名成功通知", bodyHtml, "晟心誠藝劇團"),
  };
}
