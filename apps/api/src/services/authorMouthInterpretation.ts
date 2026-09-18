/**
 * QRE MOUTH INTERPRETATION
 *
 * QRE CANONICAL AUTHOR LAW:
 * Reality is immutable. Expression is not.
 * QRE may surprise us.
 *
 * UNIVERSALITY LAW:
 * Examples are evidence of desired behavior, never domain rules.
 * Do not hard-code subjects, industries, props, colors, locations, or example
 * phrases merely because an edge case exposed them. Every rule must generalize.
 * Prefer a small number of strong principles over exception lists.
 *
 * The evaluator protects one thing directly: unsupported concrete world claims.
 * Everything else may be compressed, strange, funny, sharp, emotional,
 * rhetorical, fragmentary, hyperbolic, metaphorical, or otherwise creative
 * when grounded in the approved beat and supplied corpus.
 */

import type { MouthCandidateBeat } from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const normalizeToken = (token: string): string => {
  const lower = token.toLowerCase();

  if (
    lower.length > 6 &&
    lower.endsWith("ing")
  ) {
    return lower.slice(0, -3);
  }

  if (
    lower.length > 5 &&
    lower.endsWith("ed")
  ) {
    return lower.slice(0, -2);
  }

  if (
    lower.length > 4 &&
    lower.endsWith("es")
  ) {
    return lower.slice(0, -2);
  }

  if (
    lower.length > 4 &&
    lower.endsWith("s")
  ) {
    return lower.slice(0, -1);
  }

  return lower;
};

const tokens = (value: string): Set<string> =>
  new Set(
    clean(value)
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((token) => token.length >= 3)
      .map(normalizeToken),
  );

const overlap = (
  a: Set<string>,
  b: Set<string>,
): number => {
  if (!a.size || !b.size) return 0;

  let hits = 0;

  for (const token of a) {
    if (b.has(token)) {
      hits += 1;
    }
  }

  return hits / Math.max(1, a.size);
};

const CONCRETE_CLAIM =
  /\b(?:escaped?|fled|chased?|attacked?|kissed?|hugged?|danced?|drove|jumped?|ran|walked|snatched?|grabbed?|swiped?|stared?|smiled?|laughed?|cried?|whispered?|screamed?|wore|wearing|held|carried|opened?|closed?|entered?|left|returned|turned|kicked?|pushed?|pulled?|threw|caught|sat|sitting|stood|standing|wags?|wagged|sniffs?|sniffed|glares?|glared|paused?|pauses?|twitch(?:es|ed)?|flurry|vanished?|disappeared?|abandoned?|moved?|move|scurried?|bolted?)\b/i;

const EXTERNAL_STATE_CLAIM =
  /\b(?:smell(?:s|ed|ing)?|sound(?:s|ed|ing)?|taste(?:s|d|ing)?|new\s+(?:scent|sound|look))\b/i;

const BODY =
  /\b(?:eye|eyes|face|mouth|shoulder|shoulders|hand|hands|head|tail|fur|coat|body|room|door|window|floor|wall|table|chair|car|road|street|sky|shadow|light|sound|scent|voice|water|phone|screen)\b/i;

const SOFT_FIRST_PERSON =
  /^(?:I|we|my|our)\b/i;
  
const CLAUSE_SUBJECT_MARKER =
  /^(?:she|he|they|it|we|you|i|someone|someone's|this|that|the\s+dog|the\s+girl|the\s+boy)\b/i;

const ABSTRACT_FRAMING =
  /\b(?:apparently|clearly|somehow|finally|now|still|again|temporary|approved|peace|mission|round|danger|victory|upgrade|boss|evidence|case|deal|terms?|status|power|control|audacity|confidence|fabulous|sharp|beautiful|good|brilliant|perfect|official|complete|completed|done|finished|cleared|ready|serious|ridiculous|absurd|suspicious|famous|celebrity|legendary|mine|belongs|belongs? to|in\s+charge|game|quest|operation|objective|target|verdict|guilty|innocent|rescue|heist|noir|romance|rebel|showtime|pit\s*stop|speedrun|knockout|stun|finish|championship|final\s+round|joyous|dream|season|devotion|seriousness|naturally|favorite|obsession|obsessed|fixation|thought|problem|wish|wonder|feeling|pull|current|pressure|warmth|silence|familiar|close|closer|distance|spark|gravity|drift|rush|calm|heat|cold|lightness|weight|connection|tension|fondness|preferences?|priorit(?:y|ies)|affinity|inclination|impression|character|personality)\b/i;

const SEMANTIC_COMPRESSION_VERBS = new Set([
  "stay",
  "stayed",
  "stays",
  "remain",
  "remained",
  "remains",
  "keep",
  "kept",
  "keeps",
  "continued",
  "continue",
  "continues",
  "knew",
  "know",
  "knows",
  "felt",
  "feel",
  "feels",
  "waited",
  "wait",
  "waits",
]);

const FUNCTION_WORDS = new Set([
  "the",
  "a",
  "an",
  "we",
  "us",
  "i",
  "you",
  "he",
  "she",
  "they",
  "it",
  "our",
  "my",
  "your",
  "their",
  "still",
  "just",
  "finally",
  "again",
  "already",
  "apparently",
]);

/*
 * These are not "bad words" in the ordinary sense.
 *
 * They are machine-facing concepts that must never leak into the
 * viewer-facing realization.
 */
const INTERNAL_MACHINE_LANGUAGE =
  /\b(?:qre|compiler|cognition|meaning\s+spine|beat\s+graph|information\s+frontier|planner|planning|operator\s+mix|viewer\s+state|viewer\s+sees|audience\s+sees|writing\s+process|semantic\s+turn|semantic\s+trajectory|trajectory|realization\s+mode|information\s+gain|candidate\s+pool|candidate\s+sequence|sequence\s+arc|creative\s+lane|canonical\s+authority|approved\s+beat|beat\s+obligation|semantic\s+compression|grounding\s+score|novelty\s+score)\b/i;

export type MouthInterpretationEvaluation = {
  interpretive: number;
  sourceAnchor: number;
  wholeSourceAnchor: number;
  frameSupport: number;
  literalRestatement: number;
  creativeFraming: number;
  unsupportedConcreteRisk: number;
  authorization: {
    realitySafe: boolean;
    semanticAuthorized: boolean;
    directGrounded: boolean;
    authorized: boolean;
    reasons: string[];
  };
  accepted: boolean;
  reasons: string[];
};

function wholeSourceCorpus(
  envelope: RealityEnvelope,
): string {
  return clean(
    [
      envelope.subject,
      ...envelope.events.map(
        (event) => event.label,
      ),
      ...envelope.suppliedPhrases,
      ...envelope.suppliedEntities,
      ...envelope.suppliedParticipants,
      ...envelope.suppliedPlaces,
      ...envelope.suppliedActions,
      ...envelope.suppliedStates,
      ...envelope.recurringSignals,
      ...envelope.sensorySignals,
      ...envelope.unresolvedTensions,
    ].join(" "),
  );
}

function compactRhetoricalShape(
  text: string,
): boolean {
  const wordCount = text
    .split(/\s+/)
    .filter(Boolean).length;

  if (
    !wordCount ||
    wordCount > 12
  ) {
    return false;
  }

  const terminal = /[.!?]$/.test(text);

  const fragment =
    !CLAUSE_SUBJECT_MARKER.test(text) &&
    wordCount <= 6;

  const framing =
    ABSTRACT_FRAMING.test(text);

  return (
    terminal &&
    (fragment || framing)
  );
}
function introducesUnsupportedPhysicalRelation(
  text: string,
  envelope: RealityEnvelope,
): boolean {
  const sourceCorpus =
    wholeSourceCorpus(
      envelope,
    );

  const sourceTokens =
    tokens(sourceCorpus);

  const candidateTokens =
    tokens(text);

  /*
   * Relational language between already-established participants is not
   * automatically a physical-world claim.
   *
   * Example:
   *
   *   met someone
   *   kept talking
   *
   * may legitimately become:
   *
   *   "A current ran between us."
   *
   * "between us" expresses an emergent interpersonal relation, not a new
   * physical location or physical event.
   */
  const interpersonalRelationMarker =
    /\b(?:between\s+(?:us|them|you)|with\s+(?:me|us|them|you)|among\s+us|between\s+the\s+two\s+of\s+us)\b/i.test(
      text,
    );

  const interactionAlreadyEstablished =
    /\b(?:met|meet|meeting|talk|talked|talking|spoke|speaking|conversation|connected|shared|together|joined|visited|called|texted|messaged|worked|played|danced)\b/i.test(
      sourceCorpus,
    );

  if (
    interpersonalRelationMarker &&
    interactionAlreadyEstablished
  ) {
    return false;
  }

  /*
   * Physical relation language is structural rather than domain-specific.
   * These markers describe an asserted relation between entities, locations,
   * surfaces, bodies, environments, or physical effects.
   */
  const physicalRelationMarker =
    /\b(?:on|onto|under|beneath|above|over|behind|beside|inside|within|through|across|against|around|between|near|next\s+to|outside|into|out\s+of|from|with|without)\b/i.test(
      text,
    );

  if (!physicalRelationMarker) {
    return false;
  }

  /*
   * A relation marker by itself is insufficient. We need at least two
   * meaningful lexical units around which a physical relation could be
   * asserted.
   */
  const significant =
    [...candidateTokens].filter(
      (token) =>
        !FUNCTION_WORDS.has(
          token,
        ),
    );

  if (
    significant.length < 2
  ) {
    return false;
  }

  /*
   * Count how much of the asserted material is represented in the supplied
   * reality.
   *
   * A transformed expression may use new language freely, but a physical
   * relation cannot introduce unsupported concrete entities.
   */
  const grounded =
    significant.filter(
      (token) =>
        sourceTokens.has(token),
    ).length;

  return (
    grounded /
      Math.max(
        1,
        significant.length,
      ) <
    0.5
  );
}

function authorityRealityCorpus(
  beat: MouthCandidateBeat | undefined,
  envelope: RealityEnvelope,
): string {
  const authority = beat?.realizationAuthority;
  if (!authority) return wholeSourceCorpus(envelope);

  const eventLabels = envelope.events
    .filter((event) => authority.reality.eventIds.includes(event.id))
    .map((event) => event.label);

  return clean(
    [
      envelope.subject,
      ...eventLabels,
      ...authority.reality.entities,
      ...authority.reality.actions,
      ...authority.reality.objects,
      ...authority.reality.states,
    ].join(" "),
  );
}

function authorityMeaningCorpus(
  beat: MouthCandidateBeat | undefined,
): string {
  const authority = beat?.realizationAuthority;
  if (!authority) return "";

  return clean(
    [
      ...Object.values(authority.meaning).map(clean),
      ...authority.earnedInterpretations,
      ...authority.permittedRealizationModes,
      ...authority.creativeMoves,
      authority.treatment?.label,
      ...(authority.treatment?.framingBias ?? []),
      ...(authority.treatment?.realizationPreferences ?? []),
      authority.inferenceBudget,
    ].join(" "),
  );
}

function hasExplicitSemanticAuthority(
  beat: MouthCandidateBeat | undefined,
): boolean {
  const authority = beat?.realizationAuthority;
  if (!authority) return false;

  return Boolean(
    Object.values(authority.meaning).some((value) => clean(value)) ||
      authority.earnedInterpretations.length ||
      authority.permittedRealizationModes.length ||
      authority.creativeMoves.length ||
      authority.inferenceBudget !== "direct",
  );
}

function unsupportedAuthorityConcreteRisk(
  text: string,
  beat: MouthCandidateBeat | undefined,
  envelope: RealityEnvelope,
): number {
  const authority = beat?.realizationAuthority;
  if (!authority) return 0;

  const value = clean(text);
  if (!value || SOFT_FIRST_PERSON.test(value)) return 0;
  if (!CONCRETE_CLAIM.test(value) && !EXTERNAL_STATE_CLAIM.test(value) && !BODY.test(value)) {
    return 0;
  }

  const allowed = tokens(authorityRealityCorpus(beat, envelope));
  const current = tokens(value);
  const significant = [...current].filter((token) => !FUNCTION_WORDS.has(token));
  const grounded = significant.filter((token) => allowed.has(token)).length;
  const groundedRatio = grounded / Math.max(1, significant.length);

  if (BODY.test(value) && ![...allowed].some((token) => BODY.test(token))) {
    return 1;
  }

  if (CONCRETE_CLAIM.test(value)) {
    const authorizedAction = authority.reality.actions.some((action) =>
      overlap(tokens(action), current) >= 0.45,
    );
    const authorizedEventWording = authority.reality.eventIds
      .map((id) => envelope.events.find((event) => event.id === id)?.label ?? "")
      .some((label) => CONCRETE_CLAIM.test(label) && overlap(tokens(label), current) >= 0.35);

    if (!authorizedAction && !authorizedEventWording && groundedRatio < 0.45) {
      return 1;
    }
  }

  if (EXTERNAL_STATE_CLAIM.test(value) && groundedRatio < 0.45) {
    return 1;
  }

  return 0;
}


const CLOSED_WORLD_PRONOUN =
  /\b(?:he|him|his|she|her|hers)\b/i;

const CLOSED_WORLD_RELATION_TARGET =
  /\b(?:by|with|for|to|from)\s+(?:(?:the|a|an|this|that|my|your|his|her|our|their)\s+)?([a-z0-9][a-z0-9'’-]*)\b/gi;

const CLOSED_WORLD_DETERMINED_REFERENCE =
  /\b(?:the|a|an|this|that|my|your|his|her|our|their)\s+([a-z0-9][a-z0-9'’-]*)\b/gi;

const CLOSED_WORLD_POSSESSOR =
  /\b([a-z0-9][a-z0-9'’-]*)['’]s\b/gi;

const CLOSED_WORLD_LEADING_SUBJECT =
  /^(?:(?:the|a|an|this|that|my|your|his|her|our|their)\s+)?(.{1,64}?)\s+(?:is|are|was|were|has|have|had|does|do|did|can|could|will|would|should|must|may|might|[a-z][a-z'’-]{2,}(?:ed|ing)|smiles?|laughs?|wins?|loses?|approves?|surrenders?|stands?|sits?|walks?|runs?|enters?|leaves?|returns?|watches?|talks?|speaks?|calls?|cleans?|fixes?|repairs?|owns?|rents?|manages?|lives?|stays?)\b/i;

const CLOSED_WORLD_PREPOSITIONAL_CONTEXT =
  /\b(?:to|at|from|with|by|for|near|inside|outside|around|through|into|onto|under|over)\s+(?:the\s+)?$/i;

function referenceTokens(value: string): Set<string> {
  return new Set(
    [...tokens(value)].filter(
      (token) =>
        !FUNCTION_WORDS.has(token),
    ),
  );
}

function referenceMatches(
  value: string,
  authorities: readonly string[],
): boolean {
  const wanted = referenceTokens(value);
  if (!wanted.size) return false;

  return authorities.some((authority) => {
    const allowed = referenceTokens(authority);
    if (!allowed.size) return false;

    return (
      [...wanted].every((token) => allowed.has(token)) ||
      [...allowed].every((token) => wanted.has(token))
    );
  });
}

function scopedPlaces(
  beat: MouthCandidateBeat | undefined,
  envelope: RealityEnvelope,
): string[] {
  const eventIds = new Set(beat?.eventIds ?? []);
  const places = eventIds.size
    ? envelope.events
        .filter((event) => eventIds.has(event.id))
        .map((event) => clean(event.place))
        .filter(Boolean)
    : envelope.suppliedPlaces;

  return [...new Set(places)];
}

function directScopedObjects(
  beat: MouthCandidateBeat | undefined,
  envelope: RealityEnvelope,
): string[] {
  const authority = beat?.realizationAuthority;
  if (!authority) return [];

  const eventIds = new Set(authority.reality.eventIds);
  const labels = envelope.events
    .filter((event) => eventIds.has(event.id))
    .map((event) => clean(event.label).toLowerCase());

  return authority.reality.objects.filter((object) => {
    const needle = clean(object).toLowerCase();
    if (!needle) return false;

    return labels.some((label) => {
      const index = label.indexOf(needle);
      if (index < 0) return false;

      const prefix = label
        .slice(0, index)
        .slice(-32)
        .trim();

      return !CLOSED_WORLD_PREPOSITIONAL_CONTEXT.test(prefix);
    });
  });
}

function sourcePronounAuthority(
  text: string,
  envelope: RealityEnvelope,
): boolean {
  const source = wholeSourceCorpus(envelope).toLowerCase();
  const pronouns = clean(text)
    .toLowerCase()
    .match(/\b(?:he|him|his|she|her|hers)\b/g) ?? [];

  return pronouns.every((pronoun) =>
    new RegExp("\\b" + pronoun + "\\b", "i").test(source),
  );
}

function relationReferenceViolations(input: {
  text: string;
  allowedConcrete: readonly string[];
  allowedMeaning: Set<string>;
}): string[] {
  const violations: string[] = [];
  const seen = new Set<string>();

  const inspect = (raw: string) => {
    const value = clean(raw);
    if (!value) return;

    const key = value.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    const parts = referenceTokens(value);
    if (!parts.size) return;

    if (
      [...parts].every(
        (token) =>
          input.allowedMeaning.has(token) ||
          semanticFrameToken(token),
      )
    ) {
      return;
    }

    if (!referenceMatches(value, input.allowedConcrete)) {
      violations.push(value);
    }
  };

  for (const match of input.text.matchAll(CLOSED_WORLD_RELATION_TARGET)) {
    inspect(match[1] ?? "");
  }

  for (const match of input.text.matchAll(CLOSED_WORLD_DETERMINED_REFERENCE)) {
    const matchEnd = (match.index ?? 0) + match[0].length;
    const trailing = input.text.slice(matchEnd).trimStart();
    const firstTrailing = trailing[0] ?? "";

    if (firstTrailing && /[A-Za-z0-9]/.test(firstTrailing)) {
      continue;
    }

    inspect(match[1] ?? "");
  }

  for (const match of input.text.matchAll(CLOSED_WORLD_POSSESSOR)) {
    inspect(match[1] ?? "");
  }

  return violations;
}

function closedWorldParticipantViolation(
  text: string,
  beat: MouthCandidateBeat | undefined,
  envelope: RealityEnvelope,
): string | undefined {
  const authority = beat?.realizationAuthority;
  if (!authority) return undefined;

  const value = clean(text);
  if (!value) return undefined;

  if (
    CLOSED_WORLD_PRONOUN.test(value) &&
    !sourcePronounAuthority(value, envelope)
  ) {
    return "unsupplied-pronoun-participant";
  }

  const actors = [
    envelope.subject,
    ...envelope.suppliedParticipants,
    ...authority.reality.entities,
  ].filter(Boolean);

  const directObjects = directScopedObjects(
    beat,
    envelope,
  );

  const places = scopedPlaces(
    beat,
    envelope,
  );

  const allowedConcrete = [
    ...actors,
    ...directObjects,
    ...places,
  ];

  const allowedMeaning = tokens(
    authorityMeaningCorpus(beat),
  );

  const relationViolations =
    relationReferenceViolations({
      text: value,
      allowedConcrete,
      allowedMeaning,
    });

  if (relationViolations.length) {
    return "unsupplied-concrete-reference:" + relationViolations.join(",");
  }

  const subjectMatch =
    value.match(
      CLOSED_WORLD_LEADING_SUBJECT,
    );

  if (!subjectMatch) {
    const standalone = value
      .replace(/[.!?]+$/g, "")
      .trim();

    const standaloneTokens =
      referenceTokens(standalone);

    if (
      standaloneTokens.size > 0 &&
      standaloneTokens.size <= 3 &&
      /^[A-Z][A-Za-z0-9'’ -]*$/.test(standalone) &&
      !referenceMatches(
        standalone,
        allowedConcrete,
      ) &&
      ![...standaloneTokens].some(
        (token) =>
          allowedMeaning.has(token) ||
          semanticFrameToken(token),
      )
    ) {
      return "unsupplied-concrete-reference:" + standalone;
    }

    return undefined;
  }

  const subjectPhrase = clean(
    subjectMatch[1],
  );

  if (!subjectPhrase) return undefined;

  if (
    referenceMatches(
      subjectPhrase,
      actors,
    )
  ) {
    return undefined;
  }

  const metaphoricalConcrete =
    referenceMatches(
      subjectPhrase,
      [
        ...directObjects,
        ...places,
      ],
    );

  if (metaphoricalConcrete) {
    const concreteAgency =
      CONCRETE_CLAIM.test(value) ||
      EXTERNAL_STATE_CLAIM.test(value) ||
      BODY.test(value);

    return concreteAgency
      ? "context-promoted-to-factual-actor:" + subjectPhrase
      : undefined;
  }

  const subjectTokens =
    referenceTokens(subjectPhrase);

  if (
    subjectTokens.size &&
    [...subjectTokens].every(
      (token) =>
        allowedMeaning.has(token) ||
        semanticFrameToken(token),
    )
  ) {
    return undefined;
  }

  return "unsupplied-participant:" + subjectPhrase;
}

const CLOSED_WORLD_RECURRENCE_LANGUAGE =
  /\b(?:again|returned?|returning|returns|repeated|repeat|once\s+more|another\s+time|used to|once before|back)\b/i;

const CLOSED_WORLD_SEQUENCE_LANGUAGE =
  /\b(?:previously|prior|earlier|later|before|afterward|afterwards|after that|next time|the next time|the next day|the day before|yesterday|tomorrow)\b/i;

const CLOSED_WORLD_CONTINUITY_LANGUAGE =
  /\b(?:still|already|continues?|continued|remains?|remained)\b/i;

function chronologyClass(value: string): string {
  if (CLOSED_WORLD_RECURRENCE_LANGUAGE.test(value)) {
    return "recurrence";
  }

  if (CLOSED_WORLD_CONTINUITY_LANGUAGE.test(value)) {
    return "continuity";
  }

  if (CLOSED_WORLD_SEQUENCE_LANGUAGE.test(value)) {
    return "sequence";
  }

  return "chronology";
}

function chronologyAuthorityCorpus(
  beat: MouthCandidateBeat | undefined,
  envelope: RealityEnvelope,
): string {
  const eventIds = new Set(
    beat?.realizationAuthority?.reality.eventIds ??
      beat?.eventIds ??
      [],
  );

  const scopedEvents = eventIds.size
    ? envelope.events.filter((event) =>
        eventIds.has(event.id),
      )
    : envelope.events;

  const structures = eventIds.size
    ? envelope.eventStructure.filter((structure) =>
        eventIds.has(structure.eventId),
      )
    : envelope.eventStructure;

  return clean(
    [
      ...scopedEvents.map((event) => event.label),
      ...structures.flatMap((structure) => structure.temporalMarkers ?? []),
      ...envelope.recurringSignals,
      authorityMeaningCorpus(beat),
    ].join(" "),
  );
}

function chronologyAuthorityViolation(
  text: string,
  beat: MouthCandidateBeat | undefined,
  envelope: RealityEnvelope,
): string | undefined {
  const value = clean(text);
  if (
    !value ||
    (!CLOSED_WORLD_RECURRENCE_LANGUAGE.test(value) &&
      !CLOSED_WORLD_SEQUENCE_LANGUAGE.test(value) &&
      !CLOSED_WORLD_CONTINUITY_LANGUAGE.test(value))
  ) {
    return undefined;
  }

  const eventIds = new Set(
    beat?.realizationAuthority?.reality.eventIds ??
      beat?.eventIds ??
      [],
  );
  const source = chronologyAuthorityCorpus(
    beat,
    envelope,
  );

  if (
    (CLOSED_WORLD_RECURRENCE_LANGUAGE.test(value) &&
      CLOSED_WORLD_RECURRENCE_LANGUAGE.test(source)) ||
    (CLOSED_WORLD_SEQUENCE_LANGUAGE.test(value) &&
      CLOSED_WORLD_SEQUENCE_LANGUAGE.test(source)) ||
    (CLOSED_WORLD_CONTINUITY_LANGUAGE.test(value) &&
      CLOSED_WORLD_CONTINUITY_LANGUAGE.test(source))
  ) {
    return undefined;
  }

  const structures = envelope.eventStructure.filter((structure) =>
    eventIds.size ? eventIds.has(structure.eventId) : true,
  );
  const hasTemporalMarker = structures.some(
    (structure) => (structure.temporalMarkers ?? []).length > 0,
  );

  const semantic = beat?.semanticRealization;
  const relationKind = clean(semantic?.relation?.kind).toLowerCase();
  const mechanism = clean(semantic?.mechanism).toLowerCase();
  const hasBeforeAfter =
    Boolean(semantic?.beforeEventIds?.length) &&
    Boolean(semantic?.afterEventIds?.length);

  if (
    CLOSED_WORLD_RECURRENCE_LANGUAGE.test(value) &&
    (mechanism === "recurrence" || relationKind === "repeats")
  ) {
    return undefined;
  }

  if (
    CLOSED_WORLD_CONTINUITY_LANGUAGE.test(value) &&
    (mechanism === "continuation" ||
      mechanism === "recurrence" ||
      relationKind === "repeats")
  ) {
    return undefined;
  }

  if (
    CLOSED_WORLD_SEQUENCE_LANGUAGE.test(value) &&
    (hasTemporalMarker ||
      hasBeforeAfter ||
      ["before", "after", "changes", "causes"].includes(relationKind))
  ) {
    return undefined;
  }

  return `unsupported-chronology:${chronologyClass(value)}`;
}

function treatmentMetaphorOverSuppliedTarget(
  text: string,
  beat: MouthCandidateBeat | undefined,
  envelope: RealityEnvelope,
): boolean {
  const authority = beat?.realizationAuthority;
  const treatment = authority?.treatment;
  if (!authority || !treatment || !clean(treatment.label)) return false;

  const value = clean(text);
  if (!value) return false;

  /*
   * Genre treatment may personify or status-frame reality that already exists.
   * It may not create a second participant, possessor, relationship, object,
   * physical action, sensory fact, or chronology.
   *
   * This is intentionally structural rather than vocabulary-specific:
   * a compact predicate over a supplied target can be figurative even when the
   * exact metaphor word was never present in source reality.
   */
  if (
    CLOSED_WORLD_PRONOUN.test(value) ||
    CLOSED_WORLD_POSSESSOR.test(value) ||
    CLOSED_WORLD_RELATION_TARGET.test(value) ||
    EXTERNAL_STATE_CLAIM.test(value) ||
    BODY.test(value)
  ) {
    return false;
  }

  CLOSED_WORLD_POSSESSOR.lastIndex = 0;
  CLOSED_WORLD_RELATION_TARGET.lastIndex = 0;

  const actors = [
    envelope.subject,
    ...envelope.suppliedParticipants,
    ...authority.reality.entities,
  ].filter(Boolean);
  const targets = [
    ...actors,
    ...directScopedObjects(beat, envelope),
    ...scopedPlaces(beat, envelope),
  ];

  const stripped = value
    .replace(/[.!?]+$/g, "")
    .trim();

  const colonIndex = stripped.indexOf(":");
  let subjectPhrase = "";
  let predicatePhrase = "";

  if (colonIndex > 0) {
    subjectPhrase = clean(stripped.slice(0, colonIndex));
    predicatePhrase = clean(stripped.slice(colonIndex + 1));
  } else {
    const subjectMatch = stripped.match(CLOSED_WORLD_LEADING_SUBJECT);
    if (!subjectMatch) return false;
    subjectPhrase = clean(subjectMatch[1]);
    predicatePhrase = clean(stripped.slice(subjectMatch[0].indexOf(subjectPhrase) + subjectPhrase.length));
  }

  if (
    !subjectPhrase ||
    !predicatePhrase ||
    !referenceMatches(subjectPhrase, targets)
  ) {
    return false;
  }

  const predicateTokens = [
    ...tokens(predicatePhrase),
  ].filter((token) => !FUNCTION_WORDS.has(token));

  if (!predicateTokens.length || predicateTokens.length > 4) {
    return false;
  }

  const treatmentTokens = tokens(
    [
      treatment.label,
      ...(treatment.framingBias ?? []),
      ...(treatment.realizationPreferences ?? []),
      authorityMeaningCorpus(beat),
    ].join(" "),
  );

  return predicateTokens.every(
    (token) =>
      treatmentTokens.has(token) ||
      semanticFrameToken(token) ||
      /(?:ed|ing)$/.test(token),
  );
}

function concreteAuthorityViolation(
  text: string,
  beat: MouthCandidateBeat | undefined,
  envelope: RealityEnvelope,
): string | undefined {
  const authority = beat?.realizationAuthority;
  if (!authority) return undefined;

  const value = clean(text);
  if (!value) return "empty-candidate";

  const current = tokens(value);
  const significant = [...current].filter((token) => !FUNCTION_WORDS.has(token));
  if (!significant.length) return undefined;

  const allowedReality = tokens(authorityRealityCorpus(beat, envelope));
  const allowedMeaning = tokens(authorityMeaningCorpus(beat));
  const participantViolation = closedWorldParticipantViolation(
    value,
    beat,
    envelope,
  );

  if (participantViolation) {
    return participantViolation;
  }

  const chronologyViolation = chronologyAuthorityViolation(
    value,
    beat,
    envelope,
  );

  if (chronologyViolation) {
    return chronologyViolation;
  }

  if (
    treatmentMetaphorOverSuppliedTarget(
      value,
      beat,
      envelope,
    )
  ) {
    return undefined;
  }

  const unknownRealityTokens = significant.filter(
    (token) =>
      !allowedReality.has(token) &&
      !allowedMeaning.has(token) &&
      !semanticFrameToken(token),
  );

  if (!unknownRealityTokens.length) return undefined;

  const clauseSubject = CLAUSE_SUBJECT_MARKER.test(value);
  const observableSignal =
    CONCRETE_CLAIM.test(value) ||
    EXTERNAL_STATE_CLAIM.test(value) ||
    BODY.test(value) ||
    introducesUnsupportedPhysicalRelation(value, envelope) ||
    observableClaimShape(value);

  if (observableSignal) {
    return `outside-realization-authority:${unknownRealityTokens.join(",")}`;
  }

  /*
   * A subject plus unknown predicate is an asserted event/state unless the
   * unknown language is already covered by earned meaning.
   */
  if (clauseSubject && unknownRealityTokens.length > 0) {
    return `outside-realization-authority:${unknownRealityTokens.join(",")}`;
  }

  return undefined;
}

function hasApprovedBeatAuthority(
  beat?: MouthCandidateBeat,
): boolean {
  return hasExplicitSemanticAuthority(beat);
}

function semanticFrameToken(
  token: string,
): boolean {
  if (ABSTRACT_FRAMING.test(token)) {
    return true;
  }

  if (token.endsWith("ous")) {
    return ABSTRACT_FRAMING.test(
      token.slice(0, -3),
    );
  }

  return false;
}

function sourceHasObservableEventAuthority(
  sourceLabels: readonly string[],
  beat: MouthCandidateBeat | undefined,
  envelope: RealityEnvelope,
): boolean {
  const beatEventIds =
    new Set(beat?.eventIds ?? []);

  const structures =
    beatEventIds.size
      ? envelope.eventStructure.filter((item) =>
          beatEventIds.has(item.eventId),
        )
      : [];

  if (
    structures.some(
      (item) =>
        item.actions.length > 0 ||
        item.objects.length > 0 ||
        item.sensoryMarkers.length > 0,
    )
  ) {
    return true;
  }

  /*
   * Fallback for source fragments that predate complete eventStructure action
   * extraction. A supplied physical relation is observable authority; it is
   * not a candidate-side vocabulary exception.
   */
  return sourceLabels.some((label) =>
    /\b(?:in|on|onto|under|inside|within|through|across|against|around|between|near|outside|into|out\s+of|from|with|at)\b/i.test(
      label,
    ),
  );
}

function compactSuppliedEventCompression(
  text: string,
  sourceLabels: readonly string[],
  beat: MouthCandidateBeat | undefined,
  envelope: RealityEnvelope,
): boolean {
  if (
    !sourceHasObservableEventAuthority(
      sourceLabels,
      beat,
      envelope,
    )
  ) {
    return false;
  }

  const words =
    clean(text)
      .replace(/[.!?]+$/g, "")
      .toLowerCase()
      .match(/[a-z0-9'-]+/g) ?? [];

  if (
    words.length < 2 ||
    words.length > 4
  ) {
    return false;
  }

  if (
    !/^(?:a|an|the)\b/i.test(text)
  ) {
    return false;
  }

  return words
    .slice(1, -1)
    .some(semanticFrameToken);
}

function observableClaimShape(
  text: string,
): boolean {
  const value = clean(text);

  const words =
    value
      .replace(/[.!?]+$/g, "")
      .toLowerCase()
      .match(/[a-z0-9'-]+/g) ?? [];

  if (!words.length) {
    return false;
  }

  const participialObservation =
    words.some((word) =>
      /(?:ing|ed)$/.test(word) &&
      !SEMANTIC_COMPRESSION_VERBS.has(word),
    );

  if (participialObservation) {
    return true;
  }

  const conjunctionInventory =
    /\b[a-z][a-z0-9'-]*\s+and\s+[a-z][a-z0-9'-]*\b/i.test(value) &&
    !words.some(semanticFrameToken);

  if (conjunctionInventory) {
    return true;
  }

  const articleNominal =
    /^(?:a|an|the)\s+[a-z][a-z0-9'-]*(?:\s+[a-z][a-z0-9'-]*){0,2}\.?$/i.test(
      value,
    );

  return (
    articleNominal &&
    !words.slice(1, -1).some(semanticFrameToken)
  );
}

function zeroOverlapApprovedRealizationShape(
  text: string,
  sourceLabels: readonly string[],
  beat: MouthCandidateBeat | undefined,
  envelope: RealityEnvelope,
  compressionVerb: boolean,
): boolean {
  if (compressionVerb) {
    return true;
  }

  if (
    compactSuppliedEventCompression(
      text,
      sourceLabels,
      beat,
      envelope,
    )
  ) {
    return true;
  }

  if (observableClaimShape(text)) {
    return false;
  }

  const words =
    clean(text)
      .replace(/[.!?]+$/g, "")
      .toLowerCase()
      .match(/[a-z0-9'-]+/g) ?? [];

  /*
   * Once Cognition has approved the beat's semantic territory, a compact
   * viewer-facing fragment does not need to reuse source or taxonomy words.
   *
   * This is language freedom, not reality freedom. Observable/concrete claim
   * shapes were rejected above and are still checked by the concrete
   * realization-authority veto. This path only permits non-observable
   * interpretation, status, implication, attitude, metaphor, or recognition.
   */
  const compactInterpretiveFragment =
    words.length <= 6 &&
    compactRhetoricalShape(text);

  return (
    compactInterpretiveFragment ||
    words.length === 1 ||
    words.some(semanticFrameToken)
  );
}
/**
 * Semantic realization is not lexical substitution.
 *
 * Historically this function required overlap with source vocabulary.
 * That was too strict for approved semantic realizations such as:
 *
 *   "started nervous" -> "Nerves. Then..."
 *   "talked until close" -> "A dangerous current."
 *
 * The approved beat now owns the semantic territory.
 *
 * This function still protects against pure atmosphere and detached
 * cinematic labels when no beat-local evidence exists.
 */
function semanticCompressionShape(
  text: string,
  sourceLabels: readonly string[],
  envelope: RealityEnvelope,
  beat?: MouthCandidateBeat,
): boolean {
  const wordCount = text
    .split(/\s+/)
    .filter(Boolean)
    .length;

  if (
    wordCount === 0 ||
    wordCount > 14
  ) {
    return false;
  }

  if (
    CONCRETE_CLAIM.test(text) ||
    EXTERNAL_STATE_CLAIM.test(text)
  ) {
    return false;
  }

  if (
    INTERNAL_MACHINE_LANGUAGE.test(text)
  ) {
    return false;
  }

  const current = tokens(text);

  const source = tokens(
    sourceLabels.join(" "),
  );

  const significant = [
    ...current,
  ].filter(
    (token) =>
      !FUNCTION_WORDS.has(token),
  );

  const compressionVerb =
    significant.some(
      (token) =>
        SEMANTIC_COMPRESSION_VERBS.has(
          token,
        ),
    );

  const framing =
    ABSTRACT_FRAMING.test(text) ||
    compactRhetoricalShape(text);

  if (
    !compressionVerb &&
    !framing
  ) {
    return false;
  }

  const beatOverlap =
    overlap(
      current,
      source,
    );
  


/*
 * Existing lexical path.
 *
 * When the realization clearly belongs to the source wording,
 * keep the stricter existing behavior.
 */
if (
  beatOverlap >= 0.12
) {

  
    const unknown =
      significant.filter(
        (token) =>
          !source.has(token) &&
          !SEMANTIC_COMPRESSION_VERBS.has(
            token,
          ) &&
          !ABSTRACT_FRAMING.test(
            token,
          ),
      );

    return (
      unknown.length <=
      Math.max(
        1,
        Math.floor(
          significant.length / 3,
        ),
      )
    );
  }

  /*
   * Canonical semantic ownership path.
   *
   * The beat has already been approved upstream by Cognition/Brain.
   * Therefore lexical overlap is NOT required for a transformed
   * realization.
   *
   * A short fragment may be a completely valid realization even when
   * it shares no literal vocabulary with the beat.
   */
  const hasApprovedBeat =
    hasApprovedBeatAuthority(beat);

  if (
    !hasApprovedBeat
  ) {
    return false;
  }

  /*
   * Machine-like abstract labels remain disallowed.
   *
   * Human-facing fragments remain allowed when their claim shape stays
   * semantic/status/interpretive, or when they compact a supplied observable
   * event. A supplied state alone does not authorize a new body, sensory,
   * environment, dialogue, entity, or event claim.
   */
  const bareNominalLabel =
    /^(?:the|a|an)\s+[a-z][a-z'-]*(?:\s+[a-z][a-z'-]*){0,2}\.?$/i.test(
      text,
    );

  const machineLikeNominalLabel =
    /^(?:the|a|an)\s+(?:tightening|deepening|afterglow|orientation|oriented|reframed|pressurized|resolved|disrupted|release)\.?$/i.test(
      text,
    );

  if (
    bareNominalLabel &&
    machineLikeNominalLabel
  ) {
    return false;
  }

  return zeroOverlapApprovedRealizationShape(
    text,
    sourceLabels,
    beat,
    envelope,
    compressionVerb,
  );
}

export function evaluateMouthInterpretation(input: {
  text: string;
  sourceLabels: readonly string[];
  envelope: RealityEnvelope;
  beat?: MouthCandidateBeat;
}): MouthInterpretationEvaluation {
  const text = clean(input.text);

  const beatSourceText =
    clean(
      input.sourceLabels.join(" "),
    );

  const wholeSourceText =
    wholeSourceCorpus(
      input.envelope,
    );

  const current = tokens(text);

  const beatSource =
    tokens(
      beatSourceText,
    );

  const wholeSource =
    tokens(
      wholeSourceText,
    );

  const sourceAnchor =
    overlap(
      current,
      beatSource,
    );

  const wholeSourceAnchor =
    overlap(
      current,
      wholeSource,
    );

  const literalRestatement =
    input.sourceLabels.some(
      (label) => {
        const a =
          text
            .replace(
              /[.!?]+$/g,
              "",
            )
            .toLowerCase();

        const b =
          clean(label)
            .replace(
              /[.!?]+$/g,
              "",
            )
            .toLowerCase();

        return Boolean(
          a &&
          b &&
          a === b,
        );
      },
    )
      ? 1
      : 0;

  const wordCount =
    text
      .split(/\s+/)
      .filter(Boolean)
      .length;

  const concreteClaim =
    CONCRETE_CLAIM.test(
      text,
    );

  const externalStateClaim =
    EXTERNAL_STATE_CLAIM.test(
      text,
    );
  const unsupportedPhysicalRelation =
  introducesUnsupportedPhysicalRelation(
    text,
    input.envelope,
  );
  const groundedConcreteFragment =
    wordCount <= 5 &&
    concreteClaim &&
    !CLAUSE_SUBJECT_MARKER.test(
      text,
    ) &&
    wholeSourceAnchor >= 0.45;

  /*
   * A candidate that is concrete or externally sensory must have actual
   * support somewhere in the supplied corpus. We deliberately do not
   * maintain a domain-specific forbidden-word list.
   */
  const concreteOrExternalClaim =
    concreteClaim ||
    externalStateClaim;

  const concreteActionSupport =
    !concreteClaim ||
    sourceAnchor >= 0.45 ||
    input.sourceLabels.some((label) =>
      CONCRETE_CLAIM.test(label),
    );

  const concreteSourceSupport =
    concreteOrExternalClaim &&
    wholeSourceAnchor >= 0.45 &&
    concreteActionSupport;

  let unsupportedConcreteRisk =
  concreteOrExternalClaim &&
  !concreteSourceSupport
    ? 1
    : 0;

if (
  unsupportedPhysicalRelation
) {
  unsupportedConcreteRisk =
    Math.max(
      unsupportedConcreteRisk,
      1,
    );
}

const authorityConcreteRisk =
  unsupportedAuthorityConcreteRisk(
    text,
    input.beat,
    input.envelope,
  );

const concreteAuthorityFailure =
  concreteAuthorityViolation(
    text,
    input.beat,
    input.envelope,
  );

if (authorityConcreteRisk > 0 || concreteAuthorityFailure) {
  unsupportedConcreteRisk =
    Math.max(
      unsupportedConcreteRisk,
      authorityConcreteRisk,
      concreteAuthorityFailure ? 1 : 0,
    );
}

  /*
   * Machine-facing language is never viewer-facing language.
   */
  if (
    INTERNAL_MACHINE_LANGUAGE.test(
      text,
    )
  ) {
    unsupportedConcreteRisk =
      Math.max(
        unsupportedConcreteRisk,
        1,
      );
  }

  const frameSignal =
    ABSTRACT_FRAMING.test(text) ||
    compactRhetoricalShape(text);

  const sourceExists =
    input.envelope.events.length > 0 ||
    Boolean(
      wholeSourceText,
    );

  const shortCreativeForm =
    wordCount <= 12;

  const hasBeatSource =
    input.sourceLabels.length > 0;

  const beatTouchesLanguage =
    sourceAnchor >= 0.08;

  const semanticCompression =
    semanticCompressionShape(
      text,
      input.sourceLabels,
      input.envelope,
      input.beat,
    );

  /*
   * The approved beat is the semantic authority.
   * It may authorize transformed expression without requiring lexical
   * overlap with the supplied wording.
   */
  const approvedSemanticBeat =
    hasApprovedBeatAuthority(input.beat);

  const authorityMeaningAnchor =
    overlap(
      current,
      tokens(authorityMeaningCorpus(input.beat)),
    );

  const directGrounded =
    literalRestatement === 1 ||
    (
      hasBeatSource &&
      sourceAnchor >= 0.55
    );

  const semanticAuthorized =
    approvedSemanticBeat &&
    (
      semanticCompression ||
      authorityMeaningAnchor >= 0.08
    );

  const semanticBeatSupport =
    directGrounded ||
    semanticAuthorized;

  const associativeWorldSupport =
    Math.max(
      0,
      Math.min(
        1,
        wholeSourceAnchor * 0.55 +
          sourceAnchor * 0.45,
      ),
    );

  const safeCreativeBet =
    Boolean(text) &&
    unsupportedConcreteRisk === 0 &&
    literalRestatement === 0 &&
    shortCreativeForm &&
    sourceExists &&
    semanticBeatSupport;

  const groundingContribution =
    hasBeatSource
      ? Math.min(
          0.45,
          sourceAnchor * 0.5,
        )
      : Math.min(
          0.45,
          wholeSourceAnchor * 0.5,
        );

  /*
   * Approved semantic beats receive a bounded grounding floor even when
   * lexical overlap is zero. This is authorization from Cognition/Brain,
   * not invented source evidence.
   */
  const approvedBeatGrounding =
    approvedSemanticBeat &&
    semanticCompression
      ? 0.36
      : approvedSemanticBeat &&
          semanticBeatSupport &&
          frameSignal
        ? 0.28
        : 0;

  const framingContribution =
    frameSignal
      ? 0.36
      : 0;

  const compressionContribution =
    shortCreativeForm
      ? 0.14
      : 0;

  const beatOwnershipContribution =
    hasBeatSource
      ? Math.min(
          0.3,
          sourceAnchor * 0.6,
        )
      : 0;

  const creativeFraming =
    Number(
      Math.max(
        0,
        Math.min(
          1,
          groundingContribution +
            approvedBeatGrounding +
            framingContribution +
            compressionContribution +
            beatOwnershipContribution +
            (
              safeCreativeBet
                ? 0.2
                : 0
            ),
        ),
      ).toFixed(3),
    );

  const interpretive =
    Number(
      Math.max(
        0,
        Math.min(
          1,
          creativeFraming +
            (
              hasBeatSource
                ? sourceAnchor
                : wholeSourceAnchor
            ) * 0.22 +
            (
              frameSignal
                ? 0.1
                : 0
            ),
        ),
      ).toFixed(3),
    );

  const reasons: string[] = [];

  if (
    literalRestatement
  ) {
    reasons.push(
      "literal-source-restatement",
    );
  }

  if (
    sourceAnchor >= 0.18
  ) {
    reasons.push(
      "beat-source-anchored",
    );
  }

  if (
    wholeSourceAnchor >= 0.18
  ) {
    reasons.push(
      "whole-reality-anchored",
    );
  }

  if (
    groundedConcreteFragment
  ) {
    reasons.push(
      "grounded-concrete-fragment",
    );
  }

  if (
    frameSignal
  ) {
    reasons.push(
      "viewer-facing-framing",
    );
  }

  if (
    approvedSemanticBeat
  ) {
    reasons.push(
      "explicit-realization-authority",
    );
  }

  if (
    hasBeatSource &&
    semanticBeatSupport
  ) {
    reasons.push(
      "beat-obligation-satisfied",
    );
  }

  if (
    semanticCompression
  ) {
    reasons.push(
      "semantic-compression",
    );
  }

  if (
    safeCreativeBet
  ) {
    reasons.push(
      "bounded-creative-bet",
    );
  }

  if (
    unsupportedConcreteRisk > 0
  ) {
    reasons.push(
      "unsupported-concrete-invention",
    );
  }

  if (
    authorityConcreteRisk > 0
  ) {
    reasons.push(
      "outside-realization-authority-reality",
    );
  }

  if (
    concreteAuthorityFailure
  ) {
    reasons.push(
      concreteAuthorityFailure,
    );
  }

  if (
    authorityMeaningAnchor >= 0.08
  ) {
    reasons.push(
      "realization-authority-meaning",
    );
  }

  if (
    interpretive >= 0.45 &&
    !literalRestatement
  ) {
    reasons.push(
      "grounded-creative-interpretation",
    );
  }

  const realitySafe =
    unsupportedConcreteRisk < 0.9;

  const authorizationReasons = [
    ...(realitySafe ? ["reality-safe"] : ["concrete-reality-veto"]),
    ...(directGrounded ? ["direct-grounded"] : []),
    ...(semanticAuthorized ? ["semantic-authorized-by-realization-authority"] : []),
  ];

  const authorized =
    Boolean(text) &&
    realitySafe &&
    (
      directGrounded ||
      semanticAuthorized
    );

  return {
    interpretive,

    sourceAnchor:
      Number(
        sourceAnchor.toFixed(3),
      ),

    wholeSourceAnchor:
      Number(
        wholeSourceAnchor.toFixed(3),
      ),

    frameSupport:
      Number(
        (
          frameSignal
            ? 0.8
            : 0
        ).toFixed(3),
      ),

    literalRestatement,

    creativeFraming,

    unsupportedConcreteRisk,

    authorization: {
      realitySafe,
      semanticAuthorized,
      directGrounded,
      authorized,
      reasons: authorizationReasons,
    },

    accepted: authorized,

    reasons,
  };
}
