import { PDFParse } from "pdf-parse";
import * as XLSX from "@keep-lts/xlsx";

export type ExtractedKnowledgeFact = {
  label: string;
  value: string;
  category: string;
  unit?: string;
  confidence: number;
  notes?: string;
};

export type ExtractedDocument = {
  text: string;
  facts: ExtractedKnowledgeFact[];
  metadata: Record<string, unknown>;
};

export function decodeDataUrl(value: string): { mimeType: string; bytes: Buffer } | null {
  const match = value.match(/^data:([^;,]+)?(?:;[^;,]+)*;base64,(.*)$/s);
  if (!match) return null;
  return {
    mimeType: match[1] || "application/octet-stream",
    bytes: Buffer.from(match[2], "base64"),
  };
}

export async function extractPdfKnowledge(bytes: Buffer): Promise<ExtractedDocument> {
  const parser = new PDFParse({ data: bytes });
  try {
    const result = await parser.getText();
    const text = String(result.text || "").replace(/\u0000/g, "").trim();
    if (!text) {
      throw new Error("This PDF has no extractable text. Scanned PDFs need OCR before QRE can learn them.");
    }

    return {
      text: text.slice(0, 200_000),
      facts: factsFromDocumentText(text),
      metadata: {
        pageCount: result.pages?.length ?? undefined,
        parser: "pdf-parse",
      },
    };
  } finally {
    await parser.destroy();
  }
}

export function extractSpreadsheetKnowledge(bytes: Buffer, originalName?: string): ExtractedDocument {
  const workbook = XLSX.read(bytes, {
    type: "buffer",
    cellDates: true,
    cellNF: false,
    cellStyles: false,
  });

  const allLines: string[] = [];
  const facts: ExtractedKnowledgeFact[] = [];
  let totalRows = 0;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: false,
    });

    const normalizedRows = rows
      .map((row) => (Array.isArray(row) ? row.map(stringifyCell) : []))
      .filter((row) => row.some((cell) => cell.trim().length > 0));

    if (!normalizedRows.length) continue;

    totalRows += normalizedRows.length;
    const headerIndex = findHeaderRow(normalizedRows);
    const headers = makeHeaders(normalizedRows[headerIndex] || []);
    const dataRows = normalizedRows.slice(headerIndex + 1);

    allLines.push(`SHEET: ${sheetName}`);
    allLines.push(`COLUMNS: ${headers.join(" | ")}`);

    for (let index = 0; index < dataRows.length && facts.length < 5000; index += 1) {
      const row = dataRows[index] || [];
      const record: Record<string, string> = {};

      for (let column = 0; column < headers.length; column += 1) {
        const value = row[column]?.trim() || "";
        if (value) record[headers[column]] = value;
      }

      if (!Object.keys(record).length) continue;

      const labelKey = pickLabelKey(headers, record);
      const label = record[labelKey] || `${sheetName} row ${index + headerIndex + 2}`;
      const value = JSON.stringify(record);

      facts.push({
        label: `${sheetName}: ${label}`.slice(0, 240),
        value: value.slice(0, 6000),
        category: "spreadsheet_row",
        confidence: 0.99,
      });

      allLines.push(value);
    }
  }

  if (!facts.length) {
    throw new Error(`No readable rows were found in ${originalName || "the spreadsheet"}.`);
  }

  const text = allLines.join("\n");

  return {
    text: text.slice(0, 250_000),
    facts,
    metadata: {
      parser: "sheetjs-compatible-xlsx",
      sheets: workbook.SheetNames,
      rowCount: totalRows,
    },
  };
}

function factsFromDocumentText(text: string): ExtractedKnowledgeFact[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2000);

  const facts: ExtractedKnowledgeFact[] = [];

  for (const line of lines) {
    const keyValue = line.match(/^(?:[-*•]\s*)?([^:]{1,140}):\s*(.{1,3000})$/);
    if (!keyValue) continue;

    facts.push({
      label: keyValue[1].trim(),
      value: keyValue[2].trim(),
      category: "document",
      confidence: 0.9,
    });
  }

  if (!facts.length) {
    facts.push({
      label: "Document knowledge",
      value: text.slice(0, 12_000),
      category: "document",
      confidence: 0.95,
      notes: "Extracted from PDF text; preserve as source knowledge rather than inferred experience.",
    });
  }

  return facts.slice(0, 500);
}

function findHeaderRow(rows: string[][]): number {
  const candidateLimit = Math.min(rows.length, 8);
  let bestIndex = 0;
  let bestScore = -1;

  for (let index = 0; index < candidateLimit; index += 1) {
    const row = rows[index] || [];
    const nonEmpty = row.filter(Boolean).length;
    const semantic = row.filter((cell) => /name|item|product|sku|brand|model|service|price|date|type|category|description/i.test(cell)).length;
    const score = nonEmpty + semantic * 2;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  return bestIndex;
}

function makeHeaders(row: string[]): string[] {
  const seen = new Map<string, number>();
  return row.map((header, index) => {
    const base = header.trim() || `column_${index + 1}`;
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return count ? `${base}_${count + 1}` : base;
  });
}

function pickLabelKey(headers: string[], record: Record<string, string>): string {
  const preferred = headers.find((header) => /^(name|product|item|title|sku|model|service|business|customer)$/i.test(header));
  if (preferred) return preferred;
  return headers.find((header) => record[header]) || headers[0] || "item";
}

function stringifyCell(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}
