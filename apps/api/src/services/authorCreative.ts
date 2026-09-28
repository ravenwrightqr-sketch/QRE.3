import type { AuthorDomainContext, AuthorScene } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import type { AuthorCreativeDiscovery } from "./authorCreativeDiscovery.js";
import { evaluateAuthorCut } from "./authorCutFloor.js";
import { QRE_CREATIVE_OPERATING_DOCTRINE } from "./authorCreativeDoctrine.js";
import {
  AUTHOR_REALITY_AUTHORITY_DOCTRINE,
  projectAuthorRealityEvidence,
} from "./authorRealityAuthority.js";

/**
 * QRE CANONICAL AUTHOR BOUNDARY
 *
 * FILE ROLE:
 * Canonical Author middle path:
 * Creative Lens / Perceptual Discovery -> Experience Composition -> Mouth.
 *
 * OWNS:
 * - perceptual treatment search after Creative Discovery
 * - semantic-mechanic diagnostics and treatment compatibility
 * - experience composition: attention, grouping, omission, reuse, progression,
 *   recontextualization, return, and payoff
 * - Mouth realization, Mouth repair/fallback, and local production scoring
 *
 * DOES NOT OWN:
 * - Reality extraction, RealityGraph truth, or Reality Authority categories
 * - Creative Discovery candidate generation/repair/selection
 * - final atomic grounding verifier policy
 * - model provider transport, token budgets, or temperatures outside call sites
 *
 * DRIFT WARNING:
 * Keep the stage boundary clean: Discovery finds more meaning than the final
 * experience expresses; Composition decides perceptual movement and provenance;
 * Mouth realizes the composed movement in language; grounding protects concrete
 * reality. Do not make Mouth re-architect the experience, do not make coverage
 * mean every supplied fact must be said, and do not add benchmark-specific
 * creative patches. See ./AUTHOR_ARCHITECTURE.md before changing prompts,
 * cognition, grounding, scoring, or model behavior.
 */

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const stripProductionLabel = (value: unknown): string =>
  clean(value).replace(/^[A-D]\s*:\s*/i, "").trim();

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

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

function debug(label: string, value: unknown): void {
  if (process.env.QRE_AUTHOR_DEBUG_RAW !== "true") return;
  const text = typeof value === "string"
    ? value
    : JSON.stringify(value, null, 2);
  console.log(`\n--- QRE ${label} ---\n${text}\n--- END QRE ${label} ---\n`);
}

function parseJson(text: string): Record<string, unknown> | undefined {
  const source = clean(text)
    .replace(/^\`\`\`(?:json)?/i, "")
    .replace(/\`\`\`$/i, "")
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

export type AuthorCreativeEvent = {
  id: string;
  text: string;
};

export type AuthorExperienceMoveRole = "HOOK" | "BUILD" | "TURN" | "PAYOFF";

export type AuthorExperienceMove = {
  order: number;
  role: AuthorExperienceMoveRole;
  eventIds: string[];
  purpose: string;
  perceptualMove: string;
};

export type AuthorExperienceComposition = {
  thesis: string;
  perceptualTreatmentId?: string;
  moves: AuthorExperienceMove[];
  unusedEventIds: string[];
};

export type AuthorCreativeTreatmentAssignment = {
  id: string;
  semanticMechanic: string;
  sourceCandidateId: string;
  sourceRelation: string;
  evidenceEventIds: string[];
  creativePressure: string;
  hiddenInference: string;
  treatment: string;
  perceptionDelta: string;
  expressiveBehaviors: string[];
  intensity: "LIGHT" | "MEDIUM" | "STRONG";
};

export type AuthorCreativeNotice = {
  latentRelations: Array<{
    relation: string;
    evidenceEventIds: string[];
  }>;
};

export type AuthorStoryGravity = {
  mode: "ARC" | "SEQUENCE" | "PORTRAIT" | "WORLD_OPENING";
  centerEventIds: string[];
  openingSignalEventIds: string[];
  characterSignalEventIds: string[];
  tensionEventIds: string[];
  escalationEventIds: string[];
  sealingDetailEventId: string;
  endpointEventId: string;
  endpointMode: string;
  endpointAuthority: "HARD";
  backwardDependencies: Array<{
    eventId: string;
    supportsEventId: string;
    function: string;
  }>;
};

export type AuthorCreativeFailureLesson = {
  failure: string;
  reason: string;
  pattern: string;
  lesson: string;
  scope: "UNIVERSAL";
};

export type AuthorSemanticMechanicCandidate = {
  mechanic: string;
  reason: string;
  confidence: number;
};

const GENERIC_OR_STYLED_MECHANIC =
  /^(?:game|journey|mission|story|experience|transformation|operation|heist|courtroom|spy|horror|noir|ceremony|bureaucratic|speedrun|quest|ballet|protocol|ritual|performance|audit)$/i;

function materialText(values: readonly string[]): string {
  return clean(values.join(" ")).toLowerCase();
}

const KNOWN_EXPRESSIVE_BEHAVIOR_SEEDS = [
  "contrast",
  "status",
  "personification",
  "rhetorical scale",
  "irony",
  "callback",
  "omission",
  "escalation",
  "compression",
  "juxtaposition",
  "inversion",
  "understatement",
  "double meaning",
  "recontextualization",
  "anticipation",
  "question",
  "motif",
  "repetition",
] as const;

function isPresentationDirection(value: string): boolean {
  // This is a layer boundary, not a creativity blacklist. These terms describe
  // audiovisual/rendering execution rather than semantic or verbal authorship.
  return /\b(?:camera|shot|zoom|lighting|edit(?:ing)?|cutaway|close[ -]?up|intercut|color palette|colour palette|soundtrack|music|audio|sound design|sound effect|voiceover|staging|ui animation|visual transition|visual cues?|typography|overlay|graphics?|footage|slow[ -]?motion|desaturated)\b/i.test(value);
}

function normalizeExpressiveBehaviors(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  // Known operations are examples, not a ceiling. Preserve concise,
  // model-discovered semantic operations so QRE can invent new ways of thinking.
  return unique(
    value
      .filter((item): item is string => typeof item === "string")
      .map((item) => clean(item).toLowerCase())
      .filter((item) => item.length > 0 && item.length <= 48)
      .filter((item) => !isPresentationDirection(item)),
  ).slice(0, 4);
}

function clamp01(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

function addSemanticMechanicCandidate(
  candidates: AuthorSemanticMechanicCandidate[],
  mechanic: string,
  reason: string,
  confidence: number,
): void {
  const normalizedMechanic = clean(mechanic).toLowerCase();
  if (!normalizedMechanic || GENERIC_OR_STYLED_MECHANIC.test(normalizedMechanic)) return;
  if (candidates.some((candidate) => candidate.mechanic === normalizedMechanic)) return;

  candidates.push({
    mechanic: normalizedMechanic,
    reason: clean(reason),
    confidence: clamp01(confidence),
  });
}
export function deriveAuthorSemanticMechanicCandidates(input: {
  subject?: string;
  suppliedReality: readonly AuthorCreativeEvent[];
  creativeDiscovery?: AuthorCreativeDiscovery;
  memory?: readonly string[];
  domainContext?: AuthorDomainContext;
}): AuthorSemanticMechanicCandidate[] {
  const eventText = materialText(input.suppliedReality.map((event) => event.text));
  const discovery = input.creativeDiscovery;
  const discoveryText = materialText([
    discovery?.selected.perception,
    discovery?.selected.relationship,
    ...(discovery?.experienceShape ?? []),
  ].filter((value): value is string => typeof value === "string"));
  const memoryText = materialText(input.memory ?? []);
  const context = (input.domainContext ?? {}) as Record<string, unknown>;
  const contextText = materialText([
    context.serviceType,
    context.businessType,
    context.merchantType,
    context.category,
    context.serviceName,
  ].map((value) => clean(value)));
  const text = clean(`${eventText} ${discoveryText} ${memoryText}`);
  const textWithContext = clean(`${text} ${contextText}`);

  const candidates: AuthorSemanticMechanicCandidate[] = [];

  const hasResistance =
    /\b(?:nervous|scared|shy|guarded|hesitant|resisted|resistance|hates?|refused|tried|attempted|stole|steals|fierce|stubborn|defiant|rebellion)\b/i.test(text);

  const hasStatusObject =
    /\b(?:bow|ticket|badge|approval|approved|rank|status|official|claim|claimed|selected|chosen|crown|prize)\b/i.test(text);

  const hasStateContrast =
    /\b(?:before|after|left|arrived|came in|entered|finished|completed)\b/i.test(text) &&
    /\b(?:nervous|scared|shy|approved|happy|fabulous|clean|finished|complete|done)\b/i.test(text);

  if (
    (hasResistance && (hasStatusObject || hasStateContrast)) ||
    /status contest|status tension/i.test(discoveryText)
  ) {
    addSemanticMechanicCandidate(
      candidates,
      "status_tension",
      "supplied resistance or status difference creates a grounded tension between states or positions",
      0.92,
    );
  }

  const serviceSignals =
    /\b(?:service|clean(?:ed|ing)?|repair(?:ed|ing)?|groom(?:ed|ing)?|bath|bathroom|kitchen|packed|loaded|delivered|installed|inspection|appointment)\b/i;

  const boundedWork =
    /\b(?:arrived|started|began|first|then|next|finished|completed|done|left)\b/i.test(text);

  const timeOrCount =
    /\b(?:\d{1,2}:\d{2}|\d+\s*(?:rooms?|bathrooms?|boxes?|items?|hours?|minutes?|days?)|two|three|four|five|first|last)\b/i.test(text);

  const taskSignals = input.suppliedReality.filter((event) =>
    serviceSignals.test(event.text),
  );

  const hasBoundedProgression =
    taskSignals.length >= 2 &&
    boundedWork &&
    timeOrCount &&
    serviceSignals.test(textWithContext);

  if (hasBoundedProgression) {
    addSemanticMechanicCandidate(
      candidates,
      "bounded_progression",
      "supplied work has a bounded beginning, distinct middle actions, and an ending without implying style, urgency, or performance",
      0.84,
    );
  }

  if (
    /\b(?:missing|lost|vanished|unresolved|mystery|unknown|question|where|search|found)\b/i.test(text) &&
    /\b(?:box|object|item|key|card|record|bag|ticket|detail|thing)\b/i.test(text)
  ) {
    addSemanticMechanicCandidate(
      candidates,
      "unresolved_search",
      "a supplied unresolved object or question creates a grounded unresolved relation",
      0.94,
    );
  }

  if (
   /\b(?:same|again|returned|return|repeated|recurring|every|weekly)\b/i.test(text) ||
/\b(?:came|went|go|going|return(?:ed)?)\s+back\b/i.test(text) ||
/\bback\s+again\b/i.test(text)
  ) {
    addSemanticMechanicCandidate(
      candidates,
      "recurrence",
      "a repeated supplied detail creates a grounded recurrence relation",
      0.9,
    );
  }

  if (
    /\b(?:memorial|remember|old records?|birthday cards?|same song|quiet|kept every)\b/i.test(text) &&
    !hasResistance
  ) {
    addSemanticMechanicCandidate(
      candidates,
      "reflective_observation",
      "supplied memory material supports grounded observation without prescribing an expressive style",
      0.88,
    );
  }

  if (
    /\b(?:before|after|dirty|filthy|restored|cleaned|revealed|uncovered)\b/i.test(text) &&
    /\b(?:visible|looked|left|finished|done|result)\b/i.test(text)
  ) {
    addSemanticMechanicCandidate(
      candidates,
      "state_change",
      "supplied before-and-after or visible-state evidence establishes a grounded difference",
      0.76,
    );
  }

  return candidates
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 6);
}

export function selectAuthorSemanticMechanic(input: {
  candidates: readonly AuthorSemanticMechanicCandidate[];
  creativeDiscovery?: AuthorCreativeDiscovery;
}): AuthorSemanticMechanicCandidate {
  const groundedCandidates = input.candidates
    .filter((candidate) => {
      const mechanic = clean(candidate.mechanic);
      return mechanic && !GENERIC_OR_STYLED_MECHANIC.test(mechanic);
    })
    .sort((a, b) => b.confidence - a.confidence);

  if (!groundedCandidates.length) {
    return {
      mechanic: "NONE",
      reason: "no grounded semantic mechanic is available from supplied reality",
      confidence: 1,
    };
  }

  const top = groundedCandidates[0]!;

  if (top.confidence < 0.72) {
    return {
      mechanic: "NONE",
      reason: "no candidate materially improves the supplied reality",
      confidence: 0.76,
    };
  }

  return top;
}

export type AuthorCreativeTreatment = {
  id: string;
  sourceCandidateId: string;
  sourceRelation: string;
  evidenceEventIds: string[];
  creativePressure: string;
  hiddenInference: string;
  treatment: string;
  perceptionDelta: string;
  expressiveBehaviors: string[];
  intensity: "LIGHT" | "MEDIUM" | "STRONG";
};

function isBareTreatment(treatment: AuthorCreativeTreatment): boolean {
  return /\b(?:none|bare reality|natural|minimal treatment)\b/i.test(
    materialText([
      treatment.id,
      treatment.sourceCandidateId,
      treatment.sourceRelation,
      treatment.creativePressure,
      treatment.hiddenInference,
      treatment.treatment,
      treatment.perceptionDelta,
      ...treatment.expressiveBehaviors,
    ]),
  );
}

const SEQUENCE_RELATIONSHIP_DEVICE =
  /\b(?:callback|refrain|echo|motif|contrast|escalat\w*|payoff|anticipat\w*|recontextual\w*|interrupt\w*|withheld|omission|accumulat\w*|setup|turn|recurr\w*|repeat\w*|progression|rhythm)\b/i;

function treatmentHasSequenceRelationship(
  treatment: AuthorCreativeTreatment,
): boolean {
  return SEQUENCE_RELATIONSHIP_DEVICE.test(
    materialText([
      treatment.treatment,
      treatment.perceptionDelta,
      ...treatment.expressiveBehaviors,
    ]),
  );
}

export type AuthorCreativeTreatmentSetAssessment = {
  complete: boolean;
  creativeSetComplete: boolean;
  renderable: boolean;
  requestedExpressiveCount: number;
  generatedExpressiveCount: number;
  groundedExpressiveCount: number;
  bareFallbackRequired: boolean;
  bareCount: number;
  expressiveCount: number;
  sequenceRelationshipCount: number;
  reasons: string[];
};

export function assessAuthorCreativeTreatmentSet(
  treatments: readonly AuthorCreativeTreatment[],
): AuthorCreativeTreatmentSetAssessment {
  const bare = treatments.filter(isBareTreatment);
  const expressive = treatments.filter(
    (treatment) => !isBareTreatment(treatment),
  );

  const sequenceRelationshipCount = expressive.filter(
    treatmentHasSequenceRelationship,
  ).length;
  const creativeSetComplete = expressive.length === 3 && bare.length === 1;
  const renderable = bare.length === 1;

  const reasons: string[] = [];

  if (treatments.length !== 4) {
    reasons.push("requires exactly four treatments");
  }

  if (bare.length !== 1) {
    reasons.push("requires exactly one bare treatment");
  }

  if (expressive.length !== 3) {
    reasons.push("requires exactly three expressive treatments");
  }

  // Diagnostic only. Do not require the model to echo QRE's vocabulary
  // in order for a creative conception to count as valid.
  return {
    complete: creativeSetComplete,
    creativeSetComplete,
    renderable,
    requestedExpressiveCount: 3,
    generatedExpressiveCount: expressive.length,
    groundedExpressiveCount: expressive.length,
    bareFallbackRequired: expressive.length < 3,
    bareCount: bare.length,
    expressiveCount: expressive.length,
    sequenceRelationshipCount,
    reasons,
  };
}

function operationalAnchorDominanceReason(input: {
  sourceRelation: string;
  hiddenInference: string;
  treatment: string;
  perceptionDelta: string;
  evidenceEvents: readonly AuthorCreativeEvent[];
  suppliedReality: readonly AuthorCreativeEvent[];
}): string | undefined {
  const creativeText = materialText([
    input.sourceRelation,
    input.hiddenInference,
    input.treatment,
    input.perceptionDelta,
  ]);
  const evidenceText = materialText(input.evidenceEvents.map((event) => event.text));
  const allRealityText = materialText(input.suppliedReality.map((event) => event.text));

  const clockTimeInEvidence = /\b(?:[01]?\d|2[0-3]):[0-5]\d\s*(?:am|pm)?\b/i.test(evidenceText);
  const timeIsCreativeCenter = /\b(?:time|timing|minute|minutes|hour|hours|clock|precis(?:e|ion)|exact(?:ness|ly)?|quantif(?:y|iable|ied)|arrival|departure|start|finish|ending|completion|closed loop|log|logged|documentation)\b/i.test(creativeText);
  const hasNonTemporalActionMaterial = /\b(?:clean(?:ed|ing)?|remove(?:d|s|ing)?|bath(?:ed|ing)?|feed|fed|refill(?:ed|ing)?|walk(?:ed|ing)?|move(?:d|s|ing)?|carry|carried|load(?:ed|ing)?|unload(?:ed|ing)?|drop(?:ped)?|pick(?:ed)?|wash(?:ed|ing)?|repair(?:ed|ing)?|fix(?:ed|ing)?|open(?:ed|ing)?|close(?:d|ing)?|try|tried|resist(?:ed|ing)?|stay(?:ed|ing)?|return(?:ed|ing)?|change(?:d|ing)?|give|gave|take|took|make|made)\b/i.test(allRealityText);
  const evidenceIsMostlyOperational = input.evidenceEvents.length <= 2 && clockTimeInEvidence;

  if (clockTimeInEvidence && timeIsCreativeCenter && evidenceIsMostlyOperational && hasNonTemporalActionMaterial) {
    return "uses operational time anchors as the primary creative idea";
  }

  return undefined;
}

export function unsupportedTreatmentMaterialReason(input: {
  text: string;
  suppliedRealityText: string;
  semanticMechanic: string;
}): string | undefined {
  const text = clean(input.text);
  const supplied = clean(input.suppliedRealityText);
  const selectedMechanic = clean(input.semanticMechanic).toLowerCase();
  const sourceHasRecurrence =
/\b(?:same|again|returned|return|repeated|recurring|every|sundays?|weekly)\b/i
  // Treatment validation is intentionally permissive because this object is
  // private Author thinking, not viewer-facing documentary copy. Protect only
  // against conceptions that explicitly require manufacturing concrete world
  // material or collapse into rendering direction. Mood, metaphor, role,
  // pressure, fictional grammar, psychological vocabulary, symbolic recurrence,
  // absurdity, and other interpretive language remain available to Creative Search.
  if (
    /\b(?:introduce|add|create|invent|include|assume)\b[^.!?]{0,48}\b(?:person|animal|object|prop|place|room|location|event|action|motive|cause|outcome|sensory detail|physical detail|world fact)\b/i.test(text)
  ) {
    return "requires unsupplied concrete reality";
  }

  if (
    /\b(?:actual|literal|real|physical|concrete)\s+(?:spy|courtroom|lawyer|weapon|handler|enemy|boss|kingdom|quest|mission|battle|crime|investigation)\b/i.test(text)
  ) {
    return "literalizes rhetorical framing into unsupplied reality";
  }

  // Presentation direction is not Author material. If the model leaks it while
  // discovering a useful conception, preserve the semantic conception but strip
  // presentation-only expressive behaviors during normalization. Do not reward,
  // propagate, or treat audiovisual direction as creative authority.

  // Do not let a creative reading manufacture concrete comparative properties
  // of the supplied world. Rhetorical scale ("twice the battle") remains
  // legal; factual claims about size, privacy, layout, duration, quantity, or
  // physical condition require evidence.
  const sourceSuppliesComparativeProperty =
    /\b(?:small(?:er|est)?|large(?:r|st)?|bigger|biggest|tiny|private|public|square feet|square footage|size|larger room|smaller room)\b/i.test(supplied);
  const claimsComparativeConcreteProperty =
    /\b(?:private(?:ly)?[ -]?used|public(?:ly)?[ -]?used|square feet|square footage|larger room|smaller room|bigger room|tinier room|larger space|smaller space|bigger space|tinier space|more spacious|less spacious)\b/i.test(text);
  if (!sourceSuppliesComparativeProperty && claimsComparativeConcreteProperty) {
    return "adds an unsupplied concrete comparative property";
  }

  // PRIVATE TREATMENT LANGUAGE IS NOT DOCUMENTARY REALITY.
  // A treatment is allowed to think in mood, status, metaphor, ritual,
  // psychology, recurrence-like patterning, absurdity, genre grammar, and
  // other interpretive language. Terms such as detached, ghostly, obsessive,
  // ritualistic, repetitive, routine, melancholy, ominous, triumphant, or
  // bureaucratic describe the creative read; they do not by themselves assert
  // that the subject literally felt that state or that a real-world recurrence
  // occurred.
  //
  // Do not reject a whole conception because its private planning vocabulary
  // contains an emotion, human-condition word, or recurrence metaphor.
  // Concrete realized claims are policed later by Author cut evaluation,
  // chronological evidence checks, whole-production grounding, and RealityGraph.
  //
  // Treatment compatibility should reject only material instructions that
  // actually require changing the supplied world (handled above), not the
  // imagination used to reinterpret that world.
  void selectedMechanic;
  void sourceHasRecurrence;
  void supplied;

  return undefined;
}

function authorCreativeTreatmentCompatibility(input: {
  semanticMechanic: AuthorSemanticMechanicCandidate;
  treatment: AuthorCreativeTreatment;
  suppliedReality?: readonly AuthorCreativeEvent[];
}): {
  compatible: boolean;
  reason: string;
} {
  const selected = clean(input.semanticMechanic.mechanic).toLowerCase();

  if (isBareTreatment(input.treatment)) {
    return {
      compatible: true,
      reason: "bare reality remains a valid competitor",
    };
  }

  const candidate = materialText([
    input.treatment.sourceRelation,
    input.treatment.creativePressure,
    input.treatment.treatment,
    input.treatment.perceptionDelta,
    ...input.treatment.expressiveBehaviors,
  ]);
  const suppliedRealityText = materialText((input.suppliedReality ?? []).map((event) => event.text));
  const unsupportedReason = unsupportedTreatmentMaterialReason({
    text: candidate,
    suppliedRealityText,
    semanticMechanic: selected,
  });

  if (unsupportedReason) {
    return {
      compatible: false,
      reason: unsupportedReason,
    };
  }

  if (!selected || selected === "none") {
    return {
      compatible: true,
      reason: "grounded treatment; no semantic mechanic constraint is required",
    };
  }

  return {
    compatible: true,
    reason: "compatible with semantic mechanic treatment boundary",
  };
}

function treatmentAsAssignment(
  treatment: AuthorCreativeTreatment,
  semanticMechanic: AuthorSemanticMechanicCandidate,
): AuthorCreativeTreatmentAssignment {
  return {
    id: treatment.id,
    semanticMechanic: isBareTreatment(treatment) ? "NONE" : semanticMechanic.mechanic,
    sourceCandidateId: treatment.sourceCandidateId,
    sourceRelation: treatment.sourceRelation,
    evidenceEventIds: treatment.evidenceEventIds,
    creativePressure: treatment.creativePressure,
    hiddenInference: treatment.hiddenInference,
    treatment: treatment.treatment,
    perceptionDelta: treatment.perceptionDelta,
    expressiveBehaviors: treatment.expressiveBehaviors,
    intensity: treatment.intensity,
  };
}

function treatmentProductionLetter(
  treatment: Pick<AuthorCreativeTreatmentAssignment, "id" | "semanticMechanic">,
): "A" | "B" | "C" | "D" {
  const match = clean(treatment.id).match(/(\d+)/);
  const index = match ? Number(match[1]) : 1;
  if (index === 2) return "B";
  if (index === 3) return "C";
  if (index === 4) return "D";
  return "A";
}

function treatmentVariantIndex(
  treatment: Pick<AuthorCreativeTreatmentAssignment, "id" | "semanticMechanic">,
): number {
  return ["A", "B", "C", "D"].indexOf(treatmentProductionLetter(treatment));
}

export type AuthorCreativeTreatmentSearchResult = {
  lensSearchEnabled: boolean;
  lensMode: "NONE" | "REQUESTED" | "AUTO";
  autoBusinessLens: boolean;
  rawTreatmentResponse: string;
  searchFallbackReason?: string;
  model: string;
  modelCalls: number;
  semanticMechanic: AuthorSemanticMechanicCandidate;
  semanticMechanicCandidates: AuthorSemanticMechanicCandidate[];
  creativeNotice: AuthorCreativeNotice;
  storyGravity: AuthorStoryGravity;
  failureLessons: AuthorCreativeFailureLesson[];
  parsedTreatments: AuthorCreativeTreatment[];
  acceptedTreatments: AuthorCreativeTreatmentAssignment[];
  rejectedTreatments: Array<{
    treatment: AuthorCreativeTreatment;
    reason: string;
  }>;
  treatmentSetAssessment: AuthorCreativeTreatmentSetAssessment;
};

function validStoryEventIds(
  value: unknown,
  suppliedReality: readonly AuthorCreativeEvent[],
  limit = 16,
): string[] {
  return Array.isArray(value)
    ? unique(
        value
          .filter((id): id is string => typeof id === "string")
          .map(clean)
          .filter((id) => suppliedReality.some((event) => clean(event.id) === id)),
      ).slice(0, limit)
    : [];
}

function isOperationalOnlyStoryEvent(event: AuthorCreativeEvent | undefined): boolean {
  if (!event) return false;
  const text = clean(event.text).toLowerCase();
  if (!text) return false;
  const stripped = text
    .replace(/\b(?:[01]?\d|2[0-3]):[0-5]\d\s*(?:am|pm)?\b/gi, " ")
    .replace(/\b(?:arrived?|arrival|started?|start|finished?|finish|completed?|completion|departed?|departure|checked in|checked out)\b/gi, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return stripped.length === 0;
}

function creativeEvidenceProjection(
  suppliedReality: readonly AuthorCreativeEvent[],
): Array<{ id: string; text: string }> {
  return suppliedReality.map((event) => {
    const exact = clean(event.text);
    // Creative Search does not need exact clock values to discover the story.
    // Keep the semantic event (arrived / finished / action / object / state),
    // while exact operational anchors remain in RealityGraph for provenance and
    // later truth checking. This prevents precise metadata from becoming the
    // accidental center of gravity simply because it looks distinctive.
    const semanticText = exact
      .replace(/\b(?:[01]?\d|2[0-3]):[0-5]\d\s*(?:am|pm)?\b/gi, " ")
      .replace(/\s+/g, " ")
      .replace(/\s+([,.;:!?])/g, "$1")
      .replace(/^[,.;:\-\s]+|[,;:\-\s]+$/g, "")
      .trim();
    return {
      id: clean(event.id),
      text: semanticText || exact,
    };
  });
}

function fallbackStoryGravity(
  suppliedReality: readonly AuthorCreativeEvent[],
): AuthorStoryGravity {
  const ids = suppliedReality.map((event) => clean(event.id)).filter(Boolean);
  const endpointEventId = ids[ids.length - 1] ?? "";
  const sealingDetailEventId = ids.length > 1 ? ids[ids.length - 2]! : endpointEventId;
  const backwardDependencies = ids
    .slice(0, -1)
    .map((eventId, index) => ({
      eventId,
      supportsEventId: ids[index + 1] ?? endpointEventId,
      function: "earlier supplied reality earns the later supplied state",
    }))
    .reverse()
    .slice(0, 6);

  return {
    mode: ids.length > 1 ? "SEQUENCE" : "PORTRAIT",
    centerEventIds: ids.slice(0, Math.min(ids.length, 3)),
    openingSignalEventIds: ids.slice(0, 1),
    characterSignalEventIds: [],
    tensionEventIds: [],
    escalationEventIds: ids.slice(1, Math.max(1, ids.length - 1)),
    sealingDetailEventId,
    endpointEventId,
    endpointMode: "supplied endpoint",
    endpointAuthority: "HARD",
    backwardDependencies,
  };
}

function failureLessonFromReason(
  treatment: AuthorCreativeTreatment,
  reason: string,
): AuthorCreativeFailureLesson {
  const normalized = clean(reason);
  const map: Array<[RegExp, string, string]> = [
    [/inner state|motive|value|emotion/i, "interpretation -> unsupplied inner state", "Realize meaning through framing and implication; never convert it into a new motive, value, belief, or emotion."],
    [/operational time anchors/i, "operational anchor -> creative center", "Keep time, geo, counts, and measurements as provenance unless the supplied relationship makes the anchor itself meaningful."],
    [/rendering direction/i, "semantic treatment -> presentation direction", "Creative Search chooses meaning and language behavior; realization details stay outside Author."],
    [/recurrence/i, "single occurrence -> recurrence", "Do not promote one supplied occurrence into a routine, habit, cycle, or repeated history."],
    [/provenance/i, "creative leap -> mismatched evidence", "Every story move must carry the exact supplied events that make that move possible."],
    [/concrete reality|literalizes/i, "rhetorical frame -> new concrete world fact", "Bend interpretation, not reality. Rhetoric may be extreme; concrete events remain supplied-only."],
  ];
  const found = map.find(([pattern]) => pattern.test(normalized));
  return {
    failure: clean(treatment.treatment || treatment.hiddenInference || treatment.sourceRelation),
    reason: normalized,
    pattern: found?.[1] ?? "candidate -> invalid realization",
    lesson: found?.[2] ?? "Preserve the creative move only when it remains evidence-bound and makes the supplied reality read differently without adding facts.",
    scope: "UNIVERSAL",
  };
}

export async function searchAuthorCreativeLensTreatments(input: {
  subject: string;
  suppliedReality: readonly AuthorCreativeEvent[];
  creativeOpportunity: string;
  relation: string;
  experienceMode?: string;
  requestedLens?: string;
  domainContext?: AuthorDomainContext;
  semanticMechanic: AuthorSemanticMechanicCandidate;
  semanticMechanicCandidates: readonly AuthorSemanticMechanicCandidate[];
}): Promise<AuthorCreativeTreatmentSearchResult> {
  const requestedLens = clean(input.requestedLens);
  const normalizedRequestedLens = requestedLens.toUpperCase();
  const explicitLensProvided = Boolean(requestedLens);
  const explicitLensOff = normalizedRequestedLens === "NONE";
  const semanticMechanic = input.semanticMechanic;
  const autoBusinessLens =
    !explicitLensProvided &&
    isBusinessCreativeContext(input.domainContext);
  const lensSearchEnabled =
    !explicitLensOff &&
    input.suppliedReality.length > 0;
  const lensMode =
    explicitLensOff
      ? "NONE"
      : explicitLensProvided
        ? "REQUESTED"
        : "AUTO";
  let searchFallbackReason: string | undefined;
  const lensResult = lensSearchEnabled
    ? await localModelGenerate(
    [
      {
        role: "system",
        content: [
          "You are QRE Creative Search.",
          ...QRE_CREATIVE_OPERATING_DOCTRINE,
          "Reality is fixed. Creative interpretation is aggressive. New concrete world facts are forbidden.",
          "Classify STORY_GRAVITY.mode as ARC, SEQUENCE, PORTRAIT, or WORLD_OPENING from the supplied event IDs only.",
          "Find the strongest relationships already inside CREATIVE_EVIDENCE. Do not force a thesis, psychology, routine, or hidden history.",
          "HARD_ENDPOINT_EVENT_ID is already locked by QRE. Earlier supplied evidence may earn it; the endpoint itself is not the creative idea.",
          "Operational anchors, including supplied times, measurements, quantities, prices, durations, readings, and technical values, are legitimate creative material. Center them when they carry the strongest creative charge; never invent a value or let domain knowledge fill one in.",
          "Search broadly in private. Return exactly three materially different latent relations and one finalist per relation in the same order.",
          "REALITY STAYS FIXED. PERSPECTIVE GETS DANGEROUS.",
          "Use these questions as creative search pressure: What changes the read of everything else? Which supplied detail refuses to stay ordinary? What becomes more interesting when two true facts are forced together? What later fact changes the meaning of an earlier one?",
          "Ask: What perspective can occupy the same reality without adding an event? What attitude can be implied with almost no language? What can be made larger in meaning without becoming larger in fact? What is the smallest detail carrying the most story?",
          "Search through perspective, attitude, implication, recontextualization, double meaning, rhetorical scale, personification, contrast, callback, tiny-detail dominance, semantic consequence, and model-discovered territory we did not name. These are examples of freedom, not a taxonomy, checklist, or menu.",
          "Do not summarize the reality. Make the reality acquire attitude. Do not explain the relationship; make the next move prove it.",
          "Prefer a relation that could only have come from THESE facts over a generic mood that could fit anything.",
          "A finalist should bend meaning as far as possible without bending reality.",
          "CREATIVE PRESSURE IS NOT FACT. A known rhetorical frame is valid only when the supplied reality genuinely makes it the strongest discovery; otherwise find the grammar this material creates for itself.",
          "Do not merely name a genre, pressure, or universe. Use pressure to change the perception of the supplied facts through implication, consequence, relation, emphasis, rhythm, or meaning.",
          "The three finalists must represent genuinely different perceptual discoveries. Three different costumes for the same underlying frame do not count as creative diversity.",
          "For example, bureaucracy, war, and protocol can all secretly be the same control/status conception. Do not blacklist those frames; use one when it is truly strongest, but do not return cousins as if they were three discoveries.",
          "If multiple searches independently converge because one perception is overwhelmingly strong in the supplied material, preserve that possibility. The requirement is genuine search, not artificial diversity.",
          "For each treatment, creativePressure names the governing perceptual pressure in a few words. It may name a known frame only when that frame is earned, or describe a stranger model-discovered grammar.",
          "At least one finalist should be bold enough that a cautious model would probably not choose it, while still preserving exact concrete reality.",
          "Penalize atmospheric vagueness. Ambiguity, impermanence, subtlety, transience, melancholy, emptiness, longing, and similar mood words are not a creative conception by themselves.",
          "Prefer executable creative ideas: a supplied detail can create perspective, attitude, consequence, double meaning, callback, or a strange private logic only as rhetoric, never literal new facts.",
          "Ask of every finalist: could this exact idea have emerged from almost any four facts? If yes, it is too generic. Make it depend on THESE facts.",
          "Each relation must name the supplied event IDs that make it possible. A missing fact is not a relation.",
          "hiddenInference is optional. Leave it empty unless the supplied facts genuinely support an unstated realization.",
          "Amplify reality through metaphor, status, personification, rhetorical scale, irony, contrast, callback, omission, escalation, compression, and recontextualization.",
          "Rhetoric may be more extreme than reality. The concrete world may not become more specific than the evidence.",
          "Treatments describe semantic/verbal transformation only: what the supplied reality means differently, how its facts relate, and what rhetorical pressure should shape the writing.",
          "IMPORTANT: 'treatment' here means a private semantic conception, not downstream execution direction.",
          "expressiveBehaviors must be semantic or rhetorical operations only. Return operations that change perception, implication, rhythm, relation, emphasis, status, or expression.",
          "Make the same reality read differently. Make meaning felt and implied, not explained.",
          "Protect the strange; police the facts.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUBJECT: input.subject,
          CREATIVE_EVIDENCE: creativeEvidenceProjection(input.suppliedReality),
          CREATIVE_DISCOVERY: {
            perception: clean(input.creativeOpportunity) || undefined,
            relationship: clean(input.relation) || undefined,
          },
          HARD_ENDPOINT_EVENT_ID: fallbackStoryGravity(input.suppliedReality).endpointEventId,
          MODE_HINT: clean(input.experienceMode) || undefined,
          REQUESTED_LENS: requestedLens || undefined,
          instruction:
            "Return STORY_GRAVITY plus exactly three distinct latent relations and exactly three finalist moves. Finalist 1 uses relation 1, finalist 2 relation 2, finalist 3 relation 3. Keep provenance in the relations; do not repeat relation text or event IDs inside finalists. Leave hiddenInference empty when no real unstated realization is earned.",
        }),
      },
    ],
    "json",
    {
      // Creative Search now carries three complete latent relations plus three
      // complete treatments without hard string clipping. Give the model enough
      // room to close valid JSON; brevity is taught in the prompt, not enforced
      // by truncating the response mid-conception.
      numPredict: 1200,
      temperature: 0.98,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["storyGravity", "creativeNotice", "treatments"],
        properties: {
          storyGravity: {
            type: "object",
            additionalProperties: false,
            required: [
              "mode",
              "centerEventIds",
              "openingSignalEventIds",
              "characterSignalEventIds",
              "tensionEventIds",
              "escalationEventIds",
              "sealingDetailEventId",
              "backwardDependencies",
            ],
            properties: {
              mode: { type: "string", enum: ["ARC", "SEQUENCE", "PORTRAIT", "WORLD_OPENING"] },
              centerEventIds: { type: "array", minItems: 1, maxItems: 6, items: { type: "string", maxLength: 64 } },
              openingSignalEventIds: { type: "array", minItems: 0, maxItems: 4, items: { type: "string", maxLength: 64 } },
              characterSignalEventIds: { type: "array", minItems: 0, maxItems: 4, items: { type: "string", maxLength: 64 } },
              tensionEventIds: { type: "array", minItems: 0, maxItems: 4, items: { type: "string", maxLength: 64 } },
              escalationEventIds: { type: "array", minItems: 0, maxItems: 6, items: { type: "string", maxLength: 64 } },
              sealingDetailEventId: { type: "string", maxLength: 64 },
              backwardDependencies: {
                type: "array",
                minItems: 0,
                maxItems: 6,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["eventId", "supportsEventId"],
                  properties: {
                    eventId: { type: "string", maxLength: 64 },
                    supportsEventId: { type: "string", maxLength: 64 },
                  },
                },
              },
            },
          },
          creativeNotice: {
            type: "object",
            additionalProperties: false,
            required: ["latentRelations"],
            properties: {
              latentRelations: {
                type: "array",
                minItems: 3,
                maxItems: 3,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["relation", "evidenceEventIds"],
                  properties: {
                    relation: { type: "string" },
                    evidenceEventIds: {
                      type: "array",
                      minItems: 1,
                      maxItems: 16,
                      items: { type: "string", maxLength: 64 },
                    },
                  },
                },
              },
            },
          },
          treatments: {
            type: "array",
            minItems: 3,
            maxItems: 3,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["creativePressure", "hiddenInference", "treatment", "perceptionDelta", "expressiveBehaviors", "intensity"],
              properties: {
                creativePressure: { type: "string" },
                hiddenInference: { type: "string" },
                treatment: { type: "string" },
                perceptionDelta: { type: "string" },
                expressiveBehaviors: {
                  type: "array",
                  minItems: 1,
                  maxItems: 4,
                  items: { type: "string" },
                },
                intensity: {
                  type: "string",
                  enum: ["LIGHT", "MEDIUM", "STRONG"],
                },
              },
            },
          },
        },
      },
    },
  ).catch((error: unknown) => {
    searchFallbackReason =
      clean((error as { message?: unknown })?.message) ||
      "creative_search_failed";
    return {
      text: "",
      model: "deterministic-bare-search-fallback",
      provider: "local" as const,
    };
  })
    : {
        text: "",
        model: "none",
        provider: "local" as const,
      };

  const parsedLens = lensSearchEnabled
    ? parseJson(lensResult.text)
    : undefined;
  const fallbackGravity = fallbackStoryGravity(input.suppliedReality);
  const rawStoryGravity =
    parsedLens?.storyGravity && typeof parsedLens.storyGravity === "object"
      ? parsedLens.storyGravity as Record<string, unknown>
      : {};
  const suppliedEventIds = new Set(input.suppliedReality.map((event) => clean(event.id)));
  // Endpoint authority belongs to QRE, not the model. The final supplied event is
  // locked before creative search so interpretation cannot mutate the ending.
  const endpointEventId = fallbackGravity.endpointEventId;
  const rawSealingDetailEventId = clean(rawStoryGravity.sealingDetailEventId);
  const rawSealingEvent = input.suppliedReality.find((event) => clean(event.id) === rawSealingDetailEventId);
  const hasNonOperationalPreEndpointEvidence = input.suppliedReality
    .slice(0, -1)
    .some((event) => !isOperationalOnlyStoryEvent(event));
  const sealingDetailEventId = suppliedEventIds.has(rawSealingDetailEventId) &&
    !(hasNonOperationalPreEndpointEvidence && isOperationalOnlyStoryEvent(rawSealingEvent))
      ? rawSealingDetailEventId
      : fallbackGravity.sealingDetailEventId;
  const rawBackwardDependencies = Array.isArray(rawStoryGravity.backwardDependencies)
    ? rawStoryGravity.backwardDependencies
    : [];
  const eventOrder = new Map(input.suppliedReality.map((event, index) => [clean(event.id), index]));
  const parsedBackwardDependencies = rawBackwardDependencies
    .map((value): AuthorStoryGravity["backwardDependencies"][number] | undefined => {
      if (!value || typeof value !== "object") return undefined;
      const record = value as Record<string, unknown>;
      const eventId = clean(record.eventId);
      const supportsEventId = clean(record.supportsEventId);
      if (!suppliedEventIds.has(eventId) || !suppliedEventIds.has(supportsEventId)) return undefined;
      const fromOrder = eventOrder.get(eventId);
      const toOrder = eventOrder.get(supportsEventId);
      // Backward search is discovered from the endpoint, but each dependency edge
      // must still point forward through reality: earlier evidence earns later evidence.
      if (fromOrder === undefined || toOrder === undefined || fromOrder >= toOrder) return undefined;
      return {
        eventId,
        supportsEventId,
        function: "earlier supplied evidence earns the later supplied evidence",
      };
    })
    .filter((value): value is AuthorStoryGravity["backwardDependencies"][number] => Boolean(value))
    .slice(0, 6);
  const rawStoryMode = clean(rawStoryGravity.mode).toUpperCase();
  const storyMode: AuthorStoryGravity["mode"] =
    rawStoryMode === "ARC" || rawStoryMode === "SEQUENCE" || rawStoryMode === "PORTRAIT" || rawStoryMode === "WORLD_OPENING"
      ? rawStoryMode
      : fallbackGravity.mode;
  const centerEventIds = validStoryEventIds(rawStoryGravity.centerEventIds, input.suppliedReality, 6);
  const nonOperationalSignalIds = (value: unknown, limit: number) =>
    validStoryEventIds(value, input.suppliedReality, limit).filter((eventId) =>
      !isOperationalOnlyStoryEvent(input.suppliedReality.find((event) => clean(event.id) === eventId)),
    );
  const storyGravity: AuthorStoryGravity = {
    mode: storyMode,
    centerEventIds: centerEventIds.length ? centerEventIds : fallbackGravity.centerEventIds,
    openingSignalEventIds: validStoryEventIds(rawStoryGravity.openingSignalEventIds, input.suppliedReality, 4),
    characterSignalEventIds: nonOperationalSignalIds(rawStoryGravity.characterSignalEventIds, 4),
    tensionEventIds: nonOperationalSignalIds(rawStoryGravity.tensionEventIds, 4),
    escalationEventIds: nonOperationalSignalIds(rawStoryGravity.escalationEventIds, 6),
    sealingDetailEventId,
    endpointEventId,
    endpointMode: fallbackGravity.endpointMode,
    endpointAuthority: "HARD",
    backwardDependencies: parsedBackwardDependencies.length
      ? parsedBackwardDependencies
      : fallbackGravity.backwardDependencies,
  };

  const rawCreativeNotice =
    parsedLens?.creativeNotice && typeof parsedLens.creativeNotice === "object"
      ? parsedLens.creativeNotice as Record<string, unknown>
      : {};
  const latentRelations = Array.isArray(rawCreativeNotice.latentRelations)
    ? rawCreativeNotice.latentRelations
        .map((value): AuthorCreativeNotice["latentRelations"][number] | undefined => {
          if (!value || typeof value !== "object") return undefined;
          const record = value as Record<string, unknown>;
          const relation = clean(record.relation);
          const evidenceEventIds = Array.isArray(record.evidenceEventIds)
            ? unique(
                record.evidenceEventIds
                  .filter((id): id is string => typeof id === "string")
                  .map(clean)
                  .filter((id) => input.suppliedReality.some((event) => clean(event.id) === id)),
              )
            : [];
          if (!relation || !evidenceEventIds.length) return undefined;
          return { relation, evidenceEventIds };
        })
        .filter((value): value is AuthorCreativeNotice["latentRelations"][number] => Boolean(value))
        .slice(0, 3)
    : [];
  const creativeNotice: AuthorCreativeNotice = {
    latentRelations,
  };
  const rawTreatments = Array.isArray(parsedLens?.treatments) ? parsedLens.treatments : [];
  const parseRejectedTreatments: Array<{
    treatment: AuthorCreativeTreatment;
    reason: string;
  }> = [];
  const modelTreatments: AuthorCreativeTreatment[] = rawTreatments
    .map((value, index): AuthorCreativeTreatment | undefined => {
      const placeholder = (reason: string, record: Record<string, unknown> = {}) => {
        const expectedRelationRecord = latentRelations[index];
        const evidenceEventIds = expectedRelationRecord?.evidenceEventIds ?? [];
        parseRejectedTreatments.push({
          treatment: {
            id: `treatment-${index + 1}`,
            sourceCandidateId: expectedRelationRecord ? `latentRelations[${index}]` : "unparsed",
            sourceRelation: clean(expectedRelationRecord?.relation) || "unparsed",
            evidenceEventIds,
            creativePressure: clean(record.creativePressure),
            hiddenInference: clean(record.hiddenInference),
            treatment: clean(record.treatment),
            perceptionDelta: clean(record.perceptionDelta),
            expressiveBehaviors: normalizeExpressiveBehaviors(record.expressiveBehaviors),
            intensity: clean(record.intensity).toUpperCase() === "STRONG"
              ? "STRONG"
              : clean(record.intensity).toUpperCase() === "LIGHT"
                ? "LIGHT"
                : "MEDIUM",
          },
          reason,
        });
      };

      if (!value || typeof value !== "object") {
        placeholder("invalid treatment object");
        return undefined;
      }
      const record = value as Record<string, unknown>;
      const expectedRelationRecord = latentRelations[index];
      const sourceCandidateId = expectedRelationRecord ? `latentRelations[${index}]` : "";
      const sourceRelation = clean(expectedRelationRecord?.relation);
      const evidenceEventIds = expectedRelationRecord?.evidenceEventIds ?? [];
      const creativePressure = clean(record.creativePressure);
      const hiddenInference = clean(record.hiddenInference);
      const treatment = clean(record.treatment);
      const perceptionDelta = clean(record.perceptionDelta);
      const expressiveBehaviorsSource = Array.isArray(record.expressiveBehaviors)
        ? record.expressiveBehaviors
        : Array.isArray(record.devices)
          ? record.devices
          : [];
      const expressiveBehaviors = normalizeExpressiveBehaviors(expressiveBehaviorsSource);
      const rawIntensity = clean(record.intensity).toUpperCase();
      const intensity: AuthorCreativeTreatmentAssignment["intensity"] =
        rawIntensity === "LIGHT" || rawIntensity === "STRONG"
          ? rawIntensity
          : "MEDIUM";

      const ownsDistinctRelation = Boolean(expectedRelationRecord && sourceRelation);
      const provenanceMatches = Boolean(expectedRelationRecord && evidenceEventIds.length);
      const finalistBoundaryReason = unsupportedTreatmentMaterialReason({
        text: materialText([
          sourceRelation,
          creativePressure,
          hiddenInference,
          treatment,
          perceptionDelta,
          ...expressiveBehaviors,
        ]),
        suppliedRealityText: materialText(input.suppliedReality.map((event) => event.text)),
        semanticMechanic: semanticMechanic.mechanic,
      });
      // Operational anchors are allowed to become creative fuel. Exact times,
      // counts, order, logs, arrivals, and completions may inspire a treatment
      // when the model finds an interesting read in them. They remain factual
      // anchors in RealityGraph and are policed at realized-cut grounding, not
      // used here to kill a private conception before Mouth can explore it.
      const structuralReason =
        !sourceCandidateId ? "missing source candidate id" :
        !sourceRelation ? "missing source relation" :
        !evidenceEventIds.length ? "missing grounded evidence event ids" :
        !creativePressure ? "missing creative pressure" :
        !ownsDistinctRelation ? "finalist must use its own distinct latent relation" :
        !provenanceMatches ? "finalist provenance does not match returned latent relation" :
        finalistBoundaryReason ? finalistBoundaryReason :
        !treatment ? "missing treatment" :
        !perceptionDelta ? "missing perception delta" :
        !expressiveBehaviors.length ? "missing expressive behaviors" :
        undefined;

      if (structuralReason) {
        placeholder(structuralReason, record);
        return undefined;
      }

      return {
        id: `treatment-${index + 1}`,
        sourceCandidateId,
        sourceRelation,
        evidenceEventIds,
        creativePressure,
        hiddenInference,
        treatment,
        perceptionDelta,
        expressiveBehaviors,
        intensity,
      };
    })
    .filter((value): value is AuthorCreativeTreatment => Boolean(value))
    .filter((treatment) => !isBareTreatment(treatment))
    .slice(0, 3);

  const deterministicBareTreatment: AuthorCreativeTreatment = {
    id: "treatment-4",
    sourceCandidateId: "bare",
    sourceRelation: "bare supplied reality",
    evidenceEventIds: input.suppliedReality.map((event) => event.id),
    creativePressure: "BARE",
    hiddenInference: "",
    treatment:
      "NONE / Bare Reality. Present only the supplied facts in their natural sequence with minimal treatment.",
    perceptionDelta: "No added perception; direct supplied reality remains visible as the control.",
    expressiveBehaviors: ["bare reality"],
    intensity: "LIGHT",
  };

  const parsedTreatments: AuthorCreativeTreatment[] = lensSearchEnabled
    ? [...modelTreatments, deterministicBareTreatment]
    : [];

  const treatmentResults = parsedTreatments.map((treatment) => ({
    treatment,
    result: authorCreativeTreatmentCompatibility({
      semanticMechanic,
      treatment,
      suppliedReality: input.suppliedReality,
    }),
  }));
  const acceptedTreatmentRecords = lensSearchEnabled
    ? treatmentResults
        .filter(({ result }) => result.compatible)
        .map(({ treatment }) => treatment)
    : [];
  const rejectedTreatments = lensSearchEnabled
    ? [
        ...parseRejectedTreatments,
        ...treatmentResults
          .filter(({ result }) => !result.compatible)
          .map(({ treatment, result }) => ({
            treatment,
            reason: result.reason,
          })),
      ]
    : [];
  const distinctTreatments = (treatments: readonly AuthorCreativeTreatment[]): AuthorCreativeTreatment[] => {
    const seen = new Set<string>();
    return treatments.filter((treatment) => {
      const key = materialText([
        treatment.sourceRelation,
        treatment.treatment,
        treatment.perceptionDelta,
        ...treatment.expressiveBehaviors,
      ]);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  const distinctAcceptedTreatmentRecords =
    distinctTreatments(acceptedTreatmentRecords).slice(0, 4);
  const generatedExpressiveCount = modelTreatments.length;
  const treatmentSetAssessment = !lensSearchEnabled
    ? {
        complete: true,
        creativeSetComplete: true,
        renderable: true,
        requestedExpressiveCount: 0,
        generatedExpressiveCount: 0,
        groundedExpressiveCount: 0,
        bareFallbackRequired: false,
        bareCount: 0,
        expressiveCount: 0,
        sequenceRelationshipCount: 0,
        reasons: [],
      }
    : {
        ...assessAuthorCreativeTreatmentSet(distinctAcceptedTreatmentRecords),
        generatedExpressiveCount,
      };
  const acceptedTreatments = treatmentSetAssessment.renderable
    ? distinctAcceptedTreatmentRecords.map((treatment) =>
        treatmentAsAssignment(treatment, semanticMechanic),
      )
    : [];
  const failureLessons = rejectedTreatments
    .map(({ treatment, reason }) => failureLessonFromReason(treatment, reason))
    .filter((lesson, index, all) =>
      all.findIndex((candidate) => candidate.pattern === lesson.pattern && candidate.reason === lesson.reason) === index,
    );

  return {
    lensSearchEnabled,
    lensMode,
    autoBusinessLens,
    rawTreatmentResponse: lensSearchEnabled ? lensResult.text : "SKIPPED",
    searchFallbackReason,
    model: lensResult.model,
    modelCalls: lensSearchEnabled ? 1 : 0,
    semanticMechanic,
    semanticMechanicCandidates: [...input.semanticMechanicCandidates],
    creativeNotice,
    storyGravity,
    failureLessons,
    parsedTreatments,
    acceptedTreatments,
    rejectedTreatments,
    treatmentSetAssessment,
  };
}

function realityAuthorityContext(
  evidence: readonly AuthorCreativeEvent[],
): string {
  const projected = projectAuthorRealityEvidence(evidence);
  if (!projected.some((item) => item.authority !== "UNKNOWN")) return "";

  return [
    "UNIVERSAL REALITY AUTHORITY:",
    ...AUTHOR_REALITY_AUTHORITY_DOCTRINE,
    `AUTHORIZED_REALITY_KINDS: ${JSON.stringify(projected)}`,
  ].join("\n");
}

function presentationAffordance(domainContext?: AuthorDomainContext): string {
  const contextRecord = (domainContext ?? {}) as Record<string, unknown>;
  const experienceMode = clean(contextRecord.experienceMode).toUpperCase();

  if (experienceMode !== "IDENTITY") return "";

  return [
    "IDENTITY / PORTRAIT REALIZATION:",
    "Stable preferences, relationships, known topics, and character facts are creative material for direct voice, fixation, tiny questions, callbacks, attitude, status, and playful self-presentation.",
    "A known preference may become anticipation, importance, a question, or an open possibility. It may not become an invented event.",
    "Synthesize combinations of truths into character instead of dressing up each fact separately.",
    "Sparse identity reality does not require plot. It may open a world or create a discovery portrait.",
    "Concrete events still come from supplied reality; identity treatment changes perception of supplied truths rather than manufacturing an occurrence.",
  ].join("\n");
}

function isBusinessCreativeContext(domainContext?: AuthorDomainContext): boolean {
  const context = (domainContext ?? {}) as Record<string, unknown>;
  const serviceType = clean(context.serviceType);
  const businessType = clean(context.businessType);
  const merchantType = clean(context.merchantType);
  const category = clean(context.category).toUpperCase();

  return Boolean(serviceType || businessType || merchantType) ||
    /\b(?:SERVICE|BUSINESS|COMMERCE|RETAIL|RESTAURANT|HOSPITALITY|GROOMING)\b/.test(category);
}

function normalizeRole(value: unknown, index: number, total: number): AuthorExperienceMoveRole {
  const role = clean(value).toUpperCase();
  if (role === "HOOK" || role === "BUILD" || role === "TURN" || role === "PAYOFF") {
    return role;
  }
  if (index === 0) return "HOOK";
  if (index === total - 1) return "PAYOFF";
  return "BUILD";
}

function normalizePlan(
  value: Record<string, unknown> | undefined,
  allowedEventIds: Set<string>,
  allowedTreatmentIds: Set<string> = new Set(),
): AuthorExperienceComposition | undefined {
  const rawMoves = Array.isArray(value?.moves) ? value!.moves : [];
  const moves: AuthorExperienceMove[] = [];

  for (const [index, raw] of rawMoves.entries()) {
    if (!raw || typeof raw !== "object") continue;
    const record = raw as Record<string, unknown>;
    const eventIds = Array.isArray(record.eventIds)
      ? unique(
          record.eventIds
            .filter((id): id is string => typeof id === "string")
            .filter((id) => allowedEventIds.has(id)),
        )
      : [];

    if (!eventIds.length) continue;

    moves.push({
      order: moves.length + 1,
      role: normalizeRole(record.role, index, rawMoves.length),
      eventIds,
      purpose: clean(record.purpose),
      perceptualMove: clean(record.perceptualMove),
    });
  }

  if (!moves.length) return undefined;

  const usedIds = new Set(moves.flatMap((move) => move.eventIds).map(clean));
  const unusedEventIds = Array.isArray(value?.unusedEventIds)
    ? unique(
        value.unusedEventIds
          .filter((id): id is string => typeof id === "string")
          .map(clean)
          .filter((id) => allowedEventIds.has(id) && !usedIds.has(id)),
      )
    : [];

  return {
    thesis: clean(value?.thesis),
    perceptualTreatmentId: allowedTreatmentIds.has(clean(value?.perceptualTreatmentId))
      ? clean(value?.perceptualTreatmentId)
      : undefined,
    moves,
    unusedEventIds,
  };
}

function enforceMemoryStructure(
  plan: AuthorExperienceComposition,
  selectedEvidence: readonly AuthorCreativeEvent[],
): AuthorExperienceComposition {
  const selectedIds = new Set(selectedEvidence.map((event) => clean(event.id)));
  const usedIds = new Set(plan.moves.flatMap((move) => move.eventIds).map(clean));
  const unusedEventIds = unique([
    ...plan.unusedEventIds.filter((id) => selectedIds.has(clean(id)) && !usedIds.has(clean(id))),
  ]);

  return {
    ...plan,
    unusedEventIds,
    moves: plan.moves.map((move, index, all) => ({
      ...move,
      order: index + 1,
      role:
        index === 0
          ? "HOOK"
          : index === all.length - 1
            ? "PAYOFF"
            : move.role === "TURN"
              ? "TURN"
              : "BUILD",
    })),
  };
}

function fallbackPlan(
  events: readonly AuthorCreativeEvent[],
  discovery: AuthorCreativeDiscovery,
): AuthorExperienceComposition {
  const selected = new Set(discovery.selected.evidenceEventIds);
  const preferred = events.filter((event) => selected.has(event.id));
  const source = preferred.length ? preferred : [...events];
  const limited = source;
  const fallbackMoves: AuthorExperienceMove[] = limited.map((event, index) => ({
    order: index + 1,
    role:
      index === 0
        ? "HOOK"
        : index === limited.length - 1
          ? "PAYOFF"
          : "BUILD",
    eventIds: [event.id],
    purpose: "Carry this supplied evidence clearly into the experience.",
    perceptualMove: event.text,
  }));

  if (fallbackMoves.length === 1) {
    const only = fallbackMoves[0]!;
    fallbackMoves.push({
      ...only,
      order: 2,
      role: "PAYOFF",
      purpose: "Recontextualize the same supplied evidence without adding new reality.",
      perceptualMove:
        discovery.selected.perception ||
        discovery.selected.relationship ||
        only.perceptualMove,
    });
    fallbackMoves[0] = {
      ...only,
      role: "HOOK",
      perceptualMove: "Establish the supplied evidence without exhausting its meaning.",
    };
  }

  return {
    thesis:
      discovery.selected.id === "reality-direct"
        ? "Use supplied reality directly."
        : discovery.selected.perception || discovery.selected.relationship,
    moves: fallbackMoves,
    unusedEventIds: events
      .map((event) => event.id)
      .filter((id) => !fallbackMoves.some((move) => move.eventIds.includes(id))),
  };
}

function beatKind(role: AuthorExperienceMoveRole, index: number, total: number): AuthorScene["kind"] {
  if (role === "HOOK" || index === 0) return "hook";
  if (role === "PAYOFF" || index === total - 1) return "payoff";
  if (role === "TURN") return "turn";
  return "line";
}


function replayTokens(value: string): string[] {
  return clean(value)
    .toLowerCase()
    .split(/[^a-z0-9'’-]+/i)
    .map((token) => {
      if (token === "tried" || token === "tries" || token === "attempted" || token === "attempt") return "try";
      if (token === "removal" || token === "removed" || token === "removing") return "remove";
      if (token.length > 5 && token.endsWith("ing")) return token.slice(0, -3);
      if (token.length > 4 && token.endsWith("ed")) return token.slice(0, -2);
      if (token.length > 4 && token.endsWith("es")) return token.slice(0, -2);
      if (token.length > 3 && token.endsWith("s")) return token.slice(0, -1);
      return token;
    })
    .filter((token) =>
      token.length >= 3 &&
      !new Set(["the", "and", "for", "with", "from", "that", "this", "just", "was", "were", "got", "had", "has"]).has(token)
    );
}

function futureEvidenceLeakReason(
  text: string,
  beatIndex: number,
  plan: AuthorExperienceComposition,
  suppliedReality: readonly AuthorCreativeEvent[],
): string | undefined {
  if (!clean(text)) return undefined;

  const establishedIds = new Set(
    plan.moves
      .slice(0, beatIndex + 1)
      .flatMap((beat) => beat.eventIds)
      .map(clean),
  );
  const futureIds = new Set(
    plan.moves
      .slice(beatIndex + 1)
      .flatMap((beat) => beat.eventIds)
      .map(clean),
  );

  const establishedText = suppliedReality
    .filter((event) => establishedIds.has(clean(event.id)))
    .map((event) => clean(event.text))
    .join(" ");
  const futureText = suppliedReality
    .filter((event) => futureIds.has(clean(event.id)))
    .map((event) => clean(event.text))
    .join(" ");

  if (!futureText) return undefined;

  const tokenSet = (value: string): Set<string> => {
    const out = new Set(replayTokens(value));
    for (const match of clean(value).toLowerCase().matchAll(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g)) {
      out.add(match[0]);
    }
    return out;
  };

  const candidate = tokenSet(text);
  const established = tokenSet(establishedText);
  const future = tokenSet(futureText);
  const generic = new Set([
    "clean",
    "arrive",
    "arrival",
    "finish",
    "complete",
    "service",
    "work",
    "space",
    "room",
  ]);

  const leaked = [...candidate].filter(
    (token) =>
      future.has(token) &&
      !established.has(token) &&
      !generic.has(token),
  );

  return leaked.length
    ? `future-evidence-leak: ${leaked.slice(0, 3).join(", ")}`
    : undefined;
}

function canonicalClockAnchors(value: string): string[] {
  const text = clean(value).toLowerCase();
  const anchors = new Set<string>();

  const addClock = (
    rawHour: string,
    rawMinute: string | undefined,
    rawSuffix: string | undefined,
  ): void => {
    let hour = Number(rawHour);
    const minute = Number(rawMinute ?? "0");
    const suffix = clean(rawSuffix).toLowerCase();

    if (suffix === "am" || suffix === "pm") {
      if (hour < 1 || hour > 12) return;
      if (suffix === "am") hour = hour === 12 ? 0 : hour;
      if (suffix === "pm") hour = hour === 12 ? 12 : hour + 12;
    } else if (hour > 23) {
      return;
    }

    anchors.add(`clock:${hour}:${String(minute).padStart(2, "0")}`);
  };

  for (const match of text.matchAll(/\b(\d{1,2}):([0-5]\d)\s*(am|pm|hours?)?\b/g)) {
    addClock(match[1]!, match[2], match[3]);
  }

  for (const match of text.matchAll(/\b(\d{1,2})\s*(am|pm)\b/g)) {
    addClock(match[1]!, "0", match[2]);
  }

  return [...anchors];
}

function exactPercentAnchors(value: string): string[] {
  return [
    ...clean(value).matchAll(/\b\d+(?:\.\d+)?%/g),
  ].map((match) => `percent:${match[0]}`);
}

function exactMeasurementAnchors(value: string): string[] {
  const text = clean(value).toLowerCase();
  const unitPattern =
    "(?:ml\/min|l\/min|gpm|km\/h|km\/hr|mph|m\/s|ft\/s|n\\u00b7m|n-m|nm|psi|kpa|mpa|bar|rpm|db|mah|wh|kwh|kw|mw|w|v|mv|a|ma|mcg|mg|kg|lbs?|oz|g|ml|cl|dl|liters?|litres?|gal(?:lons?)?|mm|cm|km|meters?|metres?|inches?|inch|ft|feet|yards?|yd|miles?|mi|degrees?|deg|\\u00b0f|\\u00b0c|f|c)";
  const pattern = new RegExp(
    `\\b(\\d+(?:\\.\\d+)?)\\s*(${unitPattern})\\b`,
    "gi",
  );

  return [...text.matchAll(pattern)].map((match) => {
    const amount = match[1];
    const unit = clean(match[2]).toLowerCase().replace(/\s+/g, "");
    return `measure:${amount}:${unit}`;
  });
}

function changedClockFormatReason(
  text: string,
  suppliedReality: readonly AuthorCreativeEvent[],
): string | undefined {
  const source = suppliedReality.map((event) => clean(event.text)).join(" ");
  const candidate = clean(text);

  const sourceUses12Hour =
    /\b\d{1,2}(?::[0-5]\d)?\s*(?:am|pm)\b/i.test(source);
  const sourceUses24Hour =
    /\b(?:[01]?\d|2[0-3]):[0-5]\d\b(?!\s*(?:am|pm))/i.test(source);
  const candidateUses12Hour =
    /\b\d{1,2}(?::[0-5]\d)?\s*(?:am|pm)\b/i.test(candidate);
  const candidateUses24Hour =
    /\b(?:[01]?\d|2[0-3]):[0-5]\d\b(?!\s*(?:am|pm))/i.test(candidate);

  if (sourceUses12Hour && candidateUses24Hour && !candidateUses12Hour) {
    return "changed-clock-format";
  }

  if (sourceUses24Hour && candidateUses12Hour && !candidateUses24Hour) {
    return "changed-clock-format";
  }

  return undefined;
}

function inventedOperationalAnchorReason(
  text: string,
  suppliedReality: readonly AuthorCreativeEvent[],
): string | undefined {
  const suppliedText = suppliedReality.map((event) => clean(event.text)).join(" ");
  const suppliedAnchors = new Set([
    ...canonicalClockAnchors(suppliedText),
    ...exactPercentAnchors(suppliedText),
    ...exactMeasurementAnchors(suppliedText),
  ]);
  const candidateAnchors = [
    ...canonicalClockAnchors(text),
    ...exactPercentAnchors(text),
    ...exactMeasurementAnchors(text),
  ];

  const invented = candidateAnchors.filter((anchor) => !suppliedAnchors.has(anchor));
  return invented.length
    ? `invented-operational-anchor: ${invented.slice(0, 3).join(", ")}`
    : undefined;
}
export function testInventedOperationalAnchorReason(
  text: string,
  suppliedReality: readonly AuthorCreativeEvent[],
): string | undefined {
  return inventedOperationalAnchorReason(text, suppliedReality);
}
function sourceReplayPenalty(text: string, beatFacts: readonly string[]): number {
  const candidate = replayTokens(text);
  if (!candidate.length) return 0;

  const source = new Set(replayTokens(beatFacts.join(" ")));
  const overlap = candidate.filter((token) => source.has(token)).length / candidate.length;

  if (overlap >= 0.8) return 0.18;
  if (overlap >= 0.6) return 0.12;
  if (overlap >= 0.4) return 0.06;
  return 0;
}

function expressiveProductionHasPerceptionDelta(
  production: MemorySequenceCandidate,
): boolean {
  if (!production.lines.length) return false;

  const materiallyTransformedLines = production.lines.filter((line) => {
    const candidate = replayTokens(line.text);
    if (!candidate.length) return false;
    const source = new Set(replayTokens(line.beatFacts.join(" ")));
    const overlap =
      candidate.filter((token) => source.has(token)).length / candidate.length;

    // A line counts as transformed when it is not mostly a replay of its
    // source wording. This is intentionally vocabulary-agnostic: it does not
    // require any genre/device words and does not care what creative grammar
    // the model discovered.
    return overlap < 0.8;
  }).length;

  // A whole expressive production needs transformation across more than one
  // isolated cut. This blocks "three receipt lines + one fancy line".
  return materiallyTransformedLines >= Math.min(2, production.lines.length);
}

function temporalAnchorTokens(value: string): string[] {
  const text = clean(value).toLowerCase();
  const tokens = new Set<string>();

  for (const match of text.matchAll(/\b\d+(?:\.\d+)?\b/g)) {
    tokens.add(match[0]);
  }

  for (const match of text.matchAll(
    /\b(?:second|seconds|minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years|morning|afternoon|evening|night|today|tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/g,
  )) {
    tokens.add(match[0]);
  }

  if (/\bnext\s+(?:day|week|month|year|morning|afternoon|evening|night)\b/.test(text)) {
    tokens.add("next");
  }
  if (/\b(?:again|returned|return|revisit|revisited|back)\b/.test(text)) {
    tokens.add("recurrence");
  }

  return [...tokens];
}

function temporalAnchorAdjustment(text: string, beatFacts: readonly string[]): number {
  const sourceAnchors = temporalAnchorTokens(beatFacts.join(" "));
  if (!sourceAnchors.length) return 0;

  const candidateAnchors = new Set(temporalAnchorTokens(text));
  const preserved = sourceAnchors.filter((anchor) => candidateAnchors.has(anchor));

  if (preserved.length === sourceAnchors.length) return 0.14;
  if (preserved.length > 0) return 0.04;
  return -0.22;
}

function hasSpecificTemporalAnchor(value: string): boolean {
  const text = clean(value).toLowerCase();
  return (
    /\b\d+(?:\.\d+)?\b/.test(text) ||
    /\b(?:second|seconds|minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/.test(text) ||
    /\bnext\s+(?:day|week|month|year|morning|afternoon|evening|night)\b/.test(text)
  );
}

function preservesSpecificTemporalAnchor(
  text: string,
  beatFacts: readonly string[],
): boolean {
  const sourceText = beatFacts.join(" ");
  if (!hasSpecificTemporalAnchor(sourceText)) return true;

  const sourceAnchors = temporalAnchorTokens(sourceText)
    .filter((anchor) => anchor !== "recurrence");
  const candidateAnchors = new Set(temporalAnchorTokens(text));

  return sourceAnchors.some((anchor) => candidateAnchors.has(anchor));
}

function actionlessCompressionReason(
  text: string,
  beatFacts: readonly string[],
  requireLiteralAction: boolean,
): string | undefined {
  // Bare Reality must keep the supplied action legible on the line itself.
  // Expressive QRE cuts are judged as part of a whole production: they may
  // imply, personify, exaggerate, or rhetorically transform the action rather
  // than replay its verb. This is what allows cuts such as "Twice the battle"
  // while keeping the factual memory underneath unchanged.
  if (!requireLiteralAction) return undefined;

  const source = clean(beatFacts.join(" ")).toLowerCase();
  const candidate = clean(text).toLowerCase();
  if (!candidate) return undefined;

  const sourceHasAction = /\b(?:arriv(?:e|ed|ing)|finish(?:ed|ing)?|clean(?:ed|ing)?|drop(?:ped|s|ping)?|pick(?:ed|s|ing)?|bath(?:e|ed|ing)?|remove(?:d|s|ing)?|try|tried|feed|fed|refill(?:ed|s|ing)?|stay(?:ed|s|ing)?|walk(?:ed|s|ing)?|move(?:d|s|ing)?|carry|carried|load(?:ed|s|ing)?|unload(?:ed|s|ing)?|wash(?:ed|s|ing)?|repair(?:ed|s|ing)?|fix(?:ed|es|ing)?|open(?:ed|s|ing)?|close(?:d|s|ing)?|return(?:ed|s|ing)?|change(?:d|s|ing)?|give|gave|take|took|make|made)\b/.test(source);
  if (!sourceHasAction) return undefined;

  const candidateHasActionShape = /\b(?:arriv(?:e|ed|ing|al)|finish(?:ed|ing)?|clean(?:ed|ing)?|drop(?:ped|s|ping|off)?|pick(?:ed|s|ing|up)?|bath(?:e|ed|ing)?|remove(?:d|s|ing)?|try|tried|feed|fed|refill(?:ed|s|ing)?|stay(?:ed|s|ing)?|walk(?:ed|s|ing)?|move(?:d|s|ing)?|carry|carried|load(?:ed|s|ing)?|unload(?:ed|s|ing)?|wash(?:ed|s|ing)?|repair(?:ed|s|ing)?|fix(?:ed|es|ing)?|open(?:ed|s|ing)?|close(?:d|s|ing|closed)|return(?:ed|s|ing)?|change(?:d|s|ing)?|give|gave|take|took|make|made|confirm(?:ed|s|ing)?|clear(?:ed|s|ing)?|complete(?:d|s|ing)?|follow(?:ed|s|ing)?|resist(?:ed|s|ing|ance)?|object(?:ed|s|ing|ion)?|refus(?:e|ed|al)|done|down)\b/.test(candidate);
  const compactTokens = replayTokens(candidate);

  if (!candidateHasActionShape && compactTokens.length <= 5) {
    return "actionless-compression";
  }

  return undefined;
}

function variantScore(
  text: string,
  beatFacts: readonly string[],
  semanticAuthority: readonly string[],
  subject: string,
  prior: readonly string[],
  penalizeSourceReplay = true,
  requireLiteralAction = false,
): { accepted: boolean; score: number; reasons: string[] } {
  const policy = evaluateAuthorCut(text, {
    subject,
    facts: beatFacts,
    semanticAuthority,
  });

  if (!policy.accepted) {
    return { accepted: false, score: 0, reasons: policy.reasons };
  }

  const normalized = clean(text).toLowerCase();
  const repeated = prior.some((value) => clean(value).toLowerCase() === normalized);
  const actionlessReason = actionlessCompressionReason(text, beatFacts, requireLiteralAction);
  const replayPenalty = penalizeSourceReplay
    ? sourceReplayPenalty(text, beatFacts)
    : 0;
  const score = Math.max(
    0,
    policy.score -
      (repeated ? 0.35 : 0) -
      replayPenalty -
      (actionlessReason ? 0.18 : 0),
  );

  return {
    accepted: !repeated && !actionlessReason,
    score,
    reasons: [
      ...(repeated ? ["repetition"] : []),
      ...(actionlessReason ? [actionlessReason] : []),
    ],
  };
}

function lockPlanToApprovedMeaning(
  plan: AuthorExperienceComposition,
  events: readonly AuthorCreativeEvent[],
  discovery: AuthorCreativeDiscovery,
): AuthorExperienceComposition {
  const selected = discovery.selected;
  const approvedMeaning = clean(selected.perception || selected.relationship);
  const approvedRelation = clean(selected.relationship);
  const realityDirect = clean(selected.id).toLowerCase() === "reality-direct";
  const authorizedEventIds = new Set(
    (
      discovery.playableEventIds.length
        ? discovery.playableEventIds
        : selected.evidenceEventIds
    ).map(clean).filter(Boolean),
  );

  const scopedMoves = plan.moves
    .map((move) => ({
      ...move,
      eventIds: move.eventIds.filter((id) => authorizedEventIds.has(clean(id))),
    }))
    .filter((move) => move.eventIds.length > 0);
  const compositionMoves = scopedMoves.length
    ? scopedMoves
    : fallbackPlan(
        events.filter((event) => authorizedEventIds.has(clean(event.id))),
        discovery,
      ).moves;
  const usedIds = new Set(compositionMoves.flatMap((move) => move.eventIds).map(clean));
  const unusedEventIds = unique(
    plan.unusedEventIds.filter((id) =>
      authorizedEventIds.has(clean(id)) && !usedIds.has(clean(id)),
    ),
  );

  if (realityDirect) {
    return {
      thesis: "Use supplied reality directly.",
      perceptualTreatmentId: plan.perceptualTreatmentId,
      moves: compositionMoves.map((move) => ({
        ...move,
        purpose: move.purpose ||
          move.eventIds
            .map((id) => events.find((event) => event.id === id)?.text ?? "")
            .map(clean)
            .filter(Boolean)
            .join(" | "),
        perceptualMove: move.perceptualMove ||
          "Advance the supplied reality directly; the creative work is perceptual rather than factual.",
      })),
      unusedEventIds,
    };
  }

  return {
    thesis: approvedMeaning || approvedRelation || "Approved grounded perception.",
    perceptualTreatmentId: plan.perceptualTreatmentId,
    moves: compositionMoves.map((move, index) => {
      const isFirst = index === 0;
      const isLast = index === compositionMoves.length - 1;
      const purpose = move.purpose ||
        move.eventIds
        .map((id) => events.find((event) => event.id === id)?.text ?? "")
        .map(clean)
        .filter(Boolean)
        .join(" | ");

      const perceptualMove = move.perceptualMove || (compositionMoves.length === 1
        ? approvedMeaning || approvedRelation || "Realize this supplied evidence."
        : isFirst
          ? "Establish only this beat's supplied evidence. Do not import later evidence or state the full relation yet."
          : isLast
            ? approvedMeaning || approvedRelation || "Land the approved relation using only this beat and prior established evidence."
            : "Advance the approved relation using only this beat and already-established prior evidence. Do not import later evidence.");

      return {
        ...move,
        order: index + 1,
        purpose,
        perceptualMove,
      };
    }),
    unusedEventIds,
  };
}

function ensurePostLockMemoryCanvas(
  plan: AuthorExperienceComposition,
  selectedEvidence: readonly AuthorCreativeEvent[],
): AuthorExperienceComposition {
  return enforceMemoryStructure(plan, selectedEvidence);
}

function memoryPayoffReplayPenalty(
  text: string,
  beatFacts: readonly string[],
  isMemoryMode: boolean,
  isFinalBeat: boolean,
  semanticMove: string,
): number {
  if (!isMemoryMode || !isFinalBeat || !clean(semanticMove)) return 0;
  const candidate = replayTokens(text);
  if (!candidate.length) return 0;
  const source = new Set(replayTokens(beatFacts.join(" ")));
  const overlap = candidate.filter((token) => source.has(token)).length / candidate.length;
  if (overlap >= 0.8) return 0.24;
  if (overlap >= 0.6) return 0.16;
  return 0;
}

type MemorySequenceCandidate = {
  variantIndex: number;
  lines: Array<{
    beat: AuthorExperienceMove;
    beatFacts: string[];
    text: string;
    accepted: boolean;
    score: number;
    reasons: string[];
  }>;
  accepted: boolean;
  score: number;
  reasons: string[];
};

function scoreMemorySequence(
  variantIndex: number,
  plan: AuthorExperienceComposition,
  variantsByOrder: Map<number, string[]>,
  suppliedReality: readonly AuthorCreativeEvent[],
  subject: string,
  realityDirect = false,
): MemorySequenceCandidate {
  const prior: string[] = [];
  const lines = plan.moves.map((beat, index) => {
    const beatFacts = beat.eventIds
      .map((id) => suppliedReality.find((event) => event.id === id)?.text ?? "")
      .map(clean)
      .filter(Boolean);
    const text = clean(variantsByOrder.get(beat.order)?.[variantIndex] ?? "");
    const base = variantScore(
      text,
      beatFacts,
      [beat.perceptualMove].map(clean).filter(Boolean),
      subject,
      prior,
      !realityDirect,
      variantIndex === 3,
    );
    const payoffPenalty = memoryPayoffReplayPenalty(
      text,
      beatFacts,
      true,
      index === plan.moves.length - 1,
      beat.perceptualMove,
    );
    const dropsSpecificTimeAnchor =
      variantIndex === 3 && !preservesSpecificTemporalAnchor(text, beatFacts);
    const futureLeakReason =
      variantIndex < 3
        ? futureEvidenceLeakReason(text, index, plan, suppliedReality)
        : undefined;
    const operationalAnchorFailure =
      variantIndex < 3
        ? inventedOperationalAnchorReason(text, suppliedReality) ??
          changedClockFormatReason(text, suppliedReality)
        : undefined;
    const line = {
      beat,
      beatFacts,
      text,
      ...base,
      accepted:
        base.accepted &&
        !dropsSpecificTimeAnchor &&
        !futureLeakReason &&
        !operationalAnchorFailure,
      score:
        futureLeakReason || operationalAnchorFailure
          ? 0
          : Math.max(0, base.score - payoffPenalty),
      reasons: [
        ...base.reasons,
        ...(payoffPenalty > 0 ? ["memory-payoff-replay"] : []),
        ...(dropsSpecificTimeAnchor ? ["drops-specific-time-anchor"] : []),
        ...(futureLeakReason ? [futureLeakReason] : []),
        ...(operationalAnchorFailure ? [operationalAnchorFailure] : []),
      ],
    };
    if (text) prior.push(text);
    return line;
  });

  const acceptedLines = lines.filter((line) => line.accepted && line.text);
  const completeness = plan.moves.length
    ? acceptedLines.length / plan.moves.length
    : 0;
  const meanScore = acceptedLines.length
    ? acceptedLines.reduce((sum, line) => sum + line.score, 0) / acceptedLines.length
    : 0;
  const normalizedLines = lines
    .map((line) => clean(line.text).toLowerCase())
    .filter(Boolean);
  const uniqueRatio = normalizedLines.length
    ? new Set(normalizedLines).size / normalizedLines.length
    : 0;
  const payoff = lines.length ? lines[lines.length - 1] : undefined;
  const payoffStrength = payoff?.accepted ? payoff.score : 0;
  const payoffDropsSpecificTime = Boolean(
    variantIndex === 3 &&
    payoff &&
    !preservesSpecificTemporalAnchor(payoff.text, payoff.beatFacts),
  );
  const rejected = lines.length - acceptedLines.length;

  const score = Math.max(
    0,
    meanScore * 0.5 +
      completeness * 0.25 +
      payoffStrength * 0.2 +
      uniqueRatio * 0.05 -
      rejected * 0.2,
  );

  const reasons: string[] = [];
  if (completeness < 1) reasons.push("incomplete-composition");
  if (uniqueRatio < 1) reasons.push("repeated-line");
  if ((payoff?.reasons ?? []).includes("memory-payoff-replay")) {
    reasons.push("weak-payoff-replay");
  }
  if (payoffDropsSpecificTime) {
    reasons.push("payoff-drops-specific-time-anchor");
  }

  return {
    variantIndex,
    lines,
    accepted: completeness === 1 && !payoffDropsSpecificTime,
    score: Number(score.toFixed(3)),
    reasons,
  };
}

async function repairNominatedMemoryProduction(input: {
  production: MemorySequenceCandidate;
  plan: AuthorExperienceComposition;
  suppliedReality: readonly AuthorCreativeEvent[];
  subject: string;
  thesis: string;
  assignedTreatment?: AuthorCreativeTreatmentAssignment;
}): Promise<{
  replacements: Map<number, string>;
  model: string;
  modelCalls: number;
}> {
  const failed = input.production.lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => !line.accepted || !clean(line.text));

  if (!failed.length) {
    return {
      replacements: new Map<number, string>(),
      model: "none",
      modelCalls: 0,
    };
  }

  const result = await localModelGenerate(
    [
      {
        role: "system",
        content: [
          "You are QRE Memory Realization Repair.",
          ...QRE_CREATIVE_OPERATING_DOCTRINE,
          "A complete creative realization already exists. Restore failed lines without weakening the conception.",
          "PRESERVE THE CONCEPTION. PRESERVE THE REALITY. RECOVER THE ENERGY.",
          "The supplied reality is the whole available world. Repair may change expression, rhythm, and compression, but every factual implication must remain inside supplied evidence and prior established lines.",
          "A failed line may not borrow evidence from a later move. Keep each replacement inside its own suppliedEvidence plus prior established evidence. Future facts must stay future.",
          "Preserve the selected perception. Police literal reality, not imaginative vocabulary.",
          "Use the assigned treatment's perceptionDelta and expressiveBehaviors as repair authority. Do not invent a new treatment and do not flatten the line into bare fact unless no grounded expression of the conception remains.",
          "Discover more meaning than you express. A repaired line is a hit of perceptual impact, not a length target. Keep phone readability while preserving meaning, rhythm, character, or surprise.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUBJECT: input.subject,
          EXPERIENCE_THESIS: input.thesis,
          ASSIGNED_TREATMENT: input.assignedTreatment,
          FULL_PRODUCTION: input.production.lines.map((line, index) => ({
            order: line.beat.order,
            text: line.text,
            accepted: line.accepted,
            reasons: line.reasons,
            suppliedEvidence: line.beatFacts,
            semanticMove: line.beat.perceptualMove,
            keepExactly: line.accepted,
            priorLines: input.production.lines
              .slice(0, index)
              .map((prior) => prior.text)
              .filter(Boolean),
          })),
          FAILED_MOVES: failed.map(({ line }) => ({
            order: line.beat.order,
            rejectedText: line.text,
            reasons: line.reasons,
            suppliedEvidence: line.beatFacts,
            semanticMove: line.beat.perceptualMove,
          })),
          instruction:
            "Repair only FAILED_MOVES. Preserve the assigned conception, perception delta, expression voice/rhythm/progression, and supplied reality boundary. Make each replacement felt and implied rather than explained, and keep the underlying supplied action or change recoverable.",
        }),
      },
    ],
    "json",
    {
      numPredict: Math.max(220, failed.length * 90),
      temperature: 0.72,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["repairs"],
        properties: {
          repairs: {
            type: "array",
            minItems: failed.length,
            maxItems: failed.length,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["order", "text"],
              properties: {
                order: { type: "integer", minimum: 1 },
                text: { type: "string" },
              },
            },
          },
        },
      },
    },
  );

  const parsed = parseJson(result.text);
  const rawRepairs = Array.isArray(parsed?.repairs) ? parsed.repairs : [];
  const failedOrders = new Set(failed.map(({ line }) => line.beat.order));
  const replacements = new Map<number, string>();

  for (const raw of rawRepairs) {
    if (!raw || typeof raw !== "object") continue;
    const record = raw as Record<string, unknown>;
    const order = Number(record.order);
    const text = clean(record.text);
    if (!Number.isInteger(order) || !failedOrders.has(order) || !text) continue;
    replacements.set(order, text);
  }

  return {
    replacements,
    model: result.model,
    modelCalls: 1,
  };
}

function safeFallbackText(
  beat: AuthorExperienceMove,
  events: readonly AuthorCreativeEvent[],
): string {
  return (
    beat.eventIds
      .map((id) => events.find((event) => event.id === id)?.text ?? "")
      .map(clean)
      .find(Boolean) ?? ""
  );
}

function buildDeterministicMouthFallback(
  plan: AuthorExperienceComposition,
  events: readonly AuthorCreativeEvent[],
  memoryMode: boolean,
): string {
  if (memoryMode) {
    return JSON.stringify({
      productions: [
        {
          production: "D",
          lines: plan.moves.map((beat) => ({
            order: beat.order,
            text: safeFallbackText(beat, events),
          })),
        },
      ],
      selectedProduction: "D",
      selectionReason:
        "Deterministic Bare Reality selected because Mouth did not return a renderable production.",
    });
  }

  return JSON.stringify({
    variantsByMove: plan.moves.map((beat) => {
      const text = safeFallbackText(beat, events);
      return {
        order: beat.order,
        variants: [text, text, text, text],
      };
    }),
  });
}

export async function createAuthorExperience(input: {
  subject: string;
  suppliedReality: readonly AuthorCreativeEvent[];
  creativeDiscovery: AuthorCreativeDiscovery;
  requestedLens?: string;
  memory?: readonly string[];
  domainContext?: AuthorDomainContext;
}): Promise<{
  scenes: Array<AuthorScene & { sourceEventIds: string[] }>;
  model: string;
  modelCalls: number;
  diagnostics: {
    plan: AuthorExperienceComposition;
    creativeNotice: AuthorCreativeNotice;
    storyGravity: AuthorStoryGravity;
    failureLessons: AuthorCreativeFailureLesson[];
    creativeTreatments: AuthorCreativeTreatmentAssignment[];
    creativeSearchFallbackReason?: string;
    rejectedTreatments: Array<{
      treatment: AuthorCreativeTreatment;
      reason: string;
    }>;
    treatmentSetAssessment: AuthorCreativeTreatmentSetAssessment;
    productionContractComplete: {
      creativeSetComplete: boolean;
      renderable: boolean;
    };
    variantsByMove: Array<{ order: number; variants: string[] }>;
    variantsByBeat: Array<{ order: number; variants: string[] }>;
    choices: Array<{
      order: number;
      beat: AuthorExperienceMove;
      beatFacts: string[];
      candidates: Array<{ text: string; accepted: boolean; score: number; reasons: string[] }>;
      selected: string;
    }>;
    selectedProduction?: string;
    mouthFallback?: {
      reason: string;
      production: string;
    };
    memoryProductions?: Array<{
      production: string;
      accepted: boolean;
      score: number;
      reasons: string[];
      lines: Array<{
        order: number;
        text: string;
        sourceEventIds: string[];
      }>;
    }>;
  };
}> {
  const allowedEventIds = new Set(input.suppliedReality.map((event) => event.id));
  const presentationContext = presentationAffordance(input.domainContext);
  const selected = input.creativeDiscovery.selected;
  const realityDirect =
    clean(selected.id).toLowerCase() === "reality-direct" ||
    clean(selected.risk).toLowerCase() === "no_grounded_discovery_candidate";
  const contextRecord = (input.domainContext ?? {}) as Record<string, unknown>;
  const experienceMode = clean(contextRecord.experienceMode).toUpperCase();
  const isMemoryMode = experienceMode === "MEMORY";
  const authorityContext = realityAuthorityContext(input.suppliedReality);
  const playableIds = new Set(
    (
      input.creativeDiscovery.playableEventIds.length
        ? input.creativeDiscovery.playableEventIds
        : selected.evidenceEventIds
    ).map(clean).filter(Boolean),
  );
  const selectedEvidence = input.suppliedReality.filter((event) =>
    playableIds.has(clean(event.id)),
  );
  const realityDirectMemoryUsesComposition =
    isMemoryMode &&
    realityDirect &&
    selectedEvidence.length > 0;
  const useIdentityClusterPlan = false;
  const requestedLens = clean(input.requestedLens);
  const normalizedRequestedLens = requestedLens.toUpperCase();
  const explicitLensOff = normalizedRequestedLens === "NONE";
  const semanticMechanicCandidates = deriveAuthorSemanticMechanicCandidates({
    subject: input.subject,
    suppliedReality: input.suppliedReality,
    creativeDiscovery: input.creativeDiscovery,
    memory: input.memory,
    domainContext: input.domainContext,
  });
  const semanticMechanic = explicitLensOff
    ? {
        mechanic: "NONE",
        reason: "an explicit NONE lens preserves natural realization",
        confidence: 1,
      }
    : selectAuthorSemanticMechanic({
        candidates: semanticMechanicCandidates,
        creativeDiscovery: input.creativeDiscovery,
      });
  const lensReality = selectedEvidence.length ? selectedEvidence : input.suppliedReality;
  const lensSearch = await searchAuthorCreativeLensTreatments({
    subject: input.subject,
    suppliedReality: lensReality,
    creativeOpportunity: selected.perception,
    relation: selected.relationship,
    experienceMode,
    requestedLens,
    domainContext: input.domainContext,
    semanticMechanic,
    semanticMechanicCandidates,
  });
  const autoBusinessLens = lensSearch.autoBusinessLens;
  const lensSearchEnabled = lensSearch.lensSearchEnabled;
  const lensMode = lensSearch.lensMode;
  const availablePerceptualTreatments = lensSearch.acceptedTreatments.filter(
    (treatment) => !isBareTreatment(treatment),
  );
  const perceptualTreatmentIds = new Set(
    availablePerceptualTreatments.map((treatment) => treatment.id),
  );
  const perceptualDiscoveriesForComposer = availablePerceptualTreatments.map((treatment) => ({
    id: treatment.id,
    sourceCandidateId: treatment.sourceCandidateId,
    sourceRelation: treatment.sourceRelation,
    evidenceEventIds: treatment.evidenceEventIds,
    creativePressure: treatment.creativePressure,
    hiddenInference: treatment.hiddenInference || undefined,
    treatment: treatment.treatment,
    perceptionDelta: treatment.perceptionDelta,
    expressiveBehaviors: treatment.expressiveBehaviors,
    intensity: treatment.intensity,
  }));

  const planResult = await localModelGenerate(
    [
      {
        role: "system",
        content: [
          "You are QRE Experience Composer.",
          "Discovery and Perceptual Discovery find more meaning than the experience will express. Your responsibility is deciding what becomes the experience.",
          "AUTHORIZED_EVIDENCE is the factual material available to this experience.",
          "PERCEPTUAL_DISCOVERIES are possible ways this same reality can be read. Choose the territory that best composes into movement, or choose NONE only when no discovery fits.",
          "Build the strongest composed experience from authorized event IDs and preserve the supplied relationships that make the experience meaningful.",
          "Let the material determine the number of moves. Fact count does not determine move count.",
          "A move is a unit of perceptual impact, not a unit of length and not a required narrative formula.",
          "A move may use one event, group several events, reuse an earlier event, or return to a prior event as callback or payoff when the supplied material earns it.",
          "One evidence item may support several moves if each move changes what the viewer notices, expects, assumes, feels, connects, or understands.",
          "Some authorized evidence may intentionally remain unused. Record it in unusedEventIds instead of forcing it into the expression.",
          "Movement is expressive, not a checklist. Do not create one move per supplied item merely to increase move count, and do not mechanically split one thought into fragments.",
          "HOOK, BUILD, TURN, and PAYOFF are structural metadata only. Do not require every role, do not require a TURN, and do not require a fixed number of BUILD moves.",
          "The intelligence belongs primarily in purpose and perceptualMove. purpose says what the move does in the experience; perceptualMove says how perception changes.",
          "Choose a perceptualTreatmentId that governs the composition. Do not copy a treatment as prose; compose movement from it.",
          "Composition may change attention and meaning. It may not create new concrete events, actions, people, places, chronology, physical states, or world facts.",
          "REALITY STAYS FIXED. PERSPECTIVE GETS DANGEROUS.",
          ...(isMemoryMode ? [
            "MEMORY COMPOSITION: shape the supplied lived material so the memory has enough space to be experienced rather than merely summarized.",
            "Preserve meaningful temporal progression, state contrast, duration, recurrence, return, and distinctive moments when they contribute to the approved memory.",
            "A meaningful middle can carry its own weight. A later state or return can carry its own weight. Let their relationship determine the shape.",
            "Choose the smallest composition that preserves the full creative potential of the approved memory, with no predetermined move count.",
          ] : []),
          ...(presentationContext ? [presentationContext] : []),
          ...(authorityContext ? [authorityContext] : []),
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUBJECT: input.subject,
          AUTHORIZED_EVIDENCE: selectedEvidence,
          CREATIVE_DISCOVERY: {
            selectedCandidateId: input.creativeDiscovery.selectedCandidateId,
            perception: selected.perception,
            relationship: selected.relationship,
            evidenceEventIds: selected.evidenceEventIds,
            playableEventIds: input.creativeDiscovery.playableEventIds,
            backgroundEventIds: input.creativeDiscovery.backgroundEventIds,
          },
          PERCEPTUAL_DISCOVERIES: perceptualDiscoveriesForComposer,
          STORY_GRAVITY: lensSearch.storyGravity,
          EXPERIENCE_SHAPE: input.creativeDiscovery.experienceShape,
          instruction:
            "Return the strongest experience composition using only authorized event IDs. Choose perceptualTreatmentId from PERCEPTUAL_DISCOVERIES, or NONE only when no discovery fits. Decide the number of moves, evidence grouping, evidence reuse, asymmetric attention, intentional omissions, callback/recontextualization, progression, and payoff. Preserve provenance on every move through eventIds. Put authorized evidence that is intentionally not expressed in unusedEventIds. Do not write final lines.",
        }),
      },
    ],
    "json",
    {
      numPredict: 260,
      temperature: 0.18,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["thesis", "perceptualTreatmentId", "moves", "unusedEventIds"],
        properties: {
          thesis: { type: "string" },
          perceptualTreatmentId: {
            type: "string",
            enum: availablePerceptualTreatments.length
              ? availablePerceptualTreatments.map((treatment) => treatment.id)
              : ["NONE"],
          },
          moves: {
            type: "array",
            minItems: 2,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["order", "role", "eventIds", "purpose", "perceptualMove"],
              properties: {
                order: { type: "integer", minimum: 1 },
                role: { type: "string", enum: ["HOOK", "BUILD", "TURN", "PAYOFF"] },
                eventIds: {
                  type: "array",
                  minItems: 1,
                  maxItems: 32,
                  items: { type: "string", maxLength: 64 },
                },
                purpose: { type: "string" },
                perceptualMove: { type: "string" },
              },
            },
          },
          unusedEventIds: {
            type: "array",
            maxItems: 64,
            items: { type: "string", maxLength: 64 },
          },
        },
      },
    },
  );

  const rawPlan =
    normalizePlan(parseJson(planResult.text), allowedEventIds, perceptualTreatmentIds) ??
    fallbackPlan(selectedEvidence.length ? selectedEvidence : input.suppliedReality, input.creativeDiscovery);

  const structurallySafePlan = isMemoryMode
    ? enforceMemoryStructure(rawPlan, selectedEvidence)
    : rawPlan;

  const initiallyLockedPlan = lockPlanToApprovedMeaning(
    structurallySafePlan,
    input.suppliedReality,
    input.creativeDiscovery,
  );

  const postLockPlan = isMemoryMode
    ? ensurePostLockMemoryCanvas(initiallyLockedPlan, selectedEvidence)
    : initiallyLockedPlan;

  const plan = postLockPlan === initiallyLockedPlan
    ? initiallyLockedPlan
    : lockPlanToApprovedMeaning(
        postLockPlan,
        input.suppliedReality,
        input.creativeDiscovery,
      );

  debug("BARE-AUTHOR-PLAN", {
    mode: realityDirectMemoryUsesComposition
      ? "REALITY_DIRECT_MEMORY_COMPOSITION"
      : "MODEL_EXPERIENCE_COMPOSITION",
    raw: planResult.text,
    memoryStructureAdjusted:
      isMemoryMode &&
      (
        JSON.stringify(structurallySafePlan.moves.map((move) => move.eventIds)) !==
          JSON.stringify(rawPlan.moves.map((move) => move.eventIds)) ||
        JSON.stringify(plan.moves.map((move) => move.eventIds)) !==
          JSON.stringify(initiallyLockedPlan.moves.map((move) => move.eventIds))
      ),
    selectedPlan: plan,
  });

  const treatmentsForMouth = lensSearch.acceptedTreatments;
  const selectedTreatmentForMouth =
    availablePerceptualTreatments.find((treatment) => treatment.id === plan.perceptualTreatmentId) ??
    availablePerceptualTreatments[0];
  const skipExpressiveMouth = lensSearchEnabled && availablePerceptualTreatments.length === 0;
  const creativeSetComplete =
    !lensSearch.lensSearchEnabled ||
    lensSearch.treatmentSetAssessment.creativeSetComplete;
  const runtimeRenderable =
    !lensSearch.lensSearchEnabled ||
    lensSearch.treatmentSetAssessment.renderable;
  const treatmentAssignmentsForMouth = (selectedTreatmentForMouth
    ? [selectedTreatmentForMouth]
    : []
  )
    .map((assignment) => ({
      production: treatmentProductionLetter(assignment),
      ...assignment,
    }))
    .sort((a, b) => a.production.localeCompare(b.production));
  const treatmentByVariantIndex = new Map(
    treatmentAssignmentsForMouth.map((assignment) => [
      treatmentVariantIndex(assignment),
      assignment,
    ]),
  );

  debug("CREATIVE-LENS-SEARCH", {
    mode: lensMode,
    requestedLens: requestedLens || (autoBusinessLens ? "AUTO" : "NONE"),
    semanticMechanic: lensSearch.semanticMechanic,
    semanticMechanicCandidates,
    lensSearchEnabled,
    rawTreatmentResponse: lensSearch.rawTreatmentResponse,
    searchFallbackReason: lensSearch.searchFallbackReason,
    treatments: treatmentsForMouth,
    rejectedTreatments: lensSearch.rejectedTreatments,
    treatmentSetAssessment: lensSearch.treatmentSetAssessment,
    creativeSetComplete,
    renderable: runtimeRenderable,
  });

  if (!runtimeRenderable) {
    throw new Error(
      `QRE Creative Lens not renderable: ${lensSearch.treatmentSetAssessment.reasons.join("; ") || "deterministic Bare treatment unavailable"}`,
    );
  }

  let mouthFallbackReason: string | undefined;
  if (skipExpressiveMouth) {
    mouthFallbackReason = "no viable expressive treatments; skipped Mouth and returned deterministic Bare Reality";
  }
  const allowedMouthProductions = lensSearchEnabled && treatmentAssignmentsForMouth.length
    ? treatmentAssignmentsForMouth.map((assignment) => assignment.production)
    : ["A", "B", "C", "D"];
  /**
   * QRE CANONICAL MOUTH - PROTECTED
   *
   * Mouth realizes Experience Composition in language. It does not choose the
   * creative territory, redesign the composition, or require verbal coverage of
   * every supplied fact. Grounding remains downstream.
   * See ./AUTHOR_ARCHITECTURE.md.
   */
  const mouthResult = skipExpressiveMouth
    ? {
        text: buildDeterministicMouthFallback(plan, input.suppliedReality, isMemoryMode),
        model: "deterministic-bare-mouth-skip",
        provider: "local" as const,
      }
    : await localModelGenerate(
    [
      {
        role: "system",
        content: [
          "You are QRE Mouth.",
          ...QRE_CREATIVE_OPERATING_DOCTRINE,
          "You receive grounded reality, an experience composition, and the perceptual treatment chosen by Composition. Realize that composed movement in language.",
          "The realization is the product. Read it vertically: each move should set up, deepen, turn, recontextualize, or land the same experience.",
          "Concrete reality comes from the supplied evidence carried by each move plus concrete facts already established by earlier lines.",
          "Rhetorical transformation is wide open as perception, implication, emphasis, status, scale, contrast, voice, or rhythm. It may not become a new concrete world fact.",
          "An attempt remains unresolved unless the supplied reality gives its outcome. A supplied emotion or state remains that state rather than becoming an invented bodily action.",
          "Specificity is fuel. Preserve the distinctive facts that make this reality this reality, but do not confuse operational metadata with the creative center.",
          "Operational anchors such as clock time, date, geo, count, quantity, price, and measurement are ordinary supplied reality. Use them when they strengthen the experience, when the user wants them visible, or when they carry useful identity, sequence, proof, place, or meaning. Omit them when they add nothing.",
          "When an operational anchor is used, preserve its supplied value exactly. Never invent or alter an exact time, date, geo point, count, quantity, price, measurement, or other operational fact.",
          "Preserve the supplied clock style. If reality says 5 PM, keep 5 PM; do not convert it to 17:00. If reality uses 24-hour time, keep that form unless the user explicitly asks for another format.",
          "Formatting alone is not the creative move. Logs, timestamps, labels, records, and terse fragments may be part of the creative language, but the realization should also create a felt shift in status, implication, consequence, relationship, tension, humor, threat, or another perception.",
          "Do not mistake list cadence, noun fragments, repeated task words, or timestamp formatting for authorship. The creative move must come from a relationship in the supplied reality.",
          "Discover more meaning than you express. Let the viewer construct part of the meaning.",
          "A hit is a unit of perceptual impact, not a unit of length. Phone readability matters, but rhythm may vary when the composition earns it.",
          "Build the full perception privately. Realize only what makes that perception felt.",
          "The assigned creative pressure is internal creative physics, not a vocabulary pack. Let it change status, rhythm, consequence, implication, and perception before it changes surface nouns.",
          "Let the idea determine the line. Do not shorten merely to be short, and do not lengthen merely to explain.",
          "Creative precision is the target: every word should strengthen the perception, voice, rhythm, or consequence of the supplied reality.",
          "A strong realization may use fragments, full sentences, abrupt hits, or a longer turn. Let form follow the composed move.",
          "Let status, consequence, double meaning, contrast, callback, implication, weirdness, and payoff carry the world without explaining it.",
          "Do not explain the lens or summarize the meaning. Make the receiver feel the creative read through the writing itself.",
          "Compression may transform wording, but it may not erase what happened. When a supplied move includes an action or change, the line must still let the receiver recover that action or change rather than reducing it to a noun label.",
          "The receiver should be able to recover what happened while also feeling that QRE saw it from an angle they would not have produced themselves.",
          "STORY GRAVITY is evidence structure, not permission to invent meaning. The endpointEventId is HARD because QRE locked it from supplied reality. Make that ending feel earned through the supplied dependencies and sealing detail; never add psychology just because StoryGravity contains a center phrase.",
          "Think backward before wording: endpoint <- sealing detail <- escalation <- signal. Then present forward. Every moment should increase the inevitability or meaning of the locked endpoint, unless this is a sparse portrait/world-opening where the endpoint is simply the final supplied state.",
          "Do not stop at competent wording. Push the assigned perception until the sequence produces earned recognition, surprise, tension, comedy, beauty, menace, status, weirdness, or another perceptual turn.",
          "Composition owns movement and provenance. Mouth owns language realization.",
          ...(realityDirect ? [
            "REALITY-DIRECT MODE: there is no hidden explanatory thesis to add. Let the supplied facts themselves carry the creative transformation.",
            "Use nonliteral pressure aggressively while keeping every concrete noun, action, condition, result, physical property, manner, and object inside supplied evidence.",
          ] : []),
          ...(isMemoryMode ? [
            "MEMORY REALIZATION: the moves are one accumulated experience, not independent caption slots.",
            "Let facts fuse when the relationship becomes stronger, and let later moments change the meaning of earlier moments when the supplied sequence supports it.",
            "A simple line may create runway for a harder payoff. The strongest sequence does not require every line to compete for attention.",
            "Service memories are still memories. Tasks, counts, and timestamps are material, not a mandate to sound like a receipt.",
            "Customer-facing output remains decipherable: transformation may be wild, but the underlying event remains recoverable.",
            "A duration, count, clock time, date, geo fact, or other operational anchor stays viewer-facing only when it materially gives the experience its identity; otherwise it may remain in provenance instead of the expressive lines.",
            "The final moment should make the earlier moments feel more intentional in retrospect.",
            ...(treatmentAssignmentsForMouth.length ? [
              "CREATIVE_TREATMENTS contains the perceptual territory selected by Composition. Realize that territory; do not choose a different one.",
              "sourceRelation and evidenceEventIds are the grounded root of the creative leap. Keep that root alive while pushing far beyond literal paraphrase.",
              "hiddenInference is optional private Author intent, not viewer-facing copy. When present, build the sequence so the receiver can reach it themselves. When empty, do not invent a thesis; realize the supplied relationship through framing, juxtaposition, character, status, contrast, callback, possibility, or recontextualization.",
              "Realization beats explanation. Make the inference felt and implied through supplied facts, sequence, contrast, callback, personification, status, and recontextualization.",
              "Treat the assigned treatment as pressure, not literal world description. Push it hard enough that the same reality becomes a different experience.",
              "Complete the thought. Keep latent relations and treatments concise, but never end a relation, treatment, or perceptionDelta mid-phrase merely to be brief.",
              "AMPLIFY REALITY: push metaphor, status, personification, rhetorical scale, double meaning, and semantic consequence hard. Do not retreat to literal receipt wording merely to stay grounded. Grounding protects the concrete world; it does not require literal phrasing.",
              "A line may imply the supplied action rather than naming its verb when the whole realization keeps the event recoverable. Make the viewer feel and infer the move. Do not explain it.",
              "ABSENCE IS ALSO A FACT. Do not claim that a response, object, action, event, or interaction was absent unless supplied reality establishes that absence.",
              "A category does not license its typical contents. Keep creative force in status, rhetoric, logic, scale, sequence, and recontextualization instead of inventing material detail.",
              "Sensory residue is material reality too. Sensory conditions, bodily reactions, and environmental aftermath require supplied support unless the wording is unmistakably nonliteral rhetoric.",
              "Bare Reality is the truth-safe control. It wins only when no expressive variant remains viable.",
            ] : [
              "Without an assigned creative treatment, realize the approved meaning directly and still search for strong sequence-level authorship rather than generic paraphrase.",
            ]),
            "Return one complete production object for each listed production identity. Finish each production from first line through payoff before starting the next.",
            "MOVE EVIDENCE IS ORDERED AUTHORITY. A line at order N may use that move's supplied evidence plus evidence already established by earlier orders. It may not move a later room, object, timestamp, action, result, or other supplied fact into an earlier line.",
            "Do not reshuffle facts merely to create rhythm. Transform the meaning of each move where it actually occurs.",
          ] : [
            "For each move, produce materially different realizations and let the strongest grounded line win.",
          ]),
          ...(presentationContext ? [presentationContext] : []),
          ...(authorityContext ? [authorityContext] : []),
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUBJECT: input.subject,
          SUPPLIED_REALITY: input.suppliedReality,
          EXPERIENCE_COMPOSITION: {
            thesis: plan.thesis,
            perceptualTreatmentId: plan.perceptualTreatmentId ?? "NONE",
          },
          APPROVED_MOVES: plan.moves.map((beat, index) => ({
            order: beat.order,
            role: beat.role,
            eventIds: beat.eventIds,
            attentionEvidence: beat.purpose,
            semanticMove: beat.perceptualMove,
            mayUseFullRelation: index === plan.moves.length - 1,
          })),
          CREATIVE_OPPORTUNITY: selected.perception,
          RELATION: selected.relationship,
          REALITY_DIRECT: realityDirect,
          LENS_MODE: lensMode,
          REQUESTED_LENS: requestedLens || (autoBusinessLens ? "AUTO" : "NONE"),
          STORY_GRAVITY: lensSearch.storyGravity,
          CREATIVE_TREATMENTS: treatmentAssignmentsForMouth.map((assignment) => ({
            production: assignment.production,
            sourceCandidateId: assignment.sourceCandidateId,
            sourceRelation: assignment.sourceRelation,
            evidenceEventIds: assignment.evidenceEventIds,
            creativePressure: assignment.creativePressure,
            hiddenInference: assignment.hiddenInference,
            treatment: assignment.treatment,
            perceptionDelta: assignment.perceptionDelta,
            expressiveBehaviors: assignment.expressiveBehaviors,
            intensity: assignment.intensity,
          })),
          instruction: useIdentityClusterPlan
            ? "This is one IDENTITY character cluster, not a checklist. Return four short candidate realizations that synthesize the combination into character. Do not enumerate every supplied preference or simply restate them. The viewer should infer personality from the combination. Do not invent an event."
            : isMemoryMode
              ? realityDirect
                ? "Return complete productions for the listed CREATIVE_TREATMENTS only. Make the meaning felt and implied, not explained. Push the composed treatment as far as supplied reality supports through nonliteral rhetoric, sequence, status, metaphor, callback, and recontextualization. Keep the concrete world fixed and each underlying action/change recoverable. Operational anchors may stay in provenance unless they create the perception. Select only a listed production."
                : "Return complete productions for the listed CREATIVE_TREATMENTS only. Make the meaning felt and implied, not explained. Treat the selected production as one finished QRE experience unfolding through the approved moves. Push the assigned perception until the whole sequence reveals something surprising but true about supplied reality. Keep each underlying action/change recoverable. Operational anchors may stay in provenance unless they create the perception. The final moment should land the realization using its local evidence plus already-established prior evidence. Bare Reality D is the truth fallback, not the creative target."
              : "Return four candidate lines per move. The experience composition controls movement; the supplied event IDs control factual reality.",
        }),
      },
    ],
    "json",
    {
      numPredict: isMemoryMode ? 480 : 520,
      temperature: isMemoryMode ? 0.96 : 0.86,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: isMemoryMode
          ? ["productions", "selectedProduction", "selectionReason"]
          : ["variantsByMove"],
        properties: isMemoryMode
          ? {
              productions: {
                type: "array",
                minItems: lensSearchEnabled
                  ? Math.max(1, treatmentAssignmentsForMouth.length)
                  : 4,
                maxItems: lensSearchEnabled
                  ? Math.max(1, treatmentAssignmentsForMouth.length)
                  : 4,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["production", "lines"],
                  properties: {
                    production: { type: "string", enum: allowedMouthProductions },
                    lines: {
                      type: "array",
                      minItems: plan.moves.length,
                      maxItems: plan.moves.length,
                      items: {
                        type: "object",
                        additionalProperties: false,
                        required: ["order", "text"],
                        properties: {
                          order: { type: "integer", minimum: 1 },
                          text: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
              selectedProduction: {
                type: "string",
                enum: allowedMouthProductions,
              },
              selectionReason: { type: "string", maxLength: 220 },
            }
          : {
              variantsByMove: {
                type: "array",
                minItems: plan.moves.length,
                maxItems: plan.moves.length,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["order", "variants"],
                  properties: {
                    order: { type: "integer", minimum: 1 },
                    variants: {
                      type: "array",
                      minItems: 4,
                      maxItems: 4,
                      items: { type: "string" },
                    },
                  },
                },
              },
            },
      },
    },
  ).catch((error: unknown) => {
    mouthFallbackReason =
      clean((error as { message?: unknown })?.message) ||
      "mouth_model_failed";
    return {
      text: buildDeterministicMouthFallback(
        plan,
        input.suppliedReality,
        isMemoryMode,
      ),
      model: "deterministic-bare-mouth-fallback",
      provider: "local" as const,
    };
  });

  debug("MOUTH-CANDIDATES", mouthResult.text);

  let parsedMouth = parseJson(mouthResult.text);
  const variantsByOrder = new Map<number, string[]>();

  if (isMemoryMode) {
    if (!Array.isArray(parsedMouth?.productions)) {
      mouthFallbackReason =
        mouthFallbackReason ||
        "QRE MEMORY Mouth contract invalid: production-major productions are required";
      parsedMouth = parseJson(
        buildDeterministicMouthFallback(
          plan,
          input.suppliedReality,
          true,
        ),
      );
    }

    for (const beat of plan.moves) {
      variantsByOrder.set(beat.order, ["", "", "", ""]);
    }

    const rawProductions = Array.isArray(parsedMouth?.productions)
      ? parsedMouth.productions
      : [];
    for (const rawProduction of rawProductions) {
      if (!rawProduction || typeof rawProduction !== "object") continue;
      const productionRecord = rawProduction as Record<string, unknown>;
      const production = clean(productionRecord.production).toUpperCase();
      const variantIndex = ["A", "B", "C", "D"].indexOf(production);
      if (variantIndex < 0 || !Array.isArray(productionRecord.lines)) continue;

      for (const rawLine of productionRecord.lines) {
        if (!rawLine || typeof rawLine !== "object") continue;
        const lineRecord = rawLine as Record<string, unknown>;
        const order = Number(lineRecord.order);
        const text = stripProductionLabel(lineRecord.text);
        if (!Number.isInteger(order) || !text) continue;

        const variants = [...(variantsByOrder.get(order) ?? ["", "", "", ""])];
        while (variants.length < 4) variants.push("");
        variants[variantIndex] = text;
        variantsByOrder.set(order, variants.slice(0, 4));
      }
    }

    // Production D is the deterministic truth control. Mouth may return a D
    // production for contract compatibility, but its wording never competes.
    // The control is rebuilt directly from the supplied evidence so Bare
    // cannot smuggle interpretation, rhetoric, or invented state into reality.
    if (lensSearchEnabled) {
      for (const beat of plan.moves) {
        const variants = [...(variantsByOrder.get(beat.order) ?? ["", "", "", ""])];
        while (variants.length < 4) variants.push("");
        variants[3] = safeFallbackText(beat, input.suppliedReality);
        variantsByOrder.set(beat.order, variants.slice(0, 4));
      }
    }
  } else {
    const rawVariants = Array.isArray(parsedMouth?.variantsByMove)
      ? parsedMouth!.variantsByMove
      : [];

    for (const raw of rawVariants) {
      if (!raw || typeof raw !== "object") continue;
      const record = raw as Record<string, unknown>;
      const order = Number(record.order);
      const variants = Array.isArray(record.variants)
        ? unique(
            record.variants
              .filter((value): value is string => typeof value === "string")
              .map(stripProductionLabel)
              .filter(Boolean),
          ).slice(0, 4)
        : [];

      if (Number.isInteger(order) && variants.length) {
        variantsByOrder.set(order, variants);
      }
    }
  }

  const scenes: Array<AuthorScene & { sourceEventIds: string[] }> = [];
  let memoryRepairModelCalls = 0;
  let selectedMemoryProduction: string | undefined;
  let memoryProductionDiagnostics:
    | Array<{
        production: string;
        accepted: boolean;
        score: number;
        reasons: string[];
        lines: Array<{
          order: number;
          text: string;
          sourceEventIds: string[];
        }>;
      }>
    | undefined;
  const choices: Array<{
    order: number;
    beat: AuthorExperienceMove;
    beatFacts: string[];
    candidates: Array<{ text: string; accepted: boolean; score: number; reasons: string[] }>;
    selected: string;
  }> = [];

  if (isMemoryMode && plan.moves.length > 1) {
    const productions = [0, 1, 2, 3]
      .map((variantIndex) =>
        scoreMemorySequence(
          variantIndex,
          plan,
          variantsByOrder,
          input.suppliedReality,
          input.subject,
          realityDirect,
        ),
      )
      .sort((a, b) => {
        if (a.accepted !== b.accepted) return a.accepted ? -1 : 1;
        return b.score - a.score;
      });

    const selectedProductionRaw = clean(parsedMouth?.selectedProduction).toUpperCase();
    const selectedProductionLetter =
      /^[ABCD]$/.test(selectedProductionRaw)
        ? selectedProductionRaw
        : "";
    const legacySelectedProductionNumber = Number(parsedMouth?.selectedProduction);
    const nominatedVariantIndex = selectedProductionLetter
      ? ["A", "B", "C", "D"].indexOf(selectedProductionLetter)
      : Number.isInteger(legacySelectedProductionNumber)
        ? legacySelectedProductionNumber - 1
        : -1;
    const nominatedAny = nominatedVariantIndex >= 0
      ? productions.find(
          (production) => production.variantIndex === nominatedVariantIndex,
        )
      : undefined;

    let repairedNomination: MemorySequenceCandidate | undefined;

    const repairTarget =
      nominatedAny &&
      nominatedAny.variantIndex < 3 &&
      treatmentByVariantIndex.has(nominatedAny.variantIndex)
        ? nominatedAny
        : productions
            .filter(
              (production) =>
                production.variantIndex < 3 &&
                treatmentByVariantIndex.has(production.variantIndex) &&
                !production.accepted,
            )
            .sort((a, b) => b.score - a.score)[0];

      if (
  lensSearchEnabled &&
  !mouthFallbackReason &&
  repairTarget &&
  !repairTarget.accepted
) {
      const repair = await repairNominatedMemoryProduction({
        production: repairTarget,
        plan,
        suppliedReality: input.suppliedReality,
        subject: input.subject,
        thesis: plan.thesis,
        assignedTreatment: treatmentByVariantIndex.get(repairTarget.variantIndex),
      });
      memoryRepairModelCalls += repair.modelCalls;

      if (repair.replacements.size) {
        const repairedVariantsByOrder = new Map<number, string[]>(
          [...variantsByOrder.entries()].map(([order, variants]) => [
            order,
            [...variants],
          ]),
        );

        for (const [order, replacement] of repair.replacements.entries()) {
          const variants = [...(repairedVariantsByOrder.get(order) ?? [])];
          while (variants.length < 4) variants.push("");
          variants[repairTarget.variantIndex] = replacement;
          repairedVariantsByOrder.set(order, variants);
        }

        const rescored = scoreMemorySequence(
          repairTarget.variantIndex,
          plan,
          repairedVariantsByOrder,
          input.suppliedReality,
          input.subject,
          realityDirect,
        );

        debug("MEMORY-PRODUCTION-REPAIR", {
          production: String.fromCharCode(65 + repairTarget.variantIndex),
          before: repairTarget.lines.map((line) => ({
            text: line.text,
            accepted: line.accepted,
            reasons: line.reasons,
          })),
          replacements: [...repair.replacements.entries()].map(([order, text]) => ({
            order,
            text,
          })),
          after: rescored.lines.map((line) => ({
            text: line.text,
            accepted: line.accepted,
            reasons: line.reasons,
          })),
          accepted: rescored.accepted,
          score: rescored.score,
        });

        if (rescored.accepted) {
          repairedNomination = rescored;
        }
      }
    }

    const nominatedProduction = nominatedAny?.accepted
      ? nominatedAny
      : repairedNomination;
    const acceptedProductions = productions.filter(
      (production) => production.accepted,
    );
    const acceptedExpressiveProductions = lensSearchEnabled
      ? [
          ...acceptedProductions.filter(
            (production) =>
              treatmentByVariantIndex.has(production.variantIndex) &&
              production.variantIndex < 3 &&
              expressiveProductionHasPerceptionDelta(production),
          ),
          ...(repairedNomination &&
          repairedNomination.variantIndex < 3 &&
          expressiveProductionHasPerceptionDelta(repairedNomination)
            ? [repairedNomination]
            : []),
        ]
          .filter(
            (production, index, all) =>
              all.findIndex(
                (candidate) => candidate.variantIndex === production.variantIndex,
              ) === index,
          )
          .sort((a, b) => b.score - a.score)
      : acceptedProductions;
    const topScoringExpressiveProduction = acceptedExpressiveProductions[0];
    const bareFallbackProduction = lensSearchEnabled
      ? acceptedProductions.find((production) => production.variantIndex === 3)
      : undefined;

    // In creative mode, Bare is not a creative competitor. A complete,
    // accepted expressive production must own the result whenever one exists.
    // Bare exists only as the final truth-safe fallback.
    const nominatedExpressiveProduction =
      nominatedProduction &&
      (!lensSearchEnabled ||
        (
          treatmentByVariantIndex.has(nominatedProduction.variantIndex) &&
          nominatedProduction.variantIndex < 3
        ))
        ? nominatedProduction
        : undefined;

    // QRE owns admissibility. Once multiple expressive productions are fully
    // accepted and essentially tied, the model's whole-production nomination
    // becomes useful creative evidence. Do not let thousandths in a mechanical
    // line score pretend to measure conception quality. The model may break a
    // close tie only inside the accepted expressive set; it can never rescue an
    // unsafe/incomplete production or make Bare beat a viable expressive one.
    const CREATIVE_TIE_BAND = 0.02;
    const nominatedNearTop =
      nominatedExpressiveProduction &&
      topScoringExpressiveProduction &&
      topScoringExpressiveProduction.score - nominatedExpressiveProduction.score <= CREATIVE_TIE_BAND
        ? nominatedExpressiveProduction
        : undefined;

    const winner =
      nominatedNearTop ??
      topScoringExpressiveProduction ??
      nominatedExpressiveProduction ??
      bareFallbackProduction;

    selectedMemoryProduction = winner
      ? String.fromCharCode(65 + winner.variantIndex)
      : undefined;
    const effectiveProductions = productions.map((production) =>
      repairedNomination &&
      production.variantIndex === repairedNomination.variantIndex
        ? repairedNomination
        : production,
    );

    memoryProductionDiagnostics = effectiveProductions.map((production) => ({
      production: String.fromCharCode(65 + production.variantIndex),
      accepted: production.accepted,
      score: production.score,
      reasons: [
        ...production.reasons,
        ...(lensSearchEnabled &&
        production.variantIndex < 3 &&
        production.accepted &&
        !expressiveProductionHasPerceptionDelta(production)
          ? ["insufficient-perception-delta"]
          : []),
      ],
      lines: production.lines.map((line) => ({
        order: line.beat.order,
        text: line.text,
        sourceEventIds: [...line.beat.eventIds],
      })),
    }));

    debug("MEMORY-PRODUCTIONS", {
      modelNomination: nominatedVariantIndex >= 0
        ? String.fromCharCode(65 + nominatedVariantIndex)
        : "NONE",
      modelSelectionReason: clean(parsedMouth?.selectionReason),
      winner: winner
        ? String.fromCharCode(65 + winner.variantIndex)
        : "NONE",
      productions: effectiveProductions.map((production) => ({
      production: String.fromCharCode(65 + production.variantIndex),
      accepted: production.accepted,
      score: production.score,
      reasons: [
        ...production.reasons,
        ...(lensSearchEnabled &&
        production.variantIndex < 3 &&
        production.accepted &&
        !expressiveProductionHasPerceptionDelta(production)
          ? ["insufficient-perception-delta"]
          : []),
      ],
      lines: production.lines.map((line) => line.text),
      })),
    });

    for (const [index, beat] of plan.moves.entries()) {
      const beatFacts = beat.eventIds
        .map((id) => input.suppliedReality.find((event) => event.id === id)?.text ?? "")
        .map(clean)
        .filter(Boolean);

      const alternatives = effectiveProductions.map((production) => {
        const line = production.lines[index];
        return {
          text: line?.text ?? "",
          accepted: line?.accepted ?? false,
          score: line?.score ?? 0,
          reasons: line?.reasons ?? ["missing-production-line"],
        };
      });

      const winnerLine = winner?.lines[index];
      const selectedText = winner
        ? winnerLine?.text ?? ""
        : safeFallbackText(beat, input.suppliedReality);

      debug(`MOUTH-BEAT-${beat.order}-CHOICE`, {
        beat,
        beatFacts,
        candidates: alternatives,
        selectedProduction: winner
          ? String.fromCharCode(65 + winner.variantIndex)
          : "FACT-FALLBACK",
        selected: selectedText || "FACT-FALLBACK",
      });

      choices.push({
        order: beat.order,
        beat,
        beatFacts,
        candidates: alternatives,
        selected: selectedText,
      });

      if (!selectedText) continue;
      scenes.push({
        text: selectedText,
        kind: beatKind(beat.role, index, plan.moves.length),
        sourceEventIds: beat.eventIds,
      });
    }
  } else {
    const prior: string[] = [];

    for (const [index, beat] of plan.moves.entries()) {
      const beatFacts = beat.eventIds
        .map((id) => input.suppliedReality.find((event) => event.id === id)?.text ?? "")
        .map(clean)
        .filter(Boolean);

      const evaluated = (variantsByOrder.get(beat.order) ?? [])
        .map((text) => {
          const base = variantScore(
            text,
            beatFacts,
            [beat.perceptualMove].map(clean).filter(Boolean),
            input.subject,
            prior,
          );
          const payoffPenalty = memoryPayoffReplayPenalty(
            text,
            beatFacts,
            isMemoryMode,
            index === plan.moves.length - 1,
            beat.perceptualMove,
          );
          return {
            text,
            ...base,
            score: Math.max(0, base.score - payoffPenalty),
            reasons: payoffPenalty > 0
              ? [...base.reasons, "memory-payoff-replay"]
              : base.reasons,
          };
        });

      const ranked = evaluated
        .filter((candidate) => candidate.accepted)
        .sort((a, b) => b.score - a.score);

      const selectedText = ranked[0]?.text ?? safeFallbackText(beat, input.suppliedReality);

      debug(`MOUTH-BEAT-${beat.order}-CHOICE`, {
        beat,
        beatFacts,
        candidates: evaluated,
        selected: selectedText || "FACT-FALLBACK",
      });

      choices.push({
        order: beat.order,
        beat,
        beatFacts,
        candidates: evaluated,
        selected: selectedText,
      });

      if (!selectedText) continue;

      scenes.push({
        text: selectedText,
        kind: beatKind(beat.role, index, plan.moves.length),
        sourceEventIds: beat.eventIds,
      });
      prior.push(selectedText);
    }
  }

  return {
    scenes,
    model: mouthResult.model || (lensSearchEnabled ? lensSearch.model : "") || planResult.model,
    modelCalls:
      2 +
      lensSearch.modelCalls +
      memoryRepairModelCalls,
    diagnostics: {
      plan,
      creativeNotice: lensSearch.creativeNotice,
      storyGravity: lensSearch.storyGravity,
      failureLessons: lensSearch.failureLessons,
      creativeTreatments: treatmentsForMouth,
      creativeSearchFallbackReason: lensSearch.searchFallbackReason,
      rejectedTreatments: lensSearch.rejectedTreatments,
      treatmentSetAssessment: lensSearch.treatmentSetAssessment,
      productionContractComplete: {
        creativeSetComplete:
          lensSearch.treatmentSetAssessment.creativeSetComplete,
        renderable: lensSearch.treatmentSetAssessment.renderable,
      },
      variantsByMove: [...variantsByOrder.entries()]
        .sort(([a], [b]) => a - b)
        .map(([order, variants]) => ({ order, variants })),
      variantsByBeat: [...variantsByOrder.entries()]
        .sort(([a], [b]) => a - b)
        .map(([order, variants]) => ({ order, variants })),
      choices,
      selectedProduction: selectedMemoryProduction,
      mouthFallback: mouthFallbackReason
        ? {
            reason: mouthFallbackReason,
            production: selectedMemoryProduction ?? "D",
          }
        : undefined,
      memoryProductions: memoryProductionDiagnostics,
    },
  };
}
