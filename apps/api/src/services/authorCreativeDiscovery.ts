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
    "Do not write final scenes.",
    "Reality is fixed. Interpretation is free.",
    "",
    "Find what is alive in CURRENT_REALITY.",
    "Look for the specific detail, contrast, character signal, excess, awkwardness, reversal, recurrence, status change, strange combination, or relationship that makes this input worth watching.",
    "A strong read may come from one supplied detail or from several facts together.",
    "Use the supplied entities and actions as the creative cast.",
    "Treat arrival, departure, timestamps, duration, and record boundaries as logistics unless they are themselves distinctive in the supplied reality.",
    "Notice the reality, not the way the record is written.",
    "A candidate should stay interesting if the same facts were reformatted or reordered.",
    "Do not reward coverage. Do not summarize the record.",
    "",
    "Generate EXACTLY FOUR candidate reads.",
    "Each candidate is only a creative read, not an explanation of the read.",
    "perception = the concise thing you noticed.",
    "relationship = the concise creative relation or status change that makes it playable.",
    "Each candidate may be RELATIONAL or METAMORPHIC.",
    "RELATIONAL means supplied facts change how other supplied facts are read.",
    "METAMORPHIC means clearly nonliteral status, game, contest, negotiation, hierarchy, reversal, or another figurative relationship discovered from supplied reality.",
    "",
    "GROUNDING:",
    "Cite only supplied event IDs that actually support the candidate.",
    "Do not invent literal people, objects, actions, dialogue, motives, psychology, hidden causes, hidden before-states, hidden after-states, or chronology.",
    "An action does not prove what condition existed before it.",
    "Metaphor may change status or meaning. It may not invent the world.",
    "BUSINESS_CONTEXT may clarify vocabulary only. It is not creative evidence.",
    "",
    "SELECTION:",
    "Select the read that is most specific to THIS reality, grounded, surprising, compressible, and worth realizing.",
    "Prefer an idea carried by supplied entities/actions over one carried by logistics or an imagined person, beneficiary, motive, condition, or context.",
    "Do not explain why the candidate is deep, important, symbolic, or meaningful. If the read needs that explanation, it is weak.",
    "A small odd or revealing detail may beat a broad interpretation of the whole record.",
    "Do not prefer a candidate merely because it uses more facts.",
    "",
    "EVIDENCE HANDOFF:",
    "evidenceEventIds = only the supplied facts that support the selected idea.",
    "playableEventIds = the selected evidence that deserves direct screen presence.",
    "backgroundEventIds = the remaining selected evidence.",
    "experienceShape = a few semantic words only when useful; it is not an event list or writing template.",
    "",
    "If no lens was requested, return NONE. Do not invent a lens.",
    "Keep every field concise.",
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
            "Find four genuinely different grounded reads carried by the supplied entities/actions. Keep each read short: what you noticed, the playable relation, and its evidence. Do not explain significance. Treat logistics as context unless genuinely distinctive. Silently discard any read that needs an imagined person, condition, motive, hidden context, or record-shape trick to become interesting. Select the one with the most life in it. Do not write final cuts.",
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
