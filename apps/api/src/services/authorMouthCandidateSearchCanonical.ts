import type {
  AuthorDomainContext,
  MouthCandidate,
  MouthCandidateBatch,
  MouthCandidateBeat,
  MouthCandidateSelection,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { evaluateMouthInterpretation } from "./authorMouthInterpretation.js";

/**
 * ONE PRODUCTION MOUTH.
 *
 * Cognition owns reality, movie structure, semantic movement and beat purpose.
 * Mouth owns only the final human-facing realization.
 *
 * Core law: FEEL IT. DO NOT EXPLAIN IT.
 *
 * This module deliberately treats an approved semantic relationship as a
 * realization obligation. Mouth may phrase it freely, but may not collapse
 * "before -> after" into a single endpoint label when the relationship itself
 * is the point of the cut.
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

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const metric = (value: number): number =>
  Number(
    Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3),
  );

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at",
  "for", "with", "from", "by", "through", "after", "before", "then",
  "now", "still", "again", "this", "that", "it", "is", "are", "was",
  "were", "be", "been", "being", "as", "into", "my", "your", "our",
  "their", "his", "her", "its", "he", "she", "they", "them", "you",
  "we", "me",
]);

const INTERNAL = /\b(?:cognition|planner|planning|beat|candidate|trajectory|viewer|audience|observer|objective|curiosity|prediction error|state shift|sequence|author|mouth|canonical|supplied evidence|semantic turn|relation kind|payoff dependency|memory projection|future thread)\b/i;
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
const RELATION_CUE = /\b(?:then|yet|but|still|again|same|back|returned|remains|remembered|remember|now|until|finally|already|suddenly|instead|later)\b/i;
const GENERIC_CONCRETE_HEAD = /\b(?:thing|things|stuff|object|objects|item|items|something|anything|one|piece|pieces|shape|shapes|whatever|whatsoever)\b/i;

const CONCRETE_WORD = /\b(?:bow|trophy|medal|prize|toy|gift|phone|bag|purse|car|boat|yacht|surfboard|key|keys|bottle|bottles|chair|table|door|window|room|house|hotel|restaurant|kitchen|bathroom|leash|collar|tag|ticket|receipt|dress|shirt|shoe|shoes|cake|ring|flower|flowers|balloon|camera|screen|wallet|passport|boarding|plane|flight|beach|board|bed|blanket|blankets|towel|towels|knife|knives|food|drink|coffee|wine|soap|shampoo|conditioner)\b/i;

const SAFE_FRAMING = new Set([
  "apparently", "anyway", "already", "finally", "for", "now", "again",
  "still", "just", "only", "very", "really", "quite", "somehow",
  "unexpectedly", "suddenly", "maybe", "perhaps", "yet", "almost",
  "exactly", "fabulous", "fierce", "cool", "sharp", "ready", "done",
  "approved", "cleared", "complete", "finished", "temporary",
  "temporarily", "peace", "exit", "winner", "victory", "legend",
  "mission", "case", "verdict", "boss", "level", "upgrade", "final",
  "reset",
]);

function meaningfulTokens(value: string): Set<string> {
  return new Set(
    clean(value)
      .toLowerCase()
      .split(/[^a-z0-9'’-]+/g)
      .filter((token) => token.length >= 3 && !STOP.has(token)),
  );
}

function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
}

function sourceLabels(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): string[] {
  return [
    ...new Set(
      (beat.eventIds ?? [])
        .map((id) => envelope.events.find((event) => event.id === id)?.label ?? "")
        .map(clean)
        .filter(Boolean),
    ),
  ];
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

function unsupportedConcrete(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): number {
  const value = clean(text);
  if (!value) return 1;
  if (INTERNAL.test(value) || EXPLANATION.test(value)) return 1;

  const candidate = meaningfulTokens(value);
  const labels = sourceLabels(beat, envelope);
  const world = meaningfulTokens(worldEvidence(envelope).join(" "));
  const local = overlap(candidate, meaningfulTokens(labels.join(" ")));
  const global = overlap(candidate, world);

  if (GENERIC_SUMMARY.test(value)) return 0.85;
  if (GENERIC_CONCRETE_HEAD.test(value)) return 0.7;

  if (PHYSICAL_VERB.test(value)) {
    const suppliedPhysical = labels.some((label) => PHYSICAL_VERB.test(label));
    if (!suppliedPhysical && !SOFT_FIRST_PERSON.test(value)) return 1;
  }

  if (BODY.test(value)) {
    const suppliedBody = worldEvidence(envelope).some(
      (item) =>
        BODY.test(item) &&
        overlap(meaningfulTokens(value), meaningfulTokens(item)) >= 0.5,
    );
    if (!suppliedBody && !SOFT_FIRST_PERSON.test(value)) return 1;
  }

  if (DETERMINED_ROLE.test(value)) return 1;
  if (CONCRETE_WORD.test(value) && global < 0.55 && local < 0.72) return 0.8;
  return 0;
}

function semanticBridge(value: string): {
  before: string;
  after: string;
  callback: string;
} {
  const normalized = clean(value).replace(/\.$/, "");
  const match = normalized.match(
    /moves from (.+?) to (.+?)(?:;\s*the same (.+?) (?:remains?|is still|returns?)(?:\b|$)|$)/i,
  );
  if (match) {
    return {
      before: clean(match[1]),
      after: clean(match[2]),
      callback: clean(match[3] ?? ""),
    };
  }

  const significance = normalized.match(
    /changes significance from (.+?) to (.+?)(?:;\s*the same (.+?) (?:remains?|is still|returns?)(?:\b|$)|$)/i,
  );
  if (significance) {
    return {
      before: clean(significance[1]),
      after: clean(significance[2]),
      callback: clean(significance[3] ?? ""),
    };
  }

  const generic = normalized.match(/\bfrom (.+?) to (.+)$/i);
  return generic
    ? { before: clean(generic[1]), after: clean(generic[2]), callback: "" }
    : { before: "", after: "", callback: "" };
}

function semanticBridgeScore(
  text: string,
  beat: MouthCandidateBeat,
): number {
  const bridge = semanticBridge(clean(beat.change));
  if (!bridge.before || !bridge.after) return 0;

  const candidate = meaningfulTokens(text);
  const before = overlap(candidate, meaningfulTokens(bridge.before));
  const after = overlap(candidate, meaningfulTokens(bridge.after));
  const relationship = RELATION_CUE.test(text) ? 1 : 0;
  const callback = bridge.callback
    ? overlap(candidate, meaningfulTokens(bridge.callback))
    : 0;

  /*
   * The relationship is the thing Mouth must preserve. Endpoint-only lines
   * deliberately cannot score as highly as a cut that lets the viewer feel
   * both sides of the approved movement.
   */
  const twoSided = Math.min(1, before * 1.4) * Math.min(1, after * 1.4);
  const oneSided = Math.max(before, after) * 0.18;
  return metric(
    twoSided * 0.58 +
      relationship * 0.14 +
      callback * 0.18 +
      oneSided,
  );
}

function callbackScore(text: string, beat: MouthCandidateBeat): number {
  const change = clean(beat.change);
  const callbackWords = /(?:same|again|returns?|returned|remains?|still|remembered|remember|later)/i.test(change);
  if (!callbackWords) return 0;
  const value = clean(text);
  const lexical = RELATION_CUE.test(value) ? 0.45 : 0;
  const concrete = CONCRETE_WORD.test(value) ? 0.45 : 0;
  return metric(lexical + concrete);
}

function abstractPenalty(text: string): number {
  const value = clean(text);
  const count = value.split(/\s+/).filter(Boolean).length;
  if (!ABSTRACT_NOUN.test(value)) return 0;
  if (/^(?:a|an|the)\s+/i.test(value) && count <= 6) return 0.58;
  if (count <= 4) return 0.4;
  return 0.2;
}

function formScore(text: string): number {
  const count = clean(text).split(/\s+/).filter(Boolean).length;
  let score =
    count <= 2 ? 1 :
    count <= 5 ? 0.95 :
    count <= 8 ? 0.8 :
    count <= 12 ? 0.6 :
    0.35;
  if (STATUS.test(text)) score += 0.18;
  if (FRAME_NOUN.test(text) && !/^(?:the|a|an)\s+/i.test(clean(text))) score += 0.12;
  if (RELATION_CUE.test(text)) score += 0.12;
  return metric(score);
}

function semanticScore(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): number {
  const labels = sourceLabels(beat, envelope);
  const interpretation = evaluateMouthInterpretation({
    text: clean(text),
    sourceLabels: labels,
    envelope,
    beat,
  });
  const local = overlap(
    meaningfulTokens(text),
    meaningfulTokens(labels.join(" ")),
  );
  const whole = overlap(
    meaningfulTokens(text),
    meaningfulTokens(worldEvidence(envelope).join(" ")),
  );

  return metric(
    (interpretation.accepted ? 0.34 : 0) +
      (interpretation.creativeFraming ?? 0) * 0.2 +
      semanticBridgeScore(text, beat) * 0.34 +
      whole * 0.06 +
      local * 0.03 +
      (beat.eventIds?.length ? 0.03 : 0),
  );
}

function noveltyScore(text: string, priorTexts: readonly string[] = []): number {
  if (!priorTexts.length) return 0.7;
  const candidate = meaningfulTokens(text);
  const similarities = priorTexts.map((prior) => overlap(candidate, meaningfulTokens(prior)));
  return metric(1 - Math.max(0, ...similarities));
}

export function scoreMouthCandidate({
  text,
  beat,
  envelope,
  priorTexts = [],
}: {
  text: string;
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  priorTexts?: readonly string[];
}): MouthCandidate {
  const value = clean(text);
  const forbidden = unsupportedConcrete(value, beat, envelope);
  const explanation = EXPLANATION.test(value) || INTERNAL.test(value) ? 1 : 0;
  const abstract = abstractPenalty(value);
  const form = formScore(value);
  const semantic = semanticScore(value, beat, envelope);
  const bridge = semanticBridgeScore(value, beat);
  const callback = callbackScore(value, beat);
  const novelty = noveltyScore(value, priorTexts);
  const grounding = metric(overlap(meaningfulTokens(value), meaningfulTokens(worldEvidence(envelope).join(" "))));
  const transition = metric(Math.max(bridge, RELATION_CUE.test(value) ? 0.5 : 0));
  const obligation = metric(
    (beat.eventIds?.length ? grounding : 0.4) * 0.7 + bridge * 0.3,
  );
  const meaning = metric(semantic + bridge * 0.28 + callback * 0.1);
  const distinctive = metric(novelty * 0.7 + callback * 0.3);
  const discovery = metric(bridge * 0.7 + semantic * 0.3);
  const relation = metric(callback * 0.6 + bridge * 0.4);
  const cohesion = metric(0.55 + bridge * 0.45);
  const compression = metric(form * 0.55 + semantic * 0.25 + bridge * 0.2);

  const score = metric(
    grounding * 0.08 +
      obligation * 0.1 +
      meaning * 0.2 +
      transition * 0.1 +
      novelty * 0.08 +
      form * 0.1 +
      discovery * 0.14 +
      distinctive * 0.08 +
      relation * 0.06 +
      cohesion * 0.05 +
      compression * 0.01 +
      (callback > 0 ? 0.04 : 0) -
      abstract * 0.15 -
      forbidden * 0.35 -
      explanation * 0.25,
  );

  return {
    text: value,
    beatOrder: beat.order,
    supportedEventIds: [...(beat.eventIds ?? [])],
    supportedRelationPairs: [],
    groundingScore: grounding,
    meaningScore: meaning,
    observerDiscoveryScore: discovery,
    transitionScore: transition,
    obligationCoverage: obligation,
    relationContractScore: relation,
    forbiddenMoveRisk: forbidden,
    cohesionScore: cohesion,
    noveltyScore: novelty,
    compressionScore: compression,
    inventionRisk: forbidden,
    repetitionRisk: metric(1 - novelty),
    collageRisk: 0,
    endpointExactness: beat.role === "payoff" ? grounding : 0,
    score,
    reasons: [
      bridge >= 0.7 ? "preserves the approved semantic relationship" : "grounded human-facing realization",
      callback > 0.7 ? "preserves concrete continuity/callback" : "",
      grounding >= 0.6 ? "uses supplied reality" : "",
    ].filter(Boolean),
  };
}

export function buildMouthCandidateMessages({
  envelope,
  beats,
  lens,
  domainContext,
}: MouthCandidateGenerationInput): { role: "system" | "user"; content: string }[] {
  const structuredBeats = beats.map((beat) => {
    const bridge = semanticBridge(clean(beat.change));
    return {
      order: beat.order,
      supplied: sourceLabels(beat, envelope),
      purpose: clean(beat.attentionFunction || beat.role),
      meaning: clean(beat.change),
      semanticContract:
        bridge.before && bridge.after
          ? {
              mode: "relationship",
              before: bridge.before,
              after: bridge.after,
              callback: bridge.callback,
              rule: "Make the approved relationship perceptible. Do not collapse it into one endpoint label.",
            }
          : undefined,
      viewerState: beat.viewerState,
      next: clean(beat.next),
      relationKinds: [...(beat.relationKinds ?? [])],
      terminal: beat.role === "payoff",
    };
  });

  const subject = clean(envelope.subject);
  const suppliedReality = worldEvidence(envelope);
  const priorCuts = envelope.suppliedPhrases.slice(-8);
  const lensValue = clean(lens) || "AUTO";

  return [
    {
      role: "system",
      content: [
        "You are QRE's one canonical Mouth.",
        "Cognition has already selected the supplied reality, the movie, the semantic movement, and the beat purpose.",
        "Your only job is the final viewer-facing language realization.",
        "FEEL IT. DO NOT EXPLAIN IT.",
        "Keep concrete people, objects, places, actions, reactions, and chronology faithful to supplied reality.",
        "Use framing freedom: attitude, status, implication, contrast, recognition, interruption, consequence, callback, and compressed payoff are allowed when grounded.",
        "When a beat contains a semantic relationship with BEFORE and AFTER, the cut must let that relationship be felt. Do not merely name the before or after endpoint.",
        "A concrete callback must remain the same supplied object/person/event; do not replace it with a generic substitute.",
        "Do not mention cognition, planning, beats, semantic contracts, viewers, audience, or scoring in the output.",
        "Return exactly three materially different variants for each beat.",
        "Prefer sharp, human, specific film language over summaries or poetry soup.",
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify({
        subject,
        lens: lensValue,
        domainContext: domainContext ?? null,
        suppliedReality,
        priorCuts,
        beats: structuredBeats,
        outputShape: {
          variantsByBeat: [
            {
              order: "number",
              variants: ["short variant 1", "short variant 2", "short variant 3"],
            },
          ],
        },
      }),
    },
  ];
}

export function parseMouthCandidateBatch(raw: string): MouthCandidateBatch {
  const value = clean(raw);
  if (!value) return { variantsByBeat: [] };

  try {
    const parsed = JSON.parse(value) as MouthCandidateBatch;
    if (!Array.isArray(parsed.variantsByBeat)) return { variantsByBeat: [] };
    return {
      variantsByBeat: parsed.variantsByBeat
        .filter((item) => Number.isFinite(item.order) && Array.isArray(item.variants))
        .map((item) => ({
          order: Number(item.order),
          variants: item.variants.map(clean).filter(Boolean).slice(0, 3),
        })),
    };
  } catch {
    return { variantsByBeat: [] };
  }
}
