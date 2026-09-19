import type { MouthCandidateBeat } from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

export type ObservableTruthBindingClaim = {
  kind: "referent" | "relation" | "pronoun" | "chronology";
  text: string;
  bound: boolean;
  evidence: string[];
  reason?: string;
};

export type ObservableTruthBindingResult = {
  accepted: boolean;
  claims: ObservableTruthBindingClaim[];
  reasons: string[];
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const normalizeToken = (token: string): string => {
  const lower = token.toLowerCase();

  if (lower.length > 6 && lower.endsWith("ing")) return lower.slice(0, -3);
  if (lower.length > 5 && lower.endsWith("ed")) return lower.slice(0, -2);
  if (lower.length > 4 && lower.endsWith("es")) return lower.slice(0, -2);
  if (lower.length > 4 && lower.endsWith("s")) return lower.slice(0, -1);

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

const SEMANTIC_FRAME =
  /\b(?:apparently|clearly|somehow|finally|now|still|again|temporary|approved|peace|mission|round|danger|victory|upgrade|boss|evidence|case|deal|terms?|status|power|control|confidence|fabulous|sharp|beautiful|good|brilliant|perfect|official|complete|completed|done|finished|cleared|ready|serious|ridiculous|absurd|suspicious|legendary|mine|belongs|in\s+charge|game|quest|operation|objective|target|verdict|rescue|heist|noir|romance|rebel|showtime|finish|final\s+round|dream|devotion|naturally|favorite|thought|problem|wish|wonder|feeling|pull|current|pressure|warmth|silence|familiar|close|closer|distance|spark|gravity|drift|rush|calm|heat|cold|lightness|weight|connection|tension|fondness|preferences?|impression|character|personality)\b/i;

const CLOSED_WORLD_PRONOUN =
  /\b(?:he|him|his|she|her|hers)\b/i;

const RELATION_TARGET =
  /\b(?:by|with|for|to|from)\s+(?:(?:the|a|an|this|that|my|your|his|her|our|their)\s+)?([a-z0-9][a-z0-9'’-]*)\b/gi;

const DETERMINED_REFERENCE =
  /\b(?:the|a|an|this|that|my|your|his|her|our|their)\s+([a-z0-9][a-z0-9'’-]*)\b/gi;

const POSSESSOR =
  /\b([a-z0-9][a-z0-9'’-]*)['’]s\b/gi;

const LEADING_SUBJECT =
  /^(?:(?:the|a|an|this|that|my|your|his|her|our|their)\s+)?(.{1,64}?)\s+(?:is|are|was|were|has|have|had|does|do|did|can|could|will|would|should|must|may|might|[a-z][a-z'’-]{2,}(?:ed|ing)|smiles?|laughs?|wins?|loses?|approves?|surrenders?|stands?|sits?|walks?|runs?|enters?|leaves?|returns?|watches?|talks?|speaks?|calls?|cleans?|fixes?|repairs?|owns?|rents?|manages?|lives?|stays?)\b/i;

const PREPOSITIONAL_CONTEXT =
  /\b(?:to|at|from|with|by|for|near|inside|outside|around|through|into|onto|under|over)\s+(?:the\s+)?$/i;

const RECURRENCE_LANGUAGE =
  /\b(?:again|returned?|returning|returns|repeated|repeat|once\s+more|another\s+time|used to|once before|back)\b/i;

const SEQUENCE_LANGUAGE =
  /\b(?:previously|prior|earlier|later|before|afterward|afterwards|after that|next time|the next time|the next day|the day before|yesterday|tomorrow)\b/i;

const CONTINUITY_LANGUAGE =
  /\b(?:still|already|continues?|continued|remains?|remained)\b/i;

const OBSERVABLE_PREPOSITIONAL_CONTEXT =
  /\b(?:at|in|on|inside|outside|near|around|through|into|onto|under|over)\s+(?:(?:the|a|an|this|that|my|your|his|her|our|their)\s+)?[a-z0-9][a-z0-9'â€™-]*\b/i;

function referenceTokens(value: string): Set<string> {
  return new Set([...tokens(value)].filter((token) => !FUNCTION_WORDS.has(token)));
}

function semanticFrameToken(token: string): boolean {
  return SEMANTIC_FRAME.test(token);
}

function abstractReference(value: string): boolean {
  const parts = [...referenceTokens(value)];
  if (!parts.length) return false;

  /*
   * Productive abstract morphology is language, not a new world object.
   * The concrete boundary must reject an invented participant or thing; it
   * must not require an endless allow-list for every metaphorical noun a
   * model can coin (smallness, defiance, momentum, friendship, and so on).
   */
  return parts.every((token) =>
    /(?:ness|tion|sion|ment|ity|ship|hood|dom|ance|ence|ism|ure|acy)$/.test(token),
  );
}

function referenceMatches(
  value: string,
  authorities: readonly string[],
): string[] {
  const wanted = referenceTokens(value);
  if (!wanted.size) return [];

  return authorities.filter((authority) => {
    const allowed = referenceTokens(authority);
    if (!allowed.size) return false;

    return (
      [...wanted].every((token) => allowed.has(token)) ||
      [...allowed].every((token) => wanted.has(token))
    );
  });
}

function authorityMeaningCorpus(beat: MouthCandidateBeat | undefined): string {
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

      const prefix = label.slice(0, index).slice(-32).trim();
      return !PREPOSITIONAL_CONTEXT.test(prefix);
    });
  });
}

function compactHead(text: string): { head: string; labelOnly: boolean } | undefined {
  const raw = clean(text);
  const value = raw.replace(/[.!?]+$/g, "").trim();
  if (!value) return undefined;

  /*
   * An auxiliary- or interrogative-led question introduces an open variable,
   * not a concrete participant assertion. Treating "what" or "did I" as a
   * referential head blocks legitimate rhetorical realization.
   */
  const interrogativeClause =
    /\?$/.test(raw) &&
    /^(?:what|who|whom|whose|which|where|when|why|how|do|does|did|is|are|was|were|has|have|had|can|could|will|would|should|must|may|might)\b/i.test(value);

  if (interrogativeClause) return undefined;

  const colonIndex = value.indexOf(":");
  if (colonIndex > 0) {
    const head = clean(value.slice(0, colonIndex));
    const predicate = clean(value.slice(colonIndex + 1));
    return head && predicate ? { head, labelOnly: true } : undefined;
  }

  const asMatch = value.match(/^(.{1,64}?)\s+as\s+(.{1,64})$/i);
  if (asMatch) {
    const head = clean(asMatch[1]);
    const predicate = clean(asMatch[2]);
    return head && predicate ? { head, labelOnly: true } : undefined;
  }

  const subjectMatch = value.match(LEADING_SUBJECT);
  if (subjectMatch) {
    const head = clean(subjectMatch[1]);
    return head ? { head, labelOnly: false } : undefined;
  }

  if (!/[.!?]\s+\S/.test(text)) {
    const articleNominal = value.match(
      /^(?:(?:the|a|an|this|that|my|your|his|her|our|their)\s+)(.{1,64})$/i,
    );
    const head = clean(articleNominal?.[0]);
    if (head) {
      return { head, labelOnly: true };
    }
  }

  return undefined;
}

function chronologyClass(value: string): string {
  if (RECURRENCE_LANGUAGE.test(value)) return "recurrence";
  if (CONTINUITY_LANGUAGE.test(value)) return "continuity";
  if (SEQUENCE_LANGUAGE.test(value)) return "sequence";
  return "chronology";
}

function chronologyAuthorityCorpus(
  beat: MouthCandidateBeat | undefined,
  envelope: RealityEnvelope,
): string {
  const eventIds = new Set(
    beat?.realizationAuthority?.reality.eventIds ?? beat?.eventIds ?? [],
  );

  const scopedEvents = eventIds.size
    ? envelope.events.filter((event) => eventIds.has(event.id))
    : envelope.events;

  const structures = eventIds.size
    ? envelope.eventStructure.filter((structure) => eventIds.has(structure.eventId))
    : envelope.eventStructure;

  return clean(
    [
      ...scopedEvents.map((event) => event.label),
      ...structures.flatMap((structure) => structure.temporalMarkers ?? []),
      ...envelope.recurringSignals,
    ].join(" "),
  );
}

function sourcePronounAuthority(text: string, envelope: RealityEnvelope): boolean {
  const source = clean(
    [
      envelope.subject,
      ...envelope.events.map((event) => event.label),
      ...envelope.suppliedParticipants,
      ...envelope.suppliedEntities,
    ].join(" "),
  ).toLowerCase();

  const pronouns =
    clean(text).toLowerCase().match(/\b(?:he|him|his|she|her|hers)\b/g) ?? [];

  return pronouns.every((pronoun) =>
    new RegExp("\\b" + pronoun + "\\b", "i").test(source),
  );
}

function continuityAsStatusFrame(value: string): boolean {
  if (
    !CONTINUITY_LANGUAGE.test(value) ||
    RECURRENCE_LANGUAGE.test(value) ||
    SEQUENCE_LANGUAGE.test(value)
  ) {
    return false;
  }

  /*
   * "Remains non-negotiable" is status/attitude language, not a new
   * observable chronology. Continuity wording becomes a hard chronology claim
   * when it points at place/context/relations or otherwise binds observable
   * world material; abstract status framing stays in semantic-quality land.
   */
  return !OBSERVABLE_PREPOSITIONAL_CONTEXT.test(value);
}

function bindReference(input: {
  value: string;
  allowedConcrete: readonly string[];
  allowedMeaning: Set<string>;
  kind: ObservableTruthBindingClaim["kind"];
}): ObservableTruthBindingClaim | undefined {
  const value = clean(input.value);
  if (!value) return undefined;

  const parts = referenceTokens(value);
  if (!parts.size) return undefined;

  if (
    [...parts].every(
      (token) => input.allowedMeaning.has(token) || semanticFrameToken(token),
    )
  ) {
    return undefined;
  }

  if (abstractReference(value)) return undefined;

  const evidence = referenceMatches(value, input.allowedConcrete);
  if (evidence.length) {
    return {
      kind: input.kind,
      text: value,
      bound: true,
      evidence,
    };
  }

  return {
    kind: input.kind,
    text: value,
    bound: false,
    evidence: [],
    reason: "unsupplied-concrete-reference:" + value.toLowerCase(),
  };
}

function chronologyClaim(
  text: string,
  beat: MouthCandidateBeat | undefined,
  envelope: RealityEnvelope,
): ObservableTruthBindingClaim | undefined {
  const value = clean(text);
  const hasChronology =
    RECURRENCE_LANGUAGE.test(value) ||
    SEQUENCE_LANGUAGE.test(value) ||
    CONTINUITY_LANGUAGE.test(value);

  if (!hasChronology) return undefined;
  if (continuityAsStatusFrame(value)) return undefined;

  const source = chronologyAuthorityCorpus(beat, envelope);

  if (
    (RECURRENCE_LANGUAGE.test(value) && RECURRENCE_LANGUAGE.test(source)) ||
    (SEQUENCE_LANGUAGE.test(value) && SEQUENCE_LANGUAGE.test(source)) ||
    (CONTINUITY_LANGUAGE.test(value) && CONTINUITY_LANGUAGE.test(source))
  ) {
    return {
      kind: "chronology",
      text: chronologyClass(value),
      bound: true,
      evidence: [source],
    };
  }

  const semantic = beat?.semanticRealization;
  const relationKind = clean(semantic?.relation?.kind).toLowerCase();
  const mechanism = clean(semantic?.mechanism).toLowerCase();
  const semanticallyBound =
    (RECURRENCE_LANGUAGE.test(value) &&
      (mechanism === "recurrence" || relationKind === "repeats")) ||
    (CONTINUITY_LANGUAGE.test(value) &&
      (mechanism === "continuation" ||
        mechanism === "recurrence" ||
        relationKind === "repeats")) ||
    (SEQUENCE_LANGUAGE.test(value) &&
      ["before", "after", "changes", "causes"].includes(relationKind));

  if (semanticallyBound) {
    return {
      kind: "chronology",
      text: chronologyClass(value),
      bound: true,
      evidence: [mechanism || relationKind || "semantic chronology"],
    };
  }

  return {
    kind: "chronology",
    text: chronologyClass(value),
    bound: false,
    evidence: [],
    reason: "unsupported-chronology:" + chronologyClass(value),
  };
}

export function bindCandidateObservableTruth(input: {
  text: string;
  beat?: MouthCandidateBeat;
  envelope: RealityEnvelope;
}): ObservableTruthBindingResult {
  const authority = input.beat?.realizationAuthority;
  if (!authority) {
    return {
      accepted: true,
      claims: [],
      reasons: [],
    };
  }

  const value = clean(input.text);
  if (!value) {
    return {
      accepted: false,
      claims: [],
      reasons: ["empty-candidate"],
    };
  }

  const actors = [
    input.envelope.subject,
    ...input.envelope.suppliedParticipants,
    ...input.envelope.suppliedEntities,
    ...authority.reality.entities,
  ].filter(Boolean);
  const allowedConcrete = [
    ...actors,
    ...input.envelope.suppliedPlaces,
    ...authority.reality.objects,
    ...directScopedObjects(input.beat, input.envelope),
    ...scopedPlaces(input.beat, input.envelope),
  ];
  const allowedMeaning = tokens(authorityMeaningCorpus(input.beat));
  const claims: ObservableTruthBindingClaim[] = [];

  if (CLOSED_WORLD_PRONOUN.test(value) && !sourcePronounAuthority(value, input.envelope)) {
    claims.push({
      kind: "pronoun",
      text: value,
      bound: false,
      evidence: [],
      reason: "unsupplied-pronoun-participant",
    });
  }

  const head = compactHead(value);
  const headClaim = head
    ? bindReference({
        value: head.head,
        allowedConcrete,
        allowedMeaning,
        kind: "referent",
      })
    : undefined;

  if (headClaim) claims.push(headClaim);

  const inspectRelation = (raw: string) => {
    const claim = bindReference({
      value: raw,
      allowedConcrete,
      allowedMeaning,
      kind: "relation",
    });
    if (claim) claims.push(claim);
  };

  for (const match of value.matchAll(RELATION_TARGET)) {
    inspectRelation(match[1] ?? "");
  }

  for (const match of value.matchAll(DETERMINED_REFERENCE)) {
    const matchEnd = (match.index ?? 0) + match[0].length;
    const trailing = value.slice(matchEnd).trimStart();
    const firstTrailing = trailing[0] ?? "";

    if (firstTrailing && /[A-Za-z0-9]/.test(firstTrailing)) continue;
    inspectRelation(match[1] ?? "");
  }

  for (const match of value.matchAll(POSSESSOR)) {
    inspectRelation(match[1] ?? "");
  }

  const chronology = chronologyClaim(value, input.beat, input.envelope);
  if (chronology) claims.push(chronology);

  const reasons = claims
    .filter((claim) => !claim.bound)
    .map((claim) => claim.reason)
    .filter((reason): reason is string => Boolean(reason));

  return {
    accepted: reasons.length === 0,
    claims,
    reasons,
  };
}
