import { localModelGenerate } from "./localModelRuntime.js";

export type RealityVisibility = "visible" | "partial" | "occluded" | "ambiguous";
export type RealityEntityState = "present" | "empty" | "damaged" | "displaced" | "unknown";

export type RealityEntity = {
  id: string;
  kind: string;
  name?: string;
  label?: string;
  bbox?: [number, number, number, number];
  centroid?: [number, number];
  regionId?: string;
  attributes?: Record<string, string | number | boolean>;
  textEvidence?: string[];
  visibility: RealityVisibility;
  state: RealityEntityState;
  confidence: number;
  notes?: string;
};

export type RealityRegion = {
  id: string;
  name: string;
  kind: string;
  bbox?: [number, number, number, number];
  confidence: number;
};

export type RealityRelation = {
  subjectId: string;
  predicate:
    | "inside"
    | "contains"
    | "above"
    | "below"
    | "left_of"
    | "right_of"
    | "next_to"
    | "overlaps"
    | "same_group"
    | "adjacent_to"
    | "unknown";
  objectId: string;
  confidence: number;
};

export type RealityText = {
  text: string;
  bbox?: [number, number, number, number];
  confidence: number;
};

export type RealityUnknown = {
  question: string;
  reason: string;
  confidence: number;
};

export type RealityGraph = {
  schemaVersion: 1;
  scene: {
    summary: string;
    domain?: string;
    confidence: number;
  };
  regions: RealityRegion[];
  entities: RealityEntity[];
  relations: RealityRelation[];
  text: RealityText[];
  unknowns: RealityUnknown[];
  observations: string[];
  warnings: string[];
};

type RawRealityResponse = Partial<RealityGraph> & {
  scene?: Partial<RealityGraph["scene"]>;
};

function clamp(value: unknown, fallback = 0.5): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function stringArray(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()).slice(0, limit);
}

function bbox(value: unknown): [number, number, number, number] | undefined {
  if (!Array.isArray(value) || value.length !== 4) return undefined;
  const values = value.map(Number);
  if (values.some((n) => !Number.isFinite(n))) return undefined;
  return [Math.max(0, values[0]), Math.max(0, values[1]), Math.max(0, values[2]), Math.max(0, values[3])];
}

function centroid(value: unknown): [number, number] | undefined {
  if (!Array.isArray(value) || value.length !== 2) return undefined;
  const values = value.map(Number);
  if (values.some((n) => !Number.isFinite(n))) return undefined;
  return [Math.max(0, values[0]), Math.max(0, values[1])];
}

function normalizeEntity(value: unknown, index: number): RealityEntity | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const kind = typeof item.kind === "string" && item.kind.trim() ? item.kind.trim() : "object";
  const id = typeof item.id === "string" && item.id.trim() ? item.id.trim() : `entity_${index + 1}`;
  const visibility = ["visible", "partial", "occluded", "ambiguous"].includes(String(item.visibility))
    ? item.visibility as RealityVisibility
    : "visible";
  const state = ["present", "empty", "damaged", "displaced", "unknown"].includes(String(item.state))
    ? item.state as RealityEntityState
    : "present";
  const attributes = item.attributes && typeof item.attributes === "object" && !Array.isArray(item.attributes)
    ? Object.fromEntries(Object.entries(item.attributes as Record<string, unknown>).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value))) as Record<string, string | number | boolean>
    : undefined;

  return {
    id,
    kind,
    name: typeof item.name === "string" && item.name.trim() ? item.name.trim() : undefined,
    label: typeof item.label === "string" && item.label.trim() ? item.label.trim() : undefined,
    bbox: bbox(item.bbox),
    centroid: centroid(item.centroid),
    regionId: typeof item.regionId === "string" && item.regionId.trim() ? item.regionId.trim() : undefined,
    attributes,
    textEvidence: stringArray(item.textEvidence, 12),
    visibility,
    state,
    confidence: clamp(item.confidence),
    notes: typeof item.notes === "string" && item.notes.trim() ? item.notes.trim() : undefined,
  };
}

function normalizeGraph(parsed: RawRealityResponse | null): RealityGraph {
  const regions = Array.isArray(parsed?.regions)
    ? parsed.regions.map((value, index) => {
        if (!value || typeof value !== "object") return null;
        const item = value as Record<string, unknown>;
        const id = typeof item.id === "string" && item.id.trim() ? item.id.trim() : `region_${index + 1}`;
        const name = typeof item.name === "string" && item.name.trim() ? item.name.trim() : `Region ${index + 1}`;
        const kind = typeof item.kind === "string" && item.kind.trim() ? item.kind.trim() : "region";
        return { id, name, kind, bbox: bbox(item.bbox), confidence: clamp(item.confidence) } satisfies RealityRegion;
      }).filter((value): value is RealityRegion => Boolean(value)).slice(0, 64)
    : [];

  const entities = Array.isArray(parsed?.entities)
    ? parsed.entities.map(normalizeEntity).filter((value): value is RealityEntity => Boolean(value)).slice(0, 500)
    : [];

  const entityIds = new Set(entities.map((entity) => entity.id));
  const relations = Array.isArray(parsed?.relations)
    ? parsed.relations.map((value) => {
        if (!value || typeof value !== "object") return null;
        const item = value as Record<string, unknown>;
        const subjectId = typeof item.subjectId === "string" ? item.subjectId.trim() : "";
        const objectId = typeof item.objectId === "string" ? item.objectId.trim() : "";
        const predicate = typeof item.predicate === "string" && [
          "inside", "contains", "above", "below", "left_of", "right_of", "next_to", "overlaps", "same_group", "adjacent_to", "unknown",
        ].includes(item.predicate) ? item.predicate as RealityRelation["predicate"] : "unknown";
        if (!subjectId || !objectId || !entityIds.has(subjectId) || !entityIds.has(objectId)) return null;
        return { subjectId, predicate, objectId, confidence: clamp(item.confidence) } satisfies RealityRelation;
      }).filter((value): value is RealityRelation => Boolean(value)).slice(0, 1500)
    : [];

  const text = Array.isArray(parsed?.text)
    ? parsed.text.map((value) => {
        if (!value || typeof value !== "object") return null;
        const item = value as Record<string, unknown>;
        const textValue = typeof item.text === "string" ? item.text.trim() : "";
        if (!textValue) return null;
        return { text: textValue.slice(0, 500), bbox: bbox(item.bbox), confidence: clamp(item.confidence) } satisfies RealityText;
      }).filter((value): value is RealityText => Boolean(value)).slice(0, 500)
    : [];

  const unknowns = Array.isArray(parsed?.unknowns)
    ? parsed.unknowns.map((value) => {
        if (!value || typeof value !== "object") return null;
        const item = value as Record<string, unknown>;
        const question = typeof item.question === "string" ? item.question.trim() : "";
        const reason = typeof item.reason === "string" ? item.reason.trim() : "";
        if (!question || !reason) return null;
        return { question: question.slice(0, 400), reason: reason.slice(0, 800), confidence: clamp(item.confidence) } satisfies RealityUnknown;
      }).filter((value): value is RealityUnknown => Boolean(value)).slice(0, 100)
    : [];

  const scene = parsed?.scene ?? {};
  return {
    schemaVersion: 1,
    scene: {
      summary: typeof scene.summary === "string" && scene.summary.trim() ? scene.summary.trim().slice(0, 2000) : "Visual scene observed.",
      domain: typeof scene.domain === "string" && scene.domain.trim() ? scene.domain.trim().slice(0, 200) : undefined,
      confidence: clamp(scene.confidence),
    },
    regions,
    entities,
    relations,
    text,
    unknowns,
    observations: stringArray(parsed?.observations, 500),
    warnings: stringArray(parsed?.warnings, 100),
  };
}

function parseJson(text: string): RawRealityResponse | null {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned) as RawRealityResponse;
  } catch {
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first >= 0 && last > first) {
      try { return JSON.parse(cleaned.slice(first, last + 1)) as RawRealityResponse; } catch { return null; }
    }
    return null;
  }
}

const REALITY_SYSTEM = [
  "You are QRE's Reality Perception Engine.",
  "Your task is to construct the most complete evidence-grounded representation of what is visibly present in an image.",
  "Do not write a prose caption instead of structured perception.",
  "Separate direct observation from uncertainty. Never convert an inference into a fact.",
  "Inventory the whole visible scene, not just the most salient object.",
  "Identify individual repeated objects when possible. Do not collapse repeated instances into one generic item.",
  "Use approximate normalized coordinates only when you can support them from the image. bbox is [x,y,width,height] normalized to 0..1.",
  "Create regions for meaningful spatial areas such as shelf, case, counter, vehicle bay, room, wall display, table, rack, workstation, or other coherent areas.",
  "Create relations for spatial structure: above, below, left_of, right_of, next_to, inside, contains, adjacent_to, overlaps, same_group.",
  "Read only legible text. Put uncertain text in unknowns rather than inventing characters.",
  "Record occlusion and partial visibility explicitly.",
  "For identity, give a candidate only when supported by visible appearance or readable text; use confidence to express uncertainty.",
  "Do not invent serial numbers, exact specifications, hidden contents, pricing, ownership, dates, causes, intent, sales, or actions that are not directly visible.",
  "A photographed empty area is an observation of emptiness in that visible area, not proof that an item does not exist elsewhere.",
  "Return JSON only with keys: scene, regions, entities, relations, text, unknowns, observations, warnings.",
  "scene = {summary, domain?, confidence}; entity fields = {id, kind, name?, label?, bbox?, centroid?, regionId?, attributes?, textEvidence?, visibility, state, confidence, notes?}.",
].join(" ");

export async function analyzeImageForReality(imageDataUrl: string): Promise<RealityGraph> {
  const result = await localModelGenerate([
    { role: "system", content: REALITY_SYSTEM },
    {
      role: "user",
      content: "Perform a full-scene reality inventory. Enumerate visible regions, individual entities, readable text, spatial relations, and important unknowns. Do not summarize away repeated objects.",
      images: [imageDataUrl],
    },
  ], "json", {
    numPredict: 2400,
    numCtx: 24576,
    temperature: 0.2,
  });

  const graph = normalizeGraph(parseJson(result.text));
  if (!graph.entities.length && !graph.text.length && !graph.regions.length) {
    throw new Error("Reality perception returned no structured observations. The visual model response was empty or invalid.");
  }
  return graph;
}
