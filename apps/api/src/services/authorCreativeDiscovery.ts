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

const RECORD_SHAPE_LANGUAGE =
  /\b(list|prompt|input|record|document|format|formatting|field|fields|wording|phrasing|sentence|sentences)\b/i;

const EXPLICIT_RELATION_CLAIMS =
  /\b(priorit(?:y|ize|ized|ization)|rank(?:ed|ing)?|hierarch(?:y|ical)|curat(?:e|ed|es|ion)|deliberat(?:e|ely)|step\s+up|escalat(?:e|ed|es|ing|ion))\b/i;

function candidateCrossesDeterministicTruthFloor(
  candidate: AuthorCreativeCandidate,
  suppliedRealityText: string,
): boolean {
  const candidateText = clean([
    candidate.perception,
    candidate.relationship,
    candidate.observerInference,
  ].join(" "));

  const inventsRecordShape =
    RECORD_SHAPE_LANGUAGE.test(candidateText) &&
    !RECORD_SHAPE_LANGUAGE.test(suppliedRealityText);

  const inventsExplicitRelation =
    EXPLICIT_RELATION_CLAIMS.test(candidateText) &&
    !EXPLICIT_RELATION_CLAIMS.test(suppliedRealityText);

  return inventsRecordShape || inventsExplicitRelation;
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
    "Relationships between facts must come from supplied reality or from a clearly figurative read of supplied reality.",
    "When several facts merely coexist, keep them coexisting unless supplied reality establishes order, rank, cause, urgency, preference strength, escalation, deliberateness, selection, exclusivity, or curation.",
    "Coexistence itself can be creatively meaningful. Several specific likes, traits, objects, or memories may form character, contrast, texture, or a strange combination without any one being stronger, later, chosen, or more important.",
    "Use the supplied entities and actions as the creative cast.",
    "Treat logistics as background context unless the logistics themselves are genuinely distinctive.",
    "Prefer ideas that remain interesting even if the same facts are formatted differently.",
    "Read CURRENT_REALITY as facts about the world, not as a document, list, prompt, sentence pattern, writing style, record, or presentation artifact.",
    "Never make the formatting, repetition of wording, ordering of fields, existence of a list, or act of someone recording the facts into the discovered subject. Discover something about the supplied world itself.",
    "",
    "CREATE FOUR DIFFERENT READS.",
    "Keep each one concise.",
    "perception = what you noticed.",
    "relationship = the playable creative relation or status shift.",
    "RELATIONAL means supplied facts change how other supplied facts are read.",
    "METAMORPHIC means supplied reality supports a clearly figurative status, game, contrast, reversal, personification, compression, or other imaginative read. Figurative freedom does not create literal rank, sequence, choice, causality, or preference strength.",
    "",
    "GROUND EACH READ.",
    "Cite the supplied event IDs that carry the idea.",
    "Build the read from what is actually supplied.",
    "Let actions establish that the action happened; do not treat an action by itself as proof of an unseen prior condition, motive, or backstory.",
    "Let timestamps establish time and duration; do not turn precision alone into deadline, pressure, urgency, or external demand unless supplied reality supports it.",
    "When a read needs status or drama, create it figuratively from the supplied action instead of converting it into an unsupported literal before-state.",
    "Literal claims stay inside supplied reality; figurative meaning can range widely.",
    "BUSINESS_CONTEXT may clarify vocabulary.",
    "",
    "SELECT FOR LIFE.",
    "Choose the read that feels most specific, grounded, surprising, compressible, and worth realizing.",
    "A strong selected read changes how the supplied facts feel when viewed together.",
    "The read does not need to invent a relationship among the facts. A truthful cluster can be interesting because of its specificity, character, contrast, or odd combination alone.",
    "Give Creative something alive to play with: status, tension, contrast, reversal, character, odd specificity, excess, repetition, implication, or another felt dynamic already supported by reality. Use escalation, rivalry, rank, or sequence only when supplied reality actually establishes them.",
    "Prefer a read that creates a viewer perception over one that merely categorizes the service, workflow, process, or record.",
    "A tiny odd detail can beat a broad interpretation when it has more energy.",
    "Prefer the read that gives Creative the strongest thing to play with.",
    "",
    "HANDOFF:",
    "evidenceEventIds = the supplied facts carrying the selected idea.",
    "playableEventIds = any evidence that clearly deserves direct screen presence.",
    "backgroundEventIds = the remaining selected evidence.",
    "experienceShape = up to five optional semantic hints such as character, contrast, reversal, callback, expansion, compression, or implication. Use escalation only when reality actually establishes escalation.",
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
            "Find four genuinely different grounded reads in the supplied reality. Treat the input only as facts about the world: do not analyze the list, phrasing, repetition of wording, formatting, field order, or the act of recording those facts. Keep each read concise: what you noticed in the world, the playable relation, and its evidence. Favor reads that make the facts feel different through status, tension, contrast, character, reversal, repetition, excess, or another felt dynamic. Do not manufacture order, ranking, causality, urgency, preference strength, deliberateness, selection, exclusivity, curation, or hidden pressure from facts that merely coexist or from precise timestamps. Coexisting likes may imply character or specificity without implying priority or conscious selection. Keep literal premises supported; use figurative status rather than inventing unseen relations or prior conditions. Select the one with the most life and creative potential. Do not write final cuts.",
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
  const suppliedRealityText = clean(input.events.map((event) => event.text).join(" "));
  const candidates = rawCandidates
    .map((value, index) => normalizeCandidate(value, index, allowedEventIds))
    .filter((value): value is AuthorCreativeCandidate => Boolean(value))
    .filter((candidate) =>
      !candidateCrossesDeterministicTruthFloor(candidate, suppliedRealityText),
    )
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

  const selectedMatchesModelChoice =
    Boolean(requestedSelected) &&
    selected.id === requestedSelectedId;

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
      selectionReason: selectedMatchesModelChoice
        ? clean(parsed?.selectionReason)
        : selected.perception || selected.relationship,
      risk: selectedMatchesModelChoice
        ? clean(parsed?.risk) || selected.risk
        : selected.risk,
    },
    model: result.model,
    modelCalls: 1,
  };
}
