import type {
  AuthorDomainContext,
  MouthCandidate,
  MouthCandidateBatch,
  MouthCandidateBeat,
  MouthCandidateSelection,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { resolveLensPolicy } from "./authorLensPolicy.js";
import { evaluateMouthInterpretation } from "./authorMouthInterpretation.js";
import { evaluateAuthorExperienceCut } from "./authorExperienceCritic.js";

/**
 * ONE PRODUCTION MOUTH.
 *
 * Cognition decides reality, movie, semantic movement and beat purpose.
 * Mouth solves viewer-facing language only.
 *
 * The important distinction is between:
 *   - story discovery: Cognition may discover latent relationships;
 *   - story realization: when the supplied input already contains an explicit
 *     narrative spine, Mouth must preserve that spine and improve its landing,
 *     not replace it with a new summary.
 */

export type {
  MouthCandidate,
  MouthCandidateBatch,
  MouthCandidateBeat,
  MouthCandidateSelection,
} from "@qre/contracts";

export type MouthCandidateGenerationInput = {
  envelope: RealityEnvelope;
  beats: readonly MouthCandidateBeat[];
  priorTexts?: readonly string[];
  lens?: string;
  domainContext?: AuthorDomainContext;
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const words = (value: string): string[] => clean(value).split(/\s+/).filter(Boolean);
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const normalize = (value: string): string => clean(value).replace(/[.!?]+$/g, "").toLowerCase();
const tokenSet = (value: string): Set<string> => new Set(clean(value).toLowerCase().split(/[^a-z0-9'’-]+/g).filter((token) => token.length >= 3));

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at", "for", "with", "from", "by", "through", "after", "before", "then", "now", "still", "again", "this", "that", "it", "is", "are", "was", "were", "be", "been", "being", "as", "into", "my", "your", "our", "their", "his", "her", "its", "he", "she", "they", "them", "you", "we", "me",
]);

const INTERNAL = /\b(?:cognition|planner|planning|beat|candidate|semantic|trajectory|viewer|audience|observer|objective|curiosity|prediction error|state shift|sequence|author|mouth|canonical|supplied evidence|semantic turn|relation kind|payoff dependency|memory projection|future thread)\b/i;
const EXPLANATION = /\b(?:this means|which means|this shows|which shows|the point is|the meaning is|in other words|reveals that|the viewer|the audience|the relationship|the experience was|the significance)\b/i;
const GENERIC_SUMMARY = /^(?:something happened|something changed|something shifted|everything changed|a moment|the moment|a feeling|the feeling|it was meaningful|it was special|it was important)\.?$/i;
const ABSTRACT_NOUN = /\b(?:lightness|stillness|softness|warmth|tension|pressure|presence|absence|recognition|connection|possibility|momentum|energy|rhythm|silence|distance|closeness|uncertainty|comfort|relief|contentment|satisfaction|release|ease|bloom|weight|space|pull|gravity|dissonance|acknowledgement|acknowledgment|resonance)\b/i;
const FRAME_NOUN = /\b(?:lawyer|judge|witness|detective|agent|captain|boss|mission|operation|case|verdict|negotiation|negotiations|level|quest|upgrade|extraction|inspection|war|victory|champion|legend|showtime|final|reset|boss fight|character)\b/i;
const FRAME_VERB = /\b(?:called|resumed|approved|cleared|secured|completed|started|began|ended|won|lost|continued|returned|reopened|settled|entered|left|passed|failed|made|earned|survived|finished)\b/i;
const STATUS = /\b(?:fab|fabulous|dapper|fierce|cool|sharp|ready|done|cleared|approved|complete|finished|upgrade|victory|win|winner|exit|peace|temporary|temporarily|resumed|made it|level|mission|operation|case|verdict|negotiations?|final|reset|legend|perfect|apparently|anyway|for now)\b/i;
const PHYSICAL_VERB = /\b(?:smiled|smile|laughed|laugh|walked|walk|moved|move|looked|look|watched|watch|stared|stare|blinked|blink|winked|wink|nodded|nod|shrugged|shrug|touched|touch|held|hold|reached|reach|stood|stand|sat|sit|ran|run|jumped|jump|wagged|wag|barked|bark|kissed|kiss|hugged|hug|grabbed|grab|opened|open|closed|close|entered|enter|returned|return|called|call|talked|talk|spoke|speak|heard|hear|saw|see|breathed|breathe)\b/i;
const BODY = /\b(?:eye|eyes|face|mouth|shoulder|shoulders|hand|hands|head|tail|fur|coat|body|room|door|window|floor|wall|table|chair|car|road|street|sky|shadow|light|sound|scent|voice|water|phone|screen)\b/i;
const DETERMINED_ROLE = /^(?:the|a|an)\s+(?:groomer|barber|mechanic|housekeeper|cleaner|waiter|waitress|server|chef|driver|photographer|planner|officiant|vendor|host|manager|employee|staff|worker|therapist|doctor|nurse|teacher|agent|lawyer|judge|witness|detective|captain|boss)\b/i;
const SOFT_FIRST_PERSON = /^(?:I|we|my|our)\b/i;
const TEMPORAL_RESOLUTION = /\b(?:gone|departed|departing|exited|left|away|finished|done|over|ended|complete|completed|cleared|wrapped|wrapped-up|wrapped up|vanished|disappeared)\b/i;

const SAFE_FRAMING = new Set([
  "apparently", "anyway", "already", "finally", "for", "now", "again", "still", "just", "only", "very", "really", "quite", "somehow", "unexpectedly", "suddenly", "maybe", "perhaps", "yet", "almost", "exactly", "fabulous", "fierce", "cool", "sharp", "ready", "done", "approved", "cleared", "complete", "finished", "temporary", "temporarily", "peace", "exit", "winner", "victory", "legend", "mission", "case", "verdict", "boss", "level", "upgrade", "final", "reset",
]);

const CONCRETE_WORD = /\b(?:bow|trophy|medal|prize|toy|gift|phone|bag|purse|car|boat|yacht|surfboard|key|keys|bottle|bottles|chair|table|door|window|room|house|hotel|restaurant|kitchen|bathroom|leash|collar|tag|ticket|receipt|dress|shirt|shoe|shoes|cake|ring|flower|flowers|balloon|camera|screen|wallet|passport|boarding|plane|flight|beach|board|bed|blanket|blankets|towel|towels|knife|knives|food|drink|coffee|wine|soap|shampoo|conditioner)\b/i;
const GENERIC_CONCRETE_HEAD = /\b(?:thing|things|stuff|object|objects|item|items|something|anything|one|piece|pieces|shape|shapes|whatever|whatsoever)\b/i;

function meaningfulTokens(value: string): Set<string> {
  return new Set([...tokenSet(value)].filter((token) => !STOP.has(token)));
}

function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
}

function sourceLabels(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  return [...new Set((beat.eventIds ?? []).map((id) => envelope.events.find((event) => event.id === id)?.label ?? "").map(clean).filter(Boolean))];
}

function worldEvidence(envelope: RealityEnvelope): string[] {
  return [
    envelope.subject,
    ...envelope.events.map((event) => event.label),
    ...envelope.suppliedPhrases,
    ...envelope.suppliedEntities,
    ...envelope.suppliedActions,
    ...envelope.suppliedStates,
    ...envelope.recurringSignals,
    ...envelope.sensorySignals,
    ...envelope.unresolvedTensions,
  ].map(clean).filter(Boolean);
}

function candidateConcreteSubstitutionRisk(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  const value = clean(text);
  if (!value || SOFT_FIRST_PERSON.test(value)) return 0;
  if (!CONCRETE_WORD.test(value)) return 0;
  const candidateTokens = meaningfulTokens(value);
  const suppliedTokens = meaningfulTokens([...sourceLabels(beat, envelope), ...worldEvidence(envelope)].join(" "));
  const unknownConcreteTokens = [...candidateTokens].filter((token) => CONCRETE_WORD.test(token) && !suppliedTokens.has(token) && !SAFE_FRAMING.has(token));
  if (unknownConcreteTokens.length >= 2) return 1;
  if (unknownConcreteTokens.length === 1) return 0.72;
  return 0;
}

function candidateConcreteSpecificityRisk(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  const value = clean(text);
  if (!value || SOFT_FIRST_PERSON.test(value) || !GENERIC_CONCRETE_HEAD.test(value)) return 0;
  const candidate = meaningfulTokens(value);
  for (const source of [...sourceLabels(beat, envelope), ...worldEvidence(envelope)]) {
    const sourceValue = clean(source);
    if (!sourceValue || GENERIC_CONCRETE_HEAD.test(sourceValue) || !CONCRETE_WORD.test(sourceValue)) continue;
    const sourceTokens = meaningfulTokens(sourceValue);
    if (overlap(candidate, sourceTokens) > 0 && sourceTokens.size >= 2) return 1;
  }
  return 0;
}

function roleIsActuallySupplied(role: string, envelope: RealityEnvelope): boolean {
  const normalizedRole = normalize(role);
  return worldEvidence(envelope).some((item) => normalize(item).includes(normalizedRole));
}

function isFrameOnly(text: string): boolean {
  const value = clean(text);
  if (!value || value.length > 64) return false;
  if (DETERMINED_ROLE.test(value)) return false;
  if (FRAME_NOUN.test(value) && (FRAME_VERB.test(value) || STATUS.test(value))) return true;
  return words(value).length <= 5 && STATUS.test(value) && !PHYSICAL_VERB.test(value) && !BODY.test(value);
}

function unsupportedConcrete(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  const value = clean(text);
  if (!value) return 1;
  if (INTERNAL.test(value) || EXPLANATION.test(value)) return 1;
  if (DETERMINED_ROLE.test(value) && !roleIsActuallySupplied(value.replace(/^(?:the|a|an)\s+/i, ""), envelope)) return 1;
  if (isFrameOnly(value)) return 0;

  const substitutionRisk = candidateConcreteSubstitutionRisk(value, beat, envelope);
  if (substitutionRisk >= 0.72) return 1;
  const specificityRisk = candidateConcreteSpecificityRisk(value, beat, envelope);
  if (specificityRisk >= 0.9) return 1;

  const labels = sourceLabels(beat, envelope);
  const world = meaningfulTokens(worldEvidence(envelope).join(" "));
  const candidate = meaningfulTokens(value);
  const local = overlap(candidate, meaningfulTokens(labels.join(" ")));
  const global = overlap(candidate, world);
  if (GENERIC_SUMMARY.test(value)) return 0.85;
  if (PHYSICAL_VERB.test(value)) {
    const supportedPhysical = labels.some((label) => PHYSICAL_VERB.test(label));
    if (!supportedPhysical && !SOFT_FIRST_PERSON.test(value)) return 1;
  }
  if (BODY.test(value)) {
    const suppliedBody = worldEvidence(envelope).some((item) => BODY.test(item) && overlap(meaningfulTokens(value), meaningfulTokens(item)) >= 0.5);
    if (!suppliedBody && !SOFT_FIRST_PERSON.test(value)) return 1;
  }
  if (global >= 0.55 || local >= 0.72) return 0;
  return 0;
}

function abstractPenalty(text: string): number {
  const value = clean(text);
  const count = words(value).length;
  if (!ABSTRACT_NOUN.test(value)) return 0;
  if (GENERIC_SUMMARY.test(value)) return 0.7;
  if (/^(?:a|an|the)\s+/i.test(value) && count <= 6) return 0.58;
  if (count <= 4) return 0.4;
  return 0.2;
}

function explanationPenalty(text: string): number {
  return EXPLANATION.test(clean(text)) || INTERNAL.test(clean(text)) ? 1 : 0;
}

function formScore(text: string): number {
  const value = clean(text);
  const count = words(value).length;
  let score = count <= 2 ? 1 : count <= 5 ? 0.95 : count <= 8 ? 0.8 : count <= 12 ? 0.6 : 0.35;
  if (STATUS.test(value)) score += 0.18;
  if (FRAME_NOUN.test(value) && !DETERMINED_ROLE.test(value)) score += 0.14;
  if (/\?$/.test(value)) score += 0.15;
  if (/\b(?:but|yet|still|until|finally|again|already|apparently|anyway|for now|temporary|temporarily)\b/i.test(value)) score += 0.12;
  if (/^(?:a|an|the)\s+/i.test(value) && ABSTRACT_NOUN.test(value)) score -= 0.4;
  return metric(score);
}

function payoffScore(text: string, beat: MouthCandidateBeat): number {
  const attention = clean(beat.attentionFunction).toLowerCase();
  const role = clean(beat.role).toLowerCase();
  if (attention !== "payoff" && role !== "payoff" && attention !== "release" && role !== "release") return 0;
  const value = clean(text);
  const count = words(value).length;
  let score = count <= 2 ? 1 : count <= 5 ? 0.92 : count <= 8 ? 0.72 : 0.42;
  if (STATUS.test(value)) score += 0.25;
  if (/\b(?:peace|for now|temporary|temporarily|exit|fab|fabulous|dapper|done|made it|win|winner|finished|approved|cleared)\b/i.test(value)) score += 0.25;
  return metric(score);
}

function semanticScore(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  const labels = sourceLabels(beat, envelope);
  const interpretation = evaluateMouthInterpretation({ text: clean(text), sourceLabels: labels, envelope, beat });
  const local = overlap(meaningfulTokens(text), meaningfulTokens(labels.join(" ")));
  const whole = overlap(meaningfulTokens(text), meaningfulTokens(worldEvidence(envelope).join(" ")));
  return metric(
    (interpretation.accepted ? 0.42 : 0) +
    (interpretation.creativeFraming ?? 0) * 0.28 +
    whole * 0.12 +
    local * 0.08 +
    (beat.eventIds?.length ? 0.1 : 0),
  );
}

function parseExperienceState(value: unknown): { knows: string[]; expects: string[]; wonders: string[]; openQuestions: string[] } {
  const raw = clean(value);
  if (!raw) return { knows: [], expects: [], wonders: [], openQuestions: [] };
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      knows: Array.isArray(parsed.knows) ? parsed.knows.map(clean).filter(Boolean) : [],
      expects: Array.isArray(parsed.expects) ? parsed.expects.map(clean).filter(Boolean) : [],
      wonders: Array.isArray(parsed.wonders) ? parsed.wonders.map(clean).filter(Boolean) : [],
      openQuestions: Array.isArray(parsed.openQuestions) ? parsed.openQuestions.map(clean).filter(Boolean) : [],
    };
  } catch {
    return { knows: raw ? [raw] : [], expects: [], wonders: [], openQuestions: [] };
  }
}

function candidateScore(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope, priorTexts: readonly string[]): MouthCandidate {
  const value = clean(text);
  const interpretation = evaluateMouthInterpretation({ text: value, sourceLabels: sourceLabels(beat, envelope), envelope, beat });
  const baseSemantic = semanticScore(value, beat, envelope);
  const forbidden = Math.max(unsupportedConcrete(value, beat, envelope), interpretation.unsupportedConcreteRisk);
  const explain = explanationPenalty(value);
  const abstract = abstractPenalty(value);
  const form = formScore(value);
  const payoff = payoffScore(value, beat);
  const novelty = priorTexts.length
    ? metric(1 - Math.max(...priorTexts.map((prior) => overlap(meaningfulTokens(value), meaningfulTokens(prior))), 0))
    : 1;

  if (forbidden >= 0.9 || explain >= 0.95) {
    return {
      text: value, beatOrder: beat.order, supportedEventIds: [], supportedRelationPairs: [], groundingScore: 0,
      meaningScore: 0, observerDiscoveryScore: 0, transitionScore: 0, obligationCoverage: 0, relationContractScore: 0,
      forbiddenMoveRisk: 1, cohesionScore: 0, noveltyScore: novelty, compressionScore: form, inventionRisk: 1,
      repetitionRisk: 1 - novelty, collageRisk: 0, endpointExactness: 0, score: 0,
      reasons: ["unsafe-realization", ...(explain ? ["meaning-explained-instead-of-felt"] : []), ...(interpretation.reasons.includes("premature-temporal-resolution") ? ["premature-temporal-resolution"] : [])],
    };
  }

  const labels = sourceLabels(beat, envelope);
  const exact = labels.some((label) => normalize(label) === normalize(value));
  const sourceOverlap = overlap(meaningfulTokens(value), meaningfulTokens(labels.join(" ")));
  const worldOverlap = overlap(meaningfulTokens(value), meaningfulTokens(worldEvidence(envelope).join(" ")));
  const supportedEventIds = beat.eventIds?.length && sourceOverlap >= 0.25 ? [...beat.eventIds] : [];
  const supportedRelationPairs = beat.relationKinds?.map((kind) => String(kind)).filter(Boolean) ?? [];
  const grounding = metric(sourceOverlap * 0.46 + worldOverlap * 0.18 + (exact ? 0.36 : 0));
  const obligation = metric((beat.eventIds?.length ? 0.45 : 0.25) * 0.42 + baseSemantic * 0.38 + (supportedEventIds.length ? 0.2 : 0));
  const transition = metric(Number(beat.viewerState?.stateShift) || 0.45);
  const meaning = metric(baseSemantic * 0.5 + form * 0.16 + (STATUS.test(value) ? 0.08 : 0) + payoff * 0.26 - abstract * 0.18);
  const distinctive = metric(form * 0.28 + meaning * 0.28 + novelty * 0.18 + (isFrameOnly(value) ? 0.14 : 0) + payoff * 0.12 + (sourceOverlap < 0.65 ? 0.08 : 0));
  const discovery = metric(meaning * 0.38 + transition * 0.24 + distinctive * 0.2 + novelty * 0.1 + (isFrameOnly(value) ? 0.08 : 0));

  const before = parseExperienceState(beat.viewerState?.beforeState);
  const after = parseExperienceState(beat.viewerState?.afterState);
  const futureEvidence = after.expects.length || after.openQuestions.length ? [...after.expects, ...after.openQuestions] : [];
  const experienceCritic = evaluateAuthorExperienceCut({
    text: value,
    currentEvidence: labels,
    futureEvidence,
    viewerBefore: before,
    viewerAfter: after,
    attentionTarget: clean(beat.change || beat.attentionFunction),
    previousAttentionTarget: clean(beat.viewerState?.beforeState),
    withheldInformation: futureEvidence,
    nextPressure: clean(beat.next || beat.frontier),
    terminal: Boolean(beat.paysOff?.length),
  });

  const score = metric(
    grounding * 0.09 + obligation * 0.08 + meaning * 0.18 + transition * 0.1 + novelty * 0.08 + form * 0.08 +
    discovery * 0.08 + distinctive * 0.07 + payoff * 0.08 + experienceCritic.addition * 0.06 +
    experienceCritic.attentionMovement * 0.05 + experienceCritic.curiosity * 0.1 + experienceCritic.score * 0.08 - abstract * 0.12,
  );

  const reasons: string[] = [];
  if (supportedEventIds.length) reasons.push("event-grounded");
  if (supportedRelationPairs.length) reasons.push("relation-grounded");
  if (grounding >= 0.45) reasons.push("beat-grounded");
  if (baseSemantic >= 0.5) reasons.push("approved-semantic-realization");
  if (experienceCritic.addition >= 0.45) reasons.push("experience-addition");
  if (experienceCritic.attentionMovement >= 0.45) reasons.push("experience-attention");
  if (experienceCritic.curiosity >= 0.45) reasons.push("experience-curiosity");
  if (isFrameOnly(value)) reasons.push("bounded-creative-bet");
  if (distinctive >= 0.64) reasons.push("distinctive-realization");
  if (discovery >= 0.62) reasons.push("observer-discovery");
  if (payoff >= 0.62) reasons.push("viewer-reward");
  if (abstract > 0.35) reasons.push("abstract-nominalization");
  if (/^(?:a|an|the)\s+/i.test(value) && ABSTRACT_NOUN.test(value)) reasons.push("article-abstract-fragment");
  reasons.push(...interpretation.reasons.filter((reason) => !reasons.includes(reason)));

  return {
    text: value,
    beatOrder: beat.order,
    supportedEventIds,
    supportedRelationPairs,
    groundingScore: grounding,
    meaningScore: meaning,
    observerDiscoveryScore: discovery,
    transitionScore: transition,
    obligationCoverage: obligation,
    relationContractScore: metric(supportedRelationPairs.length ? 0.75 : 0.35),
    forbiddenMoveRisk: forbidden,
    cohesionScore: metric(0.55 + novelty * 0.25 + meaning * 0.2),
    noveltyScore: novelty,
    compressionScore: form,
    inventionRisk: forbidden,
    repetitionRisk: 1 - novelty,
    collageRisk: 0,
    endpointExactness: exact ? 1 : 0,
    score,
    reasons,
  };
}

function isExplicitSuppliedStory(beats: readonly MouthCandidateBeat[]): boolean {
  if (beats.length < 3) return false;
  const sourced = beats.filter((beat) => (beat.eventIds?.length ?? 0) > 0).length;
  const uniqueEventIds = new Set(beats.flatMap((beat) => beat.eventIds ?? []));
  return sourced >= beats.length - 1 && uniqueEventIds.size >= 3;
}

function buildSequenceAllocation(beats: readonly MouthCandidateBeat[], envelope: RealityEnvelope): Array<Record<string, unknown>> {
  return beats.map((beat, index) => ({
    order: beat.order,
    role: clean(beat.role),
    currentEvidence: sourceLabels(beat, envelope),
    previousEvidence: index > 0 ? sourceLabels(beats[index - 1]!, envelope) : [],
    futureEvidence: beats.slice(index + 1).flatMap((futureBeat) => sourceLabels(futureBeat, envelope)),
    terminal: Boolean(beat.paysOff?.length),
    purpose: clean(beat.attentionFunction || beat.role),
    meaning: clean(beat.change),
    next: clean(beat.next || beat.frontier),
  }));
}

function buildSystemPrompt(): string {
  return [
    "QRE ONE MOUTH — final viewer-facing language realization.",
    "Reality is already established. Cognition has already selected the movie. The beat has already been authored.",
    "Your job is realization, not story invention.",
    "FEEL IT. DO NOT EXPLAIN IT.",
    "The overall sequence is one film, not a stack of independent captions.",
    "When the supplied input already forms a coherent story, preserve its story spine exactly and improve the human landing of each cut.",
    "Never summarize a later event in an earlier cut just because you know the ending.",
    "Never borrow future outcome, departure, completion, disappearance, verdict, transformation, or payoff language into an earlier cut unless the current beat itself authorizes it.",
    "One cut should primarily realize the current beat's supplied evidence. Future beats exist to shape tension and anticipation, not to be spent early.",
    "Do not turn an explicit action sequence into generic status captions.",
    "Prefer the sharpest natural realization of the supplied event over labels such as 'transformation complete', 'fabulous exit', 'finished', or 'gone' when those states belong later.",
    "Do not compress multiple supplied events into a mini-summary merely because they are adjacent. Compress only when the relationship between them is the actual approved meaning.",
    "Do not make three variants by changing only adjectives. Vary the realization move while preserving the current beat's narrative job.",
    "Use short, specific, surprising, grounded language.",
    "Prefer attitude, implication, contrast, recognition, interruption, consequence, callback, and earned payoff.",
    "Do not turn every emotion into an abstract noun.",
    "Do not produce poetry soup.",
    "Do not narrate the machine. Never mention cognition, beats, candidates, viewer states, semantics, trajectories, planning, or meaning.",
    "Do not invent a physical action, reaction, object, person, location, motive, chronology, dialogue, sensory event, or concrete consequence.",
    "Concrete nouns are immutable unless directly supplied.",
    "Framing freedom is high, but framing must remain interpretation rather than a new occurrence.",
    "A final supplied state is truth, not permission to move that state earlier.",
    "Return JSON only.",
  ].join("\n");
}

export function buildMouthCandidateMessages(input: MouthCandidateGenerationInput): Array<{ role: "system" | "user"; content: string }> {
  const lens = resolveLensPolicy(input.lens);
  const evidence = worldEvidence(input.envelope);
  const explicitStory = isExplicitSuppliedStory(input.beats);
  const sequenceAllocation = buildSequenceAllocation(input.beats, input.envelope);
  const beats = input.beats.map((beat) => ({
    order: beat.order,
    supplied: sourceLabels(beat, input.envelope),
    purpose: clean(beat.attentionFunction || beat.role),
    meaning: clean(beat.change),
    semanticRealization: beat.semanticRealization,
    hypothesisAlignment: beat.hypothesisAlignment,
    observerExperience: beat.observerExperience,
    viewerState: beat.viewerState
      ? { before: clean(beat.viewerState.beforeState), after: clean(beat.viewerState.afterState), move: clean(beat.viewerState.attentionMove) }
      : undefined,
    next: clean(beat.next),
    relationKinds: beat.relationKinds ?? [],
    terminal: Boolean(beat.paysOff?.length),
  }));

  return [
    { role: "system", content: buildSystemPrompt() },
    {
      role: "user",
      content: JSON.stringify({
        subject: input.envelope.subject,
        mode: explicitStory ? "SUPPLIED_STORY_REALIZATION" : "LATENT_EXPERIENCE_REALIZATION",
        sequenceRule: explicitStory
          ? "The supplied moments already contain the narrative spine. Preserve order and allocate information across cuts. Current evidence belongs to current cut; future evidence is protected for future cuts."
          : "Discover the strongest approved realization while preserving source truth.",
        lens: clean(input.lens) || "NONE",
        lensFrame: lens.name,
        lensPolicy: {
          humanSpine: lens.humanSpine,
          worldOrbit: lens.worldOrbit,
          environmentalOperators: lens.environmentalOperators,
          observerTarget: lens.observerTarget,
          realizationMoves: lens.realizationMoves,
          forbiddenRealityMoves: lens.forbiddenRealityMoves,
          personification: lens.personification,
          explanationPressure: lens.explanationPressure,
          intensity: lens.intensity,
        },
        suppliedReality: evidence,
        sequenceAllocation,
        priorCuts: input.priorTexts ?? [],
        beats,
        output: { variantsByBeat: "exactly 3 viewer-facing variants for every beat, in order" },
      }),
    },
  ];
}

export function parseMouthCandidateBatch(raw: string): MouthCandidateBatch | undefined {
  try {
    const parsed = JSON.parse(clean(raw)) as { variantsByBeat?: unknown };
    if (!Array.isArray(parsed?.variantsByBeat) || parsed.variantsByBeat.length === 0) return undefined;
    const variantsByBeat = parsed.variantsByBeat
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
      .map((item) => ({
        order: Number(item.order),
        variants: Array.isArray(item.variants) ? item.variants.map(String).map(clean).filter(Boolean) : [],
      }));
    if (variantsByBeat.some((item) => !Number.isInteger(item.order) || item.variants.length !== 3)) return undefined;
    const orders = [...variantsByBeat.map((item) => item.order)].sort((a, b) => a - b);
    if (orders.some((order, index) => order !== index + 1)) return undefined;
    if (variantsByBeat.some((item) => new Set(item.variants.map((value) => value.toLowerCase())).size !== 3)) return undefined;
    return { variantsByBeat: variantsByBeat.sort((a, b) => a.order - b.order) };
  } catch {
    return undefined;
  }
}

export function scoreMouthCandidate(input: { text: string; beat: MouthCandidateBeat; envelope: RealityEnvelope; priorTexts?: readonly string[] }): MouthCandidate {
  return candidateScore(input.text, input.beat, input.envelope, input.priorTexts ?? []);
}
