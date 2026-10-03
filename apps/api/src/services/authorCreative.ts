import type { AuthorDomainContext, AuthorScene } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import type { LocalModelJsonSchema } from "./localModelRuntime.js";
import type { AuthorCreativeDiscovery } from "./authorCreativeDiscovery.js";
import type { AuthorDerivedMeaning } from "./authorDerivedMeaning.js";
import { evaluateAuthorCut, hasAuthorCameraLanguage } from "./authorCutFloor.js";
import { summarizeAuthorBehaviorProfile, type AuthorBehaviorProfile } from "./authorBehaviorProfile.js";
import { QRE_CREATIVE_OPERATING_DOCTRINE, QRE_AUTHOR_WRITING_BRIEF } from "./authorCreativeDoctrine.js";

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

function captureMouthRequest(messages: Parameters<typeof localModelGenerate>[0]) {
  debug("MOUTH-REQUEST", messages);
  return messages;
}

const DIRECT_CREATIVE_AUTHOR_EXPERIMENT_FLAG =
  "QRE_AUTHOR_DIRECT_CREATIVE_EXPERIMENT";
const AUTHOR_REALITY_EDITOR_EXPERIMENT_FLAG =
  "QRE_AUTHOR_REALITY_EDITOR_EXPERIMENT";

function directCreativeAuthorExperimentEnabled(): boolean {
  return process.env[DIRECT_CREATIVE_AUTHOR_EXPERIMENT_FLAG] === "true";
}

function authorRealityEditorExperimentEnabled(): boolean {
  return process.env[AUTHOR_REALITY_EDITOR_EXPERIMENT_FLAG] === "true";
}

export function parseJson(text: string): Record<string, unknown> | undefined {
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
  // Structure may intentionally revisit these IDs as presentation. This does
  // not assert that the underlying occurrence happened more than once.
  revisitEventIds?: string[];
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

export type AuthorProductionLetter = "A" | "B" | "C" | "D" | "ASSEMBLED";

export type AuthorMemoryMouthLine = {
  order: number;
  text: string;
  sourceEventIds: string[];
  synthesizedFrom?: string[];
  auditSpans?: AuthorRealityClaimAuditSpan[];
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

export type AuthorRealityEditorInputProduction = {
  production: "A" | "B" | "C";
  text: string;
  sourceEventIds: string[];
};

export type AuthorRealityEditorPayload = {
  SUPPLIED_REALITY: readonly AuthorCreativeEvent[];
  AUTHORED_PRODUCTIONS: AuthorRealityEditorInputProduction[];
  instruction: string;
};

export type AuthorRealityClaimClassification =
  | "SUPPORTED_REALITY"
  | "KEEP_EXPRESSION"
  | "UNSUPPORTED_REALITY";

const AUTHOR_REALITY_CLAIM_CLASSIFICATIONS: AuthorRealityClaimClassification[] = [
  "SUPPORTED_REALITY",
  "KEEP_EXPRESSION",
  "UNSUPPORTED_REALITY",
];

export type AuthorRealityClaimAuditSpan = {
  exactText: string;
  classification: AuthorRealityClaimClassification;
  sourceEventIds: string[];
};

export type AuthorRealizationMaterialKind =
  | "EXPRESSIVE_PERSPECTIVE"
  | "SUPPLIED_REALITY_MATERIAL";

export type AuthorizedRealization = {
  id: string;
  sourceProduction: "A" | "B" | "C";
  text: string;
  classification: Exclude<AuthorRealityClaimClassification, "UNSUPPORTED_REALITY">;
  sourceEventIds: string[];
  originalOrder: number;
  sourceLineOrder?: number;
  spanIndex: number;
  materialKind: AuthorRealizationMaterialKind;
};

export type AuthorAssembledCandidate = {
  production: "ASSEMBLED";
  rawText: string;
  lines: AuthorMemoryMouthLine[];
  sourceRealizationIds: string[];
  omittedSourceEventIds: string[];
};

export type AuthorRealizationSynthesizerInput = {
  subject: string;
  suppliedReality: Array<{
    id: string;
    text: string;
  }>;
  protectedExpressiveRealizations: Array<{
    id: string;
    sourceProduction: "A" | "B" | "C";
    text: string;
    sourceEventIds: string[];
    materialKind: "EXPRESSIVE_PERSPECTIVE";
  }>;
  authorizedRealizationPool: Array<{
    id: string;
    sourceProduction: "A" | "B" | "C";
    text: string;
    classification: Exclude<AuthorRealityClaimClassification, "UNSUPPORTED_REALITY">;
    sourceEventIds: string[];
    materialKind: AuthorRealizationMaterialKind;
  }>;
  forbiddenTexts: string[];
};

export type AuthorSynthesizedAssemblyLine = {
  order: number;
  text: string;
  synthesizedFrom: string[];
  sourceEventIds: string[];
};

export type AuthorSynthesizedAssemblyOutput = {
  production: "ASSEMBLED";
  lines: AuthorSynthesizedAssemblyLine[];
};

export type AuthorSynthesisAttemptResult = {
  input: AuthorRealizationSynthesizerInput;
  rawOutput: string;
  candidate?: AuthorAssembledCandidate;
  claimAuditor?: AuthorRealityClaimAuditDiagnostic;
  realityEditor?: AuthorRealityEditorApplyResult;
  truthResult: AuthorAssemblyTruthResult;
  model: string;
  modelCalls: number;
};

export type AuthorAssemblyTruthResult = {
  eligible: boolean;
  reasons: string[];
  candidate?: AuthorAssembledCandidate;
  scoring?: {
    accepted: boolean;
    score: number;
    reasons: string[];
    lines: Array<{
      order: number;
      text: string;
      sourceEventIds: string[];
      accepted: boolean;
      score: number;
      reasons: string[];
    }>;
  };
};

export type AuthorCreativeGroundedScene = AuthorScene & {
  sourceEventIds: string[];
  auditSpans?: AuthorRealityClaimAuditSpan[];
};

export type AuthorRealityClaimAuditDiagnostic = {
  production: "A" | "B" | "C";
  originalText: string;
  spans: AuthorRealityClaimAuditSpan[];
  removedSpans: string[];
  reconstructedText: string;
  semanticClassificationValid: boolean;
  auditProtocolValid: boolean;
  exactSpanMappingValid: boolean;
  unsupportedDeletionRequired: boolean;
  survivorIntegrity: "INTACT" | "FRACTURED" | "NOT_REQUIRED";
  rejectionReason?: string;
  unusableReason?: string;
};

export type AuthorRealityEditorApplyResult = {
  productions: AuthorMemoryMouthProduction[];
  applied: boolean;
  reason?: string;
  diagnostics: AuthorRealityClaimAuditDiagnostic[];
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

export type AuthorCreativePrivateConception = {
  id: string;
  sourceCandidateId: string;
  evidenceEventIds: string[];
  conception: string;
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
    /\b(?:introduce|add|create|invent|include|assume)\b[^.!?]{0,64}\b(?:smell|odor|scent|sound|noise|texture|taste|temperature|lighting|light|shadow|silence|residue)\b/i.test(text)
  ) {
    return "requires unsupplied concrete sensory reality";
  }

  if (
    /\b(?:used?|uses|using|with|via)\b[^.!?]{0,48}\b(?:checklist|contract|form|document|tool|equipment|script|procedure)\b/i.test(text)
  ) {
    return "requires unsupplied method, tool, or document";
  }

  if (
    !sourceHasRecurrence &&
    /\b(?:service|subject|customer|worker|cleaner|they|he|she|it)\s+(?:returns?|returned|comes?|came|visits?|visited)\s+(?:weekly|daily|monthly|again|every\b)/i.test(text)
  ) {
    return "adds unsupplied recurrence";
  }

  if (
    /\b(?:signed|filed|notified)\b[^.!?]{0,48}\b(?:contract|case|lawyer|agent|customer|owner)\b|\b(?:contract|case|lawyer|agent|customer|owner)\b[^.!?]{0,48}\b(?:signed|filed|notified)\b/i.test(text)
  ) {
    return "requires unsupplied concrete interaction or document event";
  }

  if (/\broom\s+went\s+silent\b/i.test(text)) {
    return "requires unsupplied environmental sensory outcome";
  }

  if (/\b(?:visuals?|camera|lighting|sound|audio|render(?:ing)?|shots?|edits?)\b/i.test(text)) {
    return "rendering direction";
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

const AUTHOR_EXPRESSIVE_PRODUCTIONS = ["A", "B", "C"] as const;

function directRhetoricalTreatmentLabel(): string {
  return "DIRECT_RHETORICAL_STANCE";
}

function directRhetoricalPressure(conception: string): string {
  const text = clean(conception);
  return text
    ? `Realize this supported conception as a direct rhetorical stance: ${text}`
    : "Realize the supported perception as a direct rhetorical stance without adding concrete facts.";
}

function fallbackMouthTreatmentAssignment(input: {
  production: "A" | "B" | "C";
  index: number;
  privateConceptions: readonly AuthorCreativePrivateConception[];
  selected: AuthorCreativeDiscovery["selected"];
  suppliedReality: readonly AuthorCreativeEvent[];
}): AuthorCreativeTreatmentMouthAssignment {
  const conception = input.privateConceptions[input.index];
  const evidenceEventIds = conception?.evidenceEventIds.length
    ? [...conception.evidenceEventIds]
    : (
        input.selected.evidenceEventIds.length
          ? [...input.selected.evidenceEventIds]
          : input.suppliedReality.map((event) => event.id)
      );
  const text =
    clean(conception?.conception) ||
    clean(input.selected.perception) ||
    clean(input.selected.relationship) ||
    "Use supplied reality directly; discover the strongest rhetorical stance it supports.";

  return {
    production: input.production,
    id: `public-${input.production}`,
    sourceCandidateId: clean(conception?.sourceCandidateId) || `public-${input.production}`,
    sourceRelation: clean(input.selected.relationship) || "public production identity",
    evidenceEventIds,
    creativePressure: directRhetoricalPressure(text),
    hiddenInference: "",
    treatment: directRhetoricalTreatmentLabel(),
    perceptionDelta: text,
    expressiveBehaviors: ["direct rhetorical stance", "supported implication"],
    intensity: "MEDIUM",
  };
}

function expressiveMouthTreatmentAssignments(input: {
  assignments: readonly AuthorCreativeTreatmentMouthAssignment[];
  privateConceptions: readonly AuthorCreativePrivateConception[];
  selected: AuthorCreativeDiscovery["selected"];
  suppliedReality: readonly AuthorCreativeEvent[];
}): AuthorCreativeTreatmentMouthAssignment[] {
  return AUTHOR_EXPRESSIVE_PRODUCTIONS.map((production, index) => {
    const accepted = input.assignments.find((assignment) => assignment.production === production);
    return accepted ?? fallbackMouthTreatmentAssignment({
      production,
      index,
      privateConceptions: input.privateConceptions,
      selected: input.selected,
      suppliedReality: input.suppliedReality,
    });
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
  privateConceptions: AuthorCreativePrivateConception[];
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

function authorRealityClaimAuditSpans(
  value: unknown,
  suppliedReality: readonly AuthorCreativeEvent[],
): AuthorRealityClaimAuditSpan[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): AuthorRealityClaimAuditSpan | undefined => {
      if (!item || typeof item !== "object") return undefined;
      const record = item as Record<string, unknown>;
      const exactText = record.exactText;
      const classification = clean(record.classification).toUpperCase();
      if (
        typeof exactText !== "string" ||
        !clean(exactText) ||
        !AUTHOR_REALITY_CLAIM_CLASSIFICATIONS.includes(
          classification as AuthorRealityClaimClassification,
        )
      ) {
        return undefined;
      }
      return {
        exactText,
        classification: classification as AuthorRealityClaimClassification,
        sourceEventIds: validStoryEventIds(
          record.sourceEventIds,
          suppliedReality,
          32,
        ),
      };
    })
    .filter((item): item is AuthorRealityClaimAuditSpan => Boolean(item));
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
  // Discovery, not a projection heuristic, decides which supplied specificity
  // earns attention. Keep exact times available alongside the other facts.
  return suppliedReality.map((event) => ({ id: clean(event.id), text: clean(event.text) }));
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
  derivedMeaning?: AuthorDerivedMeaning;
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
          "Return eight independent private conceptions that become possible because the supplied reality was noticed.",
          "Then return three public treatment assignments selected from those private conceptions.",
          "Give the thought made possible by the evidence. Keep evidence description, semantic translation, and explanatory reasoning private.",
          "Think because of the evidence, then give the thought.",
          "The conception must add a perception that was not already contained in the supplied fact wording.",
          "A treatment is not the conception repeated. A treatment names the imaginative frame, expressive world, or rhetorical operating mode that can transform how the conception feels.",
          "creativePressure says what Mouth should do differently because of that treatment.",
          "perceptionDelta says how the approved perception changes under that treatment.",
          "expressiveBehaviors are compact rhetorical behaviors, not public lines.",
          "Find the detail with the strongest pressure: specificity, surprise, relationship density, character fit, and the implication it can leave alive. Carry that pressure into the conception.",
          "Let independent conceptions explore genuinely different readings of the material. A local tension may remain the center even when the wider sequence ends pleasantly.",
          "A supplied feeling can carry an expressive stance, anticipation, rhetorical stakes, or an unresolved question. Let that pressure collide with another supplied fact while leaving its actual cause unknown. A voice can make the tension felt without reporting an additional belief or mental state.",
          "Give the underlying expressive idea and its pressure in private conception language. Leave the opening words, cut count, sequence, and final sentences for Mouth to discover. A conception can sustain changing attention across several cuts.",
          "Give a conception a legible handle in the supplied detail or relationship. Prefer a sharp, fact-dependent thought over a general reassurance or an interchangeable poetic sentiment.",
          "One supplied atom may support an entire conception. Unused supplied facts are completely legal.",
          "The eight conceptions do not need to divide or collectively cover the supplied reality. Multiple conceptions may use the same evidence.",
          "evidenceEventIds are provenance only. Choose them because they licensed the thought, not because events need coverage. They are not output slots, rewrite assignments, coverage obligations, or public representation requirements.",
          "Amplify discovered meaning through perspective, attitude, implication, rhetorical status, scale, humor, or delayed realization. Let the discovered relationship supply the pressure and the treatment accelerate it.",
          "Keep concrete participation and world commitments inside supplied evidence: participants, objects, places, physical actions, interactions, observations, sensory facts, measurements, motives, outcomes, recurrence, physical conditions, causality, and chronology.",
          "For each notice, return only conception and evidenceEventIds. The conception is private expressive thought; Mouth owns public prose and Structure owns evidence arrangement.",
          "For each treatment, return an open treatment string plus creativePressure, perceptionDelta, expressiveBehaviors, evidenceEventIds, sourceNoticeIndex, and intensity.",
          "Treatment strings are open labels or short operating modes, not a closed enum.",
          "A treatment may be direct rhetorical realization when that is stronger than a named expressive world.",
          "Do not write public copy in Creative Search.",
          "Do not literalize the treatment. Transform the rhetorical world, not the factual world.",
          "Protect strange thinking; police factual invention later.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUBJECT: input.subject,
          SUPPLIED_REALITY: creativeEvidenceProjection(input.suppliedReality),
          APPROVED_MEANING: { perception: input.creativeOpportunity, relationship: input.relation },
          DERIVED_MEANING: input.derivedMeaning ?? { kind: "DERIVED_MEANING", relations: [] },
          SEMANTIC_MECHANIC: semanticMechanic,
          SEMANTIC_MECHANIC_CANDIDATES: input.semanticMechanicCandidates,
          REQUESTED_LENS: requestedLens || undefined,
          instruction:
            "Treat APPROVED_MEANING and the alternatives in DERIVED_MEANING as already grounded cognition. Lens owns expressive treatment of that meaning. Choose a fertile reading for each conception; SUPPLIED_REALITY alone authorizes concrete facts and occurrences. Return exactly eight independent notices and exactly three public treatments. Each notice must contain only conception and evidenceEventIds. Each treatment must transform a selected conception through a distinct rhetorical operating mode and must say what pressure Mouth should follow. Treatment is not final copy. Evidence IDs carry provenance and may repeat across genuinely different conceptions or treatments. Keep Structure's evidence arrangement and Mouth's public realization in their own downstream stages.",
        }),
      },
    ],
    "json",
    {
      numPredict: 1200,
      temperature: 0.98,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["notices", "treatments"],
        properties: {
          notices: {
            type: "array",
            minItems: 8,
            maxItems: 8,
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
          treatments: {
            type: "array",
            minItems: 3,
            maxItems: 3,
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "sourceNoticeIndex",
                "evidenceEventIds",
                "treatment",
                "creativePressure",
                "perceptionDelta",
                "expressiveBehaviors",
                "intensity",
              ],
              properties: {
                sourceNoticeIndex: {
                  type: "integer",
                  minimum: 1,
                  maximum: 8,
                },
                evidenceEventIds: {
                  type: "array",
                  minItems: 1,
                  maxItems: 16,
                  items: { type: "string", maxLength: 64 },
                },
                treatment: { type: "string" },
                creativePressure: { type: "string" },
                perceptionDelta: { type: "string" },
                expressiveBehaviors: {
                  type: "array",
                  minItems: 1,
                  maxItems: 8,
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
  // AUTO Creative Search no longer asks the model to invent story structure.
  // Keep deterministic gravity only as legacy transport/provenance for downstream code.
  const storyGravity: AuthorStoryGravity = fallbackGravity;

  const rawNotices = Array.isArray(parsedLens?.notices) ? parsedLens.notices : [];
  const rawTreatmentAssignments = Array.isArray(parsedLens?.treatments)
    ? parsedLens.treatments
    : [];
  const parseRejectedTreatments: Array<{
    treatment: AuthorCreativeTreatment;
    reason: string;
  }> = [];
  const latentRelations: AuthorCreativeNotice["latentRelations"] = [];
  const privateConceptions: AuthorCreativePrivateConception[] = rawNotices
    .map((value, index): AuthorCreativePrivateConception | undefined => {
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

      return {
        id: `private-conception-${index + 1}`,
        sourceCandidateId: `notice[${index}]`,
        evidenceEventIds,
        conception,
      };
    })
    .filter((value): value is AuthorCreativePrivateConception => Boolean(value))
    .slice(0, 8);

  const fallbackTreatmentForConception = (
    privateConception: AuthorCreativePrivateConception | undefined,
    index: number,
  ): AuthorCreativeTreatment | undefined => {
    if (!privateConception) return undefined;
    const sourceRelation = "direct rhetorical realization of private conception";

    latentRelations.push({
      relation: sourceRelation,
      evidenceEventIds: privateConception.evidenceEventIds,
    });

    return {
      id: `treatment-${index + 1}`,
      sourceCandidateId: privateConception.sourceCandidateId,
      sourceRelation,
      evidenceEventIds: privateConception.evidenceEventIds,
      creativePressure: directRhetoricalPressure(privateConception.conception),
      hiddenInference: "",
      treatment: directRhetoricalTreatmentLabel(),
      perceptionDelta: privateConception.conception,
      expressiveBehaviors: ["direct rhetorical stance", "supported implication"],
      intensity: "MEDIUM",
    };
  };

  const parsedModelTreatments: AuthorCreativeTreatment[] = rawTreatmentAssignments
    .map((value, index): AuthorCreativeTreatment | undefined => {
      if (!value || typeof value !== "object") return undefined;
      const record = value as Record<string, unknown>;
      const sourceNoticeIndex = Number(record.sourceNoticeIndex);
      const privateConception = Number.isInteger(sourceNoticeIndex)
        ? privateConceptions[sourceNoticeIndex - 1]
        : privateConceptions[index];
      if (!privateConception) return undefined;

      const evidenceEventIds = Array.isArray(record.evidenceEventIds)
        ? unique(
            record.evidenceEventIds
              .filter((id): id is string => typeof id === "string")
              .map(clean)
              .filter((id) => input.suppliedReality.some((event) => clean(event.id) === id)),
          )
        : [];
      const treatmentText = clean(record.treatment);
      const creativePressure = clean(record.creativePressure);
      const perceptionDelta = clean(record.perceptionDelta);
      const expressiveBehaviors = stringArray(record.expressiveBehaviors, 8);
      const intensity = clean(record.intensity).toUpperCase();
      const normalizedIntensity =
        intensity === "LIGHT" || intensity === "STRONG" ? intensity : "MEDIUM";
      const collapsedTreatment =
        treatmentText &&
        treatmentText.toLowerCase() === privateConception.conception.toLowerCase() &&
        creativePressure.toLowerCase() === privateConception.conception.toLowerCase() &&
        perceptionDelta.toLowerCase() === privateConception.conception.toLowerCase();
      const treatment = collapsedTreatment
        ? directRhetoricalTreatmentLabel()
        : treatmentText;
      const pressure = collapsedTreatment
        ? directRhetoricalPressure(privateConception.conception)
        : creativePressure;
      const delta = perceptionDelta || privateConception.conception;
      const behaviors = expressiveBehaviors.length
        ? expressiveBehaviors
        : ["rhetorical transformation"];

      if (!treatment || !pressure || !delta || !behaviors.length) {
        return fallbackTreatmentForConception(privateConception, index);
      }

      const sourceRelation = "model-selected rhetorical treatment from private conception";
      const finalEvidenceEventIds = evidenceEventIds.length
        ? evidenceEventIds
        : privateConception.evidenceEventIds;

      latentRelations.push({
        relation: sourceRelation,
        evidenceEventIds: finalEvidenceEventIds,
      });

      return {
        id: `treatment-${index + 1}`,
        sourceCandidateId: privateConception.sourceCandidateId,
        sourceRelation,
        evidenceEventIds: finalEvidenceEventIds,
        creativePressure: pressure,
        hiddenInference: "",
        treatment,
        perceptionDelta: delta,
        expressiveBehaviors: behaviors,
        intensity: normalizedIntensity as "LIGHT" | "MEDIUM" | "STRONG",
      };
    })
    .filter((value): value is AuthorCreativeTreatment => Boolean(value))
    .slice(0, 3);

  const modelTreatments: AuthorCreativeTreatment[] = [
    ...parsedModelTreatments,
    ...privateConceptions
      .filter((conception) =>
        !parsedModelTreatments.some(
          (treatment) => treatment.sourceCandidateId === conception.sourceCandidateId,
        ),
      )
      .slice(0, Math.max(0, 3 - parsedModelTreatments.length))
      .map((conception, offset) =>
        fallbackTreatmentForConception(conception, parsedModelTreatments.length + offset),
      )
      .filter((value): value is AuthorCreativeTreatment => Boolean(value)),
  ].slice(0, 3);

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
    privateConceptions,
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
    "A known preference may become anticipation, importance, a question, or an open possibility while concrete events remain inside supplied reality.",
    "Synthesize combinations of truths into character instead of dressing up each fact separately.",
    "Sparse identity reality may open a world or create a discovery portrait through a distinctive supported character read.",
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

function normalizePlanRevisitEventIds(
  value: unknown,
  beats: readonly AuthorSemanticBeat[],
  allowedEventIds: Set<string>,
): string[] {
  const beatCounts = new Map<string, number>();
  for (const beat of beats) {
    for (const id of unique(beat.eventIds)) {
      beatCounts.set(id, (beatCounts.get(id) ?? 0) + 1);
    }
  }
  return stringArray(value, 32).filter((id) =>
    allowedEventIds.has(id) && (beatCounts.get(id) ?? 0) > 1,
  );
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
    revisitEventIds: normalizePlanRevisitEventIds(value?.revisitEventIds, beats, allowedEventIds),
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
  const suppliedEventIds = new Set(events.map((event) => clean(event.id)));
  const authorizedEventIds = new Set(
    (
      discovery.playableEventIds.length
        ? discovery.playableEventIds
        : selected.evidenceEventIds
    ).map(clean).filter((id) => suppliedEventIds.has(id)),
  );
  const revisitEventIds = normalizePlanRevisitEventIds(
    plan.revisitEventIds,
    plan.beats,
    authorizedEventIds,
  );
  const revisitSet = new Set(revisitEventIds);
  const seenEventIds = new Set<string>();
  const uniquePlanBeats = plan.beats
    .map((beat) => ({
      ...beat,
      eventIds: beat.eventIds.filter((id) => {
        const key = clean(id);
        if (!authorizedEventIds.has(key)) return false;
        if (revisitSet.has(key)) return true;
        if (seenEventIds.has(key)) return false;
        seenEventIds.add(key);
        return true;
      }),
    }))
    .filter((beat) => beat.eventIds.length > 0);
  const planWithUniqueEvidence = {
    ...plan,
    beats: uniquePlanBeats,
    revisitEventIds,
  };
  const approvedMeaning = clean(selected.perception || selected.relationship);
  const approvedRelation = clean(selected.relationship);
  const realityDirect = clean(selected.id).toLowerCase() === "reality-direct";

  if (realityDirect) {
    return {
      thesis: "Use supplied reality directly.",
      revisitEventIds,
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
    revisitEventIds: normalizePlanRevisitEventIds(revisitEventIds, beats, authorizedEventIds),
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
    auditSpans?: AuthorRealityClaimAuditSpan[];
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
  authorizedRealizationPool: readonly AuthorizedRealization[] = [],
): MemorySequenceCandidate {
  const prior: string[] = [];
  const treatmentSemanticAuthority = treatmentAuthority(treatment);
  const authorizedRealizationById = new Map(
    authorizedRealizationPool.map((realization) => [
      realization.id,
      realization,
    ]),
  );

  const lines = [...mouthLines]
    .sort((a, b) => a.order - b.order)
    .map((mouthLine, index) => {
      const sourceEventIds = unique(mouthLine.sourceEventIds)
        .filter((id) =>
          suppliedReality.some((event) => clean(event.id) === id),
        );

      const beatFacts = factsForEventIds(
        sourceEventIds,
        suppliedReality,
      );

      const lineSemanticAuthority = unique([
        ...treatmentSemanticAuthority,
        ...(mouthLine.synthesizedFrom ?? [])
          .map(
            (id) =>
              authorizedRealizationById.get(id)?.text ?? "",
          )
          .filter(Boolean),
      ]);

      const base = variantScore(
        mouthLine.text,
        beatFacts,
        lineSemanticAuthority,
        subject,
        prior,
        !realityDirect,
        false,
      );

      const operationalAnchorFailure =
        inventedOperationalAnchorReason(
          mouthLine.text,
          suppliedReality,
        );

      const accepted =
        base.accepted &&
        sourceEventIds.length > 0 &&
        !operationalAnchorFailure;

      const line = {
        order: Number.isInteger(mouthLine.order)
          ? mouthLine.order
          : index + 1,
        sourceEventIds,
        beatFacts,
        semanticMove: lineSemanticAuthority.join(" | "),
        text: clean(mouthLine.text),
        ...(mouthLine.auditSpans?.length
          ? {
              auditSpans: mouthLine.auditSpans.map((span) => ({
                ...span,
              })),
            }
          : {}),
        ...base,
        accepted,
        score: operationalAnchorFailure ? 0 : base.score,
        reasons: [
          ...base.reasons,
          ...(sourceEventIds.length
            ? []
            : ["missing-source-event-ids"]),
          ...(operationalAnchorFailure
            ? [operationalAnchorFailure]
            : []),
        ],
      };

      if (accepted) {
        prior.push(line.text);
      }

      return line;
    });

  const accepted = lines.every((line) => line.accepted);
  const score = lines.length
    ? lines.reduce((sum, line) => sum + line.score, 0) /
      lines.length
    : 0;

  return {
    variantIndex,
    accepted,
    score,
    reasons: unique(lines.flatMap((line) => line.reasons)),
    lines,
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
          "Keep each replacement inside its own suppliedEvidence plus prior established evidence. Preserve the supplied chronology.",
          "Preserve the treatment's voice, pressure, and rhetorical world while grounding concrete claims in the authorized evidence.",
          "Use the assigned treatment's perceptionDelta and expressiveBehaviors to recover the conception's force. Keep accepted cuts exactly as they are.",
          "Make the repaired perception felt through the words themselves. Let implication, rhythm, character, contrast, and surprise restore the energy.",
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
            "Return replacements for FAILED_BEATS, preserving accepted cuts, the assigned conception, voice, and supplied reality boundary. Let the replacement make the supported perception felt. Its originating fact can remain in provenance.",
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
  scenes: AuthorCreativeGroundedScene[];
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
      auditSpans?: AuthorRealityClaimAuditSpan[];
      accepted: boolean;
      score: number;
      reasons: string[];
    }>;
  }>;
  choices: AuthorMemorySelectionChoice[];
};

function productionLetterFromVariantIndex(index: number): AuthorProductionLetter {
  return (["A", "B", "C", "D", "ASSEMBLED"][index] ?? "D") as AuthorProductionLetter;
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
      ...(line.auditSpans?.length
        ? { auditSpans: line.auditSpans.map((span) => ({ ...span })) }
        : {}),
      accepted: line.accepted,
      score: line.score,
      reasons: [...line.reasons],
    })),
  }));
}

function scenesFromMemoryWinner(
  winner: MemorySequenceCandidate | undefined,
  plan: AuthorSemanticPlan,
  suppliedReality: readonly AuthorCreativeEvent[],
): AuthorCreativeGroundedScene[] {
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
        ...(line.auditSpans?.length
          ? { auditSpans: line.auditSpans.map((span) => ({ ...span })) }
          : {}),
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
      ...(line.auditSpans?.length
        ? { auditSpans: line.auditSpans.map((span) => ({ ...span })) }
        : {}),
    }));
}

function selectMemoryProductionCandidate(input: {
  plan: AuthorSemanticPlan;
  suppliedReality: readonly AuthorCreativeEvent[];
  subject: string;
  expressiveProductions: readonly AuthorMemoryMouthProduction[];
  assembledProductions?: readonly AuthorMemoryMouthProduction[];
  authorizedRealizationPool?: readonly AuthorizedRealization[];
  treatmentAssignments: readonly AuthorCreativeTreatmentMouthAssignment[];
  selectedProduction?: string;
  lensSearchEnabled: boolean;
  realityDirect: boolean;
  minimumExpressiveCuts?: number;
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
  const assembledProductions = (input.assembledProductions ?? []).map((production) =>
    scoreExpressiveMemoryProduction(
      4,
      production.lines,
      input.suppliedReality,
      input.subject,
      undefined,
      input.realityDirect,
      input.authorizedRealizationPool ?? [],
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
  const minimumExpressiveCuts = input.minimumExpressiveCuts ?? 1;
  const developedExpressiveProductions = [...expressiveProductions, ...assembledProductions]
    .map((production) => {
      const underdeveloped = production.lines.filter((line) => Boolean(clean(line.text))).length < minimumExpressiveCuts;
      return underdeveloped
        ? { ...production, accepted: false, reasons: [...production.reasons, "underdeveloped-moving-text-sequence"] }
        : production;
    });
  const productions = [...developedExpressiveProductions, bareProduction]
    .sort((a, b) => {
      if (a.accepted !== b.accepted) return a.accepted ? -1 : 1;
      return b.score - a.score;
    });

  const selectedProductionLetter = clean(input.selectedProduction).toUpperCase();
  const legacySelectedProductionNumber = Number(input.selectedProduction);
  const nominatedVariantIndex = /^[ABCD]$/.test(selectedProductionLetter)
    ? ["A", "B", "C", "D"].indexOf(selectedProductionLetter)
    : selectedProductionLetter === "ASSEMBLED"
      ? 4
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
            production.variantIndex === 4 ||
            (
              treatmentByVariantIndex.has(production.variantIndex) &&
              production.variantIndex < 3 &&
              expressiveProductionHasPerceptionDelta(production)
            ),
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
        nominatedProduction.variantIndex === 4 ||
        (
          treatmentByVariantIndex.has(nominatedProduction.variantIndex) &&
          nominatedProduction.variantIndex < 3 &&
          expressiveProductionHasPerceptionDelta(nominatedProduction)
        )
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
  // With Lens enabled, Mouth nominates on creative strength after seeing the
  // complete productions. Cut scores measure mechanical readability and replay;
  // they are not an alternative semantic creativity judge. Keep all eligibility
  // gates and final grounding, but use scoring only if that nomination is absent
  // or ineligible. The Lens-disabled control retains its existing score policy.
  const preferredNomination = input.lensSearchEnabled
    ? nominatedExpressiveProduction
    : nominatedNearTop;
  const winner =
    preferredNomination ??
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
    assembledProductions?: readonly AuthorMemoryMouthProduction[];
    assembledProduction?: AuthorMemoryMouthProduction;
    authorizedRealizationPool?: readonly AuthorizedRealization[];
    treatmentAssignments: readonly AuthorCreativeTreatmentMouthAssignment[];
    selectedProduction?: string;
    lensSearchEnabled?: boolean;
    realityDirect?: boolean;
    minimumExpressiveCuts?: number;
  },
): AuthorMemoryProductionEvaluation {
  return selectMemoryProductionCandidate({
    plan: input.plan,
    suppliedReality: input.suppliedReality,
    subject: input.subject,
    expressiveProductions: input.expressiveProductions,
    assembledProductions: input.assembledProductions ?? (
      input.assembledProduction ? [input.assembledProduction] : []
    ),
    authorizedRealizationPool: input.authorizedRealizationPool,
    treatmentAssignments: input.treatmentAssignments,
    selectedProduction: input.selectedProduction,
    lensSearchEnabled: input.lensSearchEnabled ?? true,
    realityDirect: input.realityDirect ?? false,
    minimumExpressiveCuts: input.minimumExpressiveCuts,
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
  const privateConceptions: AuthorCreativePrivateConception[] = parsedTreatments
    .filter((treatment) => !isBareTreatment(treatment))
    .map((treatment, index) => ({
      id: `private-conception-${index + 1}`,
      sourceCandidateId: treatment.sourceCandidateId,
      evidenceEventIds: [...treatment.evidenceEventIds],
      conception: treatment.treatment,
    }));

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
    privateConceptions,
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
        lines: text.split(/\r?\n/).filter((cut) => clean(cut)).map((cut, cutIndex) => ({ order: cutIndex + 1, text: cut })),
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

export function normalizeDirectAuthorProvenanceAssignments(
  value: unknown,
): AuthorDirectProvenanceAssignment[] {
  const assignmentsValue = value && typeof value === "object"
    ? (value as Record<string, unknown>).assignments
    : undefined;

  if (!Array.isArray(assignmentsValue) || assignmentsValue.length !== 3) {
    throw new Error("malformed_direct_author_provenance_assignments_cardinality");
  }

  const assignments: AuthorDirectProvenanceAssignment[] = [];
  const seen = new Set<"A" | "B" | "C">();

  for (const rawAssignment of assignmentsValue) {
    if (!rawAssignment || typeof rawAssignment !== "object") {
      throw new Error("malformed_direct_author_provenance_assignment");
    }

    const assignmentRecord = rawAssignment as Record<string, unknown>;
    const production = clean(assignmentRecord.production).toUpperCase();
    if (
      !["A", "B", "C"].includes(production) ||
      seen.has(production as "A" | "B" | "C") ||
      !Array.isArray(assignmentRecord.lines) ||
      assignmentRecord.lines.length > 12
    ) {
      throw new Error("malformed_direct_author_provenance_productions");
    }

    seen.add(production as "A" | "B" | "C");

    const lines = assignmentRecord.lines.map((rawLine) => {
      if (!rawLine || typeof rawLine !== "object") {
        throw new Error("malformed_direct_author_provenance_line");
      }

      const lineRecord = rawLine as Record<string, unknown>;
      const order = Number(lineRecord.order);
      if (!Number.isInteger(order) || order < 1) {
        throw new Error("malformed_direct_author_provenance_line_order");
      }

      const rawSourceEventIds = lineRecord.sourceEventIds;
      if (
        !Array.isArray(rawSourceEventIds) ||
        rawSourceEventIds.length < 1 ||
        rawSourceEventIds.length > 32 ||
        rawSourceEventIds.some((id) => typeof id !== "string" || !clean(id) || clean(id).length > 64)
      ) {
        throw new Error("malformed_direct_author_provenance_source_event_ids");
      }

      const sourceEventIds = stringArray(rawSourceEventIds, 32);

      return {
        order,
        sourceEventIds,
      };
    });

    assignments.push({
      production: production as AuthorProductionLetter,
      lines,
    });
  }

  const expectedProductions: Array<"A" | "B" | "C"> = ["A", "B", "C"];
  if (!expectedProductions.every((production) => seen.has(production))) {
    throw new Error("malformed_direct_author_provenance_missing_production");
  }

  return assignments;
}

export function buildAuthorRealityEditorPayload(input: {
  suppliedReality: readonly AuthorCreativeEvent[];
  productions: readonly AuthorMemoryMouthProduction[];
}): AuthorRealityEditorPayload {
  return {
    SUPPLIED_REALITY: input.suppliedReality,
    AUTHORED_PRODUCTIONS: input.productions
      .filter((production): production is AuthorMemoryMouthProduction & { production: "A" | "B" | "C" } =>
        ["A", "B", "C"].includes(production.production),
      )
      .map((production) => ({
        production: production.production,
        text: production.lines
          .map((line) => line.text)
          .filter((text) => clean(text))
          .join("\n"),
        sourceEventIds: unique(production.lines.flatMap((line) => line.sourceEventIds)),
      })),
    instruction:
      "Partition each production into atomicClaimSpans, then classify those exact authored spans. Do not rewrite.",
  };
}

function normalizeAuthorRealityClaimAudits(
  value: unknown,
): Map<"A" | "B" | "C", AuthorRealityClaimAuditSpan[]> | undefined {
  const auditsValue = value && typeof value === "object"
    ? (value as Record<string, unknown>).audits
    : undefined;
  if (!Array.isArray(auditsValue) || auditsValue.length !== 3) return undefined;

  const audits = new Map<"A" | "B" | "C", AuthorRealityClaimAuditSpan[]>();

  for (const rawAudit of auditsValue) {
    if (!rawAudit || typeof rawAudit !== "object") return undefined;
    const auditRecord = rawAudit as Record<string, unknown>;
    const production = clean(auditRecord.production).toUpperCase();
    if (!["A", "B", "C"].includes(production) || audits.has(production as "A" | "B" | "C")) {
      return undefined;
    }

    const spansValue = Array.isArray(auditRecord.atomicClaimSpans)
      ? auditRecord.atomicClaimSpans
      : auditRecord.spans;
    const requiresAtomicityMarker = Array.isArray(auditRecord.atomicClaimSpans);
    if (!Array.isArray(spansValue) || spansValue.length > 64) return undefined;
    const spans: AuthorRealityClaimAuditSpan[] = [];
    for (const rawSpan of spansValue) {
      if (!rawSpan || typeof rawSpan !== "object") return undefined;
      const spanRecord = rawSpan as Record<string, unknown>;
      const exactText = spanRecord.exactText;
      const classification = clean(spanRecord.classification).toUpperCase();
      const atomicity = clean(spanRecord.atomicity).toUpperCase();
      if (
        typeof exactText !== "string" ||
        !exactText ||
        !AUTHOR_REALITY_CLAIM_CLASSIFICATIONS.includes(
          classification as AuthorRealityClaimClassification,
        ) ||
        (requiresAtomicityMarker && atomicity !== "SMALLEST_INDEPENDENT_CLASSIFIABLE_UNIT")
      ) {
        return undefined;
      }
      spans.push({
        exactText,
        classification: classification as AuthorRealityClaimClassification,
        sourceEventIds: stringArray(spanRecord.sourceEventIds, 32),
      });
    }

    audits.set(production as "A" | "B" | "C", spans);
  }

  return audits.size === 3 ? audits : undefined;
}

function emptyAuditedProductions(input: {
  productions: readonly AuthorMemoryMouthProduction[];
  reason: string;
  auditProtocolValid?: boolean;
}): AuthorRealityEditorApplyResult {
  return {
    productions: input.productions.map((production) => (
      ["A", "B", "C"].includes(production.production)
        ? { ...production, lines: [] }
        : {
            ...production,
            lines: production.lines.map((line) => ({ ...line })),
          }
    )),
    applied: false,
    reason: input.reason,
    diagnostics: input.productions
      .filter((production): production is AuthorMemoryMouthProduction & { production: "A" | "B" | "C" } =>
        ["A", "B", "C"].includes(production.production),
      )
      .map((production) => ({
        production: production.production,
        originalText: production.lines.map((line) => line.text).join("\n"),
        spans: [],
        removedSpans: [],
        reconstructedText: "",
        semanticClassificationValid: false,
        auditProtocolValid: input.auditProtocolValid ?? false,
        exactSpanMappingValid: false,
        unsupportedDeletionRequired: false,
        survivorIntegrity: "NOT_REQUIRED" as const,
        rejectionReason: input.reason,
        unusableReason: input.reason,
      })),
  };
}

type AuthorRealityClaimAuditRange = {
  start: number;
  end: number;
  span: AuthorRealityClaimAuditSpan;
};

function hasSubstantiveText(text: string): boolean {
  return /[A-Za-z0-9]/.test(text);
}

function isStrongBoundary(char: string | undefined): boolean {
  return Boolean(char && /[.!?;\n]/.test(char));
}

function previousNonWhitespace(text: string, index: number): string | undefined {
  for (let i = index - 1; i >= 0; i -= 1) {
    const char = text[i];
    if (char && !/\s/.test(char)) return char;
  }
  return undefined;
}

function nextNonWhitespace(text: string, index: number): string | undefined {
  for (let i = index; i < text.length; i += 1) {
    const char = text[i];
    if (char && !/\s/.test(char)) return char;
  }
  return undefined;
}

function mapAuthorRealityClaimAuditRanges(input: {
  originalText: string;
  spans: readonly AuthorRealityClaimAuditSpan[];
}): {
  ranges: AuthorRealityClaimAuditRange[];
  unusableReason?: string;
} | undefined {
  const ranges: AuthorRealityClaimAuditRange[] = [];
  let cursor = 0;

  for (const span of input.spans) {
    const start = input.originalText.indexOf(span.exactText, cursor);
    if (start < 0) return undefined;
    const nextStart = input.originalText.indexOf(span.exactText, start + 1);
    if (nextStart >= 0) {
      return {
        ranges: [],
        unusableReason: "reality_auditor_span_ambiguous",
      };
    }
    const end = start + span.exactText.length;
    ranges.push({ start, end, span });
    cursor = end;
  }

  return { ranges };
}

function unauditedSubstantiveGapReason(input: {
  originalText: string;
  ranges: readonly AuthorRealityClaimAuditRange[];
}): string | undefined {
  let cursor = 0;
  for (const range of input.ranges) {
    if (hasSubstantiveText(input.originalText.slice(cursor, range.start))) {
      return "reality_auditor_unaudited_substantive_material";
    }
    cursor = range.end;
  }

  if (hasSubstantiveText(input.originalText.slice(cursor))) {
    return "reality_auditor_unaudited_substantive_material";
  }

  return undefined;
}

function unsupportedDeletionFractureReason(input: {
  originalText: string;
  ranges: readonly AuthorRealityClaimAuditRange[];
}): string | undefined {
  for (const range of input.ranges) {
    if (range.span.classification !== "UNSUPPORTED_REALITY") continue;

    const left = input.originalText.slice(0, range.start);
    const right = input.originalText.slice(range.end);
    const leftHasText = hasSubstantiveText(left);
    const rightHasText = hasSubstantiveText(right);
    const spanTrimmed = range.span.exactText.trim();
    const leftBoundary = previousNonWhitespace(input.originalText, range.start);
    const rightBoundary = nextNonWhitespace(input.originalText, range.end);
    const spanClosesSegment = isStrongBoundary(spanTrimmed[spanTrimmed.length - 1]);
    const startsAtSegmentBoundary = !leftHasText || isStrongBoundary(leftBoundary);

    if (rightBoundary && /[,.:!?;)\]}]/.test(rightBoundary)) {
      return "reality_auditor_survivor_fractured";
    }

    if (leftHasText && !rightHasText && !startsAtSegmentBoundary) {
      return "reality_auditor_survivor_fractured";
    }

    if (!leftHasText && rightHasText && !spanClosesSegment) {
      return "reality_auditor_survivor_fractured";
    }

    if (leftHasText && rightHasText && !(startsAtSegmentBoundary && spanClosesSegment)) {
      return "reality_auditor_survivor_fractured";
    }
  }

  return undefined;
}

function removeUnsupportedClaimSpans(input: {
  originalText: string;
  ranges: readonly AuthorRealityClaimAuditRange[];
}): {
  text: string;
  removedSpans: string[];
  survivingSpans: AuthorRealityClaimAuditSpan[];
  unsupportedDeletionRequired: boolean;
  survivorIntegrity: "INTACT" | "FRACTURED" | "NOT_REQUIRED";
  unusableReason?: string;
} {
  const ranges = [...input.ranges].sort((a, b) => a.start - b.start);
  const unsupportedRanges = ranges.filter(
    (range) => range.span.classification === "UNSUPPORTED_REALITY",
  );
  const survivingSpans = ranges
    .filter((range) => range.span.classification !== "UNSUPPORTED_REALITY")
    .map((range) => ({ ...range.span }));
  const unsupportedDeletionRequired = unsupportedRanges.length > 0;

  if (!unsupportedDeletionRequired) {
    return {
      text: input.originalText,
      removedSpans: [],
      survivingSpans,
      unsupportedDeletionRequired,
      survivorIntegrity: "NOT_REQUIRED",
    };
  }

  const fracturedReason = unsupportedDeletionFractureReason({
    originalText: input.originalText,
    ranges,
  });
  if (fracturedReason) {
    return {
      text: "",
      removedSpans: unsupportedRanges.map((range) => range.span.exactText),
      survivingSpans: [],
      unsupportedDeletionRequired,
      survivorIntegrity: "FRACTURED",
      unusableReason: fracturedReason,
    };
  }

  let text = "";
  let cursor = 0;
  for (const range of unsupportedRanges) {
    text += input.originalText.slice(cursor, range.start);
    cursor = range.end;
  }
  text += input.originalText.slice(cursor);

  if (/[,;:]\s*$/.test(text) || /^\s*[,;:.!?]/.test(text)) {
    return {
      text: "",
      removedSpans: unsupportedRanges.map((range) => range.span.exactText),
      survivingSpans: [],
      unsupportedDeletionRequired,
      survivorIntegrity: "FRACTURED",
      unusableReason: "reality_auditor_survivor_fractured",
    };
  }

  return {
    text,
    removedSpans: unsupportedRanges.map((range) => range.span.exactText),
    survivingSpans,
    unsupportedDeletionRequired,
    survivorIntegrity: "INTACT",
  };
}

export function applyAuthorRealityEditorEdits(input: {
  productions: readonly AuthorMemoryMouthProduction[];
  auditorResponse: unknown;
}): AuthorRealityEditorApplyResult {
  const audits = normalizeAuthorRealityClaimAudits(input.auditorResponse);
  if (!audits) {
    return emptyAuditedProductions({
      productions: input.productions,
      reason: "malformed_reality_auditor_response",
      auditProtocolValid: false,
    });
  }

  const originalLetters = new Set(
    input.productions
      .map((production) => production.production)
      .filter((production) => ["A", "B", "C"].includes(production)),
  );
  if (!["A", "B", "C"].every((production) => originalLetters.has(production as AuthorProductionLetter))) {
    return emptyAuditedProductions({
      productions: input.productions,
      reason: "reality_auditor_missing_original_production",
      auditProtocolValid: false,
    });
  }

  const diagnostics: AuthorRealityClaimAuditDiagnostic[] = [];
  return {
    productions: input.productions.map((production) => {
      if (!["A", "B", "C"].includes(production.production)) {
        return {
          ...production,
          lines: production.lines.map((line) => ({ ...line })),
        };
      }

      const productionLetter = production.production as "A" | "B" | "C";
      const spans = audits.get(productionLetter) ?? [];
      const originalText = production.lines.map((line) => line.text).join("\n");
      const firstLine = production.lines[0];
      const mapped = mapAuthorRealityClaimAuditRanges({
        originalText,
        spans,
      });

      if (!mapped || mapped.unusableReason || !firstLine) {
        const reason = !mapped
          ? "reality_auditor_span_not_exact"
          : mapped.unusableReason ?? "reality_auditor_missing_line";
        diagnostics.push({
          production: productionLetter,
          originalText,
          spans,
          removedSpans: [],
          reconstructedText: "",
          semanticClassificationValid: true,
          auditProtocolValid: !mapped?.unusableReason,
          exactSpanMappingValid: Boolean(mapped && !mapped.unusableReason),
          unsupportedDeletionRequired: spans.some((span) => span.classification === "UNSUPPORTED_REALITY"),
          survivorIntegrity: "NOT_REQUIRED",
          rejectionReason: reason,
          unusableReason: reason,
        });
        return {
          ...production,
          lines: [],
        };
      }

      const coverageReason = unauditedSubstantiveGapReason({
        originalText,
        ranges: mapped.ranges,
      });
      if (coverageReason) {
        diagnostics.push({
          production: productionLetter,
          originalText,
          spans,
          removedSpans: [],
          reconstructedText: "",
          semanticClassificationValid: true,
          auditProtocolValid: true,
          exactSpanMappingValid: true,
          unsupportedDeletionRequired: spans.some((span) => span.classification === "UNSUPPORTED_REALITY"),
          survivorIntegrity: "NOT_REQUIRED",
          rejectionReason: coverageReason,
          unusableReason: coverageReason,
        });
        return {
          ...production,
          lines: [],
        };
      }

      const removal = removeUnsupportedClaimSpans({
        originalText,
        ranges: mapped.ranges,
      });

      if (removal.unusableReason) {
        diagnostics.push({
          production: productionLetter,
          originalText,
          spans,
          removedSpans: removal.removedSpans,
          reconstructedText: removal.text,
          semanticClassificationValid: true,
          auditProtocolValid: true,
          exactSpanMappingValid: true,
          unsupportedDeletionRequired: removal.unsupportedDeletionRequired,
          survivorIntegrity: removal.survivorIntegrity,
          rejectionReason: removal.unusableReason,
          unusableReason: removal.unusableReason,
        });
        return {
          ...production,
          lines: [],
        };
      }

      diagnostics.push({
        production: productionLetter,
        originalText,
        spans,
        removedSpans: removal.removedSpans,
        reconstructedText: removal.text,
        semanticClassificationValid: true,
        auditProtocolValid: true,
        exactSpanMappingValid: true,
        unsupportedDeletionRequired: removal.unsupportedDeletionRequired,
        survivorIntegrity: removal.survivorIntegrity,
      });

      if (!clean(removal.text)) {
        return {
          ...production,
          lines: [],
        };
      }

      return {
        ...production,
        lines: [
          {
            ...firstLine,
            text: removal.text,
            sourceEventIds: [...firstLine.sourceEventIds],
            auditSpans: removal.survivingSpans.map((span) => ({ ...span })),
          },
        ],
      };
    }),
    applied: true,
    diagnostics,
  };
}

function productionEventIds(input: {
  production: AuthorProductionLetter;
  productions: readonly AuthorMemoryMouthProduction[];
  suppliedReality: readonly AuthorCreativeEvent[];
}): string[] {
  const production = input.productions.find((item) => item.production === input.production);
  return validStoryEventIds(
    production?.lines.flatMap((line) => line.sourceEventIds) ?? [],
    input.suppliedReality,
    32,
  );
}

export function harvestAuthorizedRealizationPool(input: {
  diagnostics: readonly AuthorRealityClaimAuditDiagnostic[];
  productions?: readonly AuthorMemoryMouthProduction[];
  suppliedReality: readonly AuthorCreativeEvent[];
}): AuthorizedRealization[] {
  const pool: AuthorizedRealization[] = [];
  let originalOrder = 0;

  for (const diagnostic of input.diagnostics) {
    if (!["A", "B", "C"].includes(diagnostic.production)) continue;
    const sourceProduction = diagnostic.production;
    const fallbackEventIds = productionEventIds({
      production: sourceProduction,
      productions: input.productions ?? [],
      suppliedReality: input.suppliedReality,
    });

    diagnostic.spans.forEach((span, spanIndex) => {
      if (span.classification === "UNSUPPORTED_REALITY") return;
      const text = clean(span.exactText);
      if (!text) return;
      const sourceEventIds = validStoryEventIds(
        span.sourceEventIds,
        input.suppliedReality,
        32,
      );
      const evidenceEventIds = sourceEventIds.length
        ? sourceEventIds
        : fallbackEventIds;

      pool.push({
        id: `${sourceProduction}:${spanIndex + 1}`,
        sourceProduction,
        text,
        classification: span.classification,
        sourceEventIds: evidenceEventIds,
        originalOrder: originalOrder += 1,
        sourceLineOrder: 1,
        spanIndex: spanIndex + 1,
        materialKind:
          span.classification === "KEEP_EXPRESSION"
            ? "EXPRESSIVE_PERSPECTIVE"
            : "SUPPLIED_REALITY_MATERIAL",
      });
    });
  }

  return pool;
}

function realizationEventPosition(
  realization: AuthorizedRealization,
  suppliedReality: readonly AuthorCreativeEvent[],
): number {
  const eventOrder = new Map(
    suppliedReality.map((event, index) => [clean(event.id), index]),
  );
  const positions = realization.sourceEventIds
    .map((id) => eventOrder.get(clean(id)))
    .filter((index): index is number => typeof index === "number");
  return positions.length ? Math.min(...positions) : Number.MAX_SAFE_INTEGER;
}

function realizationScore(realization: AuthorizedRealization): number {
  const text = clean(realization.text);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const expressiveBonus = realization.materialKind === "EXPRESSIVE_PERSPECTIVE" ? 3 : 0;
  const economyBonus = wordCount > 2 && wordCount <= 18 ? 2 : 0;
  const evidenceBonus = Math.min(2, realization.sourceEventIds.length);
  return expressiveBonus + economyBonus + evidenceBonus;
}

function selectAuthorizedRealizations(input: {
  pool: readonly AuthorizedRealization[];
  suppliedReality: readonly AuthorCreativeEvent[];
}): AuthorizedRealization[] {
  const candidates = input.pool
    .filter((realization) => realization.sourceEventIds.length > 0)
    .filter((realization) => clean(realization.text));
  const expressive = candidates.filter(
    (realization) => realization.materialKind === "EXPRESSIVE_PERSPECTIVE",
  );
  const source = expressive.length ? expressive : candidates;

  const selected: AuthorizedRealization[] = [];
  const seenText = new Set<string>();
  const seenProductions = new Set<string>();

  for (const realization of [...source].sort((a, b) => {
    const productionDiversity =
      Number(seenProductions.has(a.sourceProduction)) -
      Number(seenProductions.has(b.sourceProduction));
    if (productionDiversity !== 0) return productionDiversity;
    return realizationScore(b) - realizationScore(a);
  })) {
    const key = clean(realization.text).toLowerCase();
    if (!key || seenText.has(key)) continue;
    selected.push(realization);
    seenText.add(key);
    seenProductions.add(realization.sourceProduction);
    const hasCrossProduction = new Set(selected.map((item) => item.sourceProduction)).size > 1;
    if (hasCrossProduction || selected.length >= 3) break;
  }

  return selected
    .sort((a, b) => {
      const byEvidence =
        realizationEventPosition(a, input.suppliedReality) -
        realizationEventPosition(b, input.suppliedReality);
      return byEvidence || a.originalOrder - b.originalOrder;
    });
}

function protectedExpressiveRealizationsForSynthesis(input: {
  pool: readonly AuthorizedRealization[];
  suppliedReality: readonly AuthorCreativeEvent[];
}): AuthorizedRealization[] {
  return selectAuthorizedRealizations(input)
    .filter((realization) => realization.materialKind === "EXPRESSIVE_PERSPECTIVE");
}

function composeAuthorizedRealizationText(
  selected: readonly AuthorizedRealization[],
): string {
  const sentences = selected
    .map((realization) => sentenceForDirectReality(realization.text))
    .filter(Boolean);
  if (sentences.length <= 1) return sentences[0] ?? "";

  return sentences
    .map((sentence, index) => {
      if (index === 0) return sentence;
      if (/^(?:still|but|and|then|so|yet)\b/i.test(sentence)) return sentence;
      const decapitalized = sentence[0]
        ? sentence[0].toLowerCase() + sentence.slice(1)
        : sentence;
      return `Still, ${decapitalized}`;
    })
    .join(" ");
}

export function assembleAuthorizedRealizations(input: {
  pool: readonly AuthorizedRealization[];
  suppliedReality: readonly AuthorCreativeEvent[];
}): AuthorAssembledCandidate | undefined {
  const selected = selectAuthorizedRealizations(input);
  if (!selected.length) return undefined;

  const rawText = composeAuthorizedRealizationText(selected);
  const sourceEventIds = validStoryEventIds(
    selected.flatMap((realization) => realization.sourceEventIds),
    input.suppliedReality,
    32,
  );
  if (!clean(rawText) || !sourceEventIds.length) return undefined;

  const selectedEventIds = new Set(sourceEventIds);
  const omittedSourceEventIds = input.suppliedReality
    .map((event) => event.id)
    .filter((id) => !selectedEventIds.has(id));

  return {
    production: "ASSEMBLED",
    rawText,
    sourceRealizationIds: selected.map((realization) => realization.id),
    omittedSourceEventIds,
    lines: [{
      order: 1,
      text: rawText,
      sourceEventIds,
      synthesizedFrom: selected.map((realization) => realization.id),
      auditSpans: selected.map((realization) => ({
        exactText: realization.text,
        classification: realization.classification,
        sourceEventIds: [...realization.sourceEventIds],
      })),
    }],
  };
}

export function buildAuthorizedRealizationSynthesisInput(input: {
  subject: string;
  suppliedReality: readonly AuthorCreativeEvent[];
  pool: readonly AuthorizedRealization[];
  forbiddenTexts?: readonly string[];
}): AuthorRealizationSynthesizerInput {
  return {
    subject: clean(input.subject),
    suppliedReality: input.suppliedReality
      .map((event) => ({
        id: clean(event.id),
        text: clean(event.text),
      }))
      .filter((event) => event.id && event.text),
    protectedExpressiveRealizations: protectedExpressiveRealizationsForSynthesis({
      pool: input.pool,
      suppliedReality: input.suppliedReality,
    })
      .map((realization) => ({
        id: clean(realization.id),
        sourceProduction: realization.sourceProduction,
        text: clean(realization.text),
        sourceEventIds: [...realization.sourceEventIds],
        materialKind: "EXPRESSIVE_PERSPECTIVE" as const,
      }))
      .filter((realization) => realization.id && realization.text),
    authorizedRealizationPool: input.pool
      .map((realization) => ({
        id: clean(realization.id),
        sourceProduction: realization.sourceProduction,
        text: clean(realization.text),
        classification: realization.classification,
        sourceEventIds: [...realization.sourceEventIds],
        materialKind: realization.materialKind,
      }))
      .filter((realization) => realization.id && realization.text),
    forbiddenTexts: unique([...(input.forbiddenTexts ?? [])]),
  };
}
export const AUTHORIZED_REALIZATION_SYNTHESIZER_PROMPT = [
  "You are QRE Authorized Realization Synthesizer.",
  ...QRE_AUTHOR_WRITING_BRIEF,
  "WRITING_PREFERENCES guide expression only. They authorize no participants, events, states, or history.",
  "The first Author explored. Auditors established which discoveries have authority.",
  "Your job is to discover what the authorized discoveries mean together.",
  "Authorized realizations are sufficient creative material, not a mandate to reconstruct the event record. Omitted facts are not missing context; use supplied reality selectively and do not restore facts merely to complete coverage.",
  "Turn the strongest authorized material into a moving-text experience: short readable beats that progressively develop meaning across the sequence, building through setup, contrast, turn, payoff, and an optional aftershock when each earns its place.",
  "There is no fixed cut count. Do not infer sequence length from domain, event count, semantic complexity, subject type, or the apparent size of the central observation. Conceptual simplicity does not imply presentation brevity.",
  "The shared writing brief's general cut-count suggestion is not a target or minimum for synthesis; choose the sequence length this experience earns.",
  "Keep each beat immediately readable on a phone. Roughly ten words or fewer is a useful tendency, not a rule: one word, two to seven words, eight to ten words, or a longer immediately readable thought may be right. Do not count mechanically or force fragments.",
  "Setup is useful when it creates anticipation, contrast, attitude, changes how a later line reads, strengthens its impact, or contributes rhythm or character. Setup is waste when it only replays facts for completeness.",
  "EXPRESSIVE_PERSPECTIVE should strongly shape the experience. SUPPLIED_REALITY_MATERIAL may provide setup or contrast when useful. Neither material type automatically becomes the sequence backbone.",
  "protectedExpressiveRealizations names the strongest authorized expressive discoveries found before synthesis. Preserve or intensify their expressive force; do not replace them with a fuller factual inventory.",
  "Every protected expressive realization must remain materially central. Reword, split, compress, or combine it if that improves the experience, but cite each protected id in synthesizedFrom on at least one line.",
  "If factual setup does not make a protected expressive realization hit harder, omit that setup.",
  "The deterministic assembler is evidence of strong discovered meaning. You may expand that meaning across beats when the buildup makes the realization stronger; do not simply copy the assembler, automatically compress below it, or rebuild chronology around it.",
  "Optimize for progressive disclosure, phone readability, tension, rhythm, contrast, attitude, humor, surprise, character, implication, sideways observation, and payoff. Do not optimize for fewest or most lines, complete event coverage, paragraph coherence, explanation, or recap.",
  "Let the viewer connect supported dots across successive beats. Feel it; do not explain it. Each beat must earn its place, and the sequence ends when its experience lands.",
  "Protect the strange; police the facts. The synthesizer's job is to make the strongest moving-text experience from authorized material, not merely make the record more complete.",
  "Discover the supported relationship among the authorized ideas and give it a fresh, progressive realization. Select the material and sequence that make that relationship felt.",
  "Find the strongest realization available across the authorized material.",
  "Authorized ideas may disagree about what deserves attention. Do not resolve that disagreement merely by averaging them, summarizing the episode, or choosing the broadest or most reassuring interpretation.",
  "Choose the thought with the greatest supported cognitive return: the one that most changes what becomes noticeable, arguable, funny, strange, revealing, or worth having an opinion about.",
  "Do not automatically privilege chronology, completion, a positive ending, emotional closure, service success, or the final supplied state. An ending is evidence, not automatically the thesis.",
  "A small resistant, contradictory, absurd, or revealing detail may carry more creative weight than the broad outcome when the authorized material supports that reading.",
  "When one authorized idea merely closes the episode and another opens a sharper supported perception, prefer the perception with greater thought distance and attention value.",
  "Do not manufacture conflict or eccentricity. Strange is valuable only when it is already available in the authorized meanings.",
  "You may combine meanings from multiple authorized realizations, notice setup/payoff relationships, recontextualize an earlier idea with a later idea, omit weaker material, compress several ideas into one thought, give disproportionate attention to the most interesting thing, write completely new wording, use implication, and change what the viewer notices.",
  "You do not need to reconcile every authorized realization. Contradictory authorized readings are alternatives, not obligations to split the difference.",
  "FACT COUNT is not MOVE COUNT. AUTHORIZED REALIZATION COUNT is not OUTPUT LINE COUNT.",
  "Let each beat carry only the language its thought needs, while giving the full sequence the space its buildup and payoff earn.",
  "Make the meaning felt through implication, rhythm, contrast, attitude, or perspective. Let the viewer complete the connection.",
  "Let the ending earn its implication from supplied evidence. A payoff or aftershock may follow the central realization when it strengthens the experience.",
  "World boundary: transform interpretation while keeping concrete occurrence inside supplied reality. New metaphor, implication, rhetorical framing, comparison, attitude, and perspective are available as expression.",
  "PROVENANCE IS LINE-LOCAL. For every output line, synthesizedFrom declares exactly which authorized realizations license that line.",
  "For that line, sourceEventIds MUST be a subset of the union of sourceEventIds attached to the realizations named in synthesizedFrom.",
  "Do not cite or reintroduce a supplied event merely because it exists in SUPPLIED_REALITY. SUPPLIED_REALITY is the closed-world boundary, not an additional authorization pool.",
  "If a fact is not authorized by the realizations named in synthesizedFrom, omit that fact from the line. To use another authorized realization, name its id in synthesizedFrom and remain inside its sourceEventIds.",
  "Fresh wording, metaphor, implication, attitude, perspective, and synthesis are allowed; fresh factual provenance is not.",
  "Before returning, privately verify each line: union the sourceEventIds of its synthesizedFrom realizations, then remove any output sourceEventId not present in that union.",
  "Return only structured JSON.",
].join("\n");
const AUTHORIZED_REALIZATION_SYNTHESIZER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["production", "lines"],
  properties: {
    production: { type: "string", enum: ["ASSEMBLED"] },
    lines: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["order", "text", "synthesizedFrom", "sourceEventIds"],
        properties: {
          order: { type: "integer", minimum: 1 },
          text: { type: "string" },
          synthesizedFrom: {
            type: "array",
            minItems: 1,
            maxItems: 12,
            items: { type: "string", maxLength: 64 },
          },
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
} satisfies LocalModelJsonSchema;

function normalizedAuthorizedRealizationPoolById(
  pool: readonly AuthorizedRealization[],
): Map<string, AuthorizedRealization> {
  return new Map(pool.map((realization) => [clean(realization.id), realization]));
}

export function normalizeSynthesizedAssemblyCandidate(input: {
  value: unknown;
  pool: readonly AuthorizedRealization[];
  suppliedReality: readonly AuthorCreativeEvent[];
}): {
  candidate?: AuthorAssembledCandidate;
  reasons: string[];
} {
  if (!input.value || typeof input.value !== "object") {
    return { reasons: ["synthesizer-output-malformed"] };
  }

  const record = input.value as Record<string, unknown>;
  if (clean(record.production).toUpperCase() !== "ASSEMBLED") {
    return { reasons: ["synthesizer-output-production-invalid"] };
  }

  if (!Array.isArray(record.lines) || record.lines.length < 1) {
    return { reasons: ["synthesizer-output-lines-invalid"] };
  }

  const poolById = normalizedAuthorizedRealizationPoolById(input.pool);
  const reasons: string[] = [];
  const lines: AuthorMemoryMouthLine[] = [];
  const sourceRealizationIds: string[] = [];

  for (const [index, rawLine] of record.lines.entries()) {
    if (!rawLine || typeof rawLine !== "object") {
      reasons.push("synthesizer-output-line-malformed");
      continue;
    }

    const lineRecord = rawLine as Record<string, unknown>;
    const order = Number(lineRecord.order);
    const text = clean(lineRecord.text);
    const synthesizedFrom = stringArray(lineRecord.synthesizedFrom, 12)
      .filter((id) => poolById.has(id));
    const unknownSynthesizedFrom = stringArray(lineRecord.synthesizedFrom, 12)
      .some((id) => !poolById.has(id));
    const selectedEventIds = new Set(
      synthesizedFrom.flatMap((id) => poolById.get(id)?.sourceEventIds ?? []),
    );
    const sourceEventIds = validStoryEventIds(
      lineRecord.sourceEventIds,
      input.suppliedReality,
      32,
    );
    const untraceableSourceEventId = sourceEventIds.some((id) => !selectedEventIds.has(id));

    if (!Number.isInteger(order) || order < 1) reasons.push("synthesizer-output-line-order-invalid");
    if (!text) reasons.push("synthesizer-output-line-empty");
    if (!synthesizedFrom.length || unknownSynthesizedFrom) {
      reasons.push("synthesizer-output-synthesizedFrom-invalid");
    }
    if (!sourceEventIds.length || untraceableSourceEventId) {
      reasons.push("synthesizer-output-sourceEventIds-invalid");
    }

    if (
      Number.isInteger(order) &&
      order >= 1 &&
      text &&
      synthesizedFrom.length &&
      !unknownSynthesizedFrom &&
      sourceEventIds.length &&
      !untraceableSourceEventId
    ) {
      lines.push({
        order,
        text,
        sourceEventIds,
        synthesizedFrom,
      });
      sourceRealizationIds.push(...synthesizedFrom);
    }
  }

  if (reasons.length) return { reasons: unique(reasons) };

  const orderedLines = lines.sort((a, b) => a.order - b.order);
  const rawText = orderedLines.map((line) => line.text).join("\n");
  const selectedEventIds = new Set(orderedLines.flatMap((line) => line.sourceEventIds));

  return {
    reasons: [],
    candidate: {
      production: "ASSEMBLED",
      rawText,
      lines: orderedLines,
      sourceRealizationIds: unique(sourceRealizationIds),
      omittedSourceEventIds: input.suppliedReality
        .map((event) => event.id)
        .filter((id) => !selectedEventIds.has(id)),
    },
  };
}

function exactAuditCoverage(input: {
  text: string;
  spans: readonly AuthorRealityClaimAuditSpan[];
}): boolean {
  const mapped = mapAuthorRealityClaimAuditRanges({
    originalText: input.text,
    spans: input.spans,
  });
  if (!mapped || mapped.unusableReason) return false;
  return !unauditedSubstantiveGapReason({
    originalText: input.text,
    ranges: mapped.ranges,
  });
}

function candidateHasCompletePositiveRealityAudit(
  candidate: AuthorAssembledCandidate,
  suppliedReality: readonly AuthorCreativeEvent[],
): boolean {
  const spans = candidate.lines.flatMap((line) => line.auditSpans ?? []);
  if (!spans.length) return false;
  if (spans.some((span) => span.classification === "UNSUPPORTED_REALITY")) return false;
  if (!spans.every((span) =>
    validStoryEventIds(span.sourceEventIds, suppliedReality, 32).length === span.sourceEventIds.length
  )) {
    return false;
  }

  return exactAuditCoverage({
    text: candidate.rawText,
    spans,
  });
}

function applySynthesisRealityAudit(input: {
  candidate: AuthorAssembledCandidate;
  diagnostic: AuthorRealityClaimAuditDiagnostic;
  suppliedReality: readonly AuthorCreativeEvent[];
}): {
  candidate?: AuthorAssembledCandidate;
  reason?: string;
} {
  if (input.diagnostic.unusableReason) {
    return { reason: input.diagnostic.unusableReason };
  }

  const mapped = mapAuthorRealityClaimAuditRanges({
    originalText: input.candidate.rawText,
    spans: input.diagnostic.spans,
  });
  if (!mapped) {
    return { reason: "synthesis_reality_auditor_span_not_exact" };
  }
  if (mapped.unusableReason) {
    return { reason: mapped.unusableReason };
  }

  const coverageReason = unauditedSubstantiveGapReason({
    originalText: input.candidate.rawText,
    ranges: mapped.ranges,
  });
  if (coverageReason) {
    return { reason: coverageReason };
  }

  const survivingLines: AuthorMemoryMouthLine[] = [];
  let lineStart = 0;

  for (const line of input.candidate.lines) {
    const lineText = line.text;
    const lineEnd = lineStart + lineText.length;

    const lineRanges = mapped.ranges
      .filter((range) => range.start >= lineStart && range.end <= lineEnd)
      .map((range) => ({
        start: range.start - lineStart,
        end: range.end - lineStart,
        span: { ...range.span },
      }));

    const crossingRange = mapped.ranges.some(
      (range) =>
        range.start < lineEnd &&
        range.end > lineStart &&
        !(range.start >= lineStart && range.end <= lineEnd),
    );
    if (crossingRange) {
      return { reason: "synthesis_reality_auditor_span_crosses_line" };
    }

    const lineCoverageReason = unauditedSubstantiveGapReason({
      originalText: lineText,
      ranges: lineRanges,
    });
    if (lineCoverageReason) {
      return { reason: lineCoverageReason };
    }

    const removal = removeUnsupportedClaimSpans({
      originalText: lineText,
      ranges: lineRanges,
    });
    if (removal.unusableReason) {
      return { reason: removal.unusableReason };
    }

    const survivingText = clean(removal.text);
    if (survivingText) {
      survivingLines.push({
        ...line,
        order: survivingLines.length + 1,
        text: survivingText,
        sourceEventIds: [...line.sourceEventIds],
        ...(line.synthesizedFrom?.length
          ? { synthesizedFrom: [...line.synthesizedFrom] }
          : {}),
        auditSpans: removal.survivingSpans.map((span) => ({ ...span })),
      });
    }

    lineStart = lineEnd + 1;
  }

  if (!survivingLines.length) {
    return { reason: "synthesis_reality_auditor_removed_all_lines" };
  }

  const rawText = survivingLines.map((line) => line.text).join("\n");
  const sourceRealizationIds = unique(
    survivingLines.flatMap((line) => line.synthesizedFrom ?? []),
  );
  const selectedEventIds = new Set(
    survivingLines.flatMap((line) => line.sourceEventIds),
  );

  return {
    candidate: {
      ...input.candidate,
      rawText,
      lines: survivingLines,
      sourceRealizationIds,
      omittedSourceEventIds: input.suppliedReality
        .map((event) => event.id)
        .filter((id) => !selectedEventIds.has(id)),
    },
  };
}

function synthesisAuditProductions(
  candidate: AuthorAssembledCandidate,
): AuthorMemoryMouthProduction[] {
  const sourceEventIds = unique(candidate.lines.flatMap((line) => line.sourceEventIds));
  return [
    {
      production: "A",
      lines: [{
        order: 1,
        text: candidate.rawText,
        sourceEventIds,
      }],
    },
    {
      production: "B",
      lines: [{ order: 1, text: ".", sourceEventIds }],
    },
    {
      production: "C",
      lines: [{ order: 1, text: ".", sourceEventIds }],
    },
  ];
}
async function auditSynthesizedAssemblyReality(input: {
  candidate: AuthorAssembledCandidate;
  suppliedReality: readonly AuthorCreativeEvent[];
  pool: readonly AuthorizedRealization[];
}): Promise<AuthorRealityEditorApplyResult & {
  model: string;
  modelCalls: number;
}> {
  const authorizedRealizationById = new Map(
    input.pool.map((realization) => [
      realization.id,
      realization,
    ]),
  );

  const semanticAuthority = unique(
    input.candidate.lines.flatMap((line) =>
      (line.synthesizedFrom ?? [])
        .map(
          (id) =>
            authorizedRealizationById.get(id)?.text ?? "",
        )
        .filter(Boolean),
    ),
  );

  const result = await editDirectAuthorReality({
    suppliedReality: input.suppliedReality,
    productions: synthesisAuditProductions(input.candidate),
    semanticAuthority,
  });

  return {
    ...result,
    model: result.model,
    modelCalls: result.modelCalls,
  };
}

function synthesisFailureResult(input: {
  synthesisInput: AuthorRealizationSynthesizerInput;
  rawOutput?: string;
  reasons: readonly string[];
  model?: string;
  modelCalls?: number;
}): AuthorSynthesisAttemptResult {
  return {
    input: input.synthesisInput,
    rawOutput: input.rawOutput ?? "",
    truthResult: {
      eligible: false,
      reasons: [...input.reasons],
    },
    model: input.model ?? "authorized-realization-synthesizer-fail-closed",
    modelCalls: input.modelCalls ?? 0,
  };
}

type AuthorModelGenerate = typeof localModelGenerate;

function configuredPositiveInteger(
  value: unknown,
): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0
    ? Math.floor(parsed)
    : undefined;
}

function authorizedRealizationSynthesizerOpenRouterMaxTokens(): number | undefined {
  const raw = process.env.QRE_AUTHOR_SYNTHESIZER_OPENROUTER_MAX_TOKENS;
  const value = configuredPositiveInteger(raw);
  if (value) return value;

  if (clean(process.env.QRE_AI_PROVIDER).toLowerCase() === "openrouter") {
    throw new Error("author_realization_synthesizer_openrouter_token_ceiling_unset");
  }

  return undefined;
}

export async function synthesizeAuthorizedRealizations(input: {
  subject: string;
  suppliedReality: readonly AuthorCreativeEvent[];
  pool: readonly AuthorizedRealization[];
  writingProfile?: AuthorBehaviorProfile;
  forbiddenTexts?: readonly string[];
  realityDirect?: boolean;
  generate?: AuthorModelGenerate;
  auditReality?: typeof auditSynthesizedAssemblyReality;
}): Promise<AuthorSynthesisAttemptResult> {
  const synthesisInput = buildAuthorizedRealizationSynthesisInput({
    subject: input.subject,
    suppliedReality: input.suppliedReality,
    pool: input.pool,
    forbiddenTexts: input.forbiddenTexts,
  });

  if (!synthesisInput.authorizedRealizationPool.length) {
    return synthesisFailureResult({
      synthesisInput,
      reasons: ["synthesis-pool-empty"],
    });
  }

  const generate = input.generate ?? localModelGenerate;
  const auditReality = input.auditReality ?? auditSynthesizedAssemblyReality;
  const synthesizerNumPredict =
    configuredPositiveInteger(process.env.QRE_AUTHOR_SYNTHESIZER_NUM_PREDICT) ?? 720;
  let synthesizerOpenRouterMaxTokens: number | undefined;
  try {
    synthesizerOpenRouterMaxTokens = authorizedRealizationSynthesizerOpenRouterMaxTokens();
  } catch (error) {
    return synthesisFailureResult({
      synthesisInput,
      reasons: [
        clean((error as { message?: unknown })?.message) ||
          "author_realization_synthesizer_openrouter_token_ceiling_unset",
      ],
    });
  }
  const result = await generate(
    [
      {
        role: "system",
        content: AUTHORIZED_REALIZATION_SYNTHESIZER_PROMPT,
      },
      {
        role: "user",
        content: JSON.stringify({
          ...synthesisInput,
          ...(input.writingProfile?.confidence ? { WRITING_PREFERENCES: summarizeAuthorBehaviorProfile(input.writingProfile) } : {}),
          instruction:
            "Write the strongest ASSEMBLED realization available from the authorized pool. Use synthesizedFrom IDs from authorizedRealizationPool. Use only sourceEventIds traceable through those IDs.",
        }),
      },
    ],
    "json",
    {
      numPredict: synthesizerNumPredict,
      openRouterMaxTokens: synthesizerOpenRouterMaxTokens,
      temperature: 0.82,
      jsonSchema: AUTHORIZED_REALIZATION_SYNTHESIZER_SCHEMA,
    },
  ).catch(() => undefined);

  if (!result) {
    return synthesisFailureResult({
      synthesisInput,
      reasons: ["authorized_realization_synthesizer_failed"],
    });
  }

  const parsed = parseJson(result.text);
  const normalized = normalizeSynthesizedAssemblyCandidate({
    value: parsed,
    pool: input.pool,
    suppliedReality: input.suppliedReality,
  });

  if (!normalized.candidate) {
    return synthesisFailureResult({
      synthesisInput,
      rawOutput: result.text,
      reasons: normalized.reasons.length ? normalized.reasons : ["synthesizer-output-malformed"],
      model: result.model,
      modelCalls: 1,
    });
  }

  const realityEditor = await auditReality({
  candidate: normalized.candidate,
  suppliedReality: input.suppliedReality,
  pool: input.pool,
}).catch(() => undefined);
  if (!realityEditor) {
    return synthesisFailureResult({
      synthesisInput,
      rawOutput: result.text,
      reasons: ["synthesis_reality_auditor_failed"],
      model: result.model,
      modelCalls: 1,
    });
  }
  const claimAuditor = realityEditor.diagnostics.find(
    (diagnostic) => diagnostic.production === "A",
  );

  const synthesisAudit = claimAuditor
    ? applySynthesisRealityAudit({
        candidate: normalized.candidate,
        diagnostic: claimAuditor,
        suppliedReality: input.suppliedReality,
      })
    : {
        reason: "synthesis-reality-editor-rejected",
      };

  const auditedCandidate =
    synthesisAudit.candidate ?? normalized.candidate;

  const truthResult = verifyAuthorizedAssemblyCandidate({
    candidate: auditedCandidate,
    pool: input.pool,
    forbiddenTexts: input.forbiddenTexts,
    suppliedReality: input.suppliedReality,
    subject: input.subject,
    realityDirect: input.realityDirect,
  });

  const finalTruthResult = synthesisAudit.candidate
    ? truthResult
    : {
        ...truthResult,
        eligible: false,
        reasons: unique([
          ...truthResult.reasons,
          synthesisAudit.reason ?? "synthesis-reality-editor-rejected",
        ]),
      };
  return {
    input: synthesisInput,
    rawOutput: result.text,
    candidate: auditedCandidate,
    claimAuditor,
    realityEditor,
    truthResult: finalTruthResult,
    model: result.model,
    modelCalls: 1 + realityEditor.modelCalls,
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assemblyUnauthorizedResidual(input: {
  rawOutput: string;
  selected: readonly AuthorizedRealization[];
}): string {
  let residual = clean(input.rawOutput).toLowerCase();
  for (const realization of input.selected) {
    const exact = clean(realization.text)
      .toLowerCase()
      .replace(/[.!?]+$/g, "");
    if (!exact) continue;
    residual = residual.replace(new RegExp(escapeRegExp(exact), "g"), " ");
  }
  return clean(
    residual
      .replace(/\b(?:still|and|but|yet|so|then)\b/gi, " ")
      .replace(/[.,;:!?()\-[\]"']/g, " "),
  );
}

function missingProtectedExpressiveRealizationIds(input: {
  candidate: AuthorAssembledCandidate;
  pool: readonly AuthorizedRealization[];
  suppliedReality: readonly AuthorCreativeEvent[];
}): string[] {
  const protectedIds = protectedExpressiveRealizationsForSynthesis({
    pool: input.pool,
    suppliedReality: input.suppliedReality,
  }).map((realization) => realization.id);
  if (!protectedIds.length) return [];

  const usedIds = new Set([
    ...input.candidate.sourceRealizationIds,
    ...input.candidate.lines.flatMap((line) => line.synthesizedFrom ?? []),
  ].map(clean).filter(Boolean));

  return protectedIds.filter((id) => !usedIds.has(id));
}

export function verifyAuthorizedAssemblyCandidate(input: {
  candidate: AuthorAssembledCandidate | undefined;
  pool: readonly AuthorizedRealization[];
  forbiddenTexts?: readonly string[];
  suppliedReality: readonly AuthorCreativeEvent[];
  subject: string;
  realityDirect?: boolean;
}): AuthorAssemblyTruthResult {
  if (!input.candidate) {
    return {
      eligible: false,
      reasons: ["assembler-produced-no-candidate"],
    };
  }

  const poolById = new Map(input.pool.map((realization) => [realization.id, realization]));
  const selected = input.candidate.sourceRealizationIds
    .map((id) => poolById.get(id))
    .filter((realization): realization is AuthorizedRealization => Boolean(realization));
  const missingAuthorizedRealization =
    selected.length !== input.candidate.sourceRealizationIds.length;
  const rawOutput = clean(input.candidate.rawText);
  const resurrectedUnsupported = (input.forbiddenTexts ?? []).some(
    (text) =>
      clean(text) &&
      rawOutput.toLowerCase().includes(clean(text).toLowerCase()),
  );
  const evidenceEventIds = validStoryEventIds(
    input.candidate.lines.flatMap((line) => line.sourceEventIds),
    input.suppliedReality,
    32,
  );
  const missingProtectedExpressiveRealizations =
    missingProtectedExpressiveRealizationIds({
      candidate: input.candidate,
      pool: input.pool,
      suppliedReality: input.suppliedReality,
    });
  const missingSelectedRealizationText = selected.some((realization) =>
    !rawOutput.toLowerCase().includes(clean(realization.text).toLowerCase().replace(/[.!?]+$/g, "")),
  );
  const unauthorizedResidual = assemblyUnauthorizedResidual({
    rawOutput,
    selected,
  });
  const completePositiveRealityAudit = candidateHasCompletePositiveRealityAudit(
    input.candidate,
    input.suppliedReality,
  );
  const addedUnauthorizedMaterial =
    !completePositiveRealityAudit &&
    (missingSelectedRealizationText || Boolean(unauthorizedResidual));

  const scoring = scoreExpressiveMemoryProduction(
  4,
  input.candidate.lines,
  input.suppliedReality,
  input.subject,
  undefined,
  input.realityDirect ?? false,
  input.pool,
);
  const reasons = [
    ...(missingAuthorizedRealization ? ["missing-authorized-realization"] : []),
    ...(resurrectedUnsupported ? ["resurrected-unsupported-realization"] : []),
    ...(evidenceEventIds.length ? [] : ["missing-source-event-ids"]),
    ...(missingProtectedExpressiveRealizations.length
      ? ["assembly-dropped-protected-expressive-realization"]
      : []),
    ...(addedUnauthorizedMaterial
      ? ["assembly-added-unauthorized-material"]
      : []),
    ...scoring.reasons,
  ];

  return {
    eligible:
      scoring.accepted &&
      !missingAuthorizedRealization &&
      !resurrectedUnsupported &&
      evidenceEventIds.length > 0 &&
      missingProtectedExpressiveRealizations.length === 0 &&
      !addedUnauthorizedMaterial,
    reasons,
    candidate: input.candidate,
    scoring: {
      accepted: scoring.accepted,
      score: scoring.score,
      reasons: scoring.reasons,
      lines: scoring.lines.map((line) => ({
        order: line.order,
        text: line.text,
        sourceEventIds: [...line.sourceEventIds],
        accepted: line.accepted,
        score: line.score,
        reasons: [...line.reasons],
      })),
    },
  };
}

function assembledCandidateToMemoryProduction(
  candidate: AuthorAssembledCandidate,
): AuthorMemoryMouthProduction {
  return {
    production: "ASSEMBLED",
    lines: candidate.lines.map((line) => ({
      order: line.order,
      text: line.text,
      sourceEventIds: [...line.sourceEventIds],
      ...(line.synthesizedFrom?.length
        ? { synthesizedFrom: [...line.synthesizedFrom] }
        : {}),
      ...(line.auditSpans?.length
        ? { auditSpans: line.auditSpans.map((span) => ({ ...span })) }
        : {}),
    })),
  };
}

function attributedCameraLanguageAssemblyRealizationIds(input: {
  candidate: AuthorAssembledCandidate;
  truthResult: AuthorAssemblyTruthResult;
  pool: readonly AuthorizedRealization[];
}): string[] {
  const cameraRejectedLines = input.truthResult.scoring?.lines.filter((line) =>
    line.reasons.includes("camera-language"),
  ) ?? [];
  if (!cameraRejectedLines.length) return [];

  const poolById = new Map(input.pool.map((realization) => [realization.id, realization]));
  const excluded = new Set<string>();
  const usedCandidateLineIndexes = new Set<number>();

  for (const scoredLine of cameraRejectedLines) {
    let candidateLineIndex = input.candidate.lines.findIndex((line, index) =>
      !usedCandidateLineIndexes.has(index) &&
      line.order === scoredLine.order &&
      clean(line.text) === clean(scoredLine.text),
    );
    if (candidateLineIndex < 0) {
      candidateLineIndex = input.candidate.lines.findIndex((line, index) =>
        !usedCandidateLineIndexes.has(index) &&
        line.order === scoredLine.order,
      );
    }
    if (candidateLineIndex < 0) continue;

    usedCandidateLineIndexes.add(candidateLineIndex);
    const synthesizedFrom = input.candidate.lines[candidateLineIndex]?.synthesizedFrom ?? [];
    if (synthesizedFrom.length === 1) {
      excluded.add(synthesizedFrom[0]!);
      continue;
    }

    for (const id of synthesizedFrom) {
      const realization = poolById.get(id);
      if (realization && hasAuthorCameraLanguage(realization.text)) {
        excluded.add(id);
      }
    }
  }

  return [...excluded];
}

function retryAssemblyWithoutAttributedCameraLanguage(input: {
  candidate: AuthorAssembledCandidate | undefined;
  truthResult: AuthorAssemblyTruthResult;
  pool: readonly AuthorizedRealization[];
  forbiddenTexts: readonly string[];
  suppliedReality: readonly AuthorCreativeEvent[];
  subject: string;
  realityDirect: boolean;
}): {
  candidate?: AuthorAssembledCandidate;
  truthResult?: AuthorAssemblyTruthResult;
  excludedRealizationIds: string[];
} {
  if (!input.candidate || input.truthResult.eligible) {
    return { excludedRealizationIds: [] };
  }
  const excludedRealizationIds = attributedCameraLanguageAssemblyRealizationIds({
    candidate: input.candidate,
    truthResult: input.truthResult,
    pool: input.pool,
  });
  if (!excludedRealizationIds.length) return { excludedRealizationIds };

  const excluded = new Set(excludedRealizationIds);
  const filteredPool = input.pool.filter((realization) => !excluded.has(realization.id));
  if (!filteredPool.length || filteredPool.length === input.pool.length) {
    return { excludedRealizationIds };
  }

  const candidate = assembleAuthorizedRealizations({
    pool: filteredPool,
    suppliedReality: input.suppliedReality,
  });
  const truthResult = verifyAuthorizedAssemblyCandidate({
    candidate,
    pool: filteredPool,
    forbiddenTexts: input.forbiddenTexts,
    suppliedReality: input.suppliedReality,
    subject: input.subject,
    realityDirect: input.realityDirect,
  });

  return {
    candidate,
    truthResult,
    excludedRealizationIds,
  };
}
export async function editDirectAuthorReality(input: {
  suppliedReality: readonly AuthorCreativeEvent[];
  productions: readonly AuthorMemoryMouthProduction[];
  semanticAuthority?: readonly string[];
}): Promise<AuthorRealityEditorApplyResult & {
  model: string;
  modelCalls: number;
}> {
  if (
    !input.productions.length ||
    input.productions.length > 3 ||
    new Set(
      input.productions.map((production) => production.production),
    ).size !== input.productions.length
  ) {
    throw new Error(
      "Claim Auditor requires one to three distinct productions",
    );
  }

  const semanticAuthority = unique(
    (input.semanticAuthority ?? [])
      .map(clean)
      .filter(Boolean),
  );

  const result = await localModelGenerate(
    [
      {
        role: "system",
        content: [
          "You are the Claim Auditor.",
          "The supplied reality controls what actually happened.",
          "The text has already been authored. Do not author it again.",
          "Judge independently removable exact text spans from the authored productions.",
          "Before partitioning an expression into spans, determine its rhetorical or interpretive meaning as a whole in the context of supplied reality and AUTHORIZED_SEMANTIC_AUTHORITY, then determine what additional documentary reality that meaning requires. Do not classify a subject, predicate, or fragment as UNSUPPORTED_REALITY solely because it reads literally in isolation when the whole expression functions as authorized rhetoric; if the whole expression still requires an unsupplied concrete or mental occurrence, classify that proposition as UNSUPPORTED_REALITY.",
          "A rhetorical or figurative reading does not exempt an asserted completion, transition, outcome, or resulting state: if the viewer must believe that state or outcome actually occurred, it remains UNSUPPORTED_REALITY unless supplied reality establishes it.",
          "First partition each authored production into atomicClaimSpans, then classify each atomicClaimSpan.",
          "Each atomicClaimSpan must be the smallest exact, non-overlapping, semantically independently classifiable authored substring needed to distinguish SUPPORTED_REALITY, KEEP_EXPRESSION, and UNSUPPORTED_REALITY.",
          "A mixed authored sentence must not be represented by one audit span when different semantic claim units inside it can receive different classifications.",
          "A sentence or clause containing separable substantive material that one classification cannot truthfully describe is not a valid atomicClaimSpan.",
          "Audit at the smallest semantically independent claim unit that can be exactly identified in the authored text.",
          "You may identify smaller exact substrings inside a sentence when one sentence mixes supported reality, allowable expression, and unsupported reality.",
          "Do not classify an entire sentence UNSUPPORTED_REALITY merely because one atomic claim inside it is unsupported.",
          "Do not classify an entire sentence KEEP_EXPRESSION when it embeds an unsupported concrete or mental proposition.",
          "Split authored material into smaller exact claim-bearing spans when necessary.",
          "Classify each span as exactly SUPPORTED_REALITY, KEEP_EXPRESSION, or UNSUPPORTED_REALITY.",
          "SUPPORTED_REALITY means exact authored material directly established by supplied reality.",
          "KEEP_EXPRESSION means exact authored amplification or derived meaning of supplied reality that introduces no new concrete occurrence.",
          "UNSUPPORTED_REALITY means exact authored material requiring additional reality.",
          "Classification is about what must be true for the authored span to be valid.",
          "Expressiveness does not excuse an unsupported proposition.",
          "REALITY STAYS FIXED. MEANING MAY MOVE.",
          "REALITY IS CLOSED. DISCOURSE IS OPEN.",
          "AUTHORIZED_SEMANTIC_AUTHORITY, when provided, contains upstream meanings that have already survived grounding and semantic authorization.",
          "AUTHORIZED_SEMANTIC_AUTHORITY is authority for discourse, framing, interpretation, implication, rhetorical treatment, metaphor, personification, humor, attitude, and derived significance only.",
          "AUTHORIZED_SEMANTIC_AUTHORITY is NOT supplied reality and must never establish an additional participant, event, action, interaction, object, place, chronology, cause, outcome, physical state, mental state, measurement, property, sensory detail, or other concrete occurrence.",
          "When authored language is a fresh expression of an AUTHORIZED_SEMANTIC_AUTHORITY meaning, do not require it to paraphrase that authority literally.",
          "Judge what additional concrete reality the fresh expression requires after its authorized rhetorical or interpretive meaning is recognized.",
          "If the fresh expression remains within authorized semantic meaning and requires no additional concrete occurrence, it may qualify as KEEP_EXPRESSION.",
          "If it converts semantic authority into a new concrete fact, classify the unsupported concrete proposition as UNSUPPORTED_REALITY.",
          "New language, perspective, implication, category reference, rhetorical speaker, personification, metaphor, and discovered significance are allowed when they do not require additional world participation.",
          "Mention is not participation. A category, role, group, narrator, institution, object voice, place voice, or social class may appear in expressive language without becoming a factual participant in the occurrence.",
          "Do not ask whether the span mentions an unsupplied entity. Ask whether understanding it requires believing a particular additional entity actually participated in the supplied world.",
          "POV licenses voice, not events. A rhetorical speaker is not automatically a literal actor, observer, thinker, or source of additional history.",
          "A derived characterization of supplied reality is not automatically another fact in supplied reality.",
          "A rhetorical verb or predicate may characterize, personify, or reframe a supplied occurrence without asserting a second literal action, observation, interaction, or event.",
          "Do not convert rhetorical grammar into documentary ontology: if the authored predicate can be understood entirely as a characterization of already-supplied reality, test that rhetorical meaning before treating its surface verb as an additional concrete occurrence.",
          "When AUTHORIZED_SEMANTIC_AUTHORITY supports that characterization and the viewer need not believe anything else happened, classify the characterization as KEEP_EXPRESSION rather than inventing a literal occurrence behind the rhetoric.",
          "Ask whether understanding the authored characterization requires believing that an additional concrete occurrence happened.",
          "If no additional concrete occurrence is required, the span may qualify as KEEP_EXPRESSION even when the exact characterization was not supplied.",
          "KEEP_EXPRESSION may characterize, interpret, reframe, compress, compare, intensify, abstract, or change the perceived significance of supplied material without becoming an additional occurrence.",
          "Derived perception of intensity, density, significance, contrast, pattern, atmosphere, emphasis, relationship, progression, transformation, salience, or experiential character is allowed only when it does not require another concrete occurrence.",
          "Do not treat experiential character or perceived density as an asserted mental state unless the span requires a specific experiencer's private state.",
          "UNSUPPORTED_REALITY remains required for any additional participant, event, action, interaction, participant behavior, physical relation, location, object, chronology, causal occurrence, observed occurrence, mental state, or outcome.",
          "Universal authority test: strip away rhetoric, metaphor, POV, personification, generalized reference, abstraction, comparison, implication, interpretation, attitude, and discovered significance; then ask what additional thing the viewer must believe actually happened.",
          "If the answer is nothing additional, the span may be KEEP_EXPRESSION. If the answer requires an additional participant, event, action, interaction, observation, mental state, location, object, chronology, cause, outcome, or concrete history, it requires supplied evidence.",
          "First ask whether the span asserts or requires any additional concrete occurrence beyond supplied evidence.",
          "If it requires additional reality that supplied evidence directly establishes, classify SUPPORTED_REALITY.",
          "If it introduces no new concrete occurrence and can function as derived meaning, rhetoric, evaluation, metaphor, humor, attitude, or framing of supplied reality, classify KEEP_EXPRESSION.",
          "If it requires additional concrete occurrence that supplied evidence does not directly establish, classify UNSUPPORTED_REALITY.",
          "Otherwise classify UNSUPPORTED_REALITY.",
          "Evidence licenses only what it establishes.",
          "A supplied object, entity, event, action, state, or relationship licenses that supplied reality only.",
          "It does not license unsupplied measurements, quantities, colors, temperatures, materials, sensory properties, physical attributes, physical manifestations, methods, components, environmental details, causes, outcomes, mental states, preferences, motives, or other concrete specifics.",
          "Do not infer facts from common sense, world knowledge, domain familiarity, likelihood, typical consequences, implication, association, narrative convention, or what usually happens.",
          "An action does not establish its method, manner, tool, component, motive, preference, success, failure, resistance, ownership, or outcome unless supplied.",
          "A state or emotion does not establish bodily behavior, visible manifestation, private thought, preference, cause, or later continuity unless supplied.",
          "Chronology does not establish causality, resolution, transition mechanism, urgency, or duration beyond what is supplied.",
          "An event or object does not establish an unreported measurement, quantity, sensory property, material, color, temperature, location, environmental condition, physical effect, or neighboring attribute.",
          "A supplied specificity becomes usable reality: if the authored span uses the supplied exact specificity, classify that portion as SUPPORTED_REALITY when it is otherwise faithful.",
          "Do not infer neighboring properties from a supplied property.",
          "Mental propositions are reality too: wanting, preferring, noticing, remembering, forgetting, feeling, deciding, liking, disliking, satisfaction, offense, expectation, or motive are UNSUPPORTED_REALITY unless supplied evidence establishes them.",
          "Physical and sensory propositions are reality too: visible bodily motion, contact, texture, smell, sound, taste, temperature, pressure, weight, volume, speed, amount, material, or environmental condition are UNSUPPORTED_REALITY unless supplied evidence establishes them.",
          "Missing specificity must redirect creative pressure onto supplied reality itself, not complete the missing attribute.",
          "KEEP_EXPRESSION may amplify supplied reality through derived significance, relational meaning, attitude, absurdity, tension, contrast, metaphor, rhetorical role, emphasis, or evaluative framing only when the span introduces no new concrete occurrence.",
          "Derived meaning may say a supplied event mattered, changed how another supplied event reads, became setup, became payoff, felt less accidental, or gained significance, provided it does not add an unsupplied event, action, participant, object, place, physical state, mental state, cause, chronology, outcome, property, measurement, sensory detail, or state change.",
          "A rhetorical characterization of an established event may survive when it does not require another event, property, cause, state, motive, or outcome to be true.",
          "Do not automatically treat a word as safe or unsafe based on vocabulary alone.",
          "Judge what proposition the span requires in context.",
          "If a phrase requires a literal unsupplied event, action, participant, object, place, property, measurement, quantity, sensory detail, manifestation, method, cause, outcome, physical state, mental state, or state change, classify that phrase UNSUPPORTED_REALITY.",
          "If it is derived meaning or rhetorical framing of supplied reality and introduces no new concrete occurrence, classify KEEP_EXPRESSION.",
          "Do not invent or assume participation, role participation, objects, places, actions, interactions, environments, observations, reactions, sensations, preferences, thoughts, causes, outcomes, or concrete history.",
          "Do not classify an entire production as one claim when smaller independently removable claims exist.",
          "Do not hide an unsupported proposition inside a larger KEEP_EXPRESSION span.",
          "If a sentence contains both safe rhetoric and an unsupported concrete or mental claim, separate them when exact authored substrings permit safe deterministic deletion.",
          "UNKNOWN ATTRIBUTE -> DO NOT COMPLETE. KNOWN THING -> AMPLIFY THE KNOWN THING.",
          "Do not rewrite, improve, summarize, paraphrase, replace, repair, or create prose.",
          "Do not substitute words, reorder words, or generate replacement prose.",
          "Return only judgments tied to exact authored text.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          ...buildAuthorRealityEditorPayload(input),
          ...(semanticAuthority.length
            ? {
                AUTHORIZED_SEMANTIC_AUTHORITY:
                  semanticAuthority,
              }
            : {}),
        }),
      },
    ],
    "json",
    {
      numPredict: 750,
      openRouterMaxTokens: 1800,
      temperature: 0.08,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["audits"],
        properties: {
          audits: {
            type: "array",
            minItems: input.productions.length,
            maxItems: input.productions.length,
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "production",
                "atomicClaimSpans",
              ],
              properties: {
                production: {
                  type: "string",
                  enum: input.productions.map(
                    (production) =>
                      production.production,
                  ),
                },
                atomicClaimSpans: {
                  type: "array",
                  minItems: 0,
                  maxItems: 64,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: [
                      "exactText",
                      "classification",
                      "sourceEventIds",
                      "atomicity",
                    ],
                    properties: {
                      exactText: {
                        type: "string",
                      },
                      classification: {
                        type: "string",
                        enum: [
                          "SUPPORTED_REALITY",
                          "KEEP_EXPRESSION",
                          "UNSUPPORTED_REALITY",
                        ],
                      },
                      atomicity: {
                        type: "string",
                        enum: [
                          "SMALLEST_INDEPENDENT_CLASSIFIABLE_UNIT",
                        ],
                      },
                      sourceEventIds: {
                        type: "array",
                        minItems: 0,
                        maxItems: 32,
                        items: {
                          type: "string",
                          maxLength: 64,
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
    },
  );

  return {
    ...applyAuthorRealityEditorEdits({
      productions: input.productions,
      auditorResponse: parseJson(result.text),
    }),
    model: result.model,
    modelCalls: 1,
  };
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
      openRouterMaxTokens: 1200,
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
  const assignments = normalizeDirectAuthorProvenanceAssignments(parsed);

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

export function buildDirectAuthorMemoryMessages(input: {
  subject: string;
  suppliedReality: readonly AuthorCreativeEvent[];
  approvedMeaning?: {
    perception: string;
    relationship: string;
    evidenceEventIds: string[];
  };
  semanticScopeSearchInstruction?: string;
}): Array<{
  role: "system" | "user";
  content: string;
}> {
  const systemDoctrine = [
    "You are the Author.",
    ...QRE_CREATIVE_OPERATING_DOCTRINE,
    ...QRE_AUTHOR_WRITING_BRIEF,
    "Maximize meaningful inference while maintaining grounding.",
    "Keep every concrete participant, event, action, interaction, object, place, physical behavior, observation, mental state, sensory fact, causality, and outcome inside supplied reality.",
    ...(input.approvedMeaning
      ? [
          "APPROVED_MEANING is already-authorized semantic authority for expression, recontextualization, compression, questioning, judgment, humor, attitude, implication, and derived significance.",
          "APPROVED_MEANING is NOT supplied reality. It authorizes no concrete participant, event, action, interaction, object, place, chronology, cause, outcome, physical state, mental state, observation, or other concrete occurrence.",
          "Concrete facts and occurrences remain bounded exclusively by REALITY.",
          "Write three independent expressive treatments of the same APPROVED_MEANING, not three new Discovery searches from raw reality.",
        ]
      : [
          "Write three independent attempts.",
        ]),
    "In each text field, separate moving-text cuts with newline characters. Return public words only; private thought and explanation stay private.",
    ...(input.semanticScopeSearchInstruction
      ? [input.semanticScopeSearchInstruction]
      : []),
    "Return only three attempts.",
  ];

  return [
    {
      role: "system",
      content: systemDoctrine.join("\n"),
    },
    {
      role: "user",
      content: JSON.stringify({
        SUBJECT: input.subject,
        REALITY: directCreativeRealityText(input.suppliedReality),
        ...(input.approvedMeaning
          ? {
              APPROVED_MEANING: input.approvedMeaning,
            }
          : {}),
        instruction:
          "Return exactly three attempts using the required schema.",
      }),
    },
  ];
}

export async function generateDirectAuthorMemoryProductions(input: {
  subject: string;
  suppliedReality: readonly AuthorCreativeEvent[];
  approvedMeaning?: {
    perception: string;
    relationship: string;
    evidenceEventIds: string[];
  };
  semanticScopeSearchInstruction?: string;
}): Promise<{
  text: string;
  model: string;
  provider: "local";
}> {
  return localModelGenerate(
    buildDirectAuthorMemoryMessages(input),
    "json",
    {
      numPredict: 1600,
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
  productionMajorMouth: boolean,
): string {
  if (productionMajorMouth) {
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
  writingProfile?: AuthorBehaviorProfile;
  requestedLens?: string;
  memory?: readonly string[];
  domainContext?: AuthorDomainContext;
}): Promise<{
  scenes: AuthorCreativeGroundedScene[];
  model: string;
  modelCalls: number;
  diagnostics: {
    plan: AuthorSemanticPlan;
    creativeNotice: AuthorCreativeNotice;
    storyGravity: AuthorStoryGravity;
    failureLessons: AuthorCreativeFailureLesson[];
    privateConceptions: AuthorCreativePrivateConception[];
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
        auditSpans?: AuthorRealityClaimAuditSpan[];
        accepted: boolean;
        score: number;
        reasons: string[];
      }>;
    }>;
    authorizedRealizationPool?: AuthorizedRealization[];
    assemblerRawOutput?: string;
    assemblerTruthResult?: AuthorAssemblyTruthResult;
    synthesisAttempt?: AuthorSynthesisAttemptResult;
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
  const isIdentityMode = experienceMode === "IDENTITY";
  const usesProductionMajorMouth = isMemoryMode || isIdentityMode;
  const directCreativeAuthorExperiment =
    isMemoryMode && directCreativeAuthorExperimentEnabled();
  const directAuthorRealityEditorExperiment =
    directCreativeAuthorExperiment && authorRealityEditorExperimentEnabled();
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
    isIdentityMode &&
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
          "Discovery owns the approved meaning. Runtime identifies the authorized reality. Your responsibility is evidence grouping and sequence shape.",
          "Organize APPROVED_MEANING using AUTHORIZED_EVIDENCE. Preserve that meaning rather than rediscovering or replacing it.",
          "AUTHORIZED_EVIDENCE is the factual material available to this experience.",
          "Build the strongest sequence from authorized event IDs and preserve the supplied relationships that make the experience meaningful.",
          "Let the material determine the number of beats. A beat may contain one event or several tightly related events when grouping creates a stronger unit of experience.",
          "Compression is structural, not destructive. Grouping changes organization while keeping the selected reality available to realization.",
          "Use sequence to create room for progression, contrast, accumulation, interruption, return, reveal, callback, or payoff when supported by supplied material and approved meaning.",
          "The plan is structural rather than viewer-facing. Represent what each beat carries through its authorized event IDs.",
          "Every authorized evidence item remains represented in the plan. You may intentionally revisit an authorized event ID in later beats when that strengthens the arrangement. List those IDs in revisitEventIds; otherwise return an empty list.",
          "Revisiting evidence is a presentation choice. It does not establish another occurrence or prove that an event happened again.",
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
          APPROVED_MEANING: {
            perception: selected.perception,
            relationship: selected.relationship,
            evidenceEventIds: selected.evidenceEventIds,
          },
          DERIVED_MEANING: input.creativeDiscovery.derivedMeaning ?? { kind: "DERIVED_MEANING", relations: [] },
          instruction:
            "Return the strongest structural beat sequence using the authorized evidence IDs. DERIVED_MEANING contains approved alternative interpretations, not additional facts or occurrences; use only what serves the approved meaning without combining every alternative. Preserve every authorized evidence item somewhere in the sequence; group related evidence when that strengthens the experience.",
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
        required: ["beats", "revisitEventIds"],
        properties: {
          revisitEventIds: {
            type: "array",
            maxItems: 32,
            items: { type: "string", maxLength: 64 },
          },
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
        derivedMeaning: input.creativeDiscovery.derivedMeaning,
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
    privateConceptions: lensSearch.privateConceptions,
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
  let directAuthorRealityEditorModelCalls = 0;
  let authorizedRealizationSynthesisModelCalls = 0;
  let authorizedRealizationPool: AuthorizedRealization[] = [];
  let assembledCandidate: AuthorAssembledCandidate | undefined;
  let assemblyTruthResult: AuthorAssemblyTruthResult | undefined;
  let deterministicAssemblerRawOutput: string | undefined;
  let deterministicAssemblyTruthResult: AuthorAssemblyTruthResult | undefined;
  let synthesisAttempt: AuthorSynthesisAttemptResult | undefined;
  const assembledMemoryProductions: AuthorMemoryMouthProduction[] = [];
  if (skipExpressiveMouth) {
    mouthFallbackReason = "no viable expressive treatments; skipped Mouth and returned deterministic Bare Reality";
  }
  // D is already built deterministically downstream. Mixing a literal control
  // into the expressive writing request invites all candidates to copy it.
  const usesWholeProductionSelection = isIdentityMode || (isMemoryMode && lensSearchEnabled);
  const writingTreatmentAssignments = usesProductionMajorMouth && lensSearchEnabled
    ? expressiveMouthTreatmentAssignments({
        assignments: treatmentAssignmentsForMouth,
        privateConceptions: lensSearch.privateConceptions,
        selected,
        suppliedReality: input.suppliedReality,
      })
    : treatmentAssignmentsForMouth;
  const privateCreativeField = lensSearch.privateConceptions.map((conception) => ({
    id: conception.id,
    sourceCandidateId: conception.sourceCandidateId,
    evidenceEventIds: [...conception.evidenceEventIds],
    conception: conception.conception,
  }));
  const minimumExpressiveCuts = isMemoryMode && lensSearchEnabled && !directCreativeAuthorExperiment ? 3 : 1;
  const mouthResult = directCreativeAuthorExperiment
    ? await generateDirectAuthorMemoryProductions({
        subject: input.subject,
        suppliedReality: input.suppliedReality,
        approvedMeaning: {
          perception: selected.perception,
          relationship: selected.relationship,
          evidenceEventIds: [...selected.evidenceEventIds],
        },
      }).catch((error: unknown) => {
        mouthFallbackReason =
          clean((error as { message?: unknown })?.message) ||
          "direct_creative_author_model_failed";
        return {
          text: buildDeterministicMouthFallback(
            plan,
            input.suppliedReality,
            usesProductionMajorMouth,
          ),
          model: "deterministic-bare-direct-author-fallback",
          provider: "local" as const,
        };
      })
    : skipExpressiveMouth
    ? {
        text: buildDeterministicMouthFallback(plan, input.suppliedReality, usesProductionMajorMouth),
        model: "deterministic-bare-mouth-skip",
        provider: "local" as const,
      }
    : await localModelGenerate(
    captureMouthRequest([
      {
        role: "system",
        content: isMemoryMode ? [
          "You are QRE Mouth.",
          ...QRE_CREATIVE_OPERATING_DOCTRINE,
          ...QRE_AUTHOR_WRITING_BRIEF,
          "WRITING_PREFERENCES guide wording, rhythm, and nomination only. They authorize no participants, events, states, or history.",
          "Take expressive direction from APPROVED_MEANING and PRIVATE_CREATIVE_FIELD. The field is shared private cognition: use it for pressure, relationship, and possibility, not viewer-facing copy.",
          "PRIVATE_CREATIVE_FIELD is optional creative cognition. Mouth may use it, combine it, ignore it, or discover a stronger rhetorical stance directly from SUPPLIED_REALITY.",
          "Use SUPPLIED_REALITY as the full available factual evidence. Unused facts remain preserved; sourceEventIds authorize each expressive cut independently of cut position.",
          "CREATIVE_TREATMENTS supplies public production identities and compatibility anchors. A/B/C may draw from the entire private field, combine or ignore field entries, and must develop meaningfully distinct realizations.",
          "Before writing, silently choose the most interesting rhetorical stance available inside the authorized world.",
          "A rhetorical speaker is not necessarily the factual actor.",
          "The subject, an object or detail already present in supplied reality, or an outside narrator may temporarily carry rhetorical attitude without becoming a literal factual speaker.",
          "Rhetorical speech, personification, opinion, judgment, social observation, attitude, implication, comparison, and self-aware contradiction are discourse, not documentary events.",
          "Convert authorized meaning into attitude, humor, rhetorical POV, judgment, implication, contradiction, comparison, personification, object/subject voice, generalized or social observation, or sharp observation when reality supports it.",
          "The viewer should experience the attitude, not receive an explanation of the attitude.",
          "Prefer a line that has a point of view over a line that merely describes significance.",
          "Prefer specific attitude arising from this event over generic cleverness.",
          "Nominate the viable expressive production whose whole sequence creates the strongest fact-dependent inference, attention movement, character, and earned surprise. Choose that strength over brevity or event coverage alone.",
          "Runtime preserves deterministic Bare Reality D independently. Return the listed expressive productions only.",
        ].join("\n") : [
          "You are QRE Mouth.",
          ...QRE_CREATIVE_OPERATING_DOCTRINE,
          "You receive supplied reality, approved meaning, an evidence arrangement, and optionally an assigned perceptual treatment. Realize the strongest perception this material earns.",
          "Make the meaning felt through the writing itself. Let the receiver connect the dots and participate in creating the meaning.",
          "Maximize meaningful inference while maintaining grounding. Choose words that open a supported reading beyond their literal information.",
          "Find the distinctive detail, relationship, contrast, or implication that gives this experience its pressure. Give that material disproportionate significance.",
          "Treat Lens as perceptual treatment: let it change how the existing reality is noticed, felt, and understood.",
          "Rhetorical transformation is wide open. Let attitude, implication, status, humor, personification, metaphor, perspective, and scale carry the treatment.",
          "Keep the rhetorical world in expression and every concrete world commitment inside supplied evidence.",
          "Concrete reality comes from the supplied evidence carried by each beat and, for A/B/C, from each expressive line's declared sourceEventIds.",
          "Preserve supplied specificity exactly when it earns public attention. Operational anchors can carry identity, contrast, rhythm, or meaning; unused anchors remain in provenance.",
          "Build the full perception privately. ",
          "Let the opening establish the charged detail or tension. Let any continuation change its significance or deepen the supported inference.",
          "Earn the ending from supplied evidence. Let the landing leave an implication alive for the receiver.",
          "Let the charged detail lead and let the landing change how it registers. A supplied ending state may be used, omitted, or placed earlier when that gives the strongest grounded realization.",
          "Make the expressive connection legible through the cuts themselves. Choose precise, felt language that carries the character of this material over an abstract label for its emotional arc.",
          "Use no more language than the realization earns.",
          "Each public line is a moving-text cut. Give it one attention-bearing thought that can register on its own and gain force from the surrounding cuts.",
          "Build the scrolling experience, including the anticipation and changes in pressure that make its landing matter. Keep a setup, turn, or callback when it adds a distinct inference; compress each cut while preserving that movement across cuts.",
          "One word may establish the charged detail. A leading phrase may open an inference. A short sentence may deliver the turn. Use a longer line when its added words earn the attention.",
          "Prefer compact cuts with room for the viewer to feel the connection. Let the strongest supported implication land, even when it draws on only part of the evidence corridor.",
          "Let the material determine rhythm, voice, form, and length. Every word should strengthen perception, character, consequence, or surprise.",
          "Discover aggressively, interpret boldly, compress freely, and give disproportionate attention to the interesting thing. Surprise must be discovered from the material rather than cosmetically added.",
          "Structure Planner may provide structural and ordering affordances. Creative cognition discovers relationships and perception movement. Mouth owns final verbal realization and may compress, combine, omit, or express selectively inside those constraints. Presentation choices are outside Author.",
          "Take expressive direction from the approved meaning and shared private creative field. Let each realization discover its opening, movement, and landing within supplied reality.",
            "The private field is optional creative cognition. It supplies creative pressure, not finished copy, new facts, a required source, or a line-count template. Mouth may ignore it and discover a stronger rhetorical stance directly from supplied reality.",
          ...(realityDirect ? [
            "REALITY-DIRECT MODE: find the perception the supplied facts themselves make possible. Give their detail and relationships expressive force.",
          ] : []),
          ...(isMemoryMode ? [
            "MEMORY REALIZATION: supplied beats are available evidence. One detail, a combination, or the whole corridor may carry the experience.",
            "Let facts combine when their relationship creates a stronger perception, or let one fact dominate when it contains the experience.",
            "A sequence is complete when its supported perception lands. All unused supplied facts remain preserved in provenance.",
            ...(lensSearchEnabled ? [
              "PRODUCTION PACING: aim for 4–6 short moving-text cuts per expressive production, with at least 3 nonempty cuts. Compress the wording inside each cut while giving the whole sequence room to develop.",
              "Favor 1–7 words per cut. Give a single charged word its own arrival when it earns one; keep a longer line only when its added words strengthen the experience.",
              "Make each arrival matter: open an unresolved tension, let later attention build or redirect it, and earn a turn or surprise. Choose the shape this material wants; a role list is not a fixed sequence template.",
              "Separate distinct attention-bearing thoughts so the viewer encounters them in successive cuts. Develop new perception rather than splitting a recap into fragments or repeating a thought to meet the count.",
              "CREATIVE_TREATMENTS assigns public production identities. PRIVATE_CREATIVE_FIELD is shared across A/B/C; each production may combine, ignore, reinterpret, or recontextualize entries from the field.",
              "Before writing, silently choose the most interesting rhetorical stance available inside the authorized world.",
              "A rhetorical speaker is not necessarily the factual actor.",
              "The subject, an object or detail already present in supplied reality, or an outside narrator may temporarily carry rhetorical attitude without becoming a literal factual speaker.",
              "Rhetorical speech, personification, opinion, judgment, social observation, attitude, implication, comparison, and self-aware contradiction are discourse, not documentary events.",
              "Convert authorized meaning into attitude, humor, rhetorical POV, judgment, implication, contradiction, comparison, personification, object/subject voice, generalized or social observation, or sharp observation when reality supports it.",
              "The viewer should experience the attitude, not receive an explanation of the attitude.",
              "Prefer a line that has a point of view over a line that merely describes significance.",
              "Prefer specific attitude arising from this event over generic cleverness.",
              "Treat approved alternatives as possible readings. Choose the relationship each production can make felt.",
              "For A/B/C, arrange expressive lines around the strongest thought. Their count and sequence follow the realization.",
              "Every A/B/C expressive line declares sourceEventIds for the supplied evidence that authorizes its perception.",
              "Do not simply copy PRIVATE_CREATIVE_FIELD wording. Let field pressure shape implication, rhythm, contrast, attitude, and significance while public factual commitments remain controlled by SUPPLIED_REALITY and each line's sourceEventIds.",
              "Amplify the supported meaning through rhetorical scale, perspective, status, double meaning, or personification. Keep concrete participants, actions, states, chronology, and outcomes inside the cited facts.",
              "Use private hiddenInference as optional perceptual direction. Give the viewer the realization itself.",
              "Nominate the viable expressive production with the strongest fact-dependent perception, meaningful inference, specificity, surprise, and precision.",
              "Complete each thought. Let the ending carry its earned implication.",
              "Bare Reality D preserves supplied facts as the control. Use D as the fallback when the accepted expressive set is empty.",
            ] : [
              "Realize the approved meaning with a distinctive voice and supported implication. Let the supplied relationships determine what earns expression.",
            ]),
            lensSearchEnabled
              ? "Return A/B/C expressive productions for the listed identities. Runtime independently preserves deterministic Bare Reality D from the evidence arrangement."
              : "Return one production object for each listed production identity. A/B/C may use as little of the supplied reality as their strongest perception requires. D is the factual control.",
            "For D, BEAT EVIDENCE IS ORDERED AUTHORITY. For A/B/C, order is expressive order and sourceEventIds are grounding authority.",
            "Keep factual chronology fixed. Expressive attention may compress, combine, omit, or select without tracking beat-by-beat chronology.",
          ] : isIdentityMode ? [
            "IDENTITY REALIZATION: keep the stable subject, participant/context information, preferences, relationships, recurring identity context, approved perception, supplied reality, and provenance alive as identity material.",
            "Identity semantics are not Memory semantics. Do not pretend stable identity context is a new current occurrence, visit, action, or chronology.",
            "In IDENTITY, the supplied SUBJECT name is authorized identity reality and may be used as a rhetorical anchor anywhere in A/B/C when it improves the production. Its use is optional and non-templated; do not mechanically repeat it or derive new facts from the name itself.",
            "Make the supported combination reveal character through implication, contrast, voice, relation, distinctive perspective, attitude, status, or playful self-presentation.",
            "A/B/C are competing whole productions. Each production should explore a supported character read, not inventory the facts.",
            "A production may be one semantic beat when the identity read lands in one compact thought. Do not split sentences for frontend reveal behavior.",
            "Use stable preferences and relationships as creative pressure, but every concrete commitment remains inside supplied facts and each line's sourceEventIds.",
            "Let the viewer connect the dots. Choose the production whose whole shape creates the strongest supported portrait.",
            "D is the deterministic factual control/fallback and remains available outside the expressive productions.",
            "Return production-major A/B/C expressive productions for the listed production identities. Runtime independently preserves deterministic Bare Reality D from the evidence arrangement.",
            "For A/B/C, order is expressive order and sourceEventIds are grounding authority. Expressive attention may compress, combine, omit, or select without covering every fact.",
          ] : [
            "For each beat, produce materially different realizations. Let each make a supported character, relationship, or perception felt.",
            "An intentionally unused beat can carry empty text.",
          ]),
          ...(presentationContext ? [presentationContext] : []),
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUBJECT: input.subject,
          SUPPLIED_REALITY: input.suppliedReality,
          ...(input.writingProfile?.confidence ? { WRITING_PREFERENCES: summarizeAuthorBehaviorProfile(input.writingProfile) } : {}),
          ...(isMemoryMode ? {
            APPROVED_MEANING: { perception: selected.perception, relationship: selected.relationship },
            ...(!lensSearchEnabled ? {
              BARE_CONTROL_EVIDENCE: plan.beats.map((beat) => ({ order: beat.order, eventIds: beat.eventIds })),
            } : {}),
          } : {
            APPROVED_THESIS: plan.thesis,
            APPROVED_BEATS: plan.beats.map((beat) => ({
              order: beat.order,
              role: beat.role,
              eventIds: beat.eventIds,
              attentionEvidence: beat.attention,
              semanticMove: beat.change,
            })),
          }),
          ...(isIdentityMode ? {
            IDENTITY_CONTEXT: input.memory ?? [],
            IDENTITY_MODE: {
              subject: input.subject,
              experienceMode,
              domainContext: input.domainContext ?? {},
            },
          } : {}),
          CREATIVE_OPPORTUNITY: selected.perception,
          RELATION: selected.relationship,
          DERIVED_MEANING: input.creativeDiscovery.derivedMeaning ?? { kind: "DERIVED_MEANING", relations: [] },
          DERIVED_MEANING_AUTHORITY: "Use approved alternative interpretations as possible perceptual direction. Choose what earns expression; SUPPLIED_REALITY alone authorizes concrete facts and occurrences.",
          REALITY_DIRECT: realityDirect,
          LENS_MODE: lensMode,
          REQUESTED_LENS: requestedLens || (autoBusinessLens ? "AUTO" : "NONE"),
          ...(!isMemoryMode ? { STORY_GRAVITY: lensSearch.storyGravity } : {}),
          ...(usesProductionMajorMouth && lensSearchEnabled ? { PRIVATE_CREATIVE_FIELD: privateCreativeField } : {}),
          CREATIVE_TREATMENTS: isMemoryMode
            ? writingTreatmentAssignments.map((assignment) => ({
                production: assignment.production,
                conception: assignment.treatment,
                treatment: assignment.treatment,
                creativePressure: assignment.creativePressure,
                perceptionDelta: assignment.perceptionDelta,
                expressiveBehaviors: assignment.expressiveBehaviors,
                intensity: assignment.intensity,
                evidenceEventIds: assignment.evidenceEventIds,
              }))
            : authorMouthCreativeTreatmentPayload(writingTreatmentAssignments),
          instruction: useIdentityClusterPlan
            ? "Return candidate productions in PRODUCTION-MAJOR form for the listed CREATIVE_TREATMENTS only. Keep Identity semantics: make the stable supported combination reveal character through implication, voice, contrast, relation, and distinctive perspective. The supplied SUBJECT name is authorized identity reality and may be used as an optional rhetorical anchor when it improves the production; do not mechanically repeat it or derive new facts from the name itself. Do not turn stable identity context into a new current occurrence. Let A/B/C explore meaning rather than inventory. Keep concrete reality inside supplied facts and line sourceEventIds. Nominate the strongest expressive production. Runtime preserves D as factual fallback."
            : isMemoryMode
              ? realityDirect
                ? "Return candidate productions in PRODUCTION-MAJOR form for the listed CREATIVE_TREATMENTS only. Make the perception felt through implication, voice, and contrast. Let A/B/C draw from the shared PRIVATE_CREATIVE_FIELD as far as supplied reality supports. Give the charged detail disproportionate significance and let the ending earn its implication. Keep concrete reality fixed. Unused facts remain in provenance. Nominate the strongest listed expressive production. Runtime preserves the factual control independently."
                : "Return candidate productions in PRODUCTION-MAJOR form for the listed CREATIVE_TREATMENTS only. Make the perception felt through implication, voice, and contrast. Maximize meaningful inference while maintaining grounding. Let the supplied evidence earn the ending. Unused facts remain in provenance. Keep concrete reality fixed. Empty text is legal. Nominate the strongest viable expressive production by its production letter: A, B, or C. Preserve D as the factual fallback."
              : isIdentityMode
                ? "Return candidate productions in PRODUCTION-MAJOR form for the listed CREATIVE_TREATMENTS only. Make the supported identity combination reveal character through implication, voice, contrast, relation, and distinctive perspective. The supplied SUBJECT name is authorized identity reality and may be used as an optional rhetorical anchor when it improves the production; do not mechanically repeat it or derive new facts from the name itself. Stable preferences and relationships may inform character, but do not pretend they are new current events. A/B/C should explore meaning rather than inventory. Keep concrete reality fixed. Nominate the strongest viable expressive production by its production letter. Runtime preserves D as factual fallback."
              : "Return four candidate lines per beat. The semantic plan controls meaning; the supplied event IDs control factual reality.",
        }),
      },
    ]),
    "json",
    {
      numPredict: usesProductionMajorMouth && lensSearchEnabled ? 1600 : 1050,
      temperature: isMemoryMode ? 0.96 : 0.86,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: usesProductionMajorMouth
          ? ["productions", "selectedProduction", "selectionReason"]
          : ["variantsByBeat"],
        properties: usesProductionMajorMouth
          ? {
              productions: {
                type: "array",
                minItems: lensSearchEnabled ? 3 : 4,
                maxItems: lensSearchEnabled ? 3 : 4,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["production", "lines"],
                  properties: {
                    production: { type: "string", enum: lensSearchEnabled ? ["A", "B", "C"] : ["A", "B", "C", "D"] },
                    lines: {
                      type: "array",
                      minItems: lensSearchEnabled ? minimumExpressiveCuts : 0,
                      // Expressive cuts are not one slot per supplied event.
                      maxItems: Math.max(16, input.suppliedReality.length),
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
                enum: lensSearchEnabled ? ["A", "B", "C"] : ["A", "B", "C", "D"],
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
        usesProductionMajorMouth,
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
        let productionsAfterRealityEditor = provenanceResult.productions;

        if (directAuthorRealityEditorExperiment) {
          const editorResult = await editDirectAuthorReality({
            suppliedReality: input.suppliedReality,
            productions: provenanceResult.productions,
            semanticAuthority: [
              selected.perception,
              selected.relationship,
            ].map(clean).filter(Boolean),
          }).catch((error: unknown) => ({
            ...emptyAuditedProductions({
              productions: provenanceResult.productions,
              reason:
                clean((error as { message?: unknown })?.message) ||
                "direct_author_reality_auditor_failed",
            }),
            model: "direct-author-reality-auditor-fail-closed",
            modelCalls: 0,
          }));

          directAuthorRealityEditorModelCalls += editorResult.modelCalls;
          productionsAfterRealityEditor = editorResult.productions;

          debug("REALITY-EDITOR", {
            enabled: true,
            applied: editorResult.applied,
            fallbackReason: editorResult.reason,
            originalAuthorProductions: provenanceResult.productions,
            auditorSpans: editorResult.diagnostics.map((diagnostic) => ({
              production: diagnostic.production,
              originalText: diagnostic.originalText,
              spans: diagnostic.spans,
              unusableReason: diagnostic.unusableReason,
            })),
            removedSpans: editorResult.diagnostics.map((diagnostic) => ({
              production: diagnostic.production,
              removedSpans: diagnostic.removedSpans,
            })),
            reconstructedProductions: editorResult.diagnostics.map((diagnostic) => ({
              production: diagnostic.production,
              text: diagnostic.reconstructedText,
            })),
            after: productionsAfterRealityEditor,
          });

          authorizedRealizationPool = harvestAuthorizedRealizationPool({
            diagnostics: editorResult.diagnostics,
            productions: provenanceResult.productions,
            suppliedReality: input.suppliedReality,
          });
          const forbiddenTexts = editorResult.diagnostics.flatMap((diagnostic) =>
            diagnostic.spans
              .filter((span) => span.classification === "UNSUPPORTED_REALITY")
              .map((span) => span.exactText),
          );
          assembledCandidate = assembleAuthorizedRealizations({
            pool: authorizedRealizationPool,
            suppliedReality: input.suppliedReality,
          });
          assemblyTruthResult = verifyAuthorizedAssemblyCandidate({
            candidate: assembledCandidate,
            pool: authorizedRealizationPool,
            forbiddenTexts,
            suppliedReality: input.suppliedReality,
            subject: input.subject,
            realityDirect,
          });

          const deterministicCandidate = assembledCandidate;
          const deterministicTruthResult = assemblyTruthResult;
          deterministicAssemblerRawOutput = deterministicCandidate?.rawText;
          deterministicAssemblyTruthResult = deterministicTruthResult;

          synthesisAttempt = await synthesizeAuthorizedRealizations({
            subject: input.subject,
            suppliedReality: input.suppliedReality,
            pool: authorizedRealizationPool,
            writingProfile: input.writingProfile,
            forbiddenTexts,
            realityDirect,
          }).catch((error: unknown) =>
            synthesisFailureResult({
              synthesisInput: buildAuthorizedRealizationSynthesisInput({
                subject: input.subject,
                suppliedReality: input.suppliedReality,
                pool: authorizedRealizationPool,
                forbiddenTexts,
              }),
              reasons: [
                clean((error as { message?: unknown })?.message) ||
                  "authorized_realization_synthesizer_failed",
              ],
            })
          );
          authorizedRealizationSynthesisModelCalls += synthesisAttempt.modelCalls;

          const deterministicRecovery = retryAssemblyWithoutAttributedCameraLanguage({
            candidate: deterministicCandidate,
            truthResult: deterministicTruthResult,
            pool: authorizedRealizationPool,
            forbiddenTexts,
            suppliedReality: input.suppliedReality,
            subject: input.subject,
            realityDirect,
          });
          const synthesisRecovery = retryAssemblyWithoutAttributedCameraLanguage({
            candidate: synthesisAttempt.candidate,
            truthResult: synthesisAttempt.truthResult,
            pool: authorizedRealizationPool,
            forbiddenTexts,
            suppliedReality: input.suppliedReality,
            subject: input.subject,
            realityDirect,
          });

          if (deterministicTruthResult.eligible && deterministicCandidate) {
            assembledMemoryProductions.push(assembledCandidateToMemoryProduction(deterministicCandidate));
          } else if (deterministicRecovery.truthResult?.eligible && deterministicRecovery.candidate) {
            assembledMemoryProductions.push(assembledCandidateToMemoryProduction(deterministicRecovery.candidate));
          }

          if (synthesisAttempt.truthResult.eligible && synthesisAttempt.candidate) {
            assembledMemoryProductions.push(assembledCandidateToMemoryProduction(synthesisAttempt.candidate));
          } else if (synthesisRecovery.truthResult?.eligible && synthesisRecovery.candidate) {
            assembledMemoryProductions.push(assembledCandidateToMemoryProduction(synthesisRecovery.candidate));
          }

          debug("AUTHORIZED-REALIZATION-POOL", authorizedRealizationPool);
          debug("ASSEMBLER-RAW-OUTPUT", deterministicCandidate?.rawText ?? "");
          debug("ASSEMBLER-TRUTH-RESULT", deterministicTruthResult);
          debug("SYNTHESIZER-INPUT", synthesisAttempt.input);
          debug("RAW-SYNTHESIZER-OUTPUT", synthesisAttempt.rawOutput);
          debug("SYNTHESIZED-FROM", synthesisAttempt.candidate?.lines.map((line) => ({
            order: line.order,
            text: line.text,
            synthesizedFrom: line.synthesizedFrom ?? [],
            sourceEventIds: line.sourceEventIds,
          })) ?? []);
          debug("SYNTHESIS-CLAIM-AUDITOR", synthesisAttempt.claimAuditor ?? null);
          debug("SYNTHESIS-REALITY-EDITOR", synthesisAttempt.realityEditor ?? null);
          debug("SYNTHESIS-ELIGIBILITY", synthesisAttempt.truthResult);
        }

        parsedMouth = {
          productions: productionsAfterRealityEditor,
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
  const productionMajorMouthProductions: AuthorMemoryMouthProduction[] = [];

  if (usesProductionMajorMouth) {
    if (!Array.isArray(parsedMouth?.productions)) {
      mouthFallbackReason =
        mouthFallbackReason ||
        `QRE ${isIdentityMode ? "IDENTITY" : "MEMORY"} Mouth contract invalid: production-major productions are required`;
      parsedMouth = parseJson(
        buildDeterministicMouthFallback(
          plan,
          input.suppliedReality,
          usesProductionMajorMouth,
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
        const auditSpans = authorRealityClaimAuditSpans(
          lineRecord.auditSpans,
          input.suppliedReality,
        );

        if (variantIndex < 3 && usesWholeProductionSelection) {
          if (!sourceEventIds.length) continue;
          variableLines.push({
            order,
            text,
            sourceEventIds,
            ...(auditSpans.length ? { auditSpans } : {}),
          });
          continue;
        }

        if (isMemoryMode && !lensSearchEnabled) {
          const variants = [...(variantsByOrder.get(order) ?? ["", "", "", ""])];
          while (variants.length < 4) variants.push("");
          variants[variantIndex] = text;
          variantsByOrder.set(order, variants.slice(0, 4));
        }
      }

      if (variantIndex >= 0 && variantIndex < 3) {
        productionMajorMouthProductions.push({
          production: production as AuthorProductionLetter,
          lines: variableLines.sort((a, b) => a.order - b.order),
        });
      }
    }

    // Production D is the deterministic truth control. Mouth may return a D
    // production for contract compatibility, but its wording never competes.
    // The control is rebuilt directly from the supplied evidence so Bare
    // cannot smuggle interpretation, rhetoric, or invented state into reality.
    if (usesWholeProductionSelection) {
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

  const scenes: AuthorCreativeGroundedScene[] = [];
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
          auditSpans?: AuthorRealityClaimAuditSpan[];
          accepted: boolean;
          score: number;
          reasons: string[];
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

  if (usesWholeProductionSelection) {
    const selectedProductionRaw = clean(parsedMouth?.selectedProduction).toUpperCase();
    let selection = selectMemoryProductionCandidate({
      plan,
      suppliedReality: input.suppliedReality,
      subject: input.subject,
      expressiveProductions: productionMajorMouthProductions,
      assembledProductions: assembledMemoryProductions,
      authorizedRealizationPool,
      treatmentAssignments: treatmentAssignmentsForMouth,
      selectedProduction: selectedProductionRaw,
      lensSearchEnabled,
      realityDirect,
      minimumExpressiveCuts,
    });

    const repairTarget = isMemoryMode
      ? (
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
                .sort((a, b) => b.score - a.score)[0]
        )
      : undefined;

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
          const repairedProductions = productionMajorMouthProductions.map((production) =>
            production.production === repairLetter
              ? {
                  ...production,
                  lines: production.lines.map((line) => {
                    const replacement = repair.replacements.get(line.order);
                    if (!replacement) return { ...line };
                    const { auditSpans, ...rest } = line;
                    void auditSpans;
                    return {
                      ...rest,
                      text: replacement,
                    };
                  }),
                }
              : production,
          );
          const repairedSelection = selectMemoryProductionCandidate({
            plan,
            suppliedReality: input.suppliedReality,
            subject: input.subject,
            expressiveProductions: repairedProductions,
            assembledProductions: assembledMemoryProductions,
            authorizedRealizationPool,
            treatmentAssignments: treatmentAssignmentsForMouth,
            selectedProduction: selectedProductionRaw,
            lensSearchEnabled,
            realityDirect,
            minimumExpressiveCuts,
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
        mode: isIdentityMode ? "IDENTITY" : "MEMORY",
        modelNomination: selectedProductionRaw || "NONE",
        modelSelectionReason: clean(parsedMouth?.selectionReason),
        winner: selectedMemoryProduction ?? "NONE",
        productions: memoryProductionDiagnostics,
      });
      debug("ASSEMBLED-CANDIDATE-SCORING", {
        eligible: assemblyTruthResult?.eligible ?? false,
        truthReasons: assemblyTruthResult?.reasons ?? [],
        scoring:
          memoryProductionDiagnostics?.find((production) => production.production === "ASSEMBLED") ??
          assemblyTruthResult?.scoring ??
          null,
      });
  } else if (isMemoryMode) {
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
      directAuthorProvenanceModelCalls +
      directAuthorRealityEditorModelCalls +
      authorizedRealizationSynthesisModelCalls,
    diagnostics: {
      plan,
      creativeNotice: lensSearch.creativeNotice,
      storyGravity: lensSearch.storyGravity,
      failureLessons: lensSearch.failureLessons,
      privateConceptions: lensSearch.privateConceptions,
      creativeTreatments: treatmentAssignmentsForMouth,
      creativeSearchFallbackReason: lensSearch.searchFallbackReason,
      rejectedTreatments: lensSearch.rejectedTreatments,
      treatmentSetAssessment: lensSearch.treatmentSetAssessment,
      productionContractComplete: {
        creativeSetComplete:
          lensSearch.treatmentSetAssessment.creativeSetComplete,
        renderable: lensSearch.treatmentSetAssessment.renderable,
      },
      variantsByBeat: isIdentityMode
        ? []
        : [...variantsByOrder.entries()]
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
      authorizedRealizationPool,
      assemblerRawOutput: deterministicAssemblerRawOutput ?? assembledCandidate?.rawText,
      assemblerTruthResult: deterministicAssemblyTruthResult ?? assemblyTruthResult,
      synthesisAttempt,
    },
  };
}
