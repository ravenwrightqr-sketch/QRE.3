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
    "Do not write final scenes.",
    "",
    "Generate EXACTLY FOUR short grounded candidate reads from CURRENT_REALITY:",
    "1-2 = RELATIONAL: real supplied facts change how other supplied facts are read.",
    "3-4 = METAMORPHIC: clearly nonliteral framing over supplied facts: status, game, contest, negotiation, hierarchy, takeover, reversal, rule-system, or another figurative relation you discover.",
    "",
    "UNIVERSAL RULES:",
    "No domain templates.",
    "Do not infer motives, personality, pride, obsession, urgency, satisfaction, hidden standards, unseen conditions, dirt, chaos, difficulty, priority, or effort unless explicitly supplied.",
    "Do not infer significance from formatting, list granularity, event boundaries, or wording differences.",
    "Do not use timestamps, task count, chronology, completion, service scope, efficiency, professionalism, thoroughness, or workload as the main idea unless another supplied fact genuinely changes their meaning.",
    "BUSINESS_CONTEXT may clarify vocabulary only. It is not creative evidence.",
    "",
    "RELATIONAL candidate test:",
    "At least two supplied facts must create a relationship stronger than simple sequence or accumulation.",
    "If no strong literal relationship exists, keep the relational candidate modest rather than inventing one.",
    "",
    "METAMORPHIC candidate test:",
    "The figurative read must reorganize supplied reality without claiming the metaphor literally happened.",
    "It must remain understandable from the cited evidence alone.",
    "",
    "OBSERVER:",
    "Leave something for the viewer to notice. Do not explain the final meaning.",
    "",
    "SELECTION:",
    "Choose the candidate that is most grounded, specific, surprising, compressible, and worth watching.",
    "Prefer a grounded METAMORPHIC read over a generic process summary.",
    "Reject any candidate whose core idea is merely cleaning/service/process/time/effort/completion.",
    "",
    "EVIDENCE:",
    "evidenceEventIds = all current facts that support the candidate.",
    "playableEventIds = only facts that truly deserve literal screen presence.",
    "backgroundEventIds = all other grounded facts; they may collectively support an interpretive cut.",
    "Do not copy all evidenceEventIds into playableEventIds.",
    "",
    "LENS comes AFTER selection. Return requested lens or NONE; lens does not choose the idea.",
    "",
    "Keep every field concise.",
    "Return JSON only:",
    "{\"candidates\":[{\"id\":\"candidate-1\",\"mode\":\"RELATIONAL\",\"perception\":\"...\",\"relationship\":\"...\",\"observerInference\":\"...\",\"evidenceEventIds\":[\"event-1\"],\"whyItHits\":\"...\",\"risk\":\"...\"}],\"selectedCandidateId\":\"candidate-1\",\"playableEventIds\":[],\"backgroundEventIds\":[\"event-1\"],\"experienceShape\":[\"...\"],\"lens\":\"NONE\",\"confidence\":0.0,\"selectionReason\":\"...\",\"risk\":\"...\"}.",
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
            "Produce 2 grounded RELATIONAL reads and 2 clearly nonliteral METAMORPHIC reads. Then select the strongest. Do not write final cuts.",
        }),
      },
    ],
    "json",
    { numPredict: 850, temperature: 0.82 },
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
  const selected =
    candidates.find((candidate) => candidate.id === requestedSelectedId) ??
    candidates[0] ??
    fallbackCandidate;

  const playableEventIds = stringArray(parsed?.playableEventIds, 32)
    .filter((id) => allowedEventIds.has(id));

  const playableSet = new Set(playableEventIds);
  const requestedBackground = stringArray(parsed?.backgroundEventIds, 64)
    .filter((id) => allowedEventIds.has(id))
    .filter((id) => !playableSet.has(id));

  const backgroundEventIds = requestedBackground.length
    ? requestedBackground
    : input.events
        .map((event) => event.id)
        .filter((id) => !playableSet.has(id));

  return {
    discovery: {
      candidates,
      selectedCandidateId: selected.id,
      selected,
      playableEventIds,
      backgroundEventIds,
      experienceShape: stringArray(parsed?.experienceShape, 5),
      lens: requestedLens || clean(parsed?.lens) || "NONE",
      confidence: clamp(parsed?.confidence, 0.65),
      selectionReason: clean(parsed?.selectionReason),
      risk: clean(parsed?.risk) || selected.risk,
    },
    model: result.model,
    modelCalls: 1,
  };
}
