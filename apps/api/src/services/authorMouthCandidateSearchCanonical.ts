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
import { bindCandidateObservableTruth } from "./authorObservableTruthBinding.js";
import type { CreativeLensBrief } from "./authorCreativeLensBrief.js";

/**
 * ONE PRODUCTION MOUTH.
 *
 * Cognition decides the reality, meaning, semantic movement and beat purpose.
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
const PHYSICAL_VERB = /\b(?:smiled|smile|laughed|laugh|walked|walk|moved|move|looked|look|watched|watch|stared|stare|blinked|blink|winked|wink|nodded|nod|shrugged|shrug|touched|touch|held|hold|reached|reach|stood|stand|sat|sit|ran|run|jumped|jump|wagged|wag|barked|bark|kissed|kiss|hugged|hug|grabbed|grab|nudged|nudge|opened|open|closed|close|entered|enter|returned|return|called|call|talked|talk|spoke|speak|heard|hear|saw|see|breathed|breathe)\b/i;
const BODY = /\b(?:eye|eyes|face|mouth|shoulder|shoulders|hand|hands|head|tail|paw|paws|fur|coat|body|room|door|window|floor|wall|table|chair|car|road|street|sky|shadow|light|sound|scent|voice|water|phone|screen)\b/i;
const SOFT_FIRST_PERSON = /^(?:I|we|my|our)\b/i;

const GENERIC_CONCRETE_HEAD = /\b(?:thing|things|stuff|object|objects|item|items|something|anything|one|piece|pieces|shape|shapes|whatever|whatsoever)\b/i;

function candidateConcreteSubstitutionRisk(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  const value = clean(text);
  if (!value || SOFT_FIRST_PERSON.test(value)) return 0;

  /*
   * Concrete-world veto belongs to the universal binding layer. Do not
   * maintain a vocabulary of objects, roles, or industries here.
   */
  const binding = bindCandidateObservableTruth({
    text: value,
    beat,
    envelope,
  });

  return binding.claims.some((claim) => !claim.bound && (
    claim.kind === "referent" ||
    claim.kind === "relation" ||
    claim.kind === "pronoun"
  ))
    ? 1
    : 0;
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

function mouthRealityEvidence(envelope: RealityEnvelope): string[] {
  const supplied = envelope.suppliedPhrases.map(clean).filter(Boolean);
  const eventFallback = envelope.events.map((event) => clean(event.label)).filter(Boolean);
  const candidates = supplied.length ? supplied : eventFallback;

  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of candidates) {
    const key = normalize(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }

  return result.length ? result : [clean(envelope.subject)].filter(Boolean);
}

function suppliedIdentity(text: string, envelope: RealityEnvelope): boolean {
  const value = clean(text).toLowerCase();
  if (/\b(?:he|him|his|she|her|hers|they|them|their|the man|the woman|the boy|the girl|the guy|the lady|my friend|my partner|my wife|my husband|my girlfriend|my boyfriend)\b/i.test(value)) return true;
  return envelope.suppliedEntities.some((entity) => normalize(entity) === normalize(text));
}

function isInterrogativeClause(text: string): boolean {
  const value = clean(text);
  return (
    /\?$/.test(value) &&
    /^(?:what|who|whom|whose|which|where|when|why|how|do|does|did|is|are|was|were|has|have|had|can|could|will|would|should|must|may|might)\b/i.test(value)
  );
}

function unsupportedConcrete(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  const value = clean(text);
  if (!value) return 1;

  const binding = bindCandidateObservableTruth({
    text: value,
    beat,
    envelope,
  });

  if (!binding.accepted) return 1;

  // An interrogative about a supplied interest is anticipation, not a report
  // that hearing occurred. The referent/chronology binder still runs above.
  if (/^did\s+I\s+hear\s+/i.test(value) && isInterrogativeClause(value)) {
    const cue = clean(value.replace(/^did\s+I\s+hear\s+/i, "").replace(/\?$/, "")).toLowerCase();
    if (cue.length >= 4 && [...meaningfulTokens(worldEvidence(envelope).join(" "))]
      .some((token) => token === cue || token === `${cue}s`)) return 0;
  }

  // A named participant + a new completed action reports an occurrence, not
  // an interpretive frame. Derive the action from the candidate and compare
  // it with supplied events; no list of allowed/forbidden gestures is needed.
  const occurrence = value.match(/^([A-Z][a-z0-9'’-]*)\s+([a-z]{3,}(?:ed|ing))\b/i);
  if (occurrence && [envelope.subject, ...envelope.suppliedParticipants]
    .some((actor) => normalize(actor) === occurrence[1]?.toLowerCase())) {
    const action = occurrence[2]?.toLowerCase() ?? "";
    if (!meaningfulTokens(worldEvidence(envelope).join(" ")).has(action)) return 1;
  }

  /*
   * Narrow post-generation seatbelt for concrete physical claims.
   *
   * This is deliberately NOT creative authorization. It only catches a
   * physical action/body/sensory token that the candidate introduced when the
   * supplied world contains no corresponding token. Figurative, emotional,
   * rhythmic, and abstract language remains outside this check.
   */
  if (PHYSICAL_VERB.test(value) || BODY.test(value)) {
    const candidateTokens = meaningfulTokens(value);
    const sourceTokens = meaningfulTokens(worldEvidence(envelope).join(" "));

    const physicalTerms = [...candidateTokens].filter((token) =>
      PHYSICAL_VERB.test(token) || BODY.test(token),
    );

    if (
      physicalTerms.some(
        (token) => !sourceTokens.has(token),
      )
    ) {
      return 1;
    }
  }

  return 0;
}

function authorityLicensesViewerLanguage(
  text: string,
  beat: MouthCandidateBeat,
): boolean {
  const authority = beat.realizationAuthority;
  if (!authority) return false;

  const candidate = meaningfulTokens(text);
  if (!candidate.size) return false;

  const licensed = meaningfulTokens(
    [
      ...Object.values(authority.meaning).map((value) => String(value ?? "")),
      ...authority.earnedInterpretations,
      ...authority.permittedRealizationModes,
      ...authority.creativeMoves,
      authority.treatment?.label ?? "",
      ...(authority.treatment?.framingBias ?? []),
      ...(authority.treatment?.realizationPreferences ?? []),
    ].join(" "),
  );

  return [...candidate].every((token) => licensed.has(token));
}

function explanationPenalty(
  text: string,
  beat?: MouthCandidateBeat,
): number {
  const value = clean(text);
  if (EXPLANATION.test(value)) return 1;

  if (
    INTERNAL.test(value) &&
    !(beat && authorityLicensesViewerLanguage(value, beat))
  ) {
    return 1;
  }

  return 0;
}

function formScore(text: string): number {
  const value = clean(text);
  const count = words(value).length;
  return metric(count <= 2 ? 0.7 : count <= 9 ? 1 : count <= 14 ? 0.85 : 0.55);
}

function payoffScore(text: string, beat: MouthCandidateBeat): number {
  const attention = clean(beat.attentionFunction).toLowerCase();
  const role = clean(beat.role).toLowerCase();
  if (attention !== "payoff" && role !== "payoff" && attention !== "release" && role !== "release") return 0;
  // A payoff word has no intrinsic payoff. Its force is measured against the
  // complete sequence by evaluateAuthorAuthorshipQuality.
  return clean(text) ? 0.6 : 0;
}

function semanticScore(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
  interpretation: ReturnType<typeof evaluateMouthInterpretation>,
): number {
  return metric(
    (interpretation.accepted ? 0.55 : 0) +
    (interpretation.creativeFraming ?? 0) * 0.38,
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
  const labels = sourceLabels(beat, envelope);
  const source = meaningfulTokens(
    (labels.length ? labels : envelope.events.map((event) => event.label)).join(" "),
  );
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

  const currentRealityLabels = envelope.events
    .map((event) => clean(event.label))
    .filter(Boolean);

  /*
   * Fact-parade detection is intentionally world-aware rather than beat-count
   * aware. A semantic trajectory may stage only one local event in an anchor
   * beat while a bad Mouth candidate illegally enumerates several supplied
   * facts from the larger current world. That is still a fact parade.
   */
  const matchedRealityIndexes = new Set<number>();
  let sourceShapedFragments = 0;

  fragments.forEach((fragment) => {
    const fragmentTokens = meaningfulTokens(fragment);
    if (!fragmentTokens.size) return;

    let bestIndex = -1;
    let bestCoverage = 0;

    currentRealityLabels.forEach((label, index) => {
      const labelTokens = meaningfulTokens(label);
      if (!labelTokens.size) return;

      const contained = [...fragmentTokens].filter((token) =>
        labelTokens.has(token),
      ).length / Math.max(1, fragmentTokens.size);

      if (contained > bestCoverage) {
        bestCoverage = contained;
        bestIndex = index;
      }
    });

    if (bestCoverage >= 0.72 && bestIndex >= 0) {
      sourceShapedFragments += 1;
      matchedRealityIndexes.add(bestIndex);
    }
  });

  const fragmentCount = fragments.length;
  const fragmentParadeRatio = metric(
    sourceShapedFragments / Math.max(1, fragmentCount),
  );
  const distinctSourceFacts = matchedRealityIndexes.size;

  const crossFactEnumeration =
    distinctSourceFacts >= 2 && sourceShapedFragments >= 2
      ? metric(
          0.72 +
          Math.min(0.2, (distinctSourceFacts - 2) * 0.1) +
          Math.min(0.08, Math.max(0, fragmentCount - 2) * 0.04),
        )
      : 0;

  const localEvidenceCount = beat.eventIds?.length ?? 0;
  const parade = metric(
    Math.max(
      crossFactEnumeration,
      sourceCoverage * 0.62 +
        (fragmentCount >= 2 && localEvidenceCount >= 2 ? 0.16 : 0) +
        trivialProgression * 0.12,
      fragmentCount >= 2
        ? fragmentParadeRatio * 0.78 +
          (distinctSourceFacts >= 2 ? 0.18 : 0)
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
    candidateConcreteSpecificityRisk(value, beat, envelope),
  );
  const explain = explanationPenalty(value, beat);
  const generic = GENERIC_SUMMARY.test(value) ? 1 : 0;
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
    forbidden < 0.9;
  const authorization = {
    ...interpretation.authorization,
    realitySafe: authorizationRealitySafe,
    authorized:
      authorizationRealitySafe &&
      interpretation.authorization.authorized,
    reasons: [
      ...interpretation.authorization.reasons,
      ...(forbidden >= 0.9 ? ["candidate-concrete-veto"] : []),
    ],
  };

  if (forbidden >= 0.9) {
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
      reasons: [
        "unsafe-realization",
        ...interpretation.reasons,
      ],
    };
  }

  const exact = labels.some((label) => normalize(label) === normalize(value));
  const sourceOverlap = overlap(meaningfulTokens(value), meaningfulTokens(labels.join(" ")));
  const worldOverlap = overlap(meaningfulTokens(value), meaningfulTokens(worldEvidence(envelope).join(" ")));
  const supportedEventIds = beat.eventIds?.length && sourceOverlap >= 0.25 ? [...beat.eventIds] : [];
  const supportedRelationPairs = beat.relationKinds?.map((kind) => String(kind)).filter(Boolean) ?? [];
  const grounding = metric(sourceOverlap * 0.46 + worldOverlap * 0.18 + (exact ? 0.36 : 0));
  const obligation = metric((beat.eventIds?.length ? 0.45 : 0.25) * 0.42 + baseSemantic * 0.38 + (supportedEventIds.length ? 0.2 : 0));
  const transition = metric(
    (Number(beat.viewerState?.stateShift) || 0.45) * 0.72 +
      (Number(beat.viewerState?.inferenceSpace) || 0) * 0.28,
  );
  const meaning = metric(baseSemantic * 0.5 + payoff * 0.26 - generic * 0.18);
  const distinctive = metric(
    form * 0.42 +
      meaning * 0.28 +
      novelty * 0.22 +
      payoff * 0.14 +
      (sourceOverlap < 0.65 ? 0.08 : 0) -
      semanticUnitRisk.parade * 0.28,
  );
  const discovery = metric(
    meaning * 0.38 +
      transition * 0.24 +
      distinctive * 0.2 +
      novelty * 0.1 +
      semanticUnitRisk.parade * 0.24,
  );
  const score = metric(
    grounding * 0.02 +
      obligation * 0.03 +
      meaning * 0.23 +
      transition * 0.09 +
      novelty * 0.12 +
      form * 0.08 +
      discovery * 0.18 +
      distinctive * 0.14 +
      payoff * 0.16 -
      generic * 0.08 -
      explain * 0.10 -
      semanticUnitRisk.parade * 0.20 -
      semanticUnitRisk.trivialProgression * 0.06,
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
  if ((beat.viewerState?.inferenceSpace ?? 0) >= 0.55) reasons.push("meaningful-inference-space");
  if (payoff >= 0.62) reasons.push("viewer-reward");
  if (semanticUnitRisk.parade >= 0.58) {
    reasons.push("fact-parade-like");
  }
  if (semanticUnitRisk.trivialProgression >= 0.9) {
    reasons.push("trivial-connective-transformation");
  }
  if (explain >= 0.95) {
    reasons.push("meaning-explained-instead-of-felt");
  }
  if (
    (beat.eventIds?.length ?? 0) > 1 &&
    semanticUnitRisk.sourceCoverage < 0.55 &&
    authorization.semanticAuthorized
  ) {
    reasons.push("semantic-unit-transformation");
  }
  if (generic) reasons.push("generic-summary");

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
    "You are QRE's Author.",
    "QRE remembers a real thing as its world grows. What someone loves, fears, wants, notices, remembers, imagines, and actually does are different kinds of truth and all are creative material. Know the difference, then play.",
    "Play freely with what the reality suggests; keep what physically happened exactly as supplied.",
    "Treat the supplied reality as a world to understand, not wording to rewrite. Read it all first and form a private impression of the subject, situation, pressure, pattern, contradiction, or personality that emerges.",
    "Then write from that impression.",
    "A supplied word may become a question, echo, fixation, interruption, contrast, callback, punchline, payoff, or disappear entirely. Do not enumerate the source.",
    "A preference can sound like wanting without becoming an event. A memory can echo without becoming now. A possibility can create anticipation without becoming fact.",
    "Make the viewer discover something about what is already there. Let cuts change each other. Stop before explaining the meaning.",
    "Do not invent new concrete reality.",
    "Create three genuinely different complete moving-text sequences.",
    "One cut per line. Put a line containing only --- between sequences. Return nothing else.",
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
  const evidence = mouthRealityEvidence(input.envelope);

  const mechanisms = [...new Set(
    input.beats.flatMap((beat) => [
      clean(beat.semanticRealization?.mechanism),
      clean(beat.semanticRealization?.relation?.kind),
      clean(beat.creativeMove),
      clean(beat.role),
    ]).filter(Boolean),
  )];

  const hiddenReads = [...new Set(
    input.beats
      .map((beat) => clean(beat.observerExperience?.objective))
      .filter(Boolean),
  )];

  return [
    { role: "system", content: buildSystemPrompt() },
    {
      role: "user",
      content: JSON.stringify({
        subject: input.envelope.subject,
        suppliedReality: evidence,
        creativePressure: {
          mechanisms,
          hiddenRead: hiddenReads[0] || undefined,
          objective:
            "Find the strongest connected perception available in the supplied reality. The source wording is not the script. If a hiddenRead is supplied, make the observer discover it without stating or paraphrasing the conclusion.",
        },
        lens:
          lens.label && lens.label !== "NONE"
            ? {
                label: lens.label,
                framing: lens.framingBias,
                preferences: lens.realizationPreferences,
              }
            : undefined,
        context: input.domainContext
          ? {
              category: clean(input.domainContext.category),
              businessType: clean(input.domainContext.businessType),
              serviceType: clean(input.domainContext.serviceType),
              subjectKind: clean(input.domainContext.subjectKind),
              knownCapabilities: input.domainContext.knownCapabilities ?? [],
              contextualSignals: input.domainContext.contextualSignals ?? [],
            }
          : undefined,
        priorCuts: input.priorTexts ?? [],
        output:
          "Create 3 complete sequences. Use as many cuts as each experience earns. One cut per line. Separate sequences with a line containing only ---. Return nothing else.",
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
  const normalized = String(raw ?? "")
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .replace(/^\s*(?:sequence|variant)\s*\d+\s*:\s*$/gim, "")
    .trim();

  try {
    const parsed = JSON.parse(normalized) as {
      sequenceVariants?: unknown;
      variantsByBeat?: unknown;
    };

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

      const cutCount = Math.max(...sequenceVariants.map((texts) => texts.length));

      return {
        variantsByBeat: Array.from(
          { length: cutCount },
          (_, index) => ({
            order: index + 1,
            variants: sequenceVariants.map((texts) => clean(texts[index])).filter(Boolean),
          }),
        ),
        sequenceVariants,
      };
    }

    if (Array.isArray(parsed?.variantsByBeat) && parsed.variantsByBeat.length > 0) {
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
    }
  } catch {
    // Plain-text realization is the canonical fallback format.
  }

  const plainSequenceVariants = normalized
    .split(/^\s*---\s*$/m)
    .map((block) =>
      block
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => !/^(?:version|option|sequence)\s*\d*\s*:?$/i.test(line))
        .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim())
        .filter(Boolean),
    )
    .filter((texts) => texts.length > 0);

  if (plainSequenceVariants.length === 3) {
    if (new Set(plainSequenceVariants.map((texts) => texts.join("\n").toLowerCase())).size !== 3) return undefined;

    const cutCount = Math.max(
      ...plainSequenceVariants.map((texts) => texts.length),
    );

    return {
      variantsByBeat: Array.from(
        { length: cutCount },
        (_, index) => ({
          order: index + 1,
          variants: plainSequenceVariants
            .map((texts) => clean(texts[index]))
            .filter(Boolean),
        }),
      ),
      sequenceVariants: plainSequenceVariants,
    };
  }

  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);

  if (!lines.length) return undefined;

  const texts = lines;
  return {
    variantsByBeat: texts.map((text, index) => ({
      order: index + 1,
      variants: [text],
    })),
    sequenceVariants: [texts],
  };
}

export function scoreMouthCandidate(input: { text: string; beat: MouthCandidateBeat; envelope: RealityEnvelope; priorTexts?: readonly string[] }): MouthCandidate {
  return candidateScore(input.text, input.beat, input.envelope, input.priorTexts ?? []);
}
