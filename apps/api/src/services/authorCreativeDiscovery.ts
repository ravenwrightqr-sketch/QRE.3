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

export type AuthorDiscoveryRelation = {
  from: string;
  to: string;
  kind: string;
  strength: number;
};

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

const DEFAULT_DISCOVERY_MODE: AuthorCreativeCandidate["mode"] = "RELATIONAL";

const RECORD_SHAPE_LANGUAGE =
  /\b(?:list|prompt|input|record(?:ed|ing|s)?|document(?:ed|ing|s)?|audit(?:ed|ing|s)?|log(?:ged|ging|s)?|format(?:ting)?|field|fields|wording|phrasing|sentence|sentences|presentation)\b/i;

const TEMPORAL_EVALUATION_LANGUAGE =
  /\b(?:compressed timeframe|intense|intensity|sprint|rapid|rapidly|rushed|rush|fast|faster|quick|quickly|brief|briefly|slow|slowly|urgent|urgency|burst)\b/i;

const EVIDENCE_TOKEN_STOP = new Set([
  "the", "and", "with", "from", "that", "this", "into", "then", "were", "was",
  "are", "for", "at", "arrived", "finished", "cleaned", "event", "events",
]);

function evidenceTokens(text: string): Set<string> {
  return new Set(
    clean(text)
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .filter((token) => token.length >= 4 && !EVIDENCE_TOKEN_STOP.has(token)),
  );
}

function candidateReferencesUncitedEvidence(
  candidate: AuthorCreativeCandidate,
  events: ReadonlyArray<{ id: string; text: string }>,
): boolean {
  const cited = new Set(candidate.evidenceEventIds.map(clean));
  const candidateTokens = evidenceTokens([
    candidate.perception,
    candidate.relationship,
    candidate.observerInference,
  ].join(" "));

  if (!candidateTokens.size) return false;

  return events
    .filter((event) => !cited.has(clean(event.id)))
    .some((event) => {
      const tokens = evidenceTokens(event.text);
      return [...tokens].some((token) => candidateTokens.has(token));
    });
}

function candidateCrossesUnsupportedTemporalEvaluation(
  candidate: AuthorCreativeCandidate,
  suppliedRealityText: string,
): boolean {
  // Do not reject creative discovery by vocabulary alone. Temporal language is
  // only a problem when it materially changes duration, urgency, or chronology.
  // Discovery is private semantic thought; realized claims are checked later.
  void candidate;
  void suppliedRealityText;
  return false;
}
const OPERATIONAL_TRAIT_INFERENCE =
  /\b(?:meticulous(?:ness)?|diligen(?:ce|t)|efficien(?:cy|t)|devotion|devoted|obsess(?:ion|ive|ively)|disciplin(?:e|ed)|methodical|systematic|careful(?:ness)?|focused|focus|work ethic|dedication|dedicated)\b/i;

const UNSUPPORTED_ORDER_EVALUATION =
  /\b(?:priorit(?:y|ize|ized|ization)|hierarchy|higher priority|lower priority|more important|less important|demands? more attention|requires? more attention|deserves? more attention|takes? precedence|primary over|secondary to)\b/i;

function isBusinessCreativeContext(domainContext?: AuthorDomainContext): boolean {
  const context = (domainContext ?? {}) as Record<string, unknown>;
  const serviceType = clean(context.serviceType);
  const businessType = clean(context.businessType);
  const merchantType = clean(context.merchantType);
  const category = clean(context.category).toUpperCase();

  return Boolean(serviceType || businessType || merchantType) ||
    /\b(?:SERVICE|BUSINESS|COMMERCE|RETAIL|RESTAURANT|HOSPITALITY|GROOMING)\b/.test(category);
}

function isServiceContext(domainContext?: AuthorDomainContext): boolean {
  const context = (domainContext ?? {}) as Record<string, unknown>;
  const category = clean(context.category).toUpperCase();
  const serviceType = clean(context.serviceType).toUpperCase();

  return Boolean(serviceType) ||
    category.includes("SERVICE") ||
    category.includes("GROOMING");
}

function isMemoryContext(domainContext?: AuthorDomainContext): boolean {
  const context = (domainContext ?? {}) as Record<string, unknown>;
  return clean(context.experienceMode).toUpperCase() === "MEMORY";
}

function candidateCrossesOperationalServiceTruthFloor(
  candidate: AuthorCreativeCandidate,
  suppliedRealityText: string,
  domainContext?: AuthorDomainContext,
): boolean {
  if (!isServiceContext(domainContext)) return false;

  const candidateText = clean([
    candidate.perception,
    candidate.relationship,
    candidate.observerInference,
  ].join(" "));

  if (!OPERATIONAL_TRAIT_INFERENCE.test(candidateText)) return false;

  return !OPERATIONAL_TRAIT_INFERENCE.test(suppliedRealityText);
}

function candidateCrossesDeterministicTruthFloor(
  candidate: AuthorCreativeCandidate,
  suppliedRealityText: string,
): boolean {
  const candidateText = clean([
    candidate.perception,
    candidate.relationship,
    candidate.observerInference,
  ].join(" "));

  // Deterministic Discovery rejection is intentionally structural only.
  // Semantic words such as curation, rank, rebellion, resistance, ceremony,
  // priority, or liberation can be either figurative framing or factual claims.
  // The semantic verifier decides which. Do not blacklist meaning by vocabulary.
  return (
    (
      RECORD_SHAPE_LANGUAGE.test(candidateText) &&
      !RECORD_SHAPE_LANGUAGE.test(suppliedRealityText)
    ) ||
    (
      UNSUPPORTED_ORDER_EVALUATION.test(candidateText) &&
      !UNSUPPORTED_ORDER_EVALUATION.test(suppliedRealityText)
    )
  );
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
    mode: DEFAULT_DISCOVERY_MODE,
    perception,
    relationship,
    observerInference,
    evidenceEventIds: stringArray(record.evidenceEventIds, 32)
      .filter((id) => allowedEventIds.has(id)),
    whyItHits: clean(record.whyItHits),
    risk: clean(record.risk),
  };
}

async function verifyDiscoveryCandidates(input: {
  candidates: readonly AuthorCreativeCandidate[];
  events: ReadonlyArray<{ id: string; text: string }>;
  relations?: readonly AuthorDiscoveryRelation[];
  domainContext?: AuthorDomainContext;
}): Promise<{ groundedIds: Set<string>; modelCalls: number }> {
  if (!input.candidates.length) {
    return { groundedIds: new Set(), modelCalls: 0 };
  }

  const result = await localModelGenerate(
    [
      {
        role: "system",
        content: [
          "You are QRE Discovery Semantic Grounding.",
          "Reality is authority.",
          "Judge only whether each candidate's perception and relationship require unsupported concrete occurrence or another material premise beyond SUPPLIED_REALITY.",
          "A candidate may use nonliteral or interpretive language when it remains a perception of supplied evidence rather than a new fact.",
          "Reject only when understanding the candidate requires an unsupplied participant, event, action, object, place, concrete state, cause, motive, intention, ownership, chronology, completed outcome, hidden condition, or material relationship.",
          "Do not judge creative strength. Do not reject a candidate for being boring, narrow, odd, understated, familiar, or weak.",
          "Do not improve, rewrite, rank, or repair candidates.",
          "For every candidate, list unsupportedClaims: each unsupported material premise required by its perception or relationship.",
          "grounded must be true exactly when unsupportedClaims is empty.",
          "Return one verification for every candidate, in the same order.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUPPLIED_REALITY: input.events,
          SUPPLIED_RELATIONS: input.relations ?? [],
          CANDIDATES: input.candidates.map((candidate) => ({
            id: candidate.id,
            perception: candidate.perception,
            relationship: candidate.relationship,
            evidenceEventIds: candidate.evidenceEventIds,
          })),
          instruction:
            "Audit factual support only. A candidate is grounded when its perception and relationship can be understood as interpretation of cited supplied evidence without adding unsupported material reality. Return unsupportedClaims for material premises that exceed supplied reality.",
        }),
      },
    ],
    "json",
    {
      numPredict: Math.max(420, input.candidates.length * 105),
      temperature: 0.08,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["verifications"],
        properties: {
          verifications: {
            type: "array",
            minItems: input.candidates.length,
            maxItems: input.candidates.length,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["candidateId", "grounded", "unsupportedClaims"],
              properties: {
                candidateId: { type: "string", maxLength: 48 },
                grounded: { type: "boolean" },
                unsupportedClaims: {
                  type: "array",
                  maxItems: 16,
                  items: { type: "string", maxLength: 140 },
                },
              },
            },
          },
        },
      },
    },
  );

  const parsed = parseJson(result.text);
  const raw = Array.isArray(parsed?.verifications)
    ? parsed.verifications
    : [];

  const candidateIds = new Set(input.candidates.map((candidate) => candidate.id));
  const groundedIds = new Set<string>();

  for (const value of raw) {
    if (!value || typeof value !== "object") continue;
    const record = value as Record<string, unknown>;
    const candidateId = clean(record.candidateId);
    const unsupportedClaims = Array.isArray(record.unsupportedClaims)
      ? record.unsupportedClaims
          .filter((claim): claim is string => typeof claim === "string")
          .map(clean)
          .filter(Boolean)
      : [];

    if (
      !unsupportedClaims.length &&
      record.grounded === true &&
      candidateIds.has(candidateId)
    ) {
      groundedIds.add(candidateId);
    }
  }

  return { groundedIds, modelCalls: 1 };
}

async function repairDiscoveryCandidates(input: {
  candidates: readonly AuthorCreativeCandidate[];
  events: ReadonlyArray<{ id: string; text: string }>;
  relations?: readonly AuthorDiscoveryRelation[];
  allowedEventIds: Set<string>;
  domainContext?: AuthorDomainContext;
}): Promise<{ candidates: AuthorCreativeCandidate[]; model: string; modelCalls: number }> {
  if (!input.candidates.length) {
    return { candidates: [], model: "none", modelCalls: 0 };
  }

  const result = await localModelGenerate(
    [
      {
        role: "system",
        content: [
          "You are QRE Creative Discovery Repair.",
          "Reality is fixed. Meaning may move.",
          "Repair is factual salvage only, not a second Discovery pass.",
          "Preserve the original candidate's perceptual idea and evidence lineage when it can survive.",
          "Repair only by deleting unsupported material claims or narrowing wording so the original idea no longer requires unsupported reality.",
          "Do not invent a new perception, introduce a new relationship, search for a stronger idea, reinterpret different evidence, or optimize for creativity.",
          "If factual narrowing would turn the candidate into a different idea, return no repair.",
          "Return zero, one, or two repaired candidates. Zero is valid.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUPPLIED_REALITY: input.events,
          SUPPLIED_RELATIONS: input.relations ?? [],
          FAILED_DISCOVERY: input.candidates.map((candidate) => ({
            id: candidate.id,
            perception: candidate.perception,
            relationship: candidate.relationship,
            evidenceEventIds: candidate.evidenceEventIds,
          })),
          instruction:
            "For each failed candidate, return a repaired candidate only if the same perceptual idea can survive by narrowing or deleting unsupported material claims. Preserve the original candidate ID lineage and original evidence IDs unless an evidence ID no longer supports any surviving part of the candidate. Do not write final cuts.",
        }),
      },
    ],
    "json",
    {
      numPredict: 360,
      temperature: 0.46,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["candidates"],
        properties: {
          candidates: {
            type: "array",
            maxItems: 2,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["id", "perception", "relationship", "evidenceEventIds"],
              properties: {
                id: { type: "string", maxLength: 48 },
                perception: { type: "string", maxLength: 180 },
                relationship: { type: "string", maxLength: 140 },
                evidenceEventIds: {
                  type: "array",
                  minItems: 1,
                  maxItems: 32,
                  items: { type: "string", maxLength: 64 },
                },
              },
            },
          },
        },
      },
    },
  );

  const parsed = parseJson(result.text);
  const raw = Array.isArray(parsed?.candidates) ? parsed.candidates : [];
  const suppliedRealityText = clean(input.events.map((event) => event.text).join(" "));

  const candidates = raw
    .map((value, index) => normalizeCandidate(value, index, input.allowedEventIds))
    .filter((value): value is AuthorCreativeCandidate => Boolean(value))
    .map((candidate) => {
      const originalId = clean(candidate.id).replace(/-repair(?:ed)?$/i, "");
      const original = input.candidates.find(
        (failed) => clean(failed.id) === originalId,
      );
      if (!original) return candidate;

      return {
        ...candidate,
        id: `${original.id}-repair`,
        evidenceEventIds: unique([
          ...original.evidenceEventIds,
          ...candidate.evidenceEventIds,
        ]).filter((id) => input.allowedEventIds.has(id)),
      };
    })
    .filter((candidate) =>
      !candidateCrossesDeterministicTruthFloor(candidate, suppliedRealityText),
    )
    .filter((candidate) =>
      !candidateCrossesOperationalServiceTruthFloor(
        candidate,
        suppliedRealityText,
        input.domainContext,
      ),
    )
    .filter((candidate) =>
      !candidateCrossesUnsupportedTemporalEvaluation(
        candidate,
        suppliedRealityText,
      ),
    )
    .filter((candidate) =>
      !candidateReferencesUncitedEvidence(candidate, input.events),
    )
    .slice(0, 2);

  return {
    candidates,
    model: result.model,
    modelCalls: 1,
  };
}

export async function discoverAuthorCreativeDirection(input: {
  events: ReadonlyArray<{ id: string; text: string }>;
  relations?: readonly AuthorDiscoveryRelation[];
  requestedLens?: string;
  memory?: readonly string[];
  domainContext?: AuthorDomainContext;
}): Promise<{
  discovery: AuthorCreativeDiscovery;
  model: string;
  modelCalls: number;
}> {
  const requestedLens = clean(input.requestedLens);
  const normalizedRequestedLens = requestedLens.toUpperCase();
  const businessCreativeContext = isBusinessCreativeContext(input.domainContext);
  const lensStageOwnsFraming =
    businessCreativeContext &&
    normalizedRequestedLens !== "NONE";
  const allowedEventIds = new Set(input.events.map((event) => event.id));

  const system = [
    "You are QRE Creative Discovery.",
    "Reality is fixed. Meaning may move.",
    "",
    "FIND WHAT IS WORTH NOTICING.",
    "Study CURRENT_REALITY as facts about the world. Return only reads whose meaning can be traced to supplied evidence. Zero useful reads is valid. One exceptional read is valid. Unused facts are allowed.",
    "A read may come from one supplied detail or from the way supplied facts change one another's significance. It earns attention when cited evidence makes the material register differently than a direct paraphrase would.",
    "",
    "KEEP REALITY CLOSED.",
    "Supplied reality controls concrete occurrence: who or what materially exists, what materially happened, and which concrete states, causes, and outcomes are supplied.",
    "Discovery may change attention, emphasis, relation, abstraction, and significance. It may not add concrete occurrence or turn interpretation into another fact.",
    "SUPPLIED_RELATIONS may help identify connections among supplied facts. They do not independently authorize motive, causality, hierarchy, intention, ownership, or other concrete world claims.",
    "Read CURRENT_REALITY as facts about the world, not as formatting, field order, wording pattern, input record, or the act of recording.",
    "",
    "CREATE GROUNDED READS.",
    "Keep each one concise.",
    "perception = the supplied material as newly understood.",
    "relationship = the grounded connection inside the supplied material that makes the perception possible.",
    "evidenceEventIds = the supplied facts that make the read possible.",
    "State interpretation as interpretation. Figurative meaning should remain perceptual, not invented history.",
    "BUSINESS_CONTEXT may clarify vocabulary, but it is not evidence for new occurrence.",
    ...(lensStageOwnsFraming ? [
      "",
      "HANDOFF BOUNDARY:",
      "A downstream Creative Lens stage owns final treatment. Discovery owns the grounded perception and the evidence that carries it.",
      "Find the grounded meaning. Supplied material remains available downstream independently of the evidence needed for that meaning. Do not choose final treatment, write final prose, plan scenes, or score authored output.",
    ] : []),
    "",
    "SELECT BY COGNITIVE RETURN.",
    "Choose the read whose necessary evidence creates the clearest supported change in understanding. Prefer a read that depends on supplied specifics, remains valid without hidden premises, preserves ambiguity where the facts leave it, and gives later creative work one grounded idea to carry forward.",
    "A read does not become stronger by covering more facts. It becomes stronger when its cited evidence supports a sharper change in perception.",
    "",
    "Return only the requested structured object.",
  ].join("\n");

  const result = await localModelGenerate(
    [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          CURRENT_REALITY: input.events,
          SUPPLIED_RELATIONS: input.relations ?? [],
          MEMORY: (input.memory ?? []).slice(0, 12),
          BUSINESS_CONTEXT: input.domainContext,
          instruction:
            "Find any grounded reads worth returning. Fewer than the schema allows is valid; zero is valid. Use only supplied evidence, select the read with the clearest supported change in understanding, and return no final prose or unsupported explanation.",
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
          "confidence",
          "selectionReason",
          "risk",
        ],
        properties: {
          candidates: {
            type: "array",
            minItems: 0,
            maxItems: 4,
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "id",
                "perception",
                "relationship",
                "evidenceEventIds",
              ],
              properties: {
                id: { type: "string", maxLength: 48 },
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
  const deterministicCandidates = rawCandidates
    .map((value, index) => normalizeCandidate(value, index, allowedEventIds))
    .filter((value): value is AuthorCreativeCandidate => Boolean(value))
    .filter((candidate) =>
      !candidateCrossesDeterministicTruthFloor(candidate, suppliedRealityText),
    )
    .filter((candidate) =>
      !candidateCrossesOperationalServiceTruthFloor(
        candidate,
        suppliedRealityText,
        input.domainContext,
      ),
    )
    .filter((candidate) =>
      !candidateCrossesUnsupportedTemporalEvaluation(
        candidate,
        suppliedRealityText,
      ),
    )
    .filter((candidate) =>
      !candidateReferencesUncitedEvidence(candidate, input.events),
    );

  const semanticVerification = await verifyDiscoveryCandidates({
    candidates: deterministicCandidates,
    events: input.events,
    relations: input.relations,
    domainContext: input.domainContext,
  });

  let candidates = deterministicCandidates.filter((candidate) =>
    semanticVerification.groundedIds.has(candidate.id),
  );

  const requestedSelectedId = clean(parsed?.selectedCandidateId);

  let repairModel = result.model;
  let repairModelCalls = 0;
  let usedRepair = false;

  const modelSelectedCandidate = deterministicCandidates.find(
    (candidate) => candidate.id === requestedSelectedId,
  );
  const modelSelectedSurvived = candidates.some(
    (candidate) => candidate.id === requestedSelectedId,
  );

  const repairTargets =
    modelSelectedCandidate && !modelSelectedSurvived
      ? [modelSelectedCandidate]
      : !candidates.length
        ? deterministicCandidates
        : [];

  if (repairTargets.length) {
    const repair = await repairDiscoveryCandidates({
      candidates: repairTargets,
      events: input.events,
      relations: input.relations,
      allowedEventIds,
      domainContext: input.domainContext,
    });
    repairModel = repair.model === "none" ? result.model : repair.model;
    repairModelCalls += repair.modelCalls;
    usedRepair = repair.modelCalls > 0;

    if (repair.candidates.length) {
      const repairedVerification = await verifyDiscoveryCandidates({
        candidates: repair.candidates,
        events: input.events,
        relations: input.relations,
        domainContext: input.domainContext,
      });
      repairModelCalls += repairedVerification.modelCalls;

      const groundedRepairs = repair.candidates.filter((candidate) =>
        repairedVerification.groundedIds.has(candidate.id),
      );

      candidates = unique([
        ...groundedRepairs.map((candidate) => candidate.id),
        ...candidates.map((candidate) => candidate.id),
      ])
        .map((id) =>
          groundedRepairs.find((candidate) => candidate.id === id) ??
          candidates.find((candidate) => candidate.id === id),
        )
        .filter((candidate): candidate is AuthorCreativeCandidate => Boolean(candidate));
    }
  }

  const fallbackCandidate: AuthorCreativeCandidate = {
    id: "reality-direct",
    mode: "RELATIONAL",
    perception: "Use the supplied reality directly; no additional hidden relationship is established.",
    relationship: "",
    observerInference: "",
    evidenceEventIds: input.events.map((event) => event.id),
    whyItHits: "",
    risk: "no_grounded_discovery_candidate",
  };

  const requestedSelected = !usedRepair
    ? candidates.find((candidate) => candidate.id === requestedSelectedId)
    : undefined;

  const repairedSelected = usedRepair
    ? candidates.find((candidate) => {
        const baseId = clean(candidate.id).replace(/-repair(?:ed)?$/i, "");
        return baseId === requestedSelectedId;
      })
    : undefined;

  const selected =
    requestedSelected ??
    repairedSelected ??
    candidates[0] ??
    fallbackCandidate;

  const selectedMatchesModelChoice =
    Boolean(requestedSelected) &&
    selected.id === requestedSelectedId;

  // Evidence proves the selected meaning. MEMORY's available material is the
  // full supplied event corridor, regardless of selection, repair, or fallback.
  // Preserve input order and never let model-authored partitions narrow it.
  const playableEventIds = isMemoryContext(input.domainContext)
    ? unique(input.events.map((event) => event.id))
    : unique(selected.evidenceEventIds).filter((id) => allowedEventIds.has(id));

  const playableSet = new Set(playableEventIds);

  // Compatibility output only: background is derived, never model-authored.
  const backgroundEventIds = selected.evidenceEventIds
    .filter((id) => allowedEventIds.has(id) && !playableSet.has(id));

  return {
    discovery: {
      candidates,
      selectedCandidateId: selected.id,
      selected,
      playableEventIds,
      backgroundEventIds,
      // Compatibility only. Structure owns arrangement and evidence revisits.
      experienceShape: [],
      lens: requestedLens || "NONE",
      confidence: clamp(parsed?.confidence, 0.65),
      selectionReason: selectedMatchesModelChoice
        ? clean(parsed?.selectionReason)
        : selected.perception || selected.relationship,
      risk: selectedMatchesModelChoice
        ? clean(parsed?.risk) || selected.risk
        : selected.risk,
    },
    model: repairModel,
    modelCalls: 1 + semanticVerification.modelCalls + repairModelCalls,
  };
}
