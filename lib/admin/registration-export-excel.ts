import type { RegistrationExportRow } from "@/lib/admin/registration-export";
import { formatAdminSessionDate, formatDateTime } from "@/lib/admin/format";

type ExportWorkbookOptions = {
  courseTitle: string;
  courseSessionDate: string;
  rows: RegistrationExportRow[];
  filename: string;
};

const DATA_HEADERS = [
  "學生姓名",
  "家長姓名",
  "電話",
  "Email",
  "付款方式",
  "付款狀態",
  "訂單編號",
  "報名日期",
  "活動日期(Session)",
  "活動名稱",
  "備註（若有）",
] as const;

const REGISTRATION_DATE_COL = 8;
const SESSION_DATE_COL = 9;
const DATE_NUM_FMT = "yyyy/mm/dd";

type CellValue = string | Date;

function parseIsoDateOnly(iso: string): Date | null {
  const normalized = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  const [year, month, day] = normalized.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function parseRegistrationDate(iso: string): Date | string {
  const dateOnly = parseIsoDateOnly(iso);
  if (dateOnly) return dateOnly;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  return parseIsoDateOnly(parts) ?? iso;
}

function rowToValues(row: RegistrationExportRow): CellValue[] {
  const registrationDate = parseRegistrationDate(row.createdAt);
  const sessionDate = row.sessionDateRaw
    ? (parseIsoDateOnly(row.sessionDateRaw) ?? row.sessionDate)
    : row.sessionDate;

  return [
    row.studentName,
    row.parentName,
    row.phone,
    row.email,
    row.paymentMethod,
    row.paymentStatus,
    row.orderNumber,
    registrationDate,
    sessionDate,
    row.courseTitle,
    row.note,
  ];
}

function autoColumnWidths(rows: CellValue[][]): number[] {
  const widths = rows[0].map((header) => Math.max(String(header).length * 2, 10));

  for (const row of rows.slice(1)) {
    row.forEach((value, index) => {
      const display =
        value instanceof Date
          ? value.toLocaleDateString("zh-TW")
          : String(value);
      const length = Math.max(display.length * 1.2, 8);
      widths[index] = Math.max(widths[index] ?? 10, length);
    });
  }

  return widths.map((width) => Math.min(Math.ceil(width), 40));
}

function applyDateFormat(
  sheet: import("exceljs").Worksheet,
  rowIndex: number,
  columnIndex: number,
): void {
  const cell = sheet.getCell(rowIndex, columnIndex);
  if (cell.value instanceof Date) {
    cell.numFmt = DATE_NUM_FMT;
  }
}

export async function downloadRegistrationExportExcel(
  options: ExportWorkbookOptions,
): Promise<void> {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("報名");

  const exportedAt = formatDateTime(new Date().toISOString());
  const activityDateLabel = options.courseSessionDate
    ? formatAdminSessionDate(options.courseSessionDate)
    : "—";

  sheet.getCell("A1").value = "活動名稱";
  sheet.getCell("B1").value = options.courseTitle;
  sheet.getCell("C1").value = "活動日期";
  sheet.getCell("D1").value = activityDateLabel;
  sheet.getCell("E1").value = "匯出時間";
  sheet.getCell("F1").value = exportedAt;

  sheet.getRow(1).font = { bold: true };

  const headers = [...DATA_HEADERS];

  const headerRowIndex = 2;
  const headerRow = sheet.getRow(headerRowIndex);
  headerRow.values = [null, ...headers];
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF3F4F6" },
    };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
    };
  });

  const dataRows = options.rows.map((row) => rowToValues(row));

  dataRows.forEach((values, index) => {
    const rowIndex = headerRowIndex + 1 + index;
    sheet.getRow(rowIndex).values = [null, ...values];
    applyDateFormat(sheet, rowIndex, REGISTRATION_DATE_COL);
    applyDateFormat(sheet, rowIndex, SESSION_DATE_COL);
  });

  sheet.autoFilter = {
    from: { row: headerRowIndex, column: 1 },
    to: { row: headerRowIndex, column: headers.length },
  };

  sheet.views = [
    {
      state: "frozen",
      ySplit: headerRowIndex,
      activeCell: "A3",
      showGridLines: true,
    },
  ];

  const widthMatrix: CellValue[][] = [headers, ...dataRows];
  const widths = autoColumnWidths(widthMatrix);
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = options.filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
