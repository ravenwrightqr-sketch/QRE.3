import { db } from "@qre/db";
import type { CognitiveAuthorMedia } from "@qre/contracts";
import { buildAuthorMediaContext } from "./authorMediaBridge.js";

type KnowledgeMediaRow = {
  id: string;
  message: string;
  createdAt: Date;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function parseKnowledgeMedia(row: KnowledgeMediaRow): CognitiveAuthorMedia | null {
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = asRecord(JSON.parse(row.message));
  } catch {
    return null;
  }

  const imageDataUrl = typeof parsed?.imageDataUrl === "string"
    ? parsed.imageDataUrl.trim()
    : "";
  if (!imageDataUrl.startsWith("data:image/")) return null;

  const rawRole = parsed?.role;
  const role = rawRole === "evidence" || rawRole === "memory" || rawRole === "photo_beat" || rawRole === "reference"
    ? rawRole
    : "evidence";

  const observedAt = row.createdAt.toISOString();
  const metadata: Record<string, unknown> = {
    label: typeof parsed?.label === "string" ? parsed.label : undefined,
    value: typeof parsed?.value === "string" ? parsed.value : undefined,
    category: typeof parsed?.category === "string" ? parsed.category : undefined,
    notes: typeof parsed?.notes === "string" ? parsed.notes : undefined,
    source: typeof parsed?.source === "string" ? parsed.source : undefined,
    observedAt,
  };

  return {
    id: row.id,
    type: "image",
    url: imageDataUrl,
    title: typeof parsed?.label === "string" ? parsed.label : undefined,
    role,
    observedAt,
    source: typeof parsed?.source === "string" ? parsed.source : "knowledge",
    metadata,
  };
}

export function buildAuthorMediaFromKnowledge(
  rows: KnowledgeMediaRow[],
  subject?: string,
): CognitiveAuthorMedia[] {
  return buildAuthorMediaContext(
    rows.map(parseKnowledgeMedia).filter((media): media is CognitiveAuthorMedia => Boolean(media)),
    { subject, source: "knowledge" },
  );
}

export async function loadAuthorMediaContext(
  assetId: string,
  subject?: string,
): Promise<CognitiveAuthorMedia[]> {
  const rows = await db.insight.findMany({
    where: { assetId, type: "KNOWLEDGE" },
    orderBy: { createdAt: "asc" },
    take: 250,
    select: { id: true, message: true, createdAt: true },
  });

  return buildAuthorMediaFromKnowledge(rows, subject);
}
