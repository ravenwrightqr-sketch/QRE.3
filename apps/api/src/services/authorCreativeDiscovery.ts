import type { AuthorDomainContext } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import { validateAuthorDerivedMeaningStructure, type AuthorDerivedMeaning } from "./authorDerivedMeaning.js";

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
  derivedMeaning?: AuthorDerivedMeaning;
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
  // Shared subjects and details are not evidence of an uncited occurrence.
  // Only vocabulary exclusive to uncited facts can trigger this early check;
  // semantic verification still judges the actual claim and its premises.
  const citedTokens = evidenceTokens(events
    .filter((event) => cited.has(clean(event.id)))
    .map((event) => event.text).join(" "));
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
      return [...tokens].some((token) =>
        !citedTokens.has(token) && candidateTokens.has(token),
      );
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
          "Judge only whether each candidate commits the world to unsupported concrete occurrence beyond SUPPLIED_REALITY.",
          "REALITY IS CLOSED. DISCOURSE IS OPEN.",
          "Grounding is provenance, not paraphrase. Supplied evidence may license a new interpretation, attitude, significance, contrast, rhetorical status, metaphor, generalized observation, or point of view without that expressive meaning becoming another factual event.",
          "Do not literalize rhetoric. Words such as resistance, rebellion, contest, holdout, victory, argument, ceremony, status, or similar framing are not automatically concrete claims. Ask what additional thing the viewer would have to believe literally happened.",
          "MENTAL STRIP TEST: remove metaphor, personification, rhetorical POV, attitude, judgment, abstraction, and expressive characterization. Reject only if a new concrete participant, event, action, object, place, physical state, observation, motive, cause, duration, persistence, completed outcome, chronology, ownership, history, or material relationship still remains.",
          "An attempt to remove a supplied object may license expressive readings such as resistance to that object, the object becoming contested, or a small rebellion. Those readings do not assert a literal contest or rebellion unless the candidate separately claims one occurred.",
          "A supplied feeling supports that feeling and rhetorical contrast with other supplied facts. It does not by itself establish the feeling's object, cause, purpose, duration, or exception.",
          "Do not demand that interpretation already exist verbatim in SUPPLIED_REALITY. If the cited facts support the leap and no new concrete world commitment survives the strip test, the candidate is grounded.",
          "Do not judge creative strength. Do not reject a candidate for being bold, odd, figurative, understated, familiar, or weak.",
          "Do not improve, rewrite, rank, or repair candidates.",
          "For every candidate, list unsupportedClaims only for additional concrete world commitments that survive the mental strip test.",
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
            "Audit world commitments only. Preserve supported interpretation as interpretation. Apply the mental strip test and return unsupportedClaims only for concrete commitments that remain beyond supplied reality.",
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

// This is cognition, not another event extractor or a Lens treatment. Structural
// validation and semantic authority both precede any downstream handoff.
export async function discoverAuthorDerivedMeaning(
  events: ReadonlyArray<{ id: string; text: string }>,
): Promise<{ derivedMeaning: AuthorDerivedMeaning; modelCalls: number }> {
  const empty: AuthorDerivedMeaning = { kind: "DERIVED_MEANING", relations: [] };
  if (new Set(events.map((event) => event.id)).size < 2) {
    return { derivedMeaning: empty, modelCalls: 0 };
  }
  let modelCalls = 0;
  try {
    modelCalls++;
    const result = await localModelGenerate([
      { role: "system", content: [
        "You are QRE Discovery Relational Abstraction.",
        "Examine only SUPPLIED_REALITY. Find meaningful relations among supplied facts, grounding each relation in at least two distinct supplied event IDs.",
        "For each relation, derive distinct conceptual interpretations it supports, with a derivation explaining the evidence-to-meaning connection.",
        "Interpretations express supported significance rather than merely renaming an event, object, action, participant, or sequence.",
        "Look for the specific detail whose relationship to another fact carries tension, surprise, character, contradiction, or an unresolved implication. A small friction can hold more meaning than the overall outcome.",
        "Explore the conceptual neighborhood of a supplied truth as possible significance, then test those possibilities against the other facts. Let their relationship determine which interpretation is earned; the original truth remains the factual state.",
        "For a supplied feeling, explore the pressures it makes available: uncertainty, anticipation, stakes, vulnerability, readiness, or unresolved confidence. Treat these as conceptual directions to test, rather than additional feelings or beliefs attributed to the subject.",
        "Find what changes when that pressure meets a supplied action, object, or later state. A relation may create expectation, contrast, rhetorical status, or an unresolved question while the reason for the feeling stays unknown.",
        "Keep distinct readings available: an ending state can coexist with a local conflict without resolving that conflict or explaining its cause.",
        "Use as many interpretations as the evidence earns. Zero relations is valid; do not force abstraction, pad alternatives, or require collective coverage.",
        "Keep concrete reality fixed: participants, occurrences, states, chronology, causes, motives, intentions and outcomes must be supplied.",
        "Describe observed changes as observed changes. Sequence alone establishes order; a cause, duration, subjective experience, or resolution needs its own supplied evidence. Possibility words preserve uncertainty but do not supply missing evidence.",
        "Return private cognition only, without viewer-facing lines, jokes, slogans, scenes or genre treatments.",
        "Assign unique relation IDs and globally unique interpretation IDs. Return DERIVED_MEANING separately from supplied events.",
        "Write complete concise thoughts inside each field's length limit; preserve the essential relationship and finish the thought.",
      ].join("\n") },
      { role: "user", content: JSON.stringify({ SUPPLIED_REALITY: events }) },
    ], "json", {
      numPredict: 1600,
      temperature: 0.65,
      jsonSchema: {
        type: "object", additionalProperties: false, required: ["kind", "relations"],
        properties: {
          kind: { type: "string", enum: ["DERIVED_MEANING"] },
          relations: { type: "array", maxItems: 4, items: {
            type: "object", additionalProperties: false,
            required: ["id", "relation", "groundingEventIds", "interpretations"],
            properties: {
              id: { type: "string", maxLength: 64 },
              relation: { type: "string", maxLength: 180 },
              // Provider schemas omit uniqueItems; the structural validator
              // still rejects duplicate IDs before semantic authority runs.
              groundingEventIds: { type: "array", minItems: 2, maxItems: 32,
                items: { type: "string", maxLength: 64 } },
              interpretations: { type: "array", minItems: 1, maxItems: 4, items: {
                type: "object", additionalProperties: false,
                required: ["id", "interpretation", "derivation"],
                properties: {
                  id: { type: "string", maxLength: 64 },
                  interpretation: { type: "string", maxLength: 180 },
                  derivation: { type: "string", maxLength: 240 },
                },
              } },
            },
          } },
        },
      },
    });
    const validation = validateAuthorDerivedMeaningStructure(parseJson(result.text), events);
    if (!validation.valid || !validation.value.relations.length ||
      validation.value.relations.length > 4 ||
      validation.value.relations.some((relation) => relation.interpretations.length > 4 || relation.groundingEventIds.length > 32)) {
      return { derivedMeaning: empty, modelCalls };
    }
    const relations = validation.value.relations;
    // Audit the relation independently and every interpretation WITH its
    // derivation. A bad relation invalidates its children; bad siblings do not.
    const claims = relations.flatMap((relation, r) => {
      const evidence = events.filter((event) => relation.groundingEventIds.includes(event.id));
      return [
        { id: `r${r}`, relation: relation.relation, evidence },
        ...relation.interpretations.map((interpretation, i) => ({
          id: `r${r}i${i}`, relation: relation.relation, evidence,
          interpretation: interpretation.interpretation, derivation: interpretation.derivation,
        })),
      ];
    });
    modelCalls++;
    const audit = await localModelGenerate([
      { role: "system", content: [
        "You are QRE Discovery Derived Meaning Authority.",
        "For each claim, judge factual support against that claim's cited evidence only.",
        "Audit the relation, interpretation and derivation. Nonliteral significance is allowed when it introduces no unsupported material premise.",
        "Distinguish a conceptual reading of a supplied feeling from assigning another actual mental state. Expectation or rhetorical tension can be supported without knowing the feeling's cause; an assertion about what the subject feared, expected, accepted, or felt relief from needs supplied evidence.",
        "Reject unsupplied participants, occurrences, states, motives, intentions, ownership, causes, chronology, outcomes or hidden conditions required to understand any part of the claim.",
        "Check each causal and temporal commitment independently. An earlier state and a later state support that contrast; they do not establish what caused either state, how long it lasted, or whether a different conflict was resolved.",
        "Words such as likely, suggests, or temporary do not ground an otherwise unsupported material premise. Distinguish figurative significance from assertions about actual subjective experience or causal effects.",
        "Judge truth only, without ranking taste, creativity, strength or familiarity. Do not rewrite or repair.",
        "Return exactly one verification for each claim ID. grounded is true exactly when unsupportedClaims is empty.",
      ].join("\n") },
      { role: "user", content: JSON.stringify({ DERIVED_MEANING_CLAIMS: claims }) },
    ], "json", {
      numPredict: Math.max(420, claims.length * 100), temperature: 0.08,
      jsonSchema: {
        type: "object", additionalProperties: false, required: ["verifications"],
        properties: { verifications: { type: "array", minItems: claims.length, maxItems: claims.length,
          items: { type: "object", additionalProperties: false,
            required: ["claimId", "grounded", "unsupportedClaims"],
            properties: { claimId: { type: "string", maxLength: 32 }, grounded: { type: "boolean" },
              unsupportedClaims: { type: "array", maxItems: 16, items: { type: "string", maxLength: 140 } } },
          } } },
      },
    });
    const verifications = parseJson(audit.text)?.verifications;
    if (!Array.isArray(verifications)) return { derivedMeaning: empty, modelCalls };
    const grounded = (id: string): boolean => {
      const matches = verifications.filter((value) => value && value.claimId === id);
      return matches.length === 1 && matches[0].grounded === true &&
        Array.isArray(matches[0].unsupportedClaims) && matches[0].unsupportedClaims.length === 0;
    };
    return {
      derivedMeaning: { kind: "DERIVED_MEANING", relations: relations.flatMap((relation, r) => {
        if (!grounded(`r${r}`)) return [];
        const interpretations = relation.interpretations.filter((_, i) => grounded(`r${r}i${i}`));
        return interpretations.length ? [{ ...relation, interpretations }] : [];
      }) },
      modelCalls,
    };
  } catch {
    // Optional cognition fails closed; supplied facts and the approved primary
    // Discovery read remain available. Account for attempted model calls.
    return { derivedMeaning: empty, modelCalls };
  }
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
          "Keep a supported contrast or tension when its explanation must be removed. A supplied feeling and a later action may remain in relation while the feeling's cause and object remain unknown.",
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
    "Look sideways: explore what a supplied truth can mean, then let another supplied truth sharpen, contradict, or reframe that possibility. Find relationships before a downstream treatment amplifies them.",
    "Explore a supplied feeling as creative pressure rather than a request to explain its psychology. Search uncertainty, anticipation, stakes, vulnerability, readiness, and unresolved confidence as conceptual directions; keep only the significance other supplied facts make fertile.",
    "Let a feeling change how a supplied action or object registers. Find expectation, contrast, rhetorical status, or a question in that collision while preserving ambiguity about the feeling's cause. The discovered attitude belongs to the reading; additional actual beliefs and mental states require evidence.",
    "Consider whether a supplied entity offers a fertile perspective on the same facts. Discover the supported relationship or attitude privately; leave its final voice and rhetorical realization to Lens and Mouth.",
    "",
    "KEEP REALITY CLOSED.",
    "Supplied reality controls concrete occurrence: who or what materially exists, what materially happened, and which concrete states, causes, and outcomes are supplied.",
    "Discovery may change attention, emphasis, relation, abstraction, and significance. It may not add concrete occurrence or turn interpretation into another fact.",
    "SUPPLIED_RELATIONS may help identify connections among supplied facts. They do not independently authorize motive, causality, hierarchy, intention, ownership, or other concrete world claims.",
    "Read CURRENT_REALITY as facts about the world, not as formatting, field order, wording pattern, input record, or the act of recording.",
    "",
    "CREATE GROUNDED READS.",
    "Keep each one concise.",
    "Write complete thoughts inside the perception and relationship length limits. Let the essential connection fit rather than trailing off midway through an explanation.",
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
    "SEARCH BEFORE SELECTION.",
    "Do not choose a winner while generating reads. Build a genuinely divergent set first.",
    "When the evidence supports it, make candidates differ in semantic operation, not merely wording or emphasis. Search across possibilities such as: a particular characterization of one friction; a broader human or social observation licensed by the detail; a rhetorical perspective or attitude available from a supplied entity or relevant category; an implication or recontextualization created when two facts collide; an inversion of which detail seems important.",
    "These are search directions, not quotas or labels. Do not force a category the evidence does not earn. Do not make several candidates that all reduce to the same before/after summary.",
    "A broader observation need not claim that it literally occurred inside the event. A rhetorical speaker need not become a factual participant. Keep those as interpretation while concrete reality stays closed.",
    "Give disproportionate search attention to the odd, resistant, specific, awkward, or revealing detail. Do not automatically make the final positive state the meaning of the experience.",
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
            "Search for a divergent set of grounded reads worth considering. Fewer than the schema allows is valid; zero is valid. Do not select a winner. Make supported candidates conceptually different from one another rather than paraphrases of the same summary. Return no final prose or unsupported explanation.",
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
          "confidence",
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
          confidence: { type: "number" },
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

  let requestedSelectedId = "";

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
    !candidates.length
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

  if (candidates.length > 1) {
    const selectionResult = await localModelGenerate(
      [
        {
          role: "system",
          content: [
            "You are QRE Creative Discovery Selector.",
            "Discovery has already searched and semantic grounding has already removed unsupported reads.",
            "Choose among GROUNDED_CANDIDATES only. Do not rewrite, merge, repair, or invent another candidate.",
            "Select by cognitive return: which supported read most changes what becomes noticeable in this particular reality?",
            "Prefer specificity, surprise, relationship density, character, unresolved pressure, and a meaning that depends on the supplied particulars.",
            "Do not reward coverage. Do not automatically prefer chronology, a positive ending, emotional closure, or the candidate that summarizes the most events.",
            "A small resistant detail may outrank the broad arc when it creates the sharper supported perception.",
            "A broader observation, rhetorical attitude, implication, or recontextualization may outrank a literal particular characterization when the evidence genuinely licenses it.",
            "Return only the selected candidate ID plus concise selection reasoning.",
          ].join("\n"),
        },
        {
          role: "user",
          content: JSON.stringify({
            SUPPLIED_REALITY: input.events,
            GROUNDED_CANDIDATES: candidates.map((candidate) => ({
              id: candidate.id,
              perception: candidate.perception,
              relationship: candidate.relationship,
              evidenceEventIds: candidate.evidenceEventIds,
            })),
          }),
        },
      ],
      "json",
      {
        numPredict: 260,
        temperature: 0.35,
        jsonSchema: {
          type: "object",
          additionalProperties: false,
          required: ["selectedCandidateId", "selectionReason"],
          properties: {
            selectedCandidateId: { type: "string", maxLength: 48 },
            selectionReason: { type: "string", maxLength: 220 },
          },
        },
      },
    );
    const selectionParsed = parseJson(selectionResult.text);
    const selectedId = clean(selectionParsed?.selectedCandidateId);
    if (candidates.some((candidate) => candidate.id === selectedId)) {
      requestedSelectedId = selectedId;
      parsed.selectedCandidateId = selectedId;
      parsed.selectionReason = clean(selectionParsed?.selectionReason);
    }
    repairModelCalls += 1;
  } else if (candidates.length === 1) {
    requestedSelectedId = candidates[0].id;
    parsed.selectedCandidateId = requestedSelectedId;
    parsed.selectionReason = candidates[0].perception;
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

  const derived = await discoverAuthorDerivedMeaning(input.events);

  // Evidence proves the selected meaning. MEMORY's available material is the
  // full supplied event corridor, regardless of selection, repair, or fallback.
  // Preserve input order and never let model-authored partitions narrow it.
  const playableEventIds = isMemoryContext(input.domainContext)
    ? unique(input.events.map((event) => event.id))
    : unique([
        ...selected.evidenceEventIds,
        ...derived.derivedMeaning.relations.flatMap((relation) => relation.groundingEventIds),
      ]).filter((id) => allowedEventIds.has(id));

  const playableSet = new Set(playableEventIds);

  // Compatibility output only: background is derived, never model-authored.
  const backgroundEventIds = selected.evidenceEventIds
    .filter((id) => allowedEventIds.has(id) && !playableSet.has(id));

  return {
    discovery: {
      derivedMeaning: derived.derivedMeaning,
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
    modelCalls: 1 + semanticVerification.modelCalls + repairModelCalls + derived.modelCalls,
  };
}
