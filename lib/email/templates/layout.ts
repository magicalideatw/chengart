import { EMAIL_LOGO_URL } from "@/lib/email/config";
import { siteConfig } from "@/lib/data/site";

const GOLD = "#c5a059";
const FOREGROUND = "#0a0a0a";
const MUTED = "#6b6b6b";
const BORDER = "#e8e8e8";
const SURFACE = "#f7f7f7";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderEmailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid ${BORDER};color:${MUTED};font-size:14px;width:128px;vertical-align:top;">
        ${escapeHtml(label)}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid ${BORDER};color:${FOREGROUND};font-size:14px;vertical-align:top;">
        ${escapeHtml(value)}
      </td>
    </tr>
  `;
}

export function renderEmailShell(
  title: string,
  bodyHtml: string,
  footer = `${siteConfig.name} · 此為系統自動通知，請勿直接回覆`,
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
                <img src="${escapeHtml(EMAIL_LOGO_URL)}" alt="${escapeHtml(siteConfig.name)}" width="72" height="72" style="display:block;margin:0 auto 12px;border-radius:16px;object-fit:cover;" />
                <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.24em;color:${GOLD};text-transform:uppercase;">${escapeHtml(siteConfig.nameEn)}</p>
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
