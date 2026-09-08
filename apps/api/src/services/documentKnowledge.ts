import { PDFParse } from "pdf-parse";
import * as XLSX from "@keep-lts/xlsx";
import { localModelGenerate } from "./localModelRuntime.js";

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

    const deterministic = factsFromDocumentText(text);
    const semantic = await semanticFactsFromText(text, "pdf");

    return {
      text: text.slice(0, 200_000),
      facts: mergeFacts(deterministic, semantic),
      metadata: {
        pageCount: Array.isArray(result.pages) ? result.pages.length : undefined,
        parser: "pdf-parse",
        semanticExtraction: semantic.length > 0,
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
      semanticExtraction: false,
    },
  };
}

async function semanticFactsFromText(text: string, sourceType: string): Promise<ExtractedKnowledgeFact[]> {
  if (process.env.QRE_AI_ENABLED !== "true" || process.env.QRE_EXTERNAL_AI_ENABLED === "true") return [];

  try {
    const result = await localModelGenerate([
      {
        role: "system",
        content: [
          "You are QRE's source-grounded knowledge extractor.",
          `The source came from a ${sourceType}.`,
          "Extract durable facts that would help QRE understand the source later.",
          "Only use information explicitly supported by the supplied source text.",
          "Do not invent facts, names, prices, dates, services, locations, products, quantities, or relationships.",
          "Prefer useful business, product, service, operational, customer, policy, schedule, and descriptive facts.",
          "Return strict JSON array with objects: label, value, category, unit?, confidence, notes?.",
          "Keep each fact concise. Avoid one giant summary when the source contains several distinct facts.",
        ].join(" "),
      },
      {
        role: "user",
        content: text.slice(0, 70_000),
      },
    ], "json");

    const parsed = parseJsonArray(result.text);
    return parsed
      .filter((fact): fact is ExtractedKnowledgeFact => Boolean(fact && typeof fact.label === "string" && typeof fact.value === "string"))
      .map((fact) => ({
        label: fact.label.trim().slice(0, 240),
        value: fact.value.trim().slice(0, 6000),
        category: typeof fact.category === "string" && fact.category.trim() ? fact.category.trim() : "document",
        unit: typeof fact.unit === "string" ? fact.unit.trim() || undefined : undefined,
        confidence: clamp(fact.confidence),
        notes: typeof fact.notes === "string" ? fact.notes.trim().slice(0, 1000) || undefined : undefined,
      }))
      .slice(0, 250);
  } catch (error) {
    console.warn("[KnowledgeIntake] semantic document extraction unavailable", error);
    return [];
  }
}

function parseJsonArray(text: string): unknown[] {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mergeFacts(base: ExtractedKnowledgeFact[], semantic: ExtractedKnowledgeFact[]): ExtractedKnowledgeFact[] {
  const result = [...base];
  const keys = new Set(base.map((fact) => `${fact.label.toLowerCase()}|${fact.value.toLowerCase().slice(0, 200)}`));

  for (const fact of semantic) {
    const key = `${fact.label.toLowerCase()}|${fact.value.toLowerCase().slice(0, 200)}`;
    if (keys.has(key)) continue;
    keys.add(key);
    result.push(fact);
    if (result.length >= 500) break;
  }

  return result;
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

function clamp(value: unknown): number {
  return Math.max(0, Math.min(1, typeof value === "number" && Number.isFinite(value) ? value : 0.7));
}
