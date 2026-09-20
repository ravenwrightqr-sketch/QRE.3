import type { AuthorDomainContext } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function parseJson(text: string): Record<string, unknown> | undefined {
  const source = clean(text)
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  if (!source) return undefined;

  try {
    const value = JSON.parse(source);
    return value && typeof value === "object"
      ? value as Record<string, unknown>
      : undefined;
  } catch {
    const start = source.indexOf("{");
    const end = source.lastIndexOf("}");
    if (start < 0 || end <= start) return undefined;

    try {
      const value = JSON.parse(source.slice(start, end + 1));
      return value && typeof value === "object"
        ? value as Record<string, unknown>
        : undefined;
    } catch {
      return undefined;
    }
  }
}

const clamp = (value: unknown, fallback = 0): number => {
  const number = Number(value);
  return Number.isFinite(number)
    ? Number(Math.max(0, Math.min(1, number)).toFixed(3))
    : fallback;
};

function stringArray(value: unknown, limit: number): string[] {
  return Array.isArray(value)
    ? unique(
        value
          .filter((item): item is string => typeof item === "string")
          .map(clean)
          .filter(Boolean),
      ).slice(0, limit)
    : [];
}

export type AuthorCreativeCandidate = {
  id: string;
  mode: "RELATIONAL" | "METAMORPHIC";
  perception: string;
  relationship: string;
  observerInference: string;
  evidenceEventIds: string[];
  whyItHits: string;
  risk: string;
};

export type AuthorCreativeDiscovery = {
  candidates: AuthorCreativeCandidate[];
  selectedCandidateId: string;
  selected: AuthorCreativeCandidate;
  playableEventIds: string[];
  backgroundEventIds: string[];
  experienceShape: string[];
  lens: string;
  confidence: number;
  selectionReason: string;
  risk: string;
};

function normalizeMode(value: unknown): "RELATIONAL" | "METAMORPHIC" {
  return clean(value).toUpperCase() === "METAMORPHIC"
    ? "METAMORPHIC"
    : "RELATIONAL";
}

function normalizeCandidate(
  value: unknown,
  index: number,
  allowedEventIds: Set<string>,
): AuthorCreativeCandidate | undefined {
  if (!value || typeof value !== "object") return undefined;

  const record = value as Record<string, unknown>;
  const perception = clean(record.perception);
  const relationship = clean(record.relationship);
  const observerInference = clean(record.observerInference);

  if (!perception && !relationship && !observerInference) return undefined;

  return {
    id: clean(record.id) || `candidate-${index + 1}`,
    mode: normalizeMode(record.mode),
    perception,
    relationship,
    observerInference,
    evidenceEventIds: stringArray(record.evidenceEventIds, 32)
      .filter((id) => allowedEventIds.has(id)),
    whyItHits: clean(record.whyItHits),
    risk: clean(record.risk),
  };
}

export async function discoverAuthorCreativeDirection(input: {
  events: ReadonlyArray<{ id: string; text: string }>;
  requestedLens?: string;
  memory?: readonly string[];
  domainContext?: AuthorDomainContext;
}): Promise<{
  discovery: AuthorCreativeDiscovery;
  model: string;
  modelCalls: number;
}> {
  const requestedLens = clean(input.requestedLens);
  const allowedEventIds = new Set(input.events.map((event) => event.id));

  const system = [
    "You are QRE Creative Discovery.",
    "Reality is fixed. Interpretation is free.",
    "",
    "NOTICE WHAT IS ALIVE.",
    "Study CURRENT_REALITY and find the specific detail, contrast, character signal, excess, awkwardness, reversal, recurrence, status change, strange combination, or relationship that gives this material energy.",
    "A strong read may live in one supplied detail or in a relationship across several facts.",
    "Use the supplied entities and actions as the creative cast.",
    "Treat logistics as background context unless the logistics themselves are genuinely distinctive.",
    "Prefer ideas that remain interesting even if the same facts are formatted differently.",
    "",
    "CREATE FOUR DIFFERENT READS.",
    "Keep each one concise.",
    "perception = what you noticed.",
    "relationship = the playable creative relation or status shift.",
    "RELATIONAL means supplied facts change how other supplied facts are read.",
    "METAMORPHIC means supplied reality supports a clearly figurative status, game, contest, negotiation, hierarchy, reversal, or other imaginative relation.",
    "",
    "GROUND EACH READ.",
    "Cite the supplied event IDs that carry the idea.",
    "Build the read from what is actually supplied.",
    "Literal claims stay inside supplied reality; figurative meaning can range widely.",
    "BUSINESS_CONTEXT may clarify vocabulary.",
    "",
    "SELECT FOR LIFE.",
    "Choose the read that feels most specific, grounded, surprising, compressible, and worth realizing.",
    "A tiny odd detail can beat a broad interpretation when it has more energy.",
    "Prefer the read that gives Creative the strongest thing to play with.",
    "",
    "HANDOFF:",
    "evidenceEventIds = the supplied facts carrying the selected idea.",
    "playableEventIds = any evidence that clearly deserves direct screen presence.",
    "backgroundEventIds = the remaining selected evidence.",
    "experienceShape = up to five optional semantic hints such as escalation, reversal, callback, expansion, or compression.",
    "",
    "Use the requested lens when one is supplied; otherwise return NONE.",
    "Return only the requested structured object.",
  ].join("\n");

  const result = await localModelGenerate(
    [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          CURRENT_REALITY: input.events,
          MEMORY: (input.memory ?? []).slice(0, 12),
          BUSINESS_CONTEXT: input.domainContext,
          CREATIVE_INTENT: {
            requestedLens: requestedLens || undefined,
          },
          instruction:
            "Find four genuinely different grounded reads in the supplied reality. Keep each read concise: what you noticed, the playable relation, and its evidence. Select the one with the most life and creative potential. Do not write final cuts.",
        }),
      },
    ],
    "json",
    {
      numPredict: 700,
      temperature: 0.82,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: [
          "candidates",
          "selectedCandidateId",
          "playableEventIds",
          "backgroundEventIds",
          "experienceShape",
          "lens",
          "confidence",
          "selectionReason",
          "risk",
        ],
        properties: {
          candidates: {
            type: "array",
            minItems: 4,
            maxItems: 4,
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "id",
                "mode",
                "perception",
                "relationship",
                "evidenceEventIds",
              ],
              properties: {
                id: { type: "string", maxLength: 48 },
                mode: { type: "string", enum: ["RELATIONAL", "METAMORPHIC"] },
                perception: { type: "string", maxLength: 180 },
                relationship: { type: "string", maxLength: 140 },
                evidenceEventIds: {
                  type: "array",
                  maxItems: 32,
                  items: { type: "string", maxLength: 64 },
                },
              },
            },
          },
          selectedCandidateId: { type: "string", maxLength: 48 },
          playableEventIds: {
            type: "array",
            maxItems: 32,
            items: { type: "string", maxLength: 64 },
          },
          backgroundEventIds: {
            type: "array",
            maxItems: 64,
            items: { type: "string", maxLength: 64 },
          },
          experienceShape: {
            type: "array",
            maxItems: 5,
            items: { type: "string", maxLength: 40 },
          },
          lens: { type: "string", maxLength: 80 },
          confidence: { type: "number" },
          selectionReason: { type: "string", maxLength: 220 },
          risk: { type: "string", maxLength: 180 },
        },
      },
    },
  );

  const parsed = parseJson(result.text);
  const rawCandidates = Array.isArray(parsed?.candidates) ? parsed.candidates : [];
  const candidates = rawCandidates
    .map((value, index) => normalizeCandidate(value, index, allowedEventIds))
    .filter((value): value is AuthorCreativeCandidate => Boolean(value))
    .slice(0, 4);

  const fallbackCandidate: AuthorCreativeCandidate = {
    id: "candidate-1",
    mode: "RELATIONAL",
    perception: "",
    relationship: "",
    observerInference: "",
    evidenceEventIds: [],
    whyItHits: "",
    risk: "creative_discovery_parse_failure",
  };

  const requestedSelectedId = clean(parsed?.selectedCandidateId);
  const requestedSelected = candidates.find(
    (candidate) => candidate.id === requestedSelectedId,
  );

  const selected =
    requestedSelected ??
    candidates[0] ??
    fallbackCandidate;

  const selectedEvidenceSet = new Set(selected.evidenceEventIds);

  const playableEventIds = stringArray(parsed?.playableEventIds, 32)
    .filter((id) => allowedEventIds.has(id))
    .filter((id) => selectedEvidenceSet.has(id));

  const playableSet = new Set(playableEventIds);
  const requestedBackground = stringArray(parsed?.backgroundEventIds, 64)
    .filter((id) => allowedEventIds.has(id))
    .filter((id) => selectedEvidenceSet.has(id))
    .filter((id) => !playableSet.has(id));

  const backgroundEventIds = requestedBackground.length
    ? requestedBackground
    : selected.evidenceEventIds.filter((id) => !playableSet.has(id));

  return {
    discovery: {
      candidates,
      selectedCandidateId: selected.id,
      selected,
      playableEventIds,
      backgroundEventIds,
      experienceShape: stringArray(parsed?.experienceShape, 5),
      lens: requestedLens || "NONE",
      confidence: clamp(parsed?.confidence, 0.65),
      selectionReason: clean(parsed?.selectionReason),
      risk: clean(parsed?.risk) || selected.risk,
    },
    model: result.model,
    modelCalls: 1,
  };
}
