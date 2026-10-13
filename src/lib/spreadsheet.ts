import { Workbook } from "exceljs";

export type ImportedRow = Record<string, string>;

function normalizeHeader(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
}

export function importValue(row: ImportedRow, ...headers: string[]) {
  for (const header of headers) {
    const value = row[normalizeHeader(header)];
    if (value?.trim()) return value.trim();
  }
  return "";
}

export function splitImportedEmails(value: string) {
  return value.split(/[;,]/).map((email) => email.trim()).filter(Boolean);
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    const cell = value as Record<string, unknown>;
    if (typeof cell.text === "string") return cell.text.trim();
    if (Array.isArray(cell.richText)) {
      return cell.richText.map((part) => {
        const text = (part as Record<string, unknown>).text;
        return typeof text === "string" ? text : "";
      }).join("").trim();
    }
    if (cell.result !== undefined) return cellText(cell.result);
    return "";
  }
  return String(value).trim();
}

function rowsToRecords(headers: string[], rows: string[][]) {
  const normalizedHeaders = headers.map(normalizeHeader);
  return rows
    .map((values) => Object.fromEntries(normalizedHeaders.flatMap((header, index) =>
      header ? [[header, values[index] ?? ""]] : []
    )))
    .filter((row) => Object.values(row).some(Boolean));
}

function parseCsv(text: string): ImportedRow[] {
  const input = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];

    if (quoted) {
      if (char === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (quoted) throw new Error("CSV contains an unterminated quoted field.");
  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  if (rows.length < 2) return [];
  return rowsToRecords(rows[0], rows.slice(1));
}

async function parseXlsx(buffer: Buffer): Promise<ImportedRow[]> {
  const workbook = new Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.rowCount < 2) return [];

  const headerRow = worksheet.getRow(1);
  const headers = Array.from({ length: headerRow.cellCount }, (_, index) =>
    cellText(headerRow.getCell(index + 1).value)
  );
  const rows: string[][] = [];

  for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex += 1) {
    const row = worksheet.getRow(rowIndex);
    rows.push(headers.map((_, columnIndex) => cellText(row.getCell(columnIndex + 1).value)));
  }

  return rowsToRecords(headers, rows);
}

export async function parseSpreadsheet(fileName: string, buffer: Buffer) {
  const extension = fileName.toLowerCase().split(".").pop();
  if (extension === "csv") return parseCsv(buffer.toString("utf8"));
  if (extension === "xlsx") return parseXlsx(buffer);
  throw new Error("Choose a CSV or XLSX file.");
}

export function redactImportedNotes(value: string) {
  return value
    .replace(/<(\w*?(?:PASSWORD|TOKEN|SECRET)\w*)>[^<]*<\/\1>/gi, "<$1>[REDACTED]</$1>")
    .replace(/\b(password|login\s*id|api[ _-]?key|access\s*token|secret)\s*[:=]\s*[^\r\n]+/gi, "$1: [REDACTED]");
}

export function csvSafe(value: unknown) {
  let text = value instanceof Date ? value.toISOString() : String(value ?? "");
  if (typeof value === "string" && /^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
