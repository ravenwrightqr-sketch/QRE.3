import fs from "node:fs";

const path = "apps/api/src/services/authorMouthCandidateSearch.ts";
const original = fs.readFileSync(path, "utf8");
const text = original.replace(/\r\n?/g, "\n");

const start = text.indexOf("export function parseMouthCandidateBatch");
const end = text.indexOf("\nexport function scoreMouthCandidate", start);
if (start < 0 || end < 0) {
  throw new Error("MOUTH PARSER BLOCK NOT FOUND");
}

const replacement = `export function parseMouthCandidateBatch(raw: string): MouthCandidateBatch | null {
  const text = clean(raw)
    .replace(/^\\s*\\x60\\x60\\x60(?:json)?/i, "")
    .replace(/\\x60\\x60\\x60\\s*$/i, "")
    .trim();

  if (!text) return null;

  const normalizeEntry = (entry: unknown, fallbackOrder: number) => {
    if (!entry || typeof entry !== "object") return null;
    const value = entry as Record<string, unknown>;
    const order = Number(value.order ?? fallbackOrder);
    const variants = unique(
      Array.isArray(value.variants)
        ? value.variants
        : typeof value.text === "string"
          ? [value.text]
          : [],
    ).slice(0, 8);
    return Number.isFinite(order) && variants.length
      ? { order, variants }
      : null;
  };

  const normalizeParsed = (parsed: unknown): MouthCandidateBatch | null => {
    if (!parsed || typeof parsed !== "object") return null;
    const value = parsed as Record<string, unknown>;

    if (Array.isArray(value.variantsByBeat)) {
      const variantsByBeat = value.variantsByBeat
        .map((entry, index) => normalizeEntry(entry, index + 1))
        .filter((entry): entry is { order: number; variants: string[] } => Boolean(entry));
      if (variantsByBeat.length) return { variantsByBeat };
    }

    if (Array.isArray(value.texts)) {
      const variantsByBeat = value.texts
        .map((entry, index) => ({
          order: index + 1,
          variants: typeof entry === "string" && clean(entry) ? [clean(entry)] : [],
        }))
        .filter((entry) => entry.variants.length > 0);
      if (variantsByBeat.length) return { variantsByBeat };
    }

    if (typeof value.text === "string" && clean(value.text)) {
      return { variantsByBeat: [{ order: 1, variants: [clean(value.text)] }] };
    }

    return null;
  };

  try {
    const parsed = JSON.parse(text);
    const normalized = normalizeParsed(parsed);
    if (normalized) return normalized;
  } catch {
    // Continue with tolerant extraction below.
  }

  // Qwen sometimes emits repeated JSON object members such as:
  // {"variantsByBeat":[...]}, {"variantsByBeat":[...]}, ...
  // Standard JSON parsing keeps only the last member. Extract every occurrence.
  const repeated: Array<{ order: number; variants: string[] }> = [];
  const objectPattern = /\\{\\s*"variantsByBeat"\\s*:\\s*\\[\\s*\\{[\\s\\S]*?\\}\\s*\\]\\s*\\}/g;
  for (const match of text.matchAll(objectPattern)) {
    try {
      const normalized = normalizeParsed(JSON.parse(match[0]));
      if (normalized) repeated.push(...normalized.variantsByBeat);
    } catch {
      // Ignore malformed fragments and continue.
    }
  }
  if (repeated.length) return { variantsByBeat: repeated };

  // Last-resort viewer-text realization. This is safe because the caller still
  // applies the deterministic truth/length/candidate gates to the text.
  if (!/^[{[]/.test(text)) {
    return { variantsByBeat: [{ order: 1, variants: [text] }] };
  }

  return null;
}
`;

const updated = text.slice(0, start) + replacement + text.slice(end);
fs.writeFileSync(path, updated.replace(/\n/g, "\r\n"), "utf8");
console.log("PATCHED: authorMouthCandidateSearch.ts · tolerant real-model batch parser");
console.log("MOUTH PARSER REPAIR COMPLETE");
