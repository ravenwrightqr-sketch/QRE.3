import type {
  AuthorDomainContext,
  MouthCandidate,
  MouthCandidateBatch,
  MouthCandidateBeat,
  MouthCandidateSelection,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { classifyLens } from "./authorCharacterLensEngine.js";
import { evaluateMouthInterpretation } from "./authorMouthInterpretation.js";
import type { CreativeLensBrief } from "./authorCreativeLensBrief.js";

/**
 * ONE PRODUCTION MOUTH.
 *
 * Cognition decides the reality, movie, semantic movement and beat purpose.
 * Mouth only solves the human-facing language problem.
 *
 * Core law:
 *   FEEL IT. DO NOT EXPLAIN IT.
 *
 * Reality freedom = low.
 * Framing freedom = high.
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
  creativeLensBrief?: CreativeLensBrief;
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
const SOFT_FIRST_PERSON = /^(?:I|we|my|our)\b/i;

const SAFE_FRAMING = new Set([
  "apparently", "anyway", "already", "finally", "for", "now", "again", "still", "just", "only", "very", "really", "quite", "somehow", "unexpectedly", "suddenly", "maybe", "perhaps", "yet", "almost", "exactly", "fabulous", "fierce", "cool", "sharp", "ready", "done", "approved", "cleared", "complete", "finished", "temporary", "temporarily", "peace", "exit", "winner", "victory", "legend", "mission", "case", "verdict", "boss", "level", "upgrade", "final", "reset",
]);

const CONCRETE_WORD = /\b(?:bow|trophy|medal|prize|toy|gift|phone|bag|purse|car|boat|yacht|surfboard|key|keys|bottle|bottles|chair|table|door|window|room|house|hotel|restaurant|kitchen|bathroom|leash|collar|tag|ticket|receipt|dress|shirt|shoe|shoes|cake|ring|flower|flowers|balloon|camera|screen|wallet|passport|boarding|plane|flight|beach|board|bed|blanket|blankets|towel|towels|knife|knives|food|drink|coffee|wine|soap|shampoo|conditioner)\b/i;
const GENERIC_CONCRETE_HEAD = /\b(?:thing|things|stuff|object|objects|item|items|something|anything|one|piece|pieces|shape|shapes|whatever|whatsoever)\b/i;

function candidateConcreteSubstitutionRisk(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  const value = clean(text);
  if (!value || SOFT_FIRST_PERSON.test(value)) return 0;
  const labels = sourceLabels(beat, envelope);
  const evidence = worldEvidence(envelope);
  if (!CONCRETE_WORD.test(value)) return 0;
  const candidateTokens = meaningfulTokens(value);
  const suppliedTokens = meaningfulTokens([...labels, ...evidence].join(" "));
  const unknownConcreteTokens = [...candidateTokens].filter((token) => CONCRETE_WORD.test(token) && !suppliedTokens.has(token) && !SAFE_FRAMING.has(token));
  if (unknownConcreteTokens.length >= 2) return 1;
  if (unknownConcreteTokens.length === 1) return 0.72;
  return 0;
}

function candidateConcreteSpecificityRisk(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  const value = clean(text);
  if (!value || SOFT_FIRST_PERSON.test(value)) return 0;
  if (!GENERIC_CONCRETE_HEAD.test(value)) return 0;

  const labels = sourceLabels(beat, envelope);
  const evidence = worldEvidence(envelope);
  const candidate = meaningfulTokens(value);

  for (const source of [...labels, ...evidence]) {
    const sourceValue = clean(source);
    if (!sourceValue || GENERIC_CONCRETE_HEAD.test(sourceValue)) continue;
    if (!CONCRETE_WORD.test(sourceValue)) continue;

    const sourceTokens = meaningfulTokens(sourceValue);
    const shared = overlap(candidate, sourceTokens);

    /*
     * A generic head attached to any supplied concrete descriptor is a
     * specificity downgrade: "blue bow" -> "blue thing". Even one shared
     * supplied descriptor token is enough to establish that the candidate is
     * talking about the same concrete reality while throwing away its identity.
     */
    if (shared > 0 && sourceTokens.size >= 2) return 1;
  }

  return 0;
}

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
    ...envelope.suppliedParticipants,
    ...envelope.suppliedPlaces,
    ...envelope.suppliedActions,
    ...envelope.suppliedStates,
    ...envelope.recurringSignals,
    ...envelope.sensorySignals,
    ...envelope.unresolvedTensions,
  ].map(clean).filter(Boolean);
}

function suppliedIdentity(text: string, envelope: RealityEnvelope): boolean {
  const value = clean(text).toLowerCase();
  if (/\b(?:he|him|his|she|her|hers|they|them|their|the man|the woman|the boy|the girl|the guy|the lady|my friend|my partner|my wife|my husband|my girlfriend|my boyfriend)\b/i.test(value)) return true;
  return envelope.suppliedEntities.some((entity) => normalize(entity) === normalize(text));
}

function isFrameOnly(text: string): boolean {
  const value = clean(text);
  if (!value || value.length > 64) return false;
  if (FRAME_NOUN.test(value) && (FRAME_VERB.test(value) || STATUS.test(value))) return true;
  return words(value).length <= 5 && STATUS.test(value) && !PHYSICAL_VERB.test(value) && !BODY.test(value);
}

function unsupportedConcrete(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  const value = clean(text);
  if (!value) return 1;
  if (INTERNAL.test(value) || EXPLANATION.test(value)) return 1;
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
  let score = count <= 2 ? 0.62 : count <= 4 ? 0.82 : count <= 8 ? 1 : count <= 12 ? 0.96 : count <= 18 ? 0.78 : 0.5;
  if (STATUS.test(value)) score += 0.18;
  if (FRAME_NOUN.test(value)) score += 0.14;
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
  let score = count <= 2 ? 0.62 : count <= 4 ? 0.82 : count <= 8 ? 1 : count <= 12 ? 0.96 : count <= 18 ? 0.78 : 0.5;
  if (STATUS.test(value)) score += 0.25;
  if (/\b(?:peace|for now|temporary|temporarily|exit|fab|fabulous|dapper|done|made it|win|winner|finished|approved|cleared)\b/i.test(value)) score += 0.25;
  return metric(score);
}

function semanticScore(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
  interpretation: ReturnType<typeof evaluateMouthInterpretation>,
): number {
  const labels = sourceLabels(beat, envelope);
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

function semanticUnitParadeRisk(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): {
  parade: number;
  trivialProgression: number;
  sourceCoverage: number;
} {
  const eventCount = beat.eventIds?.length ?? 0;
  if (eventCount < 2) {
    return {
      parade: 0,
      trivialProgression: 0,
      sourceCoverage: 0,
    };
  }

  const labels = sourceLabels(beat, envelope);
  const source = meaningfulTokens(labels.join(" "));
  const candidate = meaningfulTokens(text);
  const sourceCoverage = overlap(source, candidate);

  const trivialProgression =
    /^(?:then|now|next|finally|after that|and then)\b|\b(?:follows|followed|completes?|completed|begins?|beginning)\b/i.test(
      clean(text),
    )
      ? 1
      : 0;

  const fragments = clean(text)
    .split(/[.!?]+/)
    .map(clean)
    .filter(Boolean);

  const fragmentCount = fragments.length;

  /*
   * A semantic unit can span several supplied events while a generated line
   * still enumerates those events one fragment at a time. Local beat overlap
   * alone misses this when composition has already compressed the evidence
   * set (for example: "Walks. Bacon. Small dogs.").
   *
   * Detect the structural failure directly: how many visible fragments are
   * substantially recoverable from one supplied current-reality event?
   * This remains domain-neutral and does not penalize a transformed line just
   * for preserving one useful source noun.
   */
  const currentRealityLabels = envelope.events
    .map((event) => clean(event.label))
    .filter(Boolean);

  const sourceShapedFragments = fragments.filter((fragment) => {
    const fragmentTokens = meaningfulTokens(fragment);
    if (!fragmentTokens.size) return false;

    return currentRealityLabels.some((label) =>
      overlap(
        fragmentTokens,
        meaningfulTokens(label),
      ) >= 0.72,
    );
  }).length;

  const fragmentParadeRatio = metric(
    sourceShapedFragments /
      Math.max(1, fragmentCount),
  );

  const parade = metric(
    Math.max(
      sourceCoverage * 0.72 +
        (fragmentCount >= Math.min(3, eventCount) ? 0.18 : 0) +
        trivialProgression * 0.1,
      fragmentCount >= 2
        ? fragmentParadeRatio * 0.82 +
          (fragmentCount >= Math.min(3, eventCount) ? 0.12 : 0)
        : 0,
    ),
  );

  return {
    parade,
    trivialProgression,
    sourceCoverage,
  };
}

function candidateScore(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope, priorTexts: readonly string[]): MouthCandidate {
  const value = clean(text);
  const labels = sourceLabels(beat, envelope);
  const interpretation = evaluateMouthInterpretation({
    text: value,
    sourceLabels: labels,
    envelope,
    beat,
  });
  const baseSemantic = semanticScore(value, beat, envelope, interpretation);
  const forbidden = Math.max(
    unsupportedConcrete(value, beat, envelope),
    interpretation.unsupportedConcreteRisk,
  );
  const explain = explanationPenalty(value);
  const abstract = abstractPenalty(value);
  const form = formScore(value);
  const payoff = payoffScore(value, beat);
  const semanticUnitRisk = semanticUnitParadeRisk(
    value,
    beat,
    envelope,
  );
  const novelty = priorTexts.length
    ? metric(1 - Math.max(...priorTexts.map((prior) => overlap(meaningfulTokens(value), meaningfulTokens(prior))), 0))
    : 1;
  const authorizationRealitySafe =
    interpretation.authorization.realitySafe &&
    forbidden < 0.9 &&
    explain < 0.95;
  const authorization = {
    ...interpretation.authorization,
    realitySafe: authorizationRealitySafe,
    authorized:
      authorizationRealitySafe &&
      interpretation.authorization.authorized,
    reasons: [
      ...interpretation.authorization.reasons,
      ...(forbidden >= 0.9 ? ["candidate-concrete-veto"] : []),
      ...(explain >= 0.95 ? ["candidate-explanation-veto"] : []),
    ],
  };

  if (forbidden >= 0.9 || explain >= 0.95) {
    return {
      text: value,
      beatOrder: beat.order,
      authorization: {
        ...authorization,
        authorized: false,
        realitySafe: false,
      },
      supportedEventIds: [],
      supportedRelationPairs: [],
      groundingScore: 0,
      meaningScore: 0,
      observerDiscoveryScore: 0,
      transitionScore: 0,
      obligationCoverage: 0,
      relationContractScore: 0,
      forbiddenMoveRisk: 1,
      cohesionScore: 0,
      noveltyScore: novelty,
      compressionScore: form,
      inventionRisk: 1,
      repetitionRisk: 1 - novelty,
      collageRisk: 0,
      endpointExactness: 0,
      score: 0,
      reasons: ["unsafe-realization", ...(explain ? ["meaning-explained-instead-of-felt"] : [])],
    };
  }

  const exact = labels.some((label) => normalize(label) === normalize(value));
  const sourceOverlap = overlap(meaningfulTokens(value), meaningfulTokens(labels.join(" ")));
  const worldOverlap = overlap(meaningfulTokens(value), meaningfulTokens(worldEvidence(envelope).join(" ")));
  const supportedEventIds = beat.eventIds?.length && sourceOverlap >= 0.25 ? [...beat.eventIds] : [];
  const supportedRelationPairs = beat.relationKinds?.map((kind) => String(kind)).filter(Boolean) ?? [];
  const grounding = metric(sourceOverlap * 0.46 + worldOverlap * 0.18 + (exact ? 0.36 : 0));
  const obligation = metric((beat.eventIds?.length ? 0.45 : 0.25) * 0.42 + baseSemantic * 0.38 + (supportedEventIds.length ? 0.2 : 0));
  const transition = metric(Number(beat.viewerState?.stateShift) || 0.45);
  const meaning = metric(baseSemantic * 0.5 + (STATUS.test(value) ? 0.08 : 0) + payoff * 0.26 - abstract * 0.18,);
  const distinctive = metric(
    form * 0.42 +
      meaning * 0.28 +
      novelty * 0.22 +
      (isFrameOnly(value) ? 0.14 : 0) +
      payoff * 0.14 +
      (sourceOverlap < 0.65 ? 0.08 : 0) -
      semanticUnitRisk.parade * 0.28,
  );
  const discovery = metric(
    meaning * 0.38 +
      transition * 0.24 +
      distinctive * 0.2 +
      novelty * 0.1 +
      (isFrameOnly(value) ? 0.08 : 0) -
      semanticUnitRisk.parade * 0.24,
  );
  const score = metric(
    grounding * 0.1 +
      obligation * 0.1 +
      meaning * 0.25 +
      transition * 0.12 +
      novelty * 0.1 +
      form * 0.1 +
      discovery * 0.13 +
      distinctive * 0.08 +
      payoff * 0.12 -
      abstract * 0.16 -
      semanticUnitRisk.parade * 0.22 -
      semanticUnitRisk.trivialProgression * 0.08,
  );

  const reasons: string[] = [];
  reasons.push(...interpretation.reasons);
  if (exact) reasons.push("literal-source-restatement");
  if (supportedEventIds.length) reasons.push("event-grounded");
  if (supportedRelationPairs.length) reasons.push("relation-grounded");
  if (grounding >= 0.45) reasons.push("beat-grounded");
  if (authorization.directGrounded) reasons.push("direct-source-grounded");
  if (authorization.semanticAuthorized) reasons.push("approved-semantic-realization");
  if (interpretation.reasons.includes("bounded-creative-bet")) reasons.push("bounded-creative-bet");
  if (distinctive >= 0.64) reasons.push("distinctive-realization");
  if (discovery >= 0.62) reasons.push("observer-discovery");
  if (payoff >= 0.62) reasons.push("viewer-reward");
  if (semanticUnitRisk.parade >= 0.58) {
    reasons.push("fact-parade-like");
  }
  if (semanticUnitRisk.trivialProgression >= 0.9) {
    reasons.push("trivial-connective-transformation");
  }
  if (
    (beat.eventIds?.length ?? 0) > 1 &&
    semanticUnitRisk.sourceCoverage < 0.55 &&
    authorization.semanticAuthorized
  ) {
    reasons.push("semantic-unit-transformation");
  }
  if (abstract > 0.35) reasons.push("abstract-nominalization");
  if (/^(?:a|an|the)\s+/i.test(value) && ABSTRACT_NOUN.test(value)) reasons.push("article-abstract-fragment");

  return {
    text: value,
    beatOrder: beat.order,
    authorization,
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

function buildSystemPrompt(): string {
  return [
    "QRE ONE MOUTH — final viewer-facing language realization.",
    "The world is already established. The movie is already chosen. The approved beats already have their purpose.",
    "Your job is to realize the approved beats as one connected viewer-facing sequence.",
    "You are not rewriting the evidence.",
    "The supplied reality is the factual boundary, not the desired wording.",
    "Invent language, not reality.",
    "Use realizationAuthority, not generic imagination, to determine what transformations are earned.",
    "The metamorphic relation is discovered upstream. The lens does not decide what happened or what the story means.",
    "Business/service context classifies the world; it is NOT event evidence.",
    "CLOSED-WORLD REALITY: if a person, participant, place, object, relationship, role, possessor, recipient, witness, worker, audience member, or other concrete entity is not explicitly supplied as factual reality, behave as though it does not exist.",
    "A contextual word is not actor authority. Mentioning a venue, service, business type, destination, role noun, crowd-like context, or workplace does not create a person who acts, watches, owns, rents, manages, receives, commissions, or participates.",
    "creativeLensBrief is treatment pressure over an already-approved relation. Use it to change perception, attitude, implication, metaphor, status, rhythm, or emotional pressure only.",
    "Never promote lens treatment into a concrete occurrence. Genre language is figurative unless the concrete event is explicitly supplied.",
    "READ THE WHOLE APPROVED SEQUENCE before writing any cut.",
    "Each cut sits inside the full experience: what has already landed, what is changing now, and what the next cut needs.",
    "FEEL IT. DO NOT EXPLAIN IT.",
    "THE MOVIE IS THE SEQUENCE OF VIEWER UPDATES CAUSED BY FACTS, NOT THE SEQUENCE OF FACTS.",
    "MAXIMIZE MEANINGFUL INFERENCE SPACE WHILE MAINTAINING GROUNDING.",
    "Never spend a cut saying what the observer can discover from the supplied evidence.",
    "Use viewerState as the cognitive target: each cut must materially change what the viewer can notice, infer, expect, question, or reinterpret.",
    "Productive ambiguity is good; confusion is not. Give enough grounded evidence for the viewer to construct the intended inference without naming the conclusion.",
    "Specific supplied detail beats generic emotional labeling. Prefer the actual supplied place, time, object, action, state, relationship, task, or odd detail as the cue that lets the viewer feel the memory or situation.",
    "Do not trade specific supplied reality for generic sentiment, genre mood, inspirational language, or a summary of why the moment matters.",
    "When one approved beat contains multiple eventIds, treat them as one semantic authorship unit unless the beat explicitly requires progression. Do not enumerate the component facts.",
    "A fact does not earn a visible cut merely because RealityGraph extracted it.",
    "Do not use connective chronology such as then, now, next, finally, or follows merely to make source facts appear progressive. Chronology must be supplied or semantically authorized.",
    "Later evidence should be allowed to change how earlier evidence reads. Prefer recontextualization over recap.",
    "Stop when the viewer can complete the meaning. Do not append the explanation after the recognition lands.",
    "Do not summarize the supplied memory, profile, service, object, or event back to the viewer.",
    "Make the viewer complete the meaning. Prefer implication, collision, callback, status, interruption, and recontextualization over explanatory connective prose.",
    "Compression means the smallest amount of visible language that causes the rest of the meaning to happen in the viewer's head.",
    "A later cut may change how an earlier cut reads. Stop when the realization lands.",
    "Use concise, specific, surprising, grounded language. Do not collapse a realization into fragments merely to make it shorter.",
    "The viewer should think: WHAT? WHY? WAIT. OH. WHAT HAPPENS NEXT?",
    "Express authorized meaning, status, attitude, implication, contrast, recurrence, consequence, viewer shift, and compressed payoff.",
    "You may radically change wording and sentence form.",
    "You may omit source wording.",
    "You may use compressed, surprising, fragmentary, declarative, ironic, status-driven, or attitude-driven language when authority permits it.",
    "Do not turn every emotion into an abstract noun.",
    "Avoid a/an/the + abstract noun unless it is genuinely specific and earned.",
    "Do not produce poetry soup: lightness, stillness, softness, resonance, contentment, a quiet bloom, the weight lifted, etc. unless the supplied material specifically earns that exact image.",
    "Do not narrate the machine. Never mention cognition, beats, candidates, viewer states, semantics, trajectories, planning, or meaning.",
    "Internal planning questions are not viewer copy. Never output phrases such as \"What connects...\", \"What becomes newly meaningful?\", \"What remains when...\", \"What happens next?\", \"Let us continue\", or other commentary about connecting, advancing, analyzing, or planning unless that exact language is supplied reality.",
    "Write the cut itself from the supplied evidence. Do not answer, paraphrase, or turn an internal next-question into a viewer-facing line.",
    "WORLD SIMULATION IS INTERNAL REASONING: its questions, hypotheses, expectations, prediction errors, and labels guide attention but are never viewer-facing copy. Never quote or paraphrase a World Simulation question unless that exact wording is supplied reality.",
    "A contextual noun is not automatically a character. A destination, venue, service, business type, workplace, or contextual role may not be promoted into a participant or actor unless the supplied reality explicitly establishes that participation.",
    "Do not invent a smile, shrug, eyebrow, walk, touch, breath, voice, room detail, object, weather, lighting, dialogue, motive, chronology, or physical event unless supplied.",
    "You may NOT create a concrete physical fact that is absent from realizationAuthority.reality.",
    "Do not convert emotions or states into invented body language.",
    "Forbidden reasoning examples: nervous -> trembling paws; nervous -> shoulders hunched; bath -> steam; bath -> bubbles; mischief -> gleaming eyes. Those add observable reality.",
    "Status or attitude framing may transform an explicitly supplied state without inventing a new physical event.",
    "Explicitly graph-authorized recurrence may be realized through compressed recognition, callback, implication, or attitude without restating every occurrence.",
    "Framing freedom is high: a role/title or genre frame may be used as interpretation when it is obviously a frame rather than an asserted new occurrence.",
    "Concrete nouns are immutable unless they are directly supplied by the source reality. Never replace one supplied object with another object just because the replacement is rhetorically stronger.",
    "A blue bow must remain a bow if that is what reality supplied. Do not turn it into a trophy, medal, prize, toy, gift, ribbon, or other object.",
    "You may compress or reframe supplied concrete reality, but you may not perform concrete noun substitution or generic specificity downgrade.",
    "A semanticRealization object, when present, is canonical non-prose realization structure from Cognition. Treat it as semantic authority, not as viewer-facing wording, and never invent concrete facts from it.",
    "A final supplied state is truth, not necessarily the exact final wording. Search for the earned status, verdict, send-off, punchline, afterimage, or identity shift.",
    "NEVER SPEND A CUT SAYING WHAT THE OBSERVER CAN DISCOVER. Productive ambiguity is desirable when the supplied evidence still makes the intended inference grounded.",
    "Each visible cut must cause a new grounded viewer update: establish, notice, sharpen, contrast, recontextualize, interrupt, accumulate, recognize, or land. A cut that only restates a fact is weak.",
    "The movie is the sequence of viewer updates caused by facts, not the sequence of facts themselves.",
    "When one approved beat contains several evidence events, realize what those events mean together. Do not serialize them into a checklist just because they were parsed separately.",
    "Do not label the conclusion when the viewer can infer it. Prefer implication, collision, callback, status, rhythm, omission, and recontextualization over explanation.",
    "Use domain/business context as arena vocabulary and capability context only. It never establishes a person, participant, relationship, ownership, tenancy, audience, staff member, recipient, witness, or social role that was not supplied.",
    "Generate exactly three materially different variants per beat by composing exactly three materially different WHOLE-SEQUENCE variants.",
    "Each sequence variant must contain exactly one viewer-facing text for each approved beat, in approved order.",
    "Compose each sequence variant as one connected experience. Later cuts may depend on earlier cuts.",
    "Do not make three synonym sets. Vary the whole sequence's rhetorical shape, progression, callback, implication, or payoff.",
    "Return JSON only.",
  ].join("\n");
}

function projectedRealizationAuthority(beat: MouthCandidateBeat) {
  const authority = beat.realizationAuthority;
  if (!authority) return undefined;

  return {
    reality: authority.reality,
    meaning: authority.meaning,
    earnedInterpretations: authority.earnedInterpretations,
    permittedRealizationModes: authority.permittedRealizationModes,
    inferenceBudget: authority.inferenceBudget,
    creativeMoves: authority.creativeMoves,
    treatment: authority.treatment,
    forbiddenMoves: authority.forbiddenMoves,
  };
}

export function buildMouthCandidateMessages(input: MouthCandidateGenerationInput): Array<{ role: "system" | "user"; content: string }> {
  const lens = classifyLens(input.lens);
  const evidence = worldEvidence(input.envelope);
  const beats = input.beats.map((beat) => ({
    order: beat.order,
    supplied: sourceLabels(beat, input.envelope),
    purpose: clean(beat.attentionFunction || beat.role),
    realizationAuthority: projectedRealizationAuthority(beat),
    viewerState: beat.viewerState
      ? { before: clean(beat.viewerState.beforeState), after: clean(beat.viewerState.afterState), move: clean(beat.viewerState.attentionMove) }
      : undefined,
    terminal: Boolean(beat.paysOff?.length),
  }));

  return [
    { role: "system", content: buildSystemPrompt() },
    {
      role: "user",
      content: JSON.stringify({
        subject: input.envelope.subject,
        lens: clean(input.lens) || "NONE",
        lensFrame: lens.label,
        creativeLensBrief: input.creativeLensBrief,
        domainContext: input.domainContext
          ? {
              category: clean(input.domainContext.category),
              businessType: clean(input.domainContext.businessType),
              businessName: clean(input.domainContext.businessName),
              businessDescription: clean(input.domainContext.businessDescription),
              serviceType: clean(input.domainContext.serviceType),
              serviceName: clean(input.domainContext.serviceName),
              subjectKind: clean(input.domainContext.subjectKind),
              services: input.domainContext.services ?? [],
              differentiators: input.domainContext.differentiators ?? [],
              signals: input.domainContext.signals ?? [],
              subjectKinds: input.domainContext.subjectKinds ?? [],
              importantFacts: input.domainContext.importantFacts ?? [],
              knownCapabilities: input.domainContext.knownCapabilities ?? [],
              contextualSignals: input.domainContext.contextualSignals ?? [],
              authority:
                "Context only. It may shape framing and legitimate domain vocabulary but may not create a concrete event, person, ownership/tenancy/client relationship, place, object, action, or chronology.",
            }
          : undefined,
        suppliedReality: evidence,
        priorCuts: input.priorTexts ?? [],
        beats,
        output: {
          sequenceVariants:
            "exactly 3 whole-sequence variants; each variant has texts containing exactly one viewer-facing cut per approved beat, in order",
        },
      }),
    },
  ];
}

type ParsedMouthCandidateBatch = MouthCandidateBatch & {
  sequenceVariants?: string[][];
};

export function parseMouthCandidateBatch(
  raw: string,
  expectedBeatCount?: number,
): ParsedMouthCandidateBatch | undefined {
  try {
    const parsed = JSON.parse(clean(raw)) as { sequenceVariants?: unknown; variantsByBeat?: unknown };
    if (Array.isArray(parsed?.sequenceVariants)) {
      const sequenceVariants = parsed.sequenceVariants
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        .map((item) =>
          Array.isArray(item.texts)
            ? item.texts.map(String).map(clean).filter(Boolean)
            : [],
        );

      if (sequenceVariants.length !== 3) return undefined;
      if (sequenceVariants.some((texts) => texts.length < 1)) return undefined;
      if (expectedBeatCount !== undefined && sequenceVariants.some((texts) => texts.length !== expectedBeatCount)) return undefined;
      const cutCount = sequenceVariants[0]?.length ?? 0;
      if (sequenceVariants.some((texts) => texts.length !== cutCount)) return undefined;

      const variantsByBeat = Array.from(
        { length: cutCount },
        (_, index) => ({
          order: index + 1,
          variants: sequenceVariants
            .map((texts) => clean(texts[index]))
            .filter(Boolean),
        }),
      );

      return {
        variantsByBeat,
        sequenceVariants,
      };
    }

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
    if (expectedBeatCount !== undefined && variantsByBeat.length !== expectedBeatCount) return undefined;
    if (variantsByBeat.some((item) => new Set(item.variants.map((value) => value.toLowerCase())).size !== 3)) return undefined;
    return { variantsByBeat: variantsByBeat.sort((a, b) => a.order - b.order) };
  } catch {
    return undefined;
  }
}

export function scoreMouthCandidate(input: { text: string; beat: MouthCandidateBeat; envelope: RealityEnvelope; priorTexts?: readonly string[] }): MouthCandidate {
  return candidateScore(input.text, input.beat, input.envelope, input.priorTexts ?? []);
}
