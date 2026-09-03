import type {
  AuthorDomainContext,
  MouthBeamOptions,
  MouthCandidate,
  MouthCandidateBatch,
  MouthCandidateBeat,
  MouthCandidatePool,
  MouthSequencePath,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { classifyLens } from "./authorCharacterLensEngine.js";

/** ONE PRODUCTION MOUTH. Generation, authorization, and sequence selection live here. */
export type { MouthCandidateBeat } from "@qre/contracts";

export type MouthCandidateGenerationInput = {
  envelope: RealityEnvelope;
  beats: readonly MouthCandidateBeat[];
  priorTexts?: readonly string[];
  lens?: string;
  domainContext?: AuthorDomainContext;
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at", "for",
  "with", "from", "by", "through", "after", "before", "then", "now", "still",
  "again", "this", "that", "it", "is", "are", "was", "were", "be", "been",
  "being", "as", "into", "my", "your", "our", "their", "his", "her", "its",
  "he", "she", "they", "them", "you", "we", "me", "very", "really", "just",
  "already", "apparently", "anyway", "perhaps", "maybe",
]);

const tokens = (value: string): Set<string> =>
  new Set(clean(value).toLowerCase().split(/[^a-z0-9'’-]+/g).filter((token) => token.length >= 3));

const meaningful = (value: string): Set<string> =>
  new Set([...tokens(value)].filter((token) => !STOP.has(token)));

const overlap = (a: Set<string>, b: Set<string>): number => {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
};

const wordCount = (value: string): number =>
  clean(value).split(/\s+/).filter(Boolean).length;

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function sourceLabels(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  return uniqueStrings(
    (beat.eventIds ?? []).map((id) =>
      envelope.events.find((event) => event.id === id)?.label ?? "",
    ),
  );
}

function worldSource(envelope: RealityEnvelope): string[] {
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

function semanticSource(beat: MouthCandidateBeat): string[] {
  const semantic = beat.semanticRealization;
  if (!semantic) return [];
  const observer = beat.observerExperience;
  return [
    semantic.subject,
    semantic.before,
    semantic.after,
    semantic.relation?.kind,
    semantic.callback?.detail,
    semantic.realizationMove,
    semantic.creativeOpportunity,
    semantic.mechanism,
    observer?.objective,
    observer?.surprise,
    observer?.curiosity,
    observer?.landing,
    ...(observer?.attention ?? []),
  ].map(clean).filter(Boolean);
}

function exactSource(text: string, labels: readonly string[]): boolean {
  const value = clean(text).replace(/[.!?]+$/g, "").toLowerCase();
  return labels.some(
    (label) => clean(label).replace(/[.!?]+$/g, "").toLowerCase() === value,
  );
}

function explanationRisk(text: string): number {
  const value = clean(text);
  if (!value) return 1;
  const explicit = [
    /\b(?:because|therefore|thus|hence|due to|as a result|thanks to|all thanks to)\b/i,
    /\b(?:the reason|the cause|the point|the meaning|the secret|the ingredient)\b/i,
    /\b(?:which made|which caused|which meant|that's how|that is how)\b/i,
    /\b(?:this was|that was)\s+(?:why|the reason|the cause)\b/i,
  ];
  const hits = explicit.reduce((sum, pattern) => sum + (pattern.test(value) ? 1 : 0), 0);
  return metric(hits / 2);
}

function concreteRisk(text: string, source: string): number {
  const value = clean(text);
  if (!value) return 1;
  if (/\b(?:qre|cognition|planner|planning|candidate|semantic|trajectory|viewer|observer|objective|audience|mouth|author|beam|payoff\s+dependency)\b/i.test(value)) {
    return 1;
  }
  const semanticMeta = /\b(?:this means|which means|the meaning is|the point is|the viewer|the audience|this proves|in other words)\b/i;
  if (semanticMeta.test(value)) return 1;
  const candidateWords = meaningful(value);
  const sourceWords = meaningful(source);
  const grounding = overlap(candidateWords, sourceWords);
  const unsupportedAction = /\b(?:walk(?:ed|s)?|run(?:ning|s)?|jump(?:ed|s|ing)?|grab(?:bed|s|bing)?|kiss(?:ed|es|ing)?|hug(?:ged|s|ging)?|smil(?:ed|es|ing)?|laugh(?:ed|s|ing)?|talk(?:ed|s|ing)?|open(?:ed|s|ing)?|clos(?:ed|es|ing)?|enter(?:ed|s|ing)?|return(?:ed|s|ing)?|watch(?:ed|es|ing)?|look(?:ed|s|ing)?|move(?:d|s|ing)?|touch(?:ed|es|ing)?|throw|threw|catch|caught|dance(?:d|s|ing)?|drive|drove|push(?:ed|es|ing)?|pull(?:ed|s|ing)?|vanish(?:ed|es|ing)?|disappear(?:ed|es|ing)?)\b/i;
  return unsupportedAction.test(value) && grounding < 0.55 ? 1 : 0;
}

/**
 * Creative realization forms are language operators, not new facts.  A candidate
 * may use these forms to express an already-approved relationship without
 * repeating Cognition's internal wording.
 */
function creativeFormSignal(text: string): number {
  const value = clean(text);
  if (!value) return 0;
  const forms = [
    /\b(?:had|has|have)\s+(?:other|different|their own)\s+(?:plans?|ideas?|agenda|way)\b/i,
    /\b(?:apparently|somehow|after all|of course|instead|still|not quite|so much for)\b/i,
    /\b(?:was|were|is|are)\s+not\s+(?:done|finished)\b/i,
    /\b(?:wasn't|weren't|isn't|aren't)\s+(?:done|finished|over)\b/i,
    /\b(?:had|has|have)\s+(?:a|an)\s+(?:point|plan|idea|agenda)\b/i,
    /\b(?:turned out|it seems|seemed|looked like)\b/i,
    /\b(?:for|with|about)\s+(?:that|this|the|a|an)\s+(?:detail|thing|part|bow|bath|visit|result|ending)\b/i,
    /\b(?:claimed|insisted|decided|chose|wanted|needed|preferred)\b/i,
  ];
  return metric(forms.reduce((sum, pattern) => sum + (pattern.test(value) ? 1 : 0), 0) / 2);
}

function declarativeRestatementRisk(
  text: string,
  labels: readonly string[],
  beat: MouthCandidateBeat,
): number {
  if (!text || !labels.length || beat.role === "establishing") return 0;
  const candidate = meaningful(text);
  const source = meaningful(labels.join(" "));
  if (!candidate.size || !source.size) return 0;

  const lexicalSimilarity = overlap(candidate, source);
  const closeInSize = wordCount(text) <= Math.max(8, Math.max(...labels.map(wordCount)) + 4);
  const declarativePredicate = /^(?:(?:[a-z][a-z'-]+)\s+){0,3}(?:is|are|was|were|has|have|loves?|likes?|needs?|owns?|wears?|uses?|visits?|visited|met|knows?|prefers?|wants?)\b/i.test(clean(text));

  if (declarativePredicate && lexicalSimilarity >= 0.55) return metric(0.72 + (lexicalSimilarity - 0.55) * 0.5);
  if (closeInSize && lexicalSimilarity >= 0.82) return 0.62;
  return 0;
}

function semanticAuthorization(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
  grounding: number,
  invention: number,
): { authorized: boolean; strength: number } {
  const semantic = beat.semanticRealization;
  if (!semantic || invention >= 0.9) return { authorized: false, strength: 0 };

  const evidence = new Set(semantic.evidenceEventIds ?? []);
  const eventIds = beat.eventIds ?? [];
  const candidateWords = meaningful(text);
  const labels = sourceLabels(beat, envelope);
  const semanticWords = meaningful(semanticSource(beat).join(" "));
  const before = meaningful(clean(semantic.before));
  const after = meaningful(clean(semantic.after));
  const beforeOverlap = overlap(candidateWords, before);
  const afterOverlap = overlap(candidateWords, after);
  const semanticOverlap = overlap(candidateWords, semanticWords);
  const sourceCoverage = labels.filter(
    (label) => overlap(meaningful(label), candidateWords) >= 0.5,
  ).length;
  const crossEventExpression = sourceCoverage >= 2;
  const beforeAfter = before.size > 0 && after.size > 0 && beforeOverlap >= 0.14 && afterOverlap >= 0.14;
  const semanticMove = semanticOverlap >= 0.24;
  const creativeForm = creativeFormSignal(text);

  const anchorIds = uniqueStrings([
    ...(semantic.beforeEventIds ?? []),
    ...(semantic.afterEventIds ?? []),
  ]);
  const anchorPositions = anchorIds.map((id) => envelope.events.findIndex((event) => event.id === id));
  const allAnchorsResolve = anchorIds.length >= 2 && anchorPositions.every((position) => position >= 0);
  const minAnchor = allAnchorsResolve ? Math.min(...anchorPositions) : -1;
  const maxAnchor = allAnchorsResolve ? Math.max(...anchorPositions) : -1;
  const bridgeEvent =
    allAnchorsResolve &&
    minAnchor < maxAnchor &&
    eventIds.some((id) => {
      const position = envelope.events.findIndex((event) => event.id === id);
      return position > minAnchor && position < maxAnchor;
    });
  const bridgeGrounded =
    bridgeEvent &&
    labels.some((label) => overlap(candidateWords, meaningful(label)) >= 0.18);
  const bridgeSpanApproved = bridgeEvent && [...evidence].every((id) => anchorIds.includes(id));
  const bridge = Boolean(bridgeSpanApproved && bridgeGrounded);

  const subjectWords = meaningful(clean(semantic.subject));
  const relationshipAnchor = afterOverlap >= 0.18 || beforeOverlap >= 0.18;
  const nonDeclarativeRelationship =
    Boolean(semantic.relation) &&
    relationshipAnchor &&
    !exactSource(text, labels) &&
    candidateWords.size <= Math.max(4, meaningful(clean(semantic.after)).size + 4) &&
    (/[!?]$/.test(clean(text)) || ![...subjectWords].some((token) => candidateWords.has(token)));

  const groundedCreativeFraming = grounding >= 0.18 && creativeForm >= 0.5;
  const groundedSemanticMove = grounding >= 0.2 && semanticOverlap >= 0.18;

  if (!(beforeAfter || crossEventExpression || semanticMove || bridge || groundedCreativeFraming || groundedSemanticMove || nonDeclarativeRelationship)) {
    return { authorized: false, strength: 0 };
  }

  return {
    authorized: true,
    strength: metric(
      (beforeAfter ? 0.38 : 0) +
        (crossEventExpression ? 0.22 : 0) +
        (semanticMove ? 0.2 : 0) +
        (bridge ? 0.12 : 0) +
        (groundedCreativeFraming ? 0.18 : 0) +
        (groundedSemanticMove ? 0.18 : 0) +
        (nonDeclarativeRelationship ? 0.24 : 0),
    ),
  };
}

function groupedEvidenceCoverage(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): number {
  const labels = sourceLabels(beat, envelope);
  if (labels.length <= 1) return labels.length ? 1 : 0;
  const candidateWords = meaningful(text);
  const covered = labels.filter(
    (label) => overlap(candidateWords, meaningful(label)) >= 0.18,
  ).length;
  return metric(covered / labels.length);
}

function evaluateCandidate(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
  priorTexts: readonly string[],
): MouthCandidate {
  const value = clean(text);
  const labels = sourceLabels(beat, envelope);
  const literal = exactSource(value, labels);
  const whole = worldSource(envelope).join(" ");
  const grounding = metric(
    overlap(meaningful(value), meaningful(labels.join(" "))) * 0.72 +
      overlap(meaningful(value), meaningful(whole)) * 0.28,
  );
  const invention = metric(concreteRisk(value, whole));
  const semantic = semanticAuthorization(value, beat, envelope, grounding, invention);
  const novelty = priorTexts.length
    ? metric(1 - Math.max(...priorTexts.map((prior) => overlap(meaningful(value), meaningful(prior))), 0))
    : 1;
  const humanSized = wordCount(value) >= 2 && wordCount(value) <= 16;
  const groupedCoverage = groupedEvidenceCoverage(value, beat, envelope);
  const observerForbidden = beat.observerExperience?.explanationForbidden === true;
  const explanation = explanationRisk(value);
  const creativeForm = creativeFormSignal(value);
  const restatementRisk = declarativeRestatementRisk(value, labels, beat);
  const semanticEligible = semantic.authorized &&
    (labels.length <= 1 || groupedCoverage >= 0.5);
  const semanticCreative = semanticEligible && !literal && creativeForm >= 0.35;
  const explanationPenalty = observerForbidden ? explanation : explanation * 0.35;
  const experiencePenalty = restatementRisk * 0.22;

  const creativeScore = metric(
    (semantic.strength * 0.34) +
      (creativeForm * 0.2) +
      (grounding * 0.16) +
      (novelty * 0.1) +
      (humanSized ? 0.07 : 0) +
      (groupedCoverage * 0.05) +
      (semanticCreative ? 0.12 : 0) -
      explanationPenalty * 0.38 -
      experiencePenalty,
  );

  const literalScore = metric(
    0.38 +
      grounding * 0.2 +
      groupedCoverage * (labels.length > 1 ? 0.12 : 0.05) +
      novelty * 0.05 +
      (observerForbidden && explanation === 0 ? 0.03 : 0) -
      explanationPenalty * 0.35 -
      experiencePenalty * 0.75,
  );

  const score = literal
    ? literalScore
    : semanticEligible
      ? creativeScore
      : 0;

  const reasons: string[] = [];
  if (literal) reasons.push("literal-source-restatement");
  if (grounding >= 0.18) reasons.push("event-grounded");
  if (semanticEligible) reasons.push("approved-semantic-realization");
  if (semanticCreative) reasons.push("creative-realization-form");
  if (semanticEligible && !literal) reasons.push("implied-semantic-realization");
  else if (!literal && !semanticEligible) reasons.push("candidate-does-not-express-approved-meaning");
  if ((beat.eventIds ?? []).length > 1 && groupedCoverage >= 0.5) reasons.push("cross-event-expression");
  if (groupedCoverage >= 0.999) reasons.push("grouped-evidence-complete");
  if (observerForbidden && explanation === 0) reasons.push("discovery-preserving");
  if (explanation > 0) reasons.push("explicit-explanation-risk");
  if (humanSized) reasons.push("human-sized-cut");
  if (creativeForm >= 0.5) reasons.push("framing-operator");
  if (restatementRisk >= 0.55) reasons.push("list-like-restatement");
  if (semantic.relation && semantic.authorized) reasons.push("relationship-expression");
  if (invention >= 0.9) reasons.push("unsupported-concrete-risk");
  if (novelty >= 0.6) reasons.push("novel-language");

  return {
    text: value,
    beatOrder: beat.order,
    supportedEventIds:
      grounding >= 0.18 &&
      invention < 0.9 &&
      (labels.length <= 1 || groupedCoverage >= 0.5)
        ? [...(beat.eventIds ?? [])]
        : [],
    supportedRelationPairs: (beat.relationKinds ?? []).map(String).filter(Boolean),
    groundingScore: grounding,
    meaningScore: semanticEligible ? Math.max(semantic.strength, creativeForm * 0.8) : literal ? 0.35 : 0,
    observerDiscoveryScore: semanticEligible
      ? Math.max(semantic.strength, 0.4) * (explanation === 0 ? 1 : 0.7)
      : literal
        ? 0.08
        : 0,
    transitionScore: metric(Number(beat.viewerState?.stateShift) || 0.4),
    obligationCoverage: metric(
      literal
        ? groupedCoverage >= 0.999 || labels.length <= 1
          ? 1
          : 0.5 + groupedCoverage * 0.4
        : semanticEligible
          ? 0.72 + groupedCoverage * 0.28
          : 0,
    ),
    relationContractScore: metric((beat.relationKinds ?? []).length ? 0.85 : 0.35),
    forbiddenMoveRisk: metric(Math.max(invention, explanationPenalty, restatementRisk * 0.55)),
    cohesionScore: metric(
      0.44 +
        (semanticEligible ? semantic.strength * 0.28 : 0) +
        creativeForm * 0.12 +
        grounding * 0.08 +
        groupedCoverage * 0.1 -
        explanationPenalty * 0.12 -
        restatementRisk * 0.08,
    ),
    noveltyScore: novelty,
    compressionScore: humanSized ? 0.95 : 0.65,
    inventionRisk: invention,
    repetitionRisk: 1 - novelty,
    collageRisk: groupedCoverage < 0.5 && labels.length > 1 ? 0.8 : 0,
    endpointExactness: literal ? 1 : 0,
    score,
    reasons,
  };
}

function buildSystemPrompt(): string {
  return [
    "You are QRE's ONE MOUTH.",
    "Cognition has already decided the reality, movie, semantic meaning, evidence, relations, viewer movement, and beat order. You only realize that approved meaning as language.",
    "Reality freedom is LOW. Framing freedom is HIGH.",
    "Grounding is necessary but lexical copying is not required. Cognition's approved semantic realization authorizes creative phrasing; do not force the internal semantic wording into the final sentence.",
    "Never invent a person, object, place, physical action, physical relation, reaction, dialogue, event, or chronology.",
    "Use the lens to alter framing, rhythm, irony, tenderness, suspense, status, absurdity, or genre coloration only.",
    "A grounded implication is preferred over a literal paraphrase when an approved semantic realization exists.",
    "THE DOTS ARE NOT THE SCRIPT: supplied facts, traits, preferences, relationships, places, and events are backend world material. Do not emit them as a profile list just because they were supplied as separate dots.",
    "SEQUENCE FIRST: each cut is a viewer-facing moment. Recompose approved relationships into what the viewer experiences next: arrival, action, anticipation, pressure, recognition, consequence, callback, or payoff.",
    "For preference, affinity, ownership, attachment, recurrence, or similar relationships, avoid declarative trait-list prose such as 'Milo loves bacon' when the cut can play the relationship instead. Prefer a lived line such as a reaction, question, anticipation, status move, juxtaposition, or consequence grounded in the supplied relation.",
    "A question or interior-style realization such as 'Do I smell bacon?' can express an approved supplied relationship without asserting that bacon is physically present. Keep the distinction clear: experiential language is not a new source event.",
    "ACCUMULATE: carry forward significance established by earlier approved beats. A later line may rely on what the observer already learned instead of restating it.",
    "IMPLY: communicate an approved relationship through juxtaposition, syntax, contrast, consequence, status, selection, or callback. Do not explain the relationship.",
    "RECONTEXTUALIZE: let a later approved fact change how an earlier fact is perceived. Preserve the fact; change its significance through the supplied relation.",
    "Use realization forms such as 'had other plans', 'had different ideas', 'apparently', 'not quite done', 'instead', 'after all', or similar framing operators when they are grounded by the supplied evidence. These are language forms, not permission to invent facts.",
    "For every beat return exactly 3 materially different candidates: (1) grounded experience, (2) compressed framing, (3) bold implication. The second and third should change the cut's framing, voice, anticipation, or information compression rather than merely swapping adjectives.",
    "A candidate needs a grounded anchor, not a complete copied source sentence. One supplied noun, relationship token, event consequence, or clearly approved referent is enough when the semantic contract carries the rest.",
    "Never write generic atmospheric filler, trailer narration, or a prettier noun for an event.",
    "Do not close every information gap immediately. Build a specific, answerable micro-question when the approved beat supplies one; resolve it at the approved payoff.",
    "At payoff, satisfy the current approved question or tension. Only open another loop when the cognition-supplied next/frontier material supports it; never manufacture a hook for engagement alone.",
    "If no approved semantic realization exists for a beat, use the supplied event literally. Do not invent a meaning.",
    "The goal is felt discovery: the observer should notice the relationship and arrive at the meaning before the language explains it.",
  ].join(" ");
}

export function buildMouthCandidateMessages(input: MouthCandidateGenerationInput) {
  const lens = classifyLens(input.lens);
  return [
    {
      role: "system" as const,
      content: buildSystemPrompt(),
    },
    {
      role: "user" as const,
      content: JSON.stringify(
        {
          instruction:
            "Return exactly 3 materially different language realizations for EVERY beat. Do not omit a beat. Do not turn the beat set into a trait/profile list. Realize each approved relationship as a sequence moment. For each beat produce: A) grounded experience, B) compressed framing, C) bold implication. Prefer reaction, anticipation, question, status, juxtaposition, consequence, or callback when those forms are supported. Preserve at least one grounded referent in every candidate, but do not copy the complete source sentence. Never state the thesis directly when explanationForbidden is true.",
          lens: input.lens || "AUTO",
          lensProfile: lens,
          domainContext: input.domainContext ?? null,
          reality: worldSource(input.envelope),
          beats: input.beats.map((beat) => ({
            order: beat.order,
            role: beat.role,
            eventIds: beat.eventIds ?? [],
            evidence: sourceLabels(beat, input.envelope),
            semanticRealization: beat.semanticRealization ?? null,
            observerExperience: beat.observerExperience ?? null,
            change: beat.change,
            next: beat.next,
            frontier: beat.frontier,
            obligations: beat.obligations ?? [],
            forbiddenMoves: beat.forbiddenMoves ?? [],
          })),
          priorTexts: input.priorTexts ?? [],
          outputSchema: {
            variantsByBeat: input.beats.map((beat) => ({
              order: beat.order,
              variants: ["grounded experience", "compressed framing", "bold implication"],
            })),
          },
        },
        null,
        2,
      ),
    },
  ];
}

export function parseMouthCandidateBatch(raw: string): MouthCandidateBatch | undefined {
  try {
    const parsed = JSON.parse(
      clean(raw)
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/i, "")
        .trim(),
    ) as { variantsByBeat?: unknown };
    if (!Array.isArray(parsed.variantsByBeat)) return;
    const variantsByBeat = parsed.variantsByBeat
      .map((item) => {
        const variant = item as { order?: unknown; variants?: unknown };
        return {
          order: Number(variant.order),
          variants: Array.isArray(variant.variants)
            ? variant.variants.map(clean).filter(Boolean).slice(0, 3)
            : [],
        };
      })
      .filter(
        (item) => Number.isFinite(item.order) && item.order > 0 && item.variants.length > 0,
      );
    return variantsByBeat.length ? { variantsByBeat } : undefined;
  } catch {
    return undefined;
  }
}

export function scoreMouthCandidate(input: {
  text: string;
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  priorTexts?: readonly string[];
}): MouthCandidate {
  return evaluateCandidate(
    input.text,
    input.beat,
    input.envelope,
    input.priorTexts ?? [],
  );
}

export function isAuthorizedMouthCandidate(candidate: MouthCandidate): boolean {
  if (!clean(candidate.text)) return false;
  if (candidate.inventionRisk >= 0.9) return false;
  if (candidate.reasons.includes("explicit-explanation-risk") && candidate.forbiddenMoveRisk >= 0.9) return false;
  if (candidate.endpointExactness >= 0.999) return true;
  return candidate.reasons.includes("approved-semantic-realization") && candidate.score >= 0.42;
}

function lexicalNovelty(text: string, prior: readonly MouthCandidate[]): number {
  if (!prior.length) return 1;
  const current = meaningful(text);
  return metric(1 - Math.max(...prior.map((candidate) => overlap(current, meaningful(candidate.text))), 0));
}

function pathIncrement(
  candidate: MouthCandidate,
  prior: readonly MouthCandidate[],
  pool: MouthCandidatePool,
): number {
  const state = pool.viewerState;
  const novelty = lexicalNovelty(candidate.text, prior);
  const carry = prior.length
    ? metric(
        Math.max(...prior.map((item) => item.meaningScore), 0) * 0.3 +
          Math.max(...prior.map((item) => item.observerDiscoveryScore), 0) * 0.22 +
          candidate.meaningScore * 0.48,
      )
    : candidate.meaningScore;
  const fit = metric(
    candidate.transitionScore * 0.25 +
      state.stateShift * 0.15 +
      state.curiosityPressure * 0.2 +
      state.predictionError * 0.15 +
      candidate.observerDiscoveryScore * 0.25,
  );
  const loop = metric((pool.nextPromise ? 0.6 : 0) + (pool.frontier ? 0.4 : 0));
  const semanticBonus = candidate.reasons.includes("approved-semantic-realization") ? 0.1 : 0;
  const implicationBonus = candidate.reasons.includes("implied-semantic-realization") ? 0.1 : 0;
  const framingBonus = candidate.reasons.includes("creative-realization-form") ? 0.12 : 0;
  const noveltyBonus = candidate.reasons.includes("novel-language") ? 0.06 : 0;
  const relationBonus = candidate.reasons.includes("cross-event-expression") ? 0.06 : 0;
  const coverageBonus = candidate.reasons.includes("grouped-evidence-complete") ? 0.05 : 0;
  const discoveryBonus = candidate.reasons.includes("discovery-preserving") ? 0.06 : 0;
  const relationshipBonus = candidate.reasons.includes("relationship-expression") ? 0.08 : 0;
  const explanationPenalty = candidate.reasons.includes("explicit-explanation-risk") ? 0.14 : 0;
  const literalPenalty = candidate.endpointExactness >= 0.999 ? 0.09 : 0;
  const listPenalty = candidate.reasons.includes("list-like-restatement") ? 0.16 : 0;

  return metric(
    candidate.score * 0.32 +
      fit * 0.18 +
      carry * 0.14 +
      candidate.meaningScore * 0.08 +
      candidate.obligationCoverage * 0.04 +
      novelty * 0.04 +
      candidate.cohesionScore * 0.04 +
      loop * 0.03 +
      semanticBonus +
      implicationBonus +
      framingBonus +
      noveltyBonus +
      relationBonus +
      coverageBonus +
      discoveryBonus +
      relationshipBonus -
      explanationPenalty -
      literalPenalty -
      listPenalty,
  );
}

function dedupe(candidates: readonly MouthCandidate[]): MouthCandidate[] {
  const seen = new Set<string>();
  const output: MouthCandidate[] = [];
  for (const candidate of candidates) {
    const key = clean(candidate.text).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(candidate);
  }
  return output;
}

export function selectBestMouthSequence(
  pools: readonly MouthCandidatePool[],
  options: MouthBeamOptions = {},
): MouthSequencePath {
  const ordered = [...pools].sort((a, b) => a.order - b.order);
  if (!ordered.length) return { candidates: [], texts: [], score: 0 };
  if (ordered.some((pool) => !pool.viewerState || typeof pool.viewerState !== "object")) {
    return { candidates: [], texts: [], score: 0 };
  }

  const width = Math.max(1, Math.floor(options.width ?? 8));
  const perBeat = Math.max(1, Math.floor(options.candidatesPerBeat ?? 8));
  let paths: Array<{ candidates: MouthCandidate[]; score: number }> = [
    { candidates: [], score: 0 },
  ];

  for (const pool of ordered) {
    let eligible = dedupe(pool.candidates).filter(isAuthorizedMouthCandidate);
    const creative = eligible.filter((candidate) =>
      candidate.reasons.includes("approved-semantic-realization") &&
      !candidate.reasons.includes("literal-source-restatement"),
    );
    if (creative.length) {
      eligible = creative;
    } else {
      eligible = eligible.filter((candidate) => candidate.endpointExactness >= 0.999);
    }

    if (!eligible.length) return { candidates: [], texts: [], score: 0 };

    eligible.sort((a, b) => b.score - a.score);
    eligible = eligible.slice(0, Math.max(width, perBeat));

    const expanded: Array<{ candidates: MouthCandidate[]; score: number }> = [];
    for (const path of paths) {
      for (const candidate of eligible) {
        if (
          path.candidates.some(
            (prior) => clean(prior.text).toLowerCase() === clean(candidate.text).toLowerCase(),
          )
        ) {
          continue;
        }
        expanded.push({
          candidates: [...path.candidates, candidate],
          score: path.score + pathIncrement(candidate, path.candidates, pool),
        });
      }
    }

    expanded.sort((a, b) => b.score - a.score);
    paths = expanded.slice(0, width);
  }

  const best = paths[0];
  if (!best) return { candidates: [], texts: [], score: 0 };
  return {
    candidates: best.candidates,
    texts: best.candidates.map((candidate) => candidate.text),
    score: metric(best.score / Math.max(1, best.candidates.length)),
  };
}
