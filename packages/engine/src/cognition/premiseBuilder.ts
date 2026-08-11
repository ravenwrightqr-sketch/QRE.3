/**
 * Build the conserved semantic premise without creating domain-specific
 * compiler modes. The builder extracts roles and relationships from evidence
 * the cognition layer already owns.
 */

import type {
  CognitiveClaim,
  CognitiveEvidence,
  CognitiveExperiencePlan,
  CognitivePremise,
  CognitivePremiseRelation,
  CognitivePremiseRole,
  CognitivePremiseSlot,
  ExperienceEntities,
} from "@qre/contracts";

type PremiseContext = {
  location?: {
    label?: string;
    city?: string;
  };
  event?: {
    venue?: string;
    participants?: string[];
  };
};

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const lower = (value: string) => clean(value).toLowerCase();

const unique = (values: string[]) =>
  [...new Set(values.map(clean).filter(Boolean))];

const DETAIL_STOP = new Set([
  "a", "an", "and", "are", "as", "at", "be", "because", "but", "by",
  "can", "could", "did", "do", "does", "doing", "for", "from", "get",
  "give", "gives", "given", "has", "have", "having", "how", "i", "if",
  "in", "into", "is", "it", "its", "just", "make", "makes", "making",
  "me", "my", "of", "on", "or", "our", "people", "please", "that",
  "the", "their", "this", "those", "to", "turn", "up", "was", "we",
  "were", "what", "when", "where", "which", "who", "will", "with", "you",
  "your", "after", "before", "over", "through", "then", "now", "something",
  "someone", "thing", "things", "experience", "story", "about", "want", "wants",
  "need", "needs", "create", "build", "built", "house", "day",
]);

function evidence(detail: string, confidence = 0.9): CognitiveEvidence {
  return {
    source: "prompt",
    detail,
    confidence,
  };
}

function slot(
  role: CognitivePremiseRole,
  values: string[],
  status: CognitivePremiseSlot["status"],
  confidence: number,
  salience: number,
  detail: string,
): CognitivePremiseSlot | undefined {
  const normalized = unique(values);
  if (!normalized.length) return undefined;

  return {
    role,
    values: normalized,
    status,
    confidence,
    salience,
    evidence: [evidence(detail, confidence)],
  };
}

function relation(
  from: CognitivePremiseRole,
  to: CognitivePremiseRole,
  relationName: string,
  confidence: number,
  detail: string,
): CognitivePremiseRelation {
  return {
    from,
    to,
    relation: relationName,
    confidence,
    evidence: [evidence(detail, confidence)],
  };
}

function outcomeValues(prompt: string): string[] {
  const values: string[] = [];

  const patterns = [
    /\b(?:so|that)\s+(.+)$/i,
    /\b(?:people|everyone|family|friends?|visitors?|customers?|fans?)\s+(?:can|will|should|might|could)\s+(.+)$/i,
    /\b(?:to|for)\s+(?:make|help|give|let)\s+(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern)?.[1];
    if (match) values.push(match.replace(/[.!?]+$/, ""));
  }

  const remembered = prompt.match(
    /\b(?:people|everyone|family|friends?)\s+(?:will|can|should|might|could)\s+(remember|keep|share|add|discover|return|play|participate)\b[^.!?]*/i,
  )?.[0];

  if (remembered) values.push(remembered);
  return unique(values).slice(0, 3);
}

function transformationValues(prompt: string): string[] {
  const match = prompt.match(
    /\b(?:turn|transform)\s+(.+?)\s+\b(?:into|as)\s+(.+)$/i,
  );

  if (!match) return [];
  return unique([match[1], match[2].replace(/[.!?]+$/, "")]);
}

function temporalValues(
  prompt: string,
  entities: ExperienceEntities,
  plan: CognitiveExperiencePlan,
): string[] {
  return unique([
    ...entities.dates,
    ...entities.times,
    ...plan.futureEvolution.filter((value) =>
      /\b(?:future|over time|again|return|later|next|continue|grows?|evolv|accumulat|milestone|years?)\b/i.test(value),
    ),
    ...(prompt.match(/\b(?:tonight|today|tomorrow|now|later|again|over time|for(?:ever)?)\b/gi) ?? []),
  ]).slice(0, 8);
}

function constraintValues(prompt: string): string[] {
  return unique(
    (prompt.match(
      /\b(?:don'?t want|do not want|not another|avoid|without|no)\b[^.!?]*/gi,
    ) ?? []),
  );
}

function mediumValues(entities: ExperienceEntities): string[] {
  const media = entities.products.filter((value) =>
    /\b(?:qr|nfc|scan|tag|barcode|code|link|portal|interface)\b/i.test(value),
  );

  return unique([
    ...media,
    ...entities.media.filter((value) => /media/i.test(value)),
  ]);
}

function detailValues(prompt: string, known: string[]): string[] {
  const knownTokens = new Set(
    known
      .flatMap((value) => clean(value).toLowerCase().split(/\s+/))
      .filter(Boolean),
  );

  const words = clean(prompt)
    .replace(/[^\p{L}\p{N}'-]+/gu, " ")
    .split(/\s+/)
    .map((word) => word.replace(/^['-]+|['-]+$/g, ""))
    .filter((word) => word.length > 2);

  const phrases: string[] = [];
  let run: string[] = [];

  const flush = () => {
    if (run.length >= 1) {
      for (let size = Math.min(4, run.length); size >= 1; size -= 1) {
        for (let start = 0; start + size <= run.length; start += 1) {
          const phrase = run.slice(start, start + size).join(" ");
          if (phrase.split(/\s+/).every((word) => !knownTokens.has(lower(word)))) {
            phrases.push(phrase);
          }
        }
      }
    }
    run = [];
  };

  for (const word of words) {
    if (DETAIL_STOP.has(lower(word))) {
      flush();
      continue;
    }
    run.push(word);
  }
  flush();

  return unique(phrases)
    .filter((value) => !known.some((item) => lower(item) === lower(value)))
    .filter((value) => value.length >= 4)
    .sort((a, b) => {
      const aWords = a.split(/\s+/).length;
      const bWords = b.split(/\s+/).length;
      return bWords - aWords || b.length - a.length;
    })
    .slice(0, 8);
}

export function buildCognitivePremise(args: {
  prompt: string;
  subject: CognitiveClaim<string>;
  participants: CognitiveClaim<string[]>;
  entities: ExperienceEntities;
  affordances: string[];
  emotionalIntent: string[];
  plan: CognitiveExperiencePlan;
  context?: PremiseContext;
}): CognitivePremise {
  const {
    prompt,
    subject,
    participants,
    entities,
    affordances,
    emotionalIntent,
    plan,
    context,
  } = args;

  const eventValues = unique([
    ...entities.events,
    ...(context?.event?.venue ? [context.event.venue] : []),
  ]);

  const artifactValues = unique([
    ...entities.products.filter(
      (value) => !/\b(?:qr|nfc|scan|tag|barcode|code)\b/i.test(value),
    ),
    ...entities.organizations.filter((value) =>
      /\b(?:shop|studio|restaurant|hotel|club|brand|company)\b/i.test(value),
    ),
  ]);

  const places = unique([
    ...entities.places,
    ...(context?.location?.label ? [context.location.label] : []),
    ...(context?.location?.city ? [context.location.city] : []),
  ]);

  const social = unique([
    ...participants.value,
    ...entities.people,
    ...(context?.event?.participants ?? []),
  ]);

  const outcomes = unique([
    ...outcomeValues(prompt),
    ...(plan.purpose ? [plan.purpose] : []),
  ]);

  const transformations = transformationValues(prompt);
  const constraints = constraintValues(prompt);
  const temporal = temporalValues(prompt, entities, plan);
  const media = mediumValues(entities);
  const knownEvidence = [
    subject.value,
    ...eventValues,
    ...artifactValues,
    ...places,
    ...social,
    ...outcomes,
    ...transformations,
    ...constraints,
    ...temporal,
    ...media,
  ];
  const details = detailValues(prompt, knownEvidence);

  const slots = [
    slot(
      "subject",
      [subject.value],
      subject.status,
      subject.confidence,
      1,
      "central subject claim",
    ),
    slot(
      "event",
      eventValues,
      "observed",
      eventValues.length ? 0.96 : 0,
      0.9,
      "event/context evidence from prompt or runtime context",
    ),
    slot(
      "medium",
      media,
      "observed",
      media.length ? 0.96 : 0,
      0.92,
      "interaction medium or interface evidence",
    ),
    slot(
      "artifact",
      artifactValues,
      "observed",
      artifactValues.length ? 0.9 : 0,
      0.88,
      "physical or concrete artifact evidence",
    ),
    slot(
      "participants",
      social,
      social.length ? "observed" : "unknown",
      social.length ? 0.84 : 0,
      0.78,
      "participant and social evidence",
    ),
    slot(
      "outcome",
      outcomes,
      outcomes.length ? "derived" : "unknown",
      outcomes.length ? 0.78 : 0,
      outcomes.length ? 0.94 : 0,
      "desired human outcome inferred from explicit request and selected plan",
    ),
    slot(
      "emotion",
      emotionalIntent,
      emotionalIntent.length ? "derived" : "unknown",
      emotionalIntent.length ? 0.82 : 0,
      0.72,
      "emotional intent inferred from prompt language",
    ),
    slot(
      "affordance",
      affordances,
      affordances.length ? "derived" : "unknown",
      affordances.length ? 0.84 : 0,
      0.76,
      "interaction affordances derived by cognition",
    ),
    slot(
      "temporal",
      temporal,
      temporal.length ? "observed" : "unknown",
      temporal.length ? 0.86 : 0,
      0.7,
      "temporal evidence and future-evolution signals",
    ),
    slot(
      "place",
      places,
      places.length ? "observed" : "unknown",
      places.length ? 0.92 : 0,
      0.68,
      "geographic evidence from prompt or runtime context",
    ),
    slot(
      "social",
      social,
      social.length ? "observed" : "unknown",
      social.length ? 0.84 : 0,
      0.72,
      "social relationship evidence",
    ),
    slot(
      "transformation",
      transformations,
      transformations.length ? "observed" : "unknown",
      transformations.length ? 0.96 : 0,
      transformations.length ? 0.9 : 0,
      "explicit transformation relationship in prompt",
    ),
    slot(
      "constraint",
      constraints,
      constraints.length ? "observed" : "unknown",
      constraints.length ? 0.96 : 0,
      constraints.length ? 0.94 : 0,
      "explicit rejection or constraint in prompt",
    ),
    slot(
      "detail",
      details,
      details.length ? "observed" : "unknown",
      details.length ? 0.9 : 0,
      details.length ? 0.86 : 0,
      "salient lexical detail preserved directly from the prompt",
    ),
  ].filter(Boolean) as CognitivePremiseSlot[];

  const relations: CognitivePremiseRelation[] = [];

  if (eventValues.length && media.length) {
    relations.push(
      relation(
        "event",
        "medium",
        "medium operates within event context",
        0.96,
        `${eventValues.join(", ")} + ${media.join(", ")}`,
      ),
    );
  }

  if (eventValues.length && subject.value) {
    relations.push(
      relation(
        "subject",
        "event",
        "subject is situated in event context",
        0.9,
        `${subject.value} + ${eventValues.join(", ")}`,
      ),
    );
  }

  if (media.length && subject.value) {
    relations.push(
      relation(
        "subject",
        "medium",
        "subject is carried or accessed through medium",
        0.9,
        `${subject.value} + ${media.join(", ")}`,
      ),
    );
  }

  if (artifactValues.length && subject.value) {
    relations.push(
      relation(
        "subject",
        "artifact",
        "subject is represented by or attached to artifact",
        0.82,
        `${subject.value} + ${artifactValues.join(", ")}`,
      ),
    );
  }

  if (social.length && outcomes.length) {
    relations.push(
      relation(
        "participants",
        "outcome",
        "participants are intended beneficiaries or actors in the outcome",
        0.84,
        `${social.join(", ")} → ${outcomes.join(", ")}`,
      ),
    );
  }

  if (subject.value && outcomes.length) {
    relations.push(
      relation(
        "subject",
        "outcome",
        "experience is intended to move the subject toward the desired outcome",
        0.82,
        `${subject.value} → ${outcomes.join(", ")}`,
      ),
    );
  }

  if (transformations.length >= 2) {
    relations.push(
      relation(
        "transformation",
        "outcome",
        "explicit transformation supplies desired end state",
        0.96,
        transformations.join(" → "),
      ),
    );
  }

  if (places.length && eventValues.length) {
    relations.push(
      relation(
        "event",
        "place",
        "event is situated at place",
        0.9,
        `${eventValues.join(", ")} @ ${places.join(", ")}`,
      ),
    );
  }

  if (temporal.length && subject.value) {
    relations.push(
      relation(
        "subject",
        "temporal",
        "subject evolves or is constrained by temporal context",
        0.78,
        temporal.join(", "),
      ),
    );
  }

  if (constraints.length && subject.value) {
    relations.push(
      relation(
        "subject",
        "constraint",
        "subject must satisfy explicit user constraint",
        0.96,
        constraints.join(", "),
      ),
    );
  }

  return {
    slots,
    relations,
  };
}

export function premiseValues(
  premise: CognitivePremise | undefined,
  role: CognitivePremiseRole,
): string[] {
  return unique(
    premise?.slots
      .filter((slotValue) => slotValue.role === role)
      .flatMap((slotValue) => slotValue.values) ?? [],
  );
}

export function premiseHas(
  premise: CognitivePremise | undefined,
  role: CognitivePremiseRole,
  value: string,
): boolean {
  const target = lower(value);
  return premiseValues(premise, role).some((item) => lower(item).includes(target));
}
