import type { AuthorDomainContext, AuthorScene } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import type { AuthorCreativeDiscovery } from "./authorCreativeDiscovery.js";
import { evaluateAuthorCut } from "./authorCutFloor.js";
import { QRE_CREATIVE_OPERATING_DOCTRINE } from "./authorCreativeDoctrine.js";

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

const DIRECT_CREATIVE_AUTHOR_EXPERIMENT_FLAG =
  "QRE_AUTHOR_DIRECT_CREATIVE_EXPERIMENT";

function directCreativeAuthorExperimentEnabled(): boolean {
  return process.env[DIRECT_CREATIVE_AUTHOR_EXPERIMENT_FLAG] === "true";
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

export type AuthorBeatRole = "HOOK" | "BUILD" | "TURN" | "PAYOFF";

export type AuthorSemanticBeat = {
  order: number;
  role: AuthorBeatRole;
  eventIds: string[];
  attention: string;
  change: string;
};

export type AuthorSemanticPlan = {
  thesis: string;
  beats: AuthorSemanticBeat[];
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

export type AuthorProductionLetter = "A" | "B" | "C" | "D";

export type AuthorMemoryMouthLine = {
  order: number;
  text: string;
  sourceEventIds: string[];
};

export type AuthorMemoryMouthProduction = {
  production: AuthorProductionLetter;
  lines: AuthorMemoryMouthLine[];
};

export type AuthorDirectTextProduction = {
  production: AuthorProductionLetter;
  lines: Array<{
    order: number;
    text: string;
  }>;
};

export type AuthorDirectProvenanceAssignment = {
  production: AuthorProductionLetter;
  lines: Array<{
    order: number;
    sourceEventIds: string[];
  }>;
};

export type AuthorCreativeTreatmentMouthAssignment =
  Omit<AuthorCreativeTreatmentAssignment, "semanticMechanic"> & {
    production: AuthorProductionLetter;
    semanticMechanic?: string;
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
    /\b(?:same|again|returned|return|repeated|recurring|every|sundays?|weekly|back)\b/i.test(text)
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
    /\b(?:same|again|returned|return|repeated|recurring|every|weekly|back)\b/i.test(supplied);

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
  treatment: Pick<AuthorCreativeTreatmentAssignment, "id">,
): AuthorProductionLetter {
  const match = clean(treatment.id).match(/(\d+)/);
  const index = match ? Number(match[1]) : 1;
  if (index === 2) return "B";
  if (index === 3) return "C";
  if (index === 4) return "D";
  return "A";
}

function treatmentVariantIndex(
  treatment: Pick<AuthorCreativeTreatmentAssignment, "id">,
): number {
  return ["A", "B", "C", "D"].indexOf(treatmentProductionLetter(treatment));
}

export function sanitizeAuthorMouthTreatmentAssignments(
  assignments: readonly AuthorCreativeTreatmentMouthAssignment[],
): AuthorCreativeTreatmentMouthAssignment[] {
  return assignments.map((assignment) => {
    const { semanticMechanic, ...rest } = assignment;
    if (assignment.production === "D") {
      return {
        ...rest,
        semanticMechanic: clean(semanticMechanic) || "NONE",
      };
    }

    return rest;
  });
}

export function authorMouthCreativeTreatmentPayload(
  assignments: readonly AuthorCreativeTreatmentMouthAssignment[],
): Array<Record<string, unknown>> {
  return assignments.map((assignment) => ({
    production: assignment.production,
    ...(clean(assignment.semanticMechanic)
      ? { semanticMechanic: assignment.semanticMechanic }
      : {}),
    sourceCandidateId: assignment.sourceCandidateId,
    sourceRelation: assignment.sourceRelation,
    evidenceEventIds: assignment.evidenceEventIds,
    creativePressure: assignment.creativePressure,
    hiddenInference: assignment.hiddenInference,
    treatment: assignment.treatment,
    perceptionDelta: assignment.perceptionDelta,
    expressiveBehaviors: assignment.expressiveBehaviors,
    intensity: assignment.intensity,
  }));
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
    [/rendering direction/i, "semantic treatment -> presentation direction", "Creative Search chooses meaning and language behavior; camera, editing, staging, sound, and rendering stay outside Author."],
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
  plan: AuthorSemanticPlan;
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
          "Reality is evidence for thought.",
          "Return three independent private conceptions that become possible because the supplied reality was noticed.",
          "Do not describe the evidence. Do not explain what the evidence means. Do not translate evidence into a conceptual synonym or abstraction.",
          "Think because of the evidence, then give the thought.",
          "The conception must add a perception that was not already contained in the supplied fact wording.",
          "One supplied atom may support an entire conception. Unused supplied facts are completely legal.",
          "The three conceptions do not need to divide or collectively cover the supplied reality. Multiple conceptions may use the same evidence.",
          "evidenceEventIds are provenance only. Choose them because they licensed the thought, not because events need coverage. They are not output slots, rewrite assignments, coverage obligations, or public representation requirements.",
          "Invent perception, attitude, implication, metaphorical thought, judgment, humor, or recontextualization freely. Do not invent concrete occurrence.",
          "Do not invent people, objects, places, physical actions, sensory facts, measurements, motives, outcomes, recurrence, physical conditions, or any new concrete occurrence.",
          "Do not return observation, meaning, interpretation, relation, rationale, explanation, theme, mechanic, lens, treatment instructions, story, arc, or public prose.",
          "Protect strange thinking; police factual invention later.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUBJECT: input.subject,
          SUPPLIED_REALITY: creativeEvidenceProjection(input.suppliedReality),
          REQUESTED_LENS: requestedLens || undefined,
          instruction:
            "Return exactly three independent notices. Each notice must contain only conception and evidenceEventIds. Give the thought, not a description, explanation, observation, meaning, interpretation, relation, rationale, theme, mechanic, lens, or semantic translation of the evidence. The notices do not owe collective coverage and may reuse the same evidence when the conceptions are genuinely different. Do not return story structure, latent relations, treatments, hidden inference, perception deltas, expressive behavior menus, or narrative instructions.",
        }),
      },
    ],
    "json",
    {
      numPredict: 520,
      temperature: 0.98,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["notices"],
        properties: {
          notices: {
            type: "array",
            minItems: 3,
            maxItems: 3,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["evidenceEventIds", "conception"],
              properties: {
                evidenceEventIds: {
                  type: "array",
                  minItems: 1,
                  maxItems: 16,
                  items: { type: "string", maxLength: 64 },
                },
                conception: { type: "string" },
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
  // AUTO Creative Search no longer asks the model to invent story structure.
  // Keep deterministic gravity only as legacy transport/provenance for downstream code.
  const storyGravity: AuthorStoryGravity = fallbackGravity;

  const rawNotices = Array.isArray(parsedLens?.notices) ? parsedLens.notices : [];
  const parseRejectedTreatments: Array<{
    treatment: AuthorCreativeTreatment;
    reason: string;
  }> = [];
  const latentRelations: AuthorCreativeNotice["latentRelations"] = [];
  const modelTreatments: AuthorCreativeTreatment[] = rawNotices
    .map((value, index): AuthorCreativeTreatment | undefined => {
      if (!value || typeof value !== "object") return undefined;
      const record = value as Record<string, unknown>;
      const conception = clean(record.conception);
      const evidenceEventIds = Array.isArray(record.evidenceEventIds)
        ? unique(
            record.evidenceEventIds
              .filter((id): id is string => typeof id === "string")
              .map(clean)
              .filter((id) => input.suppliedReality.some((event) => clean(event.id) === id)),
          )
        : [];
      if (!conception || !evidenceEventIds.length) return undefined;
      const sourceRelation = "model-selected evidence provenance";

      latentRelations.push({
        relation: sourceRelation,
        evidenceEventIds,
      });

      return {
        id: `treatment-${index + 1}`,
        sourceCandidateId: `notice[${index}]`,
        sourceRelation,
        evidenceEventIds,
        creativePressure: conception,
        hiddenInference: "",
        treatment: conception,
        perceptionDelta: conception,
        expressiveBehaviors: ["notice"],
        intensity: "MEDIUM",
      };
    })
    .filter((value): value is AuthorCreativeTreatment => Boolean(value))
    .slice(0, 3);

  const creativeNotice: AuthorCreativeNotice = {
    latentRelations,
  };

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

function normalizeRole(value: unknown, index: number, total: number): AuthorBeatRole {
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
): AuthorSemanticPlan | undefined {
  const rawBeats = Array.isArray(value?.beats) ? value!.beats : [];
  const beats: AuthorSemanticBeat[] = [];

  for (const [index, raw] of rawBeats.entries()) {
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

    beats.push({
      order: beats.length + 1,
      role: normalizeRole(record.role, index, rawBeats.length),
      eventIds,
      attention: clean(record.attention),
      change: clean(record.change),
    });
  }

  if (!beats.length) return undefined;

  return {
    thesis: clean(value?.thesis),
    beats,
  };
}

function enforceMemoryStructure(
  plan: AuthorSemanticPlan,
  selectedEvidence: readonly AuthorCreativeEvent[],
): AuthorSemanticPlan {
  if (!selectedEvidence.length) return plan;

  const selectedIds = selectedEvidence.map((event) => clean(event.id));
  const selectedSet = new Set(selectedIds);
  const covered = new Set(
    plan.beats
      .flatMap((beat) => beat.eventIds)
      .map(clean)
      .filter((id) => selectedSet.has(id)),
  );

  const completeCoverage = selectedIds.every((id) => covered.has(id));
  const sourcePlan = completeCoverage
    ? plan
    : {
        ...plan,
        beats: selectedEvidence.map((event, index) => ({
          order: index + 1,
          role: "BUILD" as AuthorBeatRole,
          eventIds: [event.id],
          attention: "",
          change: "",
        })),
      };

  return {
    ...sourcePlan,
    beats: sourcePlan.beats.map((beat, index, all) => ({
      ...beat,
      order: index + 1,
      role:
        index === 0
          ? "HOOK"
          : index === all.length - 1
            ? "PAYOFF"
            : beat.role === "TURN"
              ? "TURN"
              : "BUILD",
    })),
  };
}

function fallbackPlan(
  events: readonly AuthorCreativeEvent[],
  discovery: AuthorCreativeDiscovery,
): AuthorSemanticPlan {
  const selected = new Set(discovery.selected.evidenceEventIds);
  const preferred = events.filter((event) => selected.has(event.id));
  const source = preferred.length ? preferred : [...events];
  const limited = source;

  return {
    thesis:
      discovery.selected.id === "reality-direct"
        ? "Use supplied reality directly."
        : discovery.selected.perception || discovery.selected.relationship,
    beats: limited.map((event, index) => ({
      order: index + 1,
      role:
        index === 0
          ? "HOOK"
          : index === limited.length - 1
            ? "PAYOFF"
            : "BUILD",
      eventIds: [event.id],
      attention: "Carry this supplied evidence clearly into the experience.",
      change: event.text,
    })),
  };
}

function beatKind(role: AuthorBeatRole, index: number, total: number): AuthorScene["kind"] {
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
  plan: AuthorSemanticPlan,
  suppliedReality: readonly AuthorCreativeEvent[],
): string | undefined {
  if (!clean(text)) return undefined;

  const establishedIds = new Set(
    plan.beats
      .slice(0, beatIndex + 1)
      .flatMap((beat) => beat.eventIds)
      .map(clean),
  );
  const futureIds = new Set(
    plan.beats
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
  const anchors: string[] = [];

  for (const match of text.matchAll(/\b(\d{1,2}):([0-5]\d)\s*(am|pm|hours?)?\b/g)) {
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const suffix = clean(match[3]).toLowerCase();

    if (suffix === "am" || suffix === "pm") {
      if (hour < 1 || hour > 12) continue;
      if (suffix === "am") hour = hour === 12 ? 0 : hour;
      if (suffix === "pm") hour = hour === 12 ? 12 : hour + 12;
    } else if (hour > 23) {
      continue;
    }

    anchors.push(`clock:${hour}:${String(minute).padStart(2, "0")}`);
  }

  return anchors;
}

function exactPercentAnchors(value: string): string[] {
  return [
    ...clean(value).matchAll(/\b\d+(?:\.\d+)?%/g),
  ].map((match) => `percent:${match[0]}`);
}

function inventedOperationalAnchorReason(
  text: string,
  suppliedReality: readonly AuthorCreativeEvent[],
): string | undefined {
  const suppliedText = suppliedReality.map((event) => clean(event.text)).join(" ");
  const suppliedAnchors = new Set([
    ...canonicalClockAnchors(suppliedText),
    ...exactPercentAnchors(suppliedText),
  ]);
  const candidateAnchors = [
    ...canonicalClockAnchors(text),
    ...exactPercentAnchors(text),
  ];

  const invented = candidateAnchors.filter((anchor) => !suppliedAnchors.has(anchor));
  return invented.length
    ? `invented-operational-anchor: ${invented.slice(0, 3).join(", ")}`
    : undefined;
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

  // Variable-length expressive productions may legitimately be one perceptual
  // hit. Coverage is D's job; A/B/C only need one materially transformed line.
  return materiallyTransformedLines >= 1;
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
  plan: AuthorSemanticPlan,
  events: readonly AuthorCreativeEvent[],
  discovery: AuthorCreativeDiscovery,
): AuthorSemanticPlan {
  const selected = discovery.selected;
  const allowEvidenceCallback = discovery.experienceShape.some((hint) =>
    /callback|recurrence|repetition|echo/i.test(clean(hint)),
  );
  const seenEventIds = new Set<string>();
  const uniquePlanBeats = plan.beats
    .map((beat) => ({
      ...beat,
      eventIds: beat.eventIds.filter((id) => {
        const key = clean(id);
        if (allowEvidenceCallback) return true;
        if (seenEventIds.has(key)) return false;
        seenEventIds.add(key);
        return true;
      }),
    }))
    .filter((beat) => beat.eventIds.length > 0);
  const planWithUniqueEvidence = {
    ...plan,
    beats: uniquePlanBeats,
  };
  const approvedMeaning = clean(selected.perception || selected.relationship);
  const approvedRelation = clean(selected.relationship);
  const realityDirect = clean(selected.id).toLowerCase() === "reality-direct";

  if (realityDirect) {
    return {
      thesis: "Use supplied reality directly.",
      beats: planWithUniqueEvidence.beats.map((beat) => ({
        ...beat,
        attention: beat.eventIds
          .map((id) => events.find((event) => event.id === id)?.text ?? "")
          .map(clean)
          .filter(Boolean)
          .join(" | "),
        change: "Advance the supplied reality directly; the creative work is perceptual rather than factual.",
      })),
    };
  }

  const authorizedEventIds = new Set(
    (
      discovery.playableEventIds.length
        ? discovery.playableEventIds
        : selected.evidenceEventIds
    ).map(clean).filter(Boolean),
  );

  const scopedBeats = planWithUniqueEvidence.beats
    .map((beat) => ({
      ...beat,
      eventIds: beat.eventIds.filter((id) => authorizedEventIds.has(clean(id))),
    }))
    .filter((beat) => beat.eventIds.length > 0);

  const beats = scopedBeats.length
    ? scopedBeats
    : fallbackPlan(
        events.filter((event) => authorizedEventIds.has(clean(event.id))),
        discovery,
      ).beats;

  return {
    thesis: approvedMeaning || approvedRelation || "Approved grounded perception.",
    beats: beats.map((beat, index) => {
      const isFirst = index === 0;
      const isLast = index === beats.length - 1;
      const attention = beat.eventIds
        .map((id) => events.find((event) => event.id === id)?.text ?? "")
        .map(clean)
        .filter(Boolean)
        .join(" | ");

      const change = beats.length === 1
        ? approvedMeaning || approvedRelation || "Realize this supplied evidence."
        : isFirst
          ? "Establish only this beat's supplied evidence. Do not import later evidence or state the full relation yet."
          : isLast
            ? approvedMeaning || approvedRelation || "Land the approved relation using only this beat and prior established evidence."
            : "Advance the approved relation using only this beat and already-established prior evidence. Do not import later evidence.";

      return {
        ...beat,
        order: index + 1,
        attention,
        change,
      };
    }),
  };
}

function ensurePostLockMemoryCanvas(
  plan: AuthorSemanticPlan,
  selectedEvidence: readonly AuthorCreativeEvent[],
): AuthorSemanticPlan {
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
    order: number;
    sourceEventIds: string[];
    beat?: AuthorSemanticBeat;
    beatFacts: string[];
    semanticMove: string;
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
  plan: AuthorSemanticPlan,
  variantsByOrder: Map<number, string[]>,
  suppliedReality: readonly AuthorCreativeEvent[],
  subject: string,
  realityDirect = false,
): MemorySequenceCandidate {
  const prior: string[] = [];
  const lines = plan.beats.map((beat, index) => {
    const beatFacts = beat.eventIds
      .map((id) => suppliedReality.find((event) => event.id === id)?.text ?? "")
      .map(clean)
      .filter(Boolean);
    const text = clean(variantsByOrder.get(beat.order)?.[variantIndex] ?? "");
    const base = variantScore(
      text,
      beatFacts,
      [beat.change].map(clean).filter(Boolean),
      subject,
      prior,
      !realityDirect,
      variantIndex === 3,
    );
    const payoffPenalty = memoryPayoffReplayPenalty(
      text,
      beatFacts,
      true,
      index === plan.beats.length - 1,
      beat.change,
    );
    const dropsSpecificTimeAnchor =
      variantIndex === 3 && !preservesSpecificTemporalAnchor(text, beatFacts);
    const futureLeakReason =
      variantIndex < 3
        ? futureEvidenceLeakReason(text, index, plan, suppliedReality)
        : undefined;
    const operationalAnchorFailure =
      variantIndex < 3
        ? inventedOperationalAnchorReason(text, suppliedReality)
        : undefined;
    const line = {
      order: beat.order,
      sourceEventIds: [...beat.eventIds],
      beat,
      beatFacts,
      semanticMove: beat.change,
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

  const usedLines = lines.filter((line) => Boolean(line.text));
  const acceptedLines = usedLines.filter((line) => line.accepted);
  const coverage = plan.beats.length
    ? acceptedLines.length / plan.beats.length
    : 0;
  const meanScore = acceptedLines.length
    ? acceptedLines.reduce((sum, line) => sum + line.score, 0) / acceptedLines.length
    : 0;
  const normalizedLines = usedLines
    .map((line) => clean(line.text).toLowerCase())
    .filter(Boolean);
  const uniqueRatio = normalizedLines.length
    ? new Set(normalizedLines).size / normalizedLines.length
    : 0;
  const payoff = variantIndex === 3
    ? (lines.length ? lines[lines.length - 1] : undefined)
    : [...usedLines].reverse().find((line) => line.accepted);
  const payoffStrength = payoff?.accepted ? payoff.score : 0;
  const payoffDropsSpecificTime = Boolean(
    variantIndex === 3 &&
    payoff &&
    !preservesSpecificTemporalAnchor(payoff.text, payoff.beatFacts),
  );
  const rejectedUsedLines = usedLines.length - acceptedLines.length;
  const expressiveHasMaterial = variantIndex < 3 && usedLines.length > 0;
  const bareComplete = variantIndex === 3 && coverage === 1;

  const score = Math.max(
    0,
    meanScore * 0.65 +
      payoffStrength * 0.2 +
      uniqueRatio * 0.15 -
      rejectedUsedLines * 0.2,
  );

  const reasons: string[] = [];
  if (variantIndex === 3 && coverage < 1) reasons.push("incomplete-sequence");
  if (variantIndex < 3 && !usedLines.length) reasons.push("empty-production");
  if (rejectedUsedLines > 0) reasons.push("rejected-used-line");
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
    accepted:
      variantIndex === 3
        ? bareComplete && !payoffDropsSpecificTime
        : expressiveHasMaterial && rejectedUsedLines === 0,
    score: Number(score.toFixed(3)),
    reasons,
  };
}

function memoryLineKind(index: number, total: number): AuthorScene["kind"] {
  if (total <= 1) return "line";
  if (index === 0) return "hook";
  if (index === total - 1) return "payoff";
  return "line";
}

function factsForEventIds(
  ids: readonly string[],
  suppliedReality: readonly AuthorCreativeEvent[],
): string[] {
  const allowed = new Set(unique(ids));
  return suppliedReality
    .filter((event) => allowed.has(clean(event.id)))
    .map((event) => clean(event.text))
    .filter(Boolean);
}

function treatmentAuthority(
  treatment?: AuthorCreativeTreatmentMouthAssignment,
): string[] {
  if (!treatment) return [];
  const mechanic = clean(treatment.semanticMechanic);
  return unique([
    mechanic && mechanic !== "NONE" ? mechanic : "",
    treatment.sourceRelation,
    treatment.creativePressure,
    treatment.hiddenInference,
    treatment.treatment,
    treatment.perceptionDelta,
    ...treatment.expressiveBehaviors,
  ]);
}

function scoreExpressiveMemoryProduction(
  variantIndex: number,
  mouthLines: readonly AuthorMemoryMouthLine[],
  suppliedReality: readonly AuthorCreativeEvent[],
  subject: string,
  treatment?: AuthorCreativeTreatmentMouthAssignment,
  realityDirect = false,
): MemorySequenceCandidate {
  const prior: string[] = [];
  const semanticAuthority = treatmentAuthority(treatment);
  const lines = [...mouthLines]
    .sort((a, b) => a.order - b.order)
    .map((mouthLine, index) => {
      const sourceEventIds = unique(mouthLine.sourceEventIds)
        .filter((id) => suppliedReality.some((event) => clean(event.id) === id));
      const beatFacts = factsForEventIds(sourceEventIds, suppliedReality);
      const base = variantScore(
        mouthLine.text,
        beatFacts,
        semanticAuthority,
        subject,
        prior,
        !realityDirect,
        false,
      );
      const operationalAnchorFailure =
        inventedOperationalAnchorReason(mouthLine.text, suppliedReality);
      const accepted =
        base.accepted &&
        sourceEventIds.length > 0 &&
        !operationalAnchorFailure;
      const line = {
        order: Number.isInteger(mouthLine.order) ? mouthLine.order : index + 1,
        sourceEventIds,
        beatFacts,
        semanticMove: semanticAuthority.join(" | "),
        text: clean(mouthLine.text),
        ...base,
        accepted,
        score: operationalAnchorFailure ? 0 : base.score,
        reasons: [
          ...base.reasons,
          ...(sourceEventIds.length ? [] : ["missing-source-event-ids"]),
          ...(operationalAnchorFailure ? [operationalAnchorFailure] : []),
        ],
      };
      if (line.text) prior.push(line.text);
      return line;
    });

  const usedLines = lines.filter((line) => Boolean(line.text));
  const acceptedLines = usedLines.filter((line) => line.accepted);
  const meanScore = acceptedLines.length
    ? acceptedLines.reduce((sum, line) => sum + line.score, 0) / acceptedLines.length
    : 0;
  const normalizedLines = usedLines
    .map((line) => clean(line.text).toLowerCase())
    .filter(Boolean);
  const uniqueRatio = normalizedLines.length
    ? new Set(normalizedLines).size / normalizedLines.length
    : 0;
  const rejectedUsedLines = usedLines.length - acceptedLines.length;
  const score = Math.max(
    0,
    meanScore * 0.82 +
      uniqueRatio * 0.18 -
      rejectedUsedLines * 0.2,
  );

  const reasons: string[] = [];
  if (!usedLines.length) reasons.push("empty-production");
  if (rejectedUsedLines > 0) reasons.push("rejected-used-line");
  if (uniqueRatio < 1) reasons.push("repeated-line");

  return {
    variantIndex,
    lines,
    accepted: usedLines.length > 0 && rejectedUsedLines === 0,
    score: Number(score.toFixed(3)),
    reasons,
  };
}

async function repairNominatedMemoryProduction(input: {
  production: MemorySequenceCandidate;
  plan: AuthorSemanticPlan;
  suppliedReality: readonly AuthorCreativeEvent[];
  subject: string;
  thesis: string;
  assignedTreatment?: AuthorCreativeTreatmentMouthAssignment;
}): Promise<{
  replacements: Map<number, string>;
  model: string;
  modelCalls: number;
}> {
  const failed = input.production.lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => clean(line.text) && !line.accepted);

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
          "You are QRE Memory Production Repair.",
          ...QRE_CREATIVE_OPERATING_DOCTRINE,
          "A complete creative production already exists. Restore failed cuts without weakening the conception.",
          "PRESERVE THE CONCEPTION. PRESERVE THE REALITY. RECOVER THE ENERGY.",
          "The supplied reality is the whole available world. Repair may change expression, rhythm, and compression, but every factual implication must remain inside supplied evidence and prior established cuts.",
          "A failed cut may not borrow evidence from a later beat. Keep each replacement inside its own suppliedEvidence plus prior established evidence. Future facts must stay future.",
          "Preserve the creative pressure and its rhetorical world. Mission/game/system language may include fictional roles, assignments, directives, sectors, objectives, procedures, verdicts, or commands when the repaired sequence clearly reads as a creative frame rather than documentary fact. Police literal reality, not imaginative vocabulary.",
          "Use the assigned treatment's perceptionDelta and expressiveBehaviors as repair authority. Do not invent a new treatment and do not flatten the cut into bare fact unless no grounded expression of the conception remains.",
          "QRE makes the meaning felt and implied, not explained. A repaired cut is a hit, not prose: compress until removing another word would weaken meaning, rhythm, character, or surprise, then stop.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUBJECT: input.subject,
          APPROVED_THESIS: input.thesis,
          ASSIGNED_TREATMENT: input.assignedTreatment,
          FULL_PRODUCTION: input.production.lines.map((line, index) => ({
            order: line.order,
            text: line.text,
            accepted: line.accepted,
            reasons: line.reasons,
            suppliedEvidence: line.beatFacts,
            sourceEventIds: line.sourceEventIds,
            semanticMove: line.semanticMove,
            keepExactly: line.accepted,
            priorLines: input.production.lines
              .slice(0, index)
              .map((prior) => prior.text)
              .filter(Boolean),
          })),
          FAILED_BEATS: failed.map(({ line }) => ({
            order: line.order,
            rejectedText: line.text,
            reasons: line.reasons,
            suppliedEvidence: line.beatFacts,
            sourceEventIds: line.sourceEventIds,
            semanticMove: line.semanticMove,
          })),
          instruction:
            "Repair only FAILED_BEATS. Preserve the assigned conception, perception delta, voice, and supplied reality boundary. A replacement may leave its originating action or change completely unsaid; preserve grounding, not paraphrase. Make the replacement a perceptual hit rather than an explanation.",
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
  const failedOrders = new Set(failed.map(({ line }) => line.order));
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
  beat: AuthorSemanticBeat,
  events: readonly AuthorCreativeEvent[],
): string {
  return (
    beat.eventIds
      .map((id) => events.find((event) => event.id === id)?.text ?? "")
      .map(clean)
      .find(Boolean) ?? ""
  );
}

type AuthorMemorySelectionChoice = {
  order: number;
  beat: AuthorSemanticBeat;
  beatFacts: string[];
  candidates: Array<{ text: string; accepted: boolean; score: number; reasons: string[] }>;
  selected: string;
};

export type AuthorMemoryProductionEvaluation = {
  scenes: Array<AuthorScene & { sourceEventIds: string[] }>;
  selectedProduction?: AuthorProductionLetter;
  productions: Array<{
    production: AuthorProductionLetter;
    accepted: boolean;
    score: number;
    reasons: string[];
    lines: Array<{
      order: number;
      text: string;
      sourceEventIds: string[];
    }>;
  }>;
  choices: AuthorMemorySelectionChoice[];
};

function productionLetterFromVariantIndex(index: number): AuthorProductionLetter {
  return (["A", "B", "C", "D"][index] ?? "D") as AuthorProductionLetter;
}

function deterministicBareVariantsByOrder(
  plan: AuthorSemanticPlan,
  suppliedReality: readonly AuthorCreativeEvent[],
): Map<number, string[]> {
  const variantsByOrder = new Map<number, string[]>();
  for (const beat of plan.beats) {
    variantsByOrder.set(beat.order, ["", "", "", safeFallbackText(beat, suppliedReality)]);
  }
  return variantsByOrder;
}

function buildMemoryProductionDiagnostics(
  productions: readonly MemorySequenceCandidate[],
  lensSearchEnabled: boolean,
): AuthorMemoryProductionEvaluation["productions"] {
  return productions.map((production) => ({
    production: productionLetterFromVariantIndex(production.variantIndex),
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
      order: line.order,
      text: line.text,
      sourceEventIds: [...line.sourceEventIds],
    })),
  }));
}

function scenesFromMemoryWinner(
  winner: MemorySequenceCandidate | undefined,
  plan: AuthorSemanticPlan,
  suppliedReality: readonly AuthorCreativeEvent[],
): Array<AuthorScene & { sourceEventIds: string[] }> {
  if (!winner) {
    return plan.beats
      .map((beat, index) => ({
        text: safeFallbackText(beat, suppliedReality),
        kind: beatKind(beat.role, index, plan.beats.length),
        sourceEventIds: [...beat.eventIds],
      }))
      .filter((scene) => Boolean(scene.text));
  }

  if (winner.variantIndex < 3) {
    return winner.lines
      .filter((line) => clean(line.text))
      .sort((a, b) => a.order - b.order)
      .map((line, index, all) => ({
        text: line.text,
        kind: memoryLineKind(index, all.length),
        sourceEventIds: [...line.sourceEventIds],
      }));
  }

  return winner.lines
    .filter((line) => clean(line.text))
    .map((line, index) => ({
      text: line.text,
      kind: line.beat
        ? beatKind(line.beat.role, index, winner.lines.length)
        : memoryLineKind(index, winner.lines.length),
      sourceEventIds: [...line.sourceEventIds],
    }));
}

function selectMemoryProductionCandidate(input: {
  plan: AuthorSemanticPlan;
  suppliedReality: readonly AuthorCreativeEvent[];
  subject: string;
  expressiveProductions: readonly AuthorMemoryMouthProduction[];
  treatmentAssignments: readonly AuthorCreativeTreatmentMouthAssignment[];
  selectedProduction?: string;
  lensSearchEnabled: boolean;
  realityDirect: boolean;
}): {
  evaluation: AuthorMemoryProductionEvaluation;
  internalProductions: MemorySequenceCandidate[];
  winner?: MemorySequenceCandidate;
  nominatedAny?: MemorySequenceCandidate;
  nominatedExpressiveProduction?: MemorySequenceCandidate;
} {
  const mouthAssignments = sanitizeAuthorMouthTreatmentAssignments(input.treatmentAssignments);
  const treatmentByVariantIndex = new Map(
    mouthAssignments.map((assignment) => [
      treatmentVariantIndex(assignment),
      assignment,
    ]),
  );
  const productionByVariantIndex = new Map(
    input.expressiveProductions.map((production) => [
      ["A", "B", "C", "D"].indexOf(production.production),
      production,
    ]),
  );
  const expressiveProductions = [0, 1, 2].map((variantIndex) =>
    scoreExpressiveMemoryProduction(
      variantIndex,
      productionByVariantIndex.get(variantIndex)?.lines ?? [],
      input.suppliedReality,
      input.subject,
      treatmentByVariantIndex.get(variantIndex),
      input.realityDirect,
    ),
  );
  const bareProduction = scoreMemorySequence(
    3,
    input.plan,
    deterministicBareVariantsByOrder(input.plan, input.suppliedReality),
    input.suppliedReality,
    input.subject,
    input.realityDirect,
  );
  const productions = [...expressiveProductions, bareProduction]
    .sort((a, b) => {
      if (a.accepted !== b.accepted) return a.accepted ? -1 : 1;
      return b.score - a.score;
    });

  const selectedProductionLetter = clean(input.selectedProduction).toUpperCase();
  const legacySelectedProductionNumber = Number(input.selectedProduction);
  const nominatedVariantIndex = /^[ABCD]$/.test(selectedProductionLetter)
    ? ["A", "B", "C", "D"].indexOf(selectedProductionLetter)
    : Number.isInteger(legacySelectedProductionNumber)
      ? legacySelectedProductionNumber - 1
      : -1;
  const nominatedAny = nominatedVariantIndex >= 0
    ? productions.find((production) => production.variantIndex === nominatedVariantIndex)
    : undefined;
  const nominatedProduction = nominatedAny?.accepted
    ? nominatedAny
    : undefined;
  const acceptedProductions = productions.filter(
    (production) => production.accepted,
  );
  const acceptedExpressiveProductions = input.lensSearchEnabled
    ? acceptedProductions
        .filter(
          (production) =>
            treatmentByVariantIndex.has(production.variantIndex) &&
            production.variantIndex < 3 &&
            expressiveProductionHasPerceptionDelta(production),
        )
        .sort((a, b) => b.score - a.score)
    : acceptedProductions;
  const topScoringExpressiveProduction = acceptedExpressiveProductions[0];
  const bareFallbackProduction = input.lensSearchEnabled
    ? acceptedProductions.find((production) => production.variantIndex === 3)
    : undefined;
  const nominatedExpressiveProduction =
    nominatedProduction &&
    (!input.lensSearchEnabled ||
      (
        treatmentByVariantIndex.has(nominatedProduction.variantIndex) &&
        nominatedProduction.variantIndex < 3 &&
        expressiveProductionHasPerceptionDelta(nominatedProduction)
      ))
      ? nominatedProduction
      : undefined;
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
  const scenes = scenesFromMemoryWinner(
    winner,
    input.plan,
    input.suppliedReality,
  );
  const choices: AuthorMemorySelectionChoice[] = winner?.variantIndex === 3
    ? input.plan.beats.map((beat, index) => {
        const line = winner.lines[index];
        const beatFacts = factsForEventIds(beat.eventIds, input.suppliedReality);
        return {
          order: beat.order,
          beat,
          beatFacts,
          candidates: [{
            text: line?.text ?? "",
            accepted: line?.accepted ?? false,
            score: line?.score ?? 0,
            reasons: line?.reasons ?? ["missing-production-line"],
          }],
          selected: line?.text ?? "",
        };
      })
    : [];

  return {
    evaluation: {
      scenes,
      selectedProduction: winner
        ? productionLetterFromVariantIndex(winner.variantIndex)
        : undefined,
      productions: buildMemoryProductionDiagnostics(productions, input.lensSearchEnabled),
      choices,
    },
    internalProductions: productions,
    winner,
    nominatedAny,
    nominatedExpressiveProduction,
  };
}

export function evaluateAuthorMemoryProductions(
  input: {
    plan: AuthorSemanticPlan;
    suppliedReality: readonly AuthorCreativeEvent[];
    subject: string;
    expressiveProductions: readonly AuthorMemoryMouthProduction[];
    treatmentAssignments: readonly AuthorCreativeTreatmentMouthAssignment[];
    selectedProduction?: string;
    lensSearchEnabled?: boolean;
    realityDirect?: boolean;
  },
): AuthorMemoryProductionEvaluation {
  return selectMemoryProductionCandidate({
    plan: input.plan,
    suppliedReality: input.suppliedReality,
    subject: input.subject,
    expressiveProductions: input.expressiveProductions,
    treatmentAssignments: input.treatmentAssignments,
    selectedProduction: input.selectedProduction,
    lensSearchEnabled: input.lensSearchEnabled ?? true,
    realityDirect: input.realityDirect ?? false,
  }).evaluation;
}

function directAuthorTreatmentRecords(
  suppliedReality: readonly AuthorCreativeEvent[],
): AuthorCreativeTreatmentAssignment[] {
  const evidenceEventIds = suppliedReality.map((event) => clean(event.id)).filter(Boolean);
  const expressive = (["A", "B", "C"] as const).map((production, index) => ({
    id: `treatment-${index + 1}`,
    semanticMechanic: "NONE",
    sourceCandidateId: `direct-author[${production}]`,
    sourceRelation: "line-owned sourceEventIds supply direct creative provenance",
    evidenceEventIds,
    creativePressure: "direct expression from supplied reality",
    hiddenInference: "",
    treatment: "direct expressive production",
    perceptionDelta: "perception authored directly in the production",
    expressiveBehaviors: ["direct author production"],
    intensity: "MEDIUM" as const,
  }));

  return [
    ...expressive,
    {
      id: "treatment-4",
      semanticMechanic: "NONE",
      sourceCandidateId: "bare",
      sourceRelation: "bare supplied reality",
      evidenceEventIds,
      creativePressure: "BARE",
      hiddenInference: "",
      treatment:
        "NONE / Bare Reality. Present only the supplied facts in their natural sequence with minimal treatment.",
      perceptionDelta: "No added perception; direct supplied reality remains visible as the control.",
      expressiveBehaviors: ["bare reality"],
      intensity: "LIGHT",
    },
  ];
}

function directAuthorTreatmentSearchResult(input: {
  suppliedReality: readonly AuthorCreativeEvent[];
  semanticMechanic: AuthorSemanticMechanicCandidate;
  semanticMechanicCandidates: readonly AuthorSemanticMechanicCandidate[];
}): AuthorCreativeTreatmentSearchResult {
  const acceptedTreatments = directAuthorTreatmentRecords(input.suppliedReality);
  const parsedTreatments = acceptedTreatments.map(({ semanticMechanic, ...treatment }) => {
    void semanticMechanic;
    return treatment;
  });

  return {
    lensSearchEnabled: true,
    lensMode: "AUTO",
    autoBusinessLens: false,
    rawTreatmentResponse: "DIRECT_CREATIVE_AUTHOR_EXPERIMENT",
    model: "direct-creative-author-experiment",
    modelCalls: 0,
    semanticMechanic: input.semanticMechanic,
    semanticMechanicCandidates: [...input.semanticMechanicCandidates],
    creativeNotice: { latentRelations: [] },
    storyGravity: fallbackStoryGravity(input.suppliedReality),
    failureLessons: [],
    parsedTreatments,
    acceptedTreatments,
    rejectedTreatments: [],
    treatmentSetAssessment: assessAuthorCreativeTreatmentSet(parsedTreatments),
  };
}

function sentenceForDirectReality(value: string): string {
  const text = clean(value);
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

export function directCreativeRealityText(
  suppliedReality: readonly AuthorCreativeEvent[],
): string {
  return suppliedReality
    .map((event) => sentenceForDirectReality(event.text))
    .filter(Boolean)
    .join(" ");
}

export function directAuthorAttemptsToProductions(
  value: unknown,
): AuthorDirectTextProduction[] {
  const attemptsValue = value && typeof value === "object"
    ? (value as Record<string, unknown>).attempts
    : undefined;
  const attempts: unknown[] = Array.isArray(attemptsValue) ? attemptsValue : [];
  const productionLetters: AuthorProductionLetter[] = ["A", "B", "C"];

  return attempts
    .slice(0, 3)
    .map((rawAttempt, index): AuthorDirectTextProduction | undefined => {
      if (!rawAttempt || typeof rawAttempt !== "object") return undefined;
      const production = productionLetters[index];
      if (!production) return undefined;
      const text = (rawAttempt as Record<string, unknown>).text;
      if (typeof text !== "string" || !clean(text)) return undefined;

      return {
        production,
        lines: [{ order: 1, text }],
      };
    })
    .filter((production): production is AuthorDirectTextProduction => Boolean(production));
}

export function attachDirectAuthorProvenanceToProductions(input: {
  authoredProductions: readonly AuthorDirectTextProduction[];
  provenanceAssignments: readonly AuthorDirectProvenanceAssignment[];
  suppliedReality: readonly AuthorCreativeEvent[];
}): AuthorMemoryMouthProduction[] {
  const assignmentByLine = new Map<string, string[]>();

  for (const assignment of input.provenanceAssignments) {
    if (!["A", "B", "C"].includes(assignment.production)) continue;
    for (const line of assignment.lines) {
      if (!Number.isInteger(line.order)) continue;
      const sourceEventIds = validStoryEventIds(
        line.sourceEventIds,
        input.suppliedReality,
        32,
      );
      if (!sourceEventIds.length) continue;
      assignmentByLine.set(`${assignment.production}:${line.order}`, sourceEventIds);
    }
  }

  return input.authoredProductions
    .map((production) => ({
      production: production.production,
      lines: production.lines
        .map((line): AuthorMemoryMouthLine | undefined => {
          const sourceEventIds = assignmentByLine.get(`${production.production}:${line.order}`) ?? [];
          if (!sourceEventIds.length) return undefined;
          return {
            order: line.order,
            text: line.text,
            sourceEventIds,
          };
        })
        .filter((line): line is AuthorMemoryMouthLine => Boolean(line)),
    }))
    .filter((production) => production.lines.length > 0);
}

async function assignDirectAuthorProductionProvenance(input: {
  suppliedReality: readonly AuthorCreativeEvent[];
  authoredProductions: readonly AuthorDirectTextProduction[];
}): Promise<{
  productions: AuthorMemoryMouthProduction[];
  model: string;
  modelCalls: number;
}> {
  const result = await localModelGenerate(
    [
      {
        role: "system",
        content: [
          "You are QRE Direct Author Provenance.",
          "A creative Author already wrote immutable A/B/C productions.",
          "Your only job is to attach supplied evidence IDs to each existing line.",
          "Do not rewrite text. Do not repair text. Do not score creativity. Do not select a winner.",
          "Do not assign evidence by line position. Do not require full coverage. Do not assign every event to every line.",
          "Choose only the supplied event IDs that license the already-authored line.",
          "The same event may support multiple lines. Several events may support one line. Unused supplied events are legal.",
          "Return evidence IDs only.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUPPLIED_REALITY: input.suppliedReality,
          AUTHORED_PRODUCTIONS: input.authoredProductions,
          instruction:
            "For each authored line, return the sourceEventIds that license it. Preserve production letters and line orders. Do not include text.",
        }),
      },
    ],
    "json",
    {
      numPredict: 520,
      temperature: 0.12,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["assignments"],
        properties: {
          assignments: {
            type: "array",
            minItems: 3,
            maxItems: 3,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["production", "lines"],
              properties: {
                production: { type: "string", enum: ["A", "B", "C"] },
                lines: {
                  type: "array",
                  minItems: 0,
                  maxItems: 12,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["order", "sourceEventIds"],
                    properties: {
                      order: { type: "integer", minimum: 1 },
                      sourceEventIds: {
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
        },
      },
    },
  );

  const parsed = parseJson(result.text);
  const assignments = Array.isArray(parsed?.assignments)
    ? parsed.assignments
        .map((rawAssignment): AuthorDirectProvenanceAssignment | undefined => {
          if (!rawAssignment || typeof rawAssignment !== "object") return undefined;
          const assignmentRecord = rawAssignment as Record<string, unknown>;
          const production = clean(assignmentRecord.production).toUpperCase();
          if (!["A", "B", "C"].includes(production) || !Array.isArray(assignmentRecord.lines)) {
            return undefined;
          }
          return {
            production: production as AuthorProductionLetter,
            lines: assignmentRecord.lines
              .map((rawLine): AuthorDirectProvenanceAssignment["lines"][number] | undefined => {
                if (!rawLine || typeof rawLine !== "object") return undefined;
                const lineRecord = rawLine as Record<string, unknown>;
                const order = Number(lineRecord.order);
                const sourceEventIds = Array.isArray(lineRecord.sourceEventIds)
                  ? lineRecord.sourceEventIds.filter((id): id is string => typeof id === "string")
                  : [];
                if (!Number.isInteger(order) || !sourceEventIds.length) return undefined;
                return { order, sourceEventIds };
              })
              .filter((line): line is AuthorDirectProvenanceAssignment["lines"][number] => Boolean(line)),
          };
        })
        .filter((assignment): assignment is AuthorDirectProvenanceAssignment => Boolean(assignment))
    : [];

  return {
    productions: attachDirectAuthorProvenanceToProductions({
      authoredProductions: input.authoredProductions,
      provenanceAssignments: assignments,
      suppliedReality: input.suppliedReality,
    }),
    model: result.model,
    modelCalls: 1,
  };
}

async function generateDirectAuthorMemoryProductions(input: {
  subject: string;
  suppliedReality: readonly AuthorCreativeEvent[];
}): Promise<{
  text: string;
  model: string;
  provider: "local";
}> {
  return localModelGenerate(
    [
      {
        role: "system",
        content: [
          "You are the Author.",
          "Here is supplied reality.",
          "Make something of it.",
          "Write three different attempts.",
          "You do not need to use everything.",
          "One detail may be enough.",
          "Most of the supplied reality may remain unused.",
          "The answer length has nothing to do with the number of supplied facts.",
          "Do not retell the facts one by one.",
          "Do not paraphrase each fact into creative-sounding language.",
          "Do not explain your reasoning.",
          "The supplied reality controls what actually happened.",
          "Do not add any new concrete event, action, object, person, place, physical behavior, sensory fact, or outcome.",
          "You may invent what to say about the supplied reality, but not more reality.",
          "Return only three attempts.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUBJECT: input.subject,
          REALITY: directCreativeRealityText(input.suppliedReality),
          instruction:
            "Return exactly three attempts using the required schema.",
        }),
      },
    ],
    "json",
    {
      numPredict: 1050,
      temperature: 0.98,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["attempts"],
        properties: {
          attempts: {
            type: "array",
            minItems: 3,
            maxItems: 3,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["text"],
              properties: {
                text: { type: "string" },
              },
            },
          },
        },
      },
    },
  );
}

function buildDeterministicMouthFallback(
  plan: AuthorSemanticPlan,
  events: readonly AuthorCreativeEvent[],
  memoryMode: boolean,
): string {
  if (memoryMode) {
    return JSON.stringify({
      productions: [
        {
          production: "D",
          lines: plan.beats.map((beat) => ({
            order: beat.order,
            text: safeFallbackText(beat, events),
            sourceEventIds: [...beat.eventIds],
          })),
        },
      ],
      selectedProduction: "D",
      selectionReason:
        "Deterministic Bare Reality selected because Mouth did not return a renderable production.",
    });
  }

  return JSON.stringify({
    variantsByBeat: plan.beats.map((beat) => {
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
    plan: AuthorSemanticPlan;
    creativeNotice: AuthorCreativeNotice;
    storyGravity: AuthorStoryGravity;
    failureLessons: AuthorCreativeFailureLesson[];
    creativeTreatments: AuthorCreativeTreatmentMouthAssignment[];
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
    variantsByBeat: Array<{ order: number; variants: string[] }>;
    choices: Array<{
      order: number;
      beat: AuthorSemanticBeat;
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
  const isMemoryMode = experienceMode === "MEMORY";
  const directCreativeAuthorExperiment =
    isMemoryMode && directCreativeAuthorExperimentEnabled();
  const useDeterministicSparsePlan =
    selectedEvidence.length > 0 && selectedEvidence.length <= 3;
  const useDeterministicRealityDirectMemoryPlan =
    isMemoryMode &&
    realityDirect &&
    selectedEvidence.length > 0;
  const useDeterministicPlan =
    useDeterministicSparsePlan || useDeterministicRealityDirectMemoryPlan;
  const useIdentityClusterPlan =
    useDeterministicSparsePlan &&
    experienceMode === "IDENTITY" &&
    selectedEvidence.length > 1;

  const planResult = useDeterministicPlan
    ? {
        text: "",
        model: "deterministic-sparse-plan",
      }
    : await localModelGenerate(
    [
      {
        role: "system",
        content: [
          "You are QRE Author Structure Planner.",
          "Discovery owns the approved meaning and identifies the playable reality. Your responsibility is evidence grouping and sequence shape.",
          "AUTHORIZED_EVIDENCE is the factual material available to this experience.",
          "Build the strongest sequence from authorized event IDs and preserve the supplied relationships that make the experience meaningful.",
          "Let the material determine the number of beats. A beat may contain one event or several tightly related events when grouping creates a stronger unit of experience.",
          "Compression is structural, not destructive. Grouping changes organization while keeping the selected reality available to realization.",
          "Use sequence to create room for progression, contrast, accumulation, interruption, return, reveal, callback, or payoff when those relationships are supported by the supplied material and approved experience shape.",
          "The plan is structural rather than viewer-facing. Represent what each beat carries through its authorized event IDs.",
          "Every authorized evidence item remains represented in the plan. Supplied recurrence may return when the approved experience shape calls for recurrence, echo, callback, or return.",
          ...(isMemoryMode ? [
            "MEMORY STRUCTURE: shape the supplied lived material so the memory has enough space to be experienced rather than merely summarized.",
            "Preserve meaningful temporal progression, state contrast, duration, recurrence, return, and distinctive moments when they contribute to the approved memory.",
            "A meaningful middle can carry its own structural weight. A later state or return can carry its own structural weight. Let their relationship determine the shape.",
            "Choose the smallest sequence that preserves the full creative potential of the approved memory, with no predetermined beat count.",
          ] : []),
          ...(presentationContext ? [presentationContext] : []),
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUBJECT: input.subject,
          AUTHORIZED_EVIDENCE: selectedEvidence,
          EXPERIENCE_SHAPE: input.creativeDiscovery.experienceShape,
          instruction:
            "Return the strongest structural beat sequence using the authorized evidence IDs. Preserve every authorized evidence item somewhere in the sequence; group related evidence when that strengthens the experience.",
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
        required: ["beats"],
        properties: {
          beats: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["order", "role", "eventIds"],
              properties: {
                order: { type: "integer", minimum: 1 },
                role: { type: "string", enum: ["HOOK", "BUILD", "TURN", "PAYOFF"] },
                eventIds: {
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

  const rawPlan = useIdentityClusterPlan
    ? {
        thesis: selected.perception || selected.relationship,
        beats: [{
          order: 1,
          role: "PAYOFF" as AuthorBeatRole,
          eventIds: selectedEvidence.map((event) => event.id),
          attention: selectedEvidence.map((event) => event.text).join(" | "),
          change: selected.perception || selected.relationship,
        }],
      }
    : useDeterministicPlan
      ? fallbackPlan(selectedEvidence, input.creativeDiscovery)
      : normalizePlan(parseJson(planResult.text), allowedEventIds) ??
      fallbackPlan(input.suppliedReality, input.creativeDiscovery);

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
    mode: useIdentityClusterPlan
      ? "DETERMINISTIC_IDENTITY_CLUSTER"
      : useDeterministicRealityDirectMemoryPlan
        ? "DETERMINISTIC_REALITY_DIRECT_MEMORY"
        : useDeterministicSparsePlan
          ? "DETERMINISTIC_SPARSE"
          : "MODEL_STRUCTURE",
    raw: useDeterministicPlan ? "SKIPPED_MODEL_PLAN" : planResult.text,
    memoryStructureAdjusted:
      isMemoryMode &&
      (
        JSON.stringify(structurallySafePlan.beats.map((beat) => beat.eventIds)) !==
          JSON.stringify(rawPlan.beats.map((beat) => beat.eventIds)) ||
        JSON.stringify(plan.beats.map((beat) => beat.eventIds)) !==
          JSON.stringify(initiallyLockedPlan.beats.map((beat) => beat.eventIds))
      ),
    selectedPlan: plan,
  });

  const requestedLens = clean(input.requestedLens);
  const normalizedRequestedLens = requestedLens.toUpperCase();
  const explicitLensProvided = Boolean(requestedLens);
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
  const lensSearch = directCreativeAuthorExperiment
    ? directAuthorTreatmentSearchResult({
        suppliedReality: input.suppliedReality,
        semanticMechanic,
        semanticMechanicCandidates,
      })
    : await searchAuthorCreativeLensTreatments({
        subject: input.subject,
        suppliedReality: input.suppliedReality,
        plan,
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
  const treatmentsForMouth = lensSearch.acceptedTreatments;
  const expressiveTreatmentsForMouth = treatmentsForMouth.filter((treatment) => !isBareTreatment(treatment));
  const skipExpressiveMouth = lensSearchEnabled && expressiveTreatmentsForMouth.length === 0;
  const creativeSetComplete =
    !lensSearch.lensSearchEnabled ||
    lensSearch.treatmentSetAssessment.creativeSetComplete;
  const runtimeRenderable =
    !lensSearch.lensSearchEnabled ||
    lensSearch.treatmentSetAssessment.renderable;
  const treatmentAssignmentsForMouth: AuthorCreativeTreatmentMouthAssignment[] =
    sanitizeAuthorMouthTreatmentAssignments(
      treatmentsForMouth.map((assignment) => ({
        production: treatmentProductionLetter(assignment),
        ...assignment,
      })),
    ).sort((a, b) => a.production.localeCompare(b.production));
  const treatmentByVariantIndex = new Map(
    treatmentAssignmentsForMouth.map((assignment) => [
      treatmentVariantIndex(assignment),
      assignment,
    ]),
  );

  debug("CREATIVE-LENS-SEARCH", {
    mode: lensMode,
    directCreativeAuthorExperiment,
    directCreativeAuthorExperimentFlag: DIRECT_CREATIVE_AUTHOR_EXPERIMENT_FLAG,
    requestedLens: requestedLens || (autoBusinessLens ? "AUTO" : "NONE"),
    semanticMechanic: lensSearch.semanticMechanic,
    semanticMechanicCandidates,
    lensSearchEnabled,
    rawTreatmentResponse: lensSearch.rawTreatmentResponse,
    searchFallbackReason: lensSearch.searchFallbackReason,
    treatments: treatmentAssignmentsForMouth,
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
  let directAuthorProvenanceModelCalls = 0;
  if (skipExpressiveMouth) {
    mouthFallbackReason = "no viable expressive treatments; skipped Mouth and returned deterministic Bare Reality";
  }
  const mouthResult = directCreativeAuthorExperiment
    ? await generateDirectAuthorMemoryProductions({
        subject: input.subject,
        suppliedReality: input.suppliedReality,
      }).catch((error: unknown) => {
        mouthFallbackReason =
          clean((error as { message?: unknown })?.message) ||
          "direct_creative_author_model_failed";
        return {
          text: buildDeterministicMouthFallback(
            plan,
            input.suppliedReality,
            isMemoryMode,
          ),
          model: "deterministic-bare-direct-author-fallback",
          provider: "local" as const,
        };
      })
    : skipExpressiveMouth
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
          "You receive grounded reality, an approved evidence arrangement, and optionally an assigned creative treatment. Find the strongest perceptual hit the evidence makes possible.",
          "SUPPLIED REALITY IS EVIDENCE, NOT A SCRIPT. A supplied fact gives authority to think from it; it does not require you to restate, encode, symbolize, illustrate, or otherwise represent that fact in public output.",
          "The evidence must support the creative leap. It does not have to appear in the line.",
          "A line may move far away from the wording and surface subject of the fact that inspired it. What must remain fixed is concrete reality, not phrasing, topic, or explicit recoverability.",
          "Concrete reality comes only from supplied evidence. New attitude, implication, metaphor, humor, status, significance, judgment, contrast, and other perception may be authored; new occurrence may not.",
          "Rhetorical transformation is wide open. Metaphor, status, title-like framing, personification, absurd seriousness, game logic, noir pressure, battle pressure, speed, spy logic, romance, horror, ceremony, accusation, evidence language, futuristic language, comedy, understatement, and unnamed expressive grammars are available as perception—not as new world facts.",
          "A rhetorical role can be extreme while the world stays fixed. 'Evidence' can be a way to perceive a supplied bow; it does not create a courtroom. 'Loadout' can frame a supplied object; it does not create a literal game system.",
          "An attempt remains unresolved unless the supplied reality gives its outcome. A supplied emotion or state remains that state rather than becoming an invented bodily action.",
          "Specificity is fuel. Preserve the distinctive facts that make this reality this reality, but do not confuse operational metadata with the creative center.",
          "Operational anchors such as clock time, date, geo, count, quantity, price, and measurement are ordinary supplied reality. Use them when they strengthen the experience, when the user wants them visible, or when they carry useful identity, sequence, proof, place, or meaning. Omit them when they add nothing.",
          "When an operational anchor is used, preserve its supplied value exactly. Never invent or alter an exact time, date, geo point, count, quantity, price, measurement, or other operational fact.",
          "Formatting alone is not the creative move. Logs, timestamps, labels, records, and terse fragments may be part of the creative language, but the production should also create a felt shift in status, implication, consequence, relationship, tension, humor, threat, or another perception.",
          "Do not mistake list cadence, noun fragments, repeated task words, or timestamp formatting for authorship. The creative move must come from a relationship in the supplied reality.",
          "QRE makes the meaning felt and implied, not explained. A cut is a hit, not prose. Compress until removing another word would weaken the meaning, rhythm, character, or surprise. Stop there.",
          "BUILD THE WHOLE STRANGE WORLD PRIVATELY. REALIZE ONLY WHAT MAKES THAT WORLD FELT.",
          "QRE IS NOT A STORYTELLER. Do not narrate the supplied sequence, explain each event, or turn every beat into prose.",
          "PUBLIC OUTPUT IS PERCEPTION, NOT STORY: attention, implication, compression, recontextualization, then stop.",
          "ATTENTION, NOT COVERAGE. An expressive production may use one beat, several beats, or all beats. Unused supplied facts are legal and remain preserved in provenance.",
          "A single word, fragment, contrast, implication, or cut may carry the experience when that is the strongest realization.",
          "For an intentionally unused beat, return its order with text as an empty string. Empty means deliberate omission, not failure.",
          "Do not add explanation after the hit lands. Do not expand a conception merely to demonstrate it.",
          "The assigned creative pressure is internal creative physics, not a vocabulary pack. Let it change status, rhythm, consequence, implication, and perception before it changes surface nouns.",
          "Teach taste, not length. Let the idea determine the line. A line may be tiny, medium, or longer when its rhythm, turn, character, tension, surprise, or payoff earns the space.",
          "Prefer impact over explanation. Do not shorten merely to be short, and do not lengthen merely to explain.",
          "Creative precision is the target: every word should strengthen the perception, voice, rhythm, or consequence of the supplied reality.",
          "Use world-specific language when it makes the frame snap into focus, but do not mechanically repeat the same genre vocabulary across every cut.",
          "A strong production may use fragments, full sentences, abrupt hits, or a longer turn. Vary form naturally according to what the experience needs.",
          "If every line announces the creative frame, trust implication more. If removing the frame leaves ordinary receipt language, push the perception harder.",
          "Let status, consequence, double meaning, contrast, callback, implication, weirdness, and payoff carry the world without explaining it.",
          "Do not explain the lens or summarize the meaning. Make the receiver feel the creative read through the writing itself.",
          "Do not preserve a fact by disguising it as a synonym, symbol, physical manifestation, or clever restatement. If the strongest perception leaves the originating fact unsaid, leave it unsaid.",
          "The receiver does not need to reconstruct every supplied action or change from expressive output. The factual record remains preserved in provenance; Mouth selects what was worth noticing.",
          "STORY GRAVITY is legacy evidence/provenance transport, not creative instruction. Do not obey its arc, escalation, sealing-detail, endpoint, or dependency vocabulary as a writing pattern.",
          "Use only the evidence the perception actually needs. No beat, endpoint, or final fact is owed expressive coverage.",
          "Do not stop at competent wording. Push the assigned perception until the sequence produces recognition, surprise, tension, comedy, beauty, menace, status, weirdness, or another earned what-the-fuck turn.",
          "Mouth owns language and sequence. Presentation choices are outside Author.",
          ...(realityDirect ? [
            "REALITY-DIRECT MODE: there is no hidden explanatory thesis to add. Let the supplied facts themselves carry the creative transformation.",
            "Use nonliteral pressure aggressively while keeping every concrete noun, action, condition, result, physical property, manner, and object inside supplied evidence.",
          ] : []),
          ...(isMemoryMode ? [
            "MEMORY REALIZATION: supplied beats are available evidence, not caption slots and not a required narrative path.",
            "Let facts combine when their relationship creates a stronger perception, or let one fact dominate when it contains the experience.",
            "Do not manufacture setup, escalation, trajectory, or payoff merely because several events were supplied.",
            "Service memories are still memories. Tasks, counts, and timestamps are material, not a mandate to sound like a receipt.",
            "Customer-facing output may be radically transformed. It must remain grounded in supplied reality, but the particular fact that inspired a line does not have to be recoverable from that line.",
            "A duration, count, clock time, date, geo fact, or other operational anchor stays viewer-facing only when it materially gives the experience its identity; otherwise it may remain in provenance instead of the expressive cuts.",
            "Stop when the perception hits. Do not add a final line merely to resolve, explain, or complete a sequence.",
            ...(lensSearchEnabled ? [
              "CREATIVE_TREATMENTS assigns production identities. Each expressive production realizes its own sourceRelation, evidenceEventIds, hiddenInference, treatment, perceptionDelta, and expressiveBehaviors across the whole sequence.",
              "sourceRelation and evidenceEventIds authorize the creative leap. They are provenance, not content requirements; the public line may leave their wording and explicit event entirely unsaid.",
              "APPROVED_BEATS ARE EVIDENCE INVENTORY, NOT OUTPUT SLOTS. For A/B/C, their number, roles, and order do not determine expressive line count or expressive sequence.",
              "Every A/B/C expressive line must declare sourceEventIds: the supplied events that authorize that line's perception. Do not inherit evidence by numeric position.",
              "A/B/C may return one line, several lines, or fewer lines than supplied events. One supplied atom may support the entire expressive production.",
              "Concrete reality comes from the supplied evidence carried by each beat and, for A/B/C, from each expressive line's declared sourceEventIds.",
              "hiddenInference is optional private Author thinking, not viewer-facing copy. When present, use it only as a possible perceptual direction; do not build an explanatory sequence to prove it. When empty, remain free to discover a grounded perception from the supplied relationship.",
              "Realization beats explanation. The public result may imply something the user never wrote when that implication is a perceptual reading rather than a new concrete occurrence. Never explain what the viewer is supposed to understand.",
              "Treat the assigned treatment as pressure, not literal world description. Push it hard enough that the same reality becomes a different experience.",
              "Available expressive productions compete on specificity, perception shift, surprise, precision, and how alive the result feels. Do not reward narrative completeness for its own sake.",
              "Do not prefer a familiar named pressure merely because it is recognizable. Reward the production that discovers the strongest fact-dependent creative grammar, including a new grammar QRE has never named before.",
              "Complete the thought. Keep latent relations and treatments concise, but never end a relation, treatment, or perceptionDelta mid-phrase merely to be brief.",
              "Prefer one complete compact sentence over a longer explanation. Finish the semantic idea before spending words on examples or presentation.",
              "AMPLIFY REALITY: push metaphor, status, personification, rhetorical scale, double meaning, and semantic consequence hard. Do not retreat to literal receipt wording merely to stay grounded. Grounding protects the concrete world; it does not require literal phrasing.",
              "A supplied action may disappear completely from public wording when it has already done its job as evidence for a stronger perception. Do not force the viewer to infer or reconstruct the originating action.",
              "ABSENCE IS ALSO A FACT. Do not claim that a response, object, action, event, or interaction was absent unless supplied reality establishes that absence.",
              "A category does not license its typical contents. Keep creative force in status, rhetoric, logic, scale, sequence, and recontextualization instead of inventing material detail.",
              "Sensory residue is material reality too. Sensory conditions, bodily reactions, and environmental aftermath require supplied support unless the wording is unmistakably nonliteral rhetoric.",
              "CREATIVE PRESSURE MAY BUILD A CLEARLY FICTIONAL RHETORICAL FRAME around supplied reality. Mission, game, battle, courtroom, ritual, protocol, system, status, and other pressure-native language may include roles, directives, assignments, verdicts, objectives, levels, sectors, sign-offs, or commands when the whole sequence clearly reads as metaphorical framing rather than documentary fact.",
              "Judge the whole production, not isolated vocabulary. 'Assignment received.' or 'Awaiting next directive.' may be legal inside an unmistakable mission/game grammar. Reject only when the wording would reasonably be understood as asserting a real external event, person, communication, institution, or outcome that supplied reality did not establish.",
              "Bare Reality is the truth-safe control. It wins only when no expressive production remains viable.",
            ] : [
              "Without an assigned creative treatment, realize the approved meaning directly and still search for strong sequence-level authorship rather than generic paraphrase.",
            ]),
            "Return one production object for each listed production identity. A/B/C may use as little of the supplied reality as their strongest perception requires. D is the factual control.",
            "For D only, BEAT EVIDENCE IS ORDERED AUTHORITY. For A/B/C, order is expressive order and sourceEventIds are the grounding authority.",
            "Do not reshuffle concrete facts. Expressive attention is not required to track beat-by-beat chronology.",
          ] : [
            "For each beat, produce materially different short realizations and let the strongest grounded line win.",
          ]),
          ...(presentationContext ? [presentationContext] : []),
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUBJECT: input.subject,
          SUPPLIED_REALITY: input.suppliedReality,
          APPROVED_THESIS: plan.thesis,
          APPROVED_BEATS: plan.beats.map((beat, index) => ({
            order: beat.order,
            role: beat.role,
            eventIds: beat.eventIds,
            attentionEvidence: beat.attention,
            semanticMove: beat.change,
            mayUseFullRelation: index === plan.beats.length - 1,
          })),
          CREATIVE_OPPORTUNITY: selected.perception,
          RELATION: selected.relationship,
          REALITY_DIRECT: realityDirect,
          LENS_MODE: lensMode,
          REQUESTED_LENS: requestedLens || (autoBusinessLens ? "AUTO" : "NONE"),
          STORY_GRAVITY: lensSearch.storyGravity,
          CREATIVE_TREATMENTS: authorMouthCreativeTreatmentPayload(treatmentAssignmentsForMouth),
          instruction: useIdentityClusterPlan
            ? "This is one IDENTITY character cluster, not a checklist. Return four short candidate realizations that synthesize the combination into character. Do not enumerate every supplied preference or simply restate them. The viewer should infer personality from the combination. Do not invent an event."
            : isMemoryMode
              ? realityDirect
                ? "Return candidate productions in PRODUCTION-MAJOR form for the listed CREATIVE_TREATMENTS only. Make the perception felt and implied, not explained. Push each assigned treatment as far as supplied reality supports. Supplied facts are evidence, not required public content: an originating action or change may remain completely unsaid. Keep concrete reality fixed. Operational anchors may stay in provenance unless they create the perception. Nominate the strongest production by its production letter: A, B, C, or D."
                : "Return candidate productions in PRODUCTION-MAJOR form for the listed CREATIVE_TREATMENTS only. Make the perception felt and implied, not explained. Search for something surprising but grounded in supplied reality. Do not narrate the events and do not make each action/change recoverable. A supplied fact may inspire a completely different public line and may remain unsaid. Keep concrete reality fixed. Empty beat text is legal. Nominate the strongest viable expressive production by its production letter: A, B, or C. Bare Reality D is the truth fallback, not the creative target."
              : "Return four candidate lines per beat. The semantic plan controls meaning; the supplied event IDs control factual reality.",
        }),
      },
    ],
    "json",
    {
      numPredict: 1050,
      temperature: isMemoryMode ? 0.96 : 0.86,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: isMemoryMode
          ? ["productions", "selectedProduction", "selectionReason"]
          : ["variantsByBeat"],
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
                    production: { type: "string", enum: ["A", "B", "C", "D"] },
                    lines: {
                      type: "array",
                      minItems: 0,
                      maxItems: Math.max(1, input.suppliedReality.length),
                      items: {
                        type: "object",
                        additionalProperties: false,
                        required: ["order", "text", "sourceEventIds"],
                        properties: {
                          order: { type: "integer", minimum: 1 },
                          text: { type: "string" },
                          sourceEventIds: {
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
              selectedProduction: {
                type: "string",
                enum: ["A", "B", "C", "D"],
              },
              selectionReason: { type: "string", maxLength: 220 },
            }
          : {
              variantsByBeat: {
                type: "array",
                minItems: plan.beats.length,
                maxItems: plan.beats.length,
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

  debug(
    directCreativeAuthorExperiment
      ? "DIRECT-CREATIVE-AUTHOR-PRODUCTIONS"
      : "MOUTH-CANDIDATES",
    mouthResult.text,
  );

  let parsedMouth = parseJson(mouthResult.text);

  if (directCreativeAuthorExperiment) {
    const authoredProductions = directAuthorAttemptsToProductions(parsedMouth);

    if (authoredProductions.length) {
      const provenanceResult = await assignDirectAuthorProductionProvenance({
        suppliedReality: input.suppliedReality,
        authoredProductions,
      }).catch((error: unknown) => {
        mouthFallbackReason =
          clean((error as { message?: unknown })?.message) ||
          "direct_creative_author_provenance_failed";
        return undefined;
      });

      directAuthorProvenanceModelCalls += provenanceResult?.modelCalls ?? 0;

      if (provenanceResult?.productions.length) {
        parsedMouth = {
          productions: provenanceResult.productions,
        };
      } else {
        mouthFallbackReason =
          mouthFallbackReason ||
          "direct creative author provenance produced no grounded line evidence";
        parsedMouth = parseJson(
          buildDeterministicMouthFallback(
            plan,
            input.suppliedReality,
            true,
          ),
        );
      }
    }
  }

  const variantsByOrder = new Map<number, string[]>();
  const memoryMouthProductions: AuthorMemoryMouthProduction[] = [];

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

    for (const beat of plan.beats) {
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
      const variableLines: AuthorMemoryMouthLine[] = [];

      for (const rawLine of productionRecord.lines) {
        if (!rawLine || typeof rawLine !== "object") continue;
        const lineRecord = rawLine as Record<string, unknown>;
        const order = Number(lineRecord.order);
        const text = stripProductionLabel(lineRecord.text);
        if (!Number.isInteger(order) || !text) continue;
        const sourceEventIds = validStoryEventIds(
          lineRecord.sourceEventIds,
          input.suppliedReality,
          32,
        );

        if (lensSearchEnabled && variantIndex < 3) {
          if (!sourceEventIds.length) continue;
          variableLines.push({
            order,
            text,
            sourceEventIds,
          });
          continue;
        }

        const variants = [...(variantsByOrder.get(order) ?? ["", "", "", ""])];
        while (variants.length < 4) variants.push("");
        variants[variantIndex] = text;
        variantsByOrder.set(order, variants.slice(0, 4));
      }

      if (lensSearchEnabled && variantIndex >= 0 && variantIndex < 3) {
        memoryMouthProductions.push({
          production: production as AuthorProductionLetter,
          lines: variableLines.sort((a, b) => a.order - b.order),
        });
      }
    }

    // Production D is the deterministic truth control. Mouth may return a D
    // production for contract compatibility, but its wording never competes.
    // The control is rebuilt directly from the supplied evidence so Bare
    // cannot smuggle interpretation, rhetoric, or invented state into reality.
    if (lensSearchEnabled) {
      for (const beat of plan.beats) {
        const variants = [...(variantsByOrder.get(beat.order) ?? ["", "", "", ""])];
        while (variants.length < 4) variants.push("");
        variants[3] = safeFallbackText(beat, input.suppliedReality);
        variantsByOrder.set(beat.order, variants.slice(0, 4));
      }
    }
  } else {
    const rawVariants = Array.isArray(parsedMouth?.variantsByBeat)
      ? parsedMouth!.variantsByBeat
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
    beat: AuthorSemanticBeat;
    beatFacts: string[];
    candidates: Array<{ text: string; accepted: boolean; score: number; reasons: string[] }>;
    selected: string;
  }> = [];

  if (isMemoryMode) {
    if (lensSearchEnabled) {
      const selectedProductionRaw = clean(parsedMouth?.selectedProduction).toUpperCase();
      let selection = selectMemoryProductionCandidate({
        plan,
        suppliedReality: input.suppliedReality,
        subject: input.subject,
        expressiveProductions: memoryMouthProductions,
        treatmentAssignments: treatmentAssignmentsForMouth,
        selectedProduction: selectedProductionRaw,
        lensSearchEnabled,
        realityDirect,
      });

      const repairTarget =
        selection.nominatedAny &&
        selection.nominatedAny.variantIndex < 3 &&
        treatmentByVariantIndex.has(selection.nominatedAny.variantIndex)
          ? selection.nominatedAny
          : selection.internalProductions
              .filter(
                (production) =>
                  production.variantIndex < 3 &&
                  treatmentByVariantIndex.has(production.variantIndex) &&
                  !production.accepted,
              )
              .sort((a, b) => b.score - a.score)[0];

      if (repairTarget && !repairTarget.accepted) {
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
          const repairLetter = productionLetterFromVariantIndex(repairTarget.variantIndex);
          const repairedProductions = memoryMouthProductions.map((production) =>
            production.production === repairLetter
              ? {
                  ...production,
                  lines: production.lines.map((line) => ({
                    ...line,
                    text: repair.replacements.get(line.order) ?? line.text,
                  })),
                }
              : production,
          );
          const repairedSelection = selectMemoryProductionCandidate({
            plan,
            suppliedReality: input.suppliedReality,
            subject: input.subject,
            expressiveProductions: repairedProductions,
            treatmentAssignments: treatmentAssignmentsForMouth,
            selectedProduction: selectedProductionRaw,
            lensSearchEnabled,
            realityDirect,
          });
          const repairedCandidate = repairedSelection.internalProductions.find(
            (production) => production.variantIndex === repairTarget.variantIndex,
          );

          debug("MEMORY-PRODUCTION-REPAIR", {
            production: repairLetter,
            before: repairTarget.lines.map((line) => ({
              text: line.text,
              sourceEventIds: line.sourceEventIds,
              accepted: line.accepted,
              reasons: line.reasons,
            })),
            replacements: [...repair.replacements.entries()].map(([order, text]) => ({
              order,
              text,
            })),
            after: repairedCandidate?.lines.map((line) => ({
              text: line.text,
              sourceEventIds: line.sourceEventIds,
              accepted: line.accepted,
              reasons: line.reasons,
            })) ?? [],
            accepted: repairedCandidate?.accepted ?? false,
            score: repairedCandidate?.score ?? 0,
          });

          if (repairedCandidate?.accepted) {
            selection = repairedSelection;
          }
        }
      }

      selectedMemoryProduction = selection.evaluation.selectedProduction;
      memoryProductionDiagnostics = selection.evaluation.productions;
      choices.push(...selection.evaluation.choices);
      scenes.push(...selection.evaluation.scenes);

      debug("MEMORY-PRODUCTIONS", {
        modelNomination: selectedProductionRaw || "NONE",
        modelSelectionReason: clean(parsedMouth?.selectionReason),
        winner: selectedMemoryProduction ?? "NONE",
        productions: memoryProductionDiagnostics,
      });
    } else {
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
      const winner = productions.find((production) => production.accepted);
      selectedMemoryProduction = winner
        ? productionLetterFromVariantIndex(winner.variantIndex)
        : undefined;
      memoryProductionDiagnostics = buildMemoryProductionDiagnostics(productions, false);

      for (const [index, beat] of plan.beats.entries()) {
        const beatFacts = factsForEventIds(beat.eventIds, input.suppliedReality);
        const alternatives = productions.map((production) => {
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
          kind: beatKind(beat.role, index, plan.beats.length),
          sourceEventIds: [...beat.eventIds],
        });
      }
    }
  } else {
    const prior: string[] = [];

    for (const [index, beat] of plan.beats.entries()) {
      const beatFacts = beat.eventIds
        .map((id) => input.suppliedReality.find((event) => event.id === id)?.text ?? "")
        .map(clean)
        .filter(Boolean);

      const evaluated = (variantsByOrder.get(beat.order) ?? [])
        .map((text) => {
          const base = variantScore(
            text,
            beatFacts,
            [beat.change].map(clean).filter(Boolean),
            input.subject,
            prior,
          );
          const payoffPenalty = memoryPayoffReplayPenalty(
            text,
            beatFacts,
            isMemoryMode,
            index === plan.beats.length - 1,
            beat.change,
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
        kind: beatKind(beat.role, index, plan.beats.length),
        sourceEventIds: beat.eventIds,
      });
      prior.push(selectedText);
    }
  }

  return {
    scenes,
    model: mouthResult.model || (lensSearchEnabled ? lensSearch.model : "") || planResult.model,
    modelCalls:
      (useDeterministicPlan ? 1 : 2) +
      lensSearch.modelCalls +
      memoryRepairModelCalls +
      directAuthorProvenanceModelCalls,
    diagnostics: {
      plan,
      creativeNotice: lensSearch.creativeNotice,
      storyGravity: lensSearch.storyGravity,
      failureLessons: lensSearch.failureLessons,
      creativeTreatments: treatmentAssignmentsForMouth,
      creativeSearchFallbackReason: lensSearch.searchFallbackReason,
      rejectedTreatments: lensSearch.rejectedTreatments,
      treatmentSetAssessment: lensSearch.treatmentSetAssessment,
      productionContractComplete: {
        creativeSetComplete:
          lensSearch.treatmentSetAssessment.creativeSetComplete,
        renderable: lensSearch.treatmentSetAssessment.renderable,
      },
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
