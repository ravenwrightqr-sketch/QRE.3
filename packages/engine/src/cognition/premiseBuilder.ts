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
  location?: { label?: string; city?: string };
  event?: { venue?: string; participants?: string[] };
};

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const lower = (value: string) => clean(value).toLowerCase();
const unique = (values: string[]) => [...new Set(values.map(clean).filter(Boolean))];

function evidence(detail: string, confidence = 0.9): CognitiveEvidence {
  return { source: "prompt", detail, confidence };
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

/**
 * Extract observable event clauses from ordinary language.
 *
 * This is deliberately grammatical rather than domain-specific. We are not
 * teaching the compiler what a groomer, wedding, house, rave, car, or animal
 * is. We are preserving the user's verbs and the concrete material attached
 * to them so the downstream realizer has something real to say.
 */
const EVENT_VERB = /\b(?:arrive|arrived|arriving|enter|entered|entering|walk|walked|walking|go|went|going|come|came|coming|leave|left|leaving|return|returned|returning|groom|groomed|grooming|clean|cleaned|cleaning|wash|washed|washing|repair|repaired|repairing|fix|fixed|fixing|restore|restored|restoring|build|built|building|make|made|making|create|created|creating|cook|cooked|cooking|bake|baked|baking|serve|served|serving|prepare|prepared|preparing|open|opened|opening|close|closed|closing|visit|visited|visiting|travel|traveled|travelling|drive|drove|driving|ride|rode|riding|paint|painted|painting|dance|danced|dancing|sing|sang|singing|play|played|playing|choose|chose|choosing|pick|picked|picking|decide|decided|deciding|touch|touched|touching|hold|held|holding|wear|wore|wearing|taste|tasted|tasting|smell|smelled|smelling|look|looked|looking|see|saw|seeing|watch|watched|watching|share|shared|sharing|give|gave|giving|take|took|taking|bring|brought|bringing|receive|received|receiving|check|checked|checking|inspect|inspected|inspecting|test|tested|testing|measure|measured|measuring|install|installed|installing|remove|removed|removing|change|changed|changing|turn|turned|turning|finish|finished|finishing|complete|completed|completing|celebrate|celebrated|celebrating|marry|married|marrying|photograph|photographed|photographing|capture|captured|capturing|record|recorded|recording|teach|taught|teaching|learn|learned|learning|discover|discovered|discovering|find|found|finding|collect|collected|collecting|organize|organized|organizing|decorate|decorated|decorating|style|styled|styling|trim|trimmed|trimming|cut|cutting|brush|brushed|brushing|dry|dried|drying|massage|massaged|massaging|relax|relaxed|relaxing|pamper|pampered|pampering|spoil|spoiled|spoiling|treat|treated|treating|rescue|rescued|rescuing|adopt|adopted|adopting|meet|met|meeting|kiss|kissed|kissing|hug|hugged|hugging|remember|remembered|remembering|reconnect|reconnected|reconnecting|propose|proposed|proposing|vow|vowed|vowing|exchange|exchanged|exchanging|celebration|celebrated)\b/i;

function stripRequestFrame(value: string): string {
  return clean(value)
    .replace(/^(?:please\s+)?(?:show|make|create|write|tell|give|send|build)\s+(?:me\s+)?/i, "")
    .replace(/^(?:a|an|the)\s+(?:funny|playful|serious|beautiful|cinematic|short|long|good|great)\s+(?:story|receipt|tale|narrative)\s+(?:about|for|of)\s+/i, "")
    .replace(/^and\s+/i, "");
}

function observedEventValues(prompt: string): string[] {
  const text = clean(prompt);
  const clauses = text
    .split(/(?:[.!?;]+|,\s+|\s+and\s+)/)
    .map(stripRequestFrame)
    .filter(Boolean);

  const result: string[] = [];

  for (const clause of clauses) {
    if (EVENT_VERB.test(clause)) {
      const trimmed = clause.replace(/\b(?:to send|for the client|for the customer|for the owner|to the client)\b.*$/i, "");
      if (trimmed.length >= 4 && trimmed.split(/\s+/).length <= 18) result.push(trimmed);
    }
  }

  // Imperative narrative requests often put the concrete sequence after
  // "show": "Coco arriving, getting groomed, looking great...". Preserve
  // those fragments rather than reducing them to the generic verb "arrive".
  const showSequence = text.match(/\bshow\s+(.+?)(?:\.|$)/i)?.[1];
  if (showSequence) {
    for (const fragment of showSequence.split(/,|\s+and\s+/i)) {
      const value = clean(fragment.replace(/^and\s+/i, ""));
      if (value && EVENT_VERB.test(value) && value.split(/\s+/).length <= 10) result.push(value);
    }
  }

  return unique(result).slice(0, 10);
}

function outcomeValues(prompt: string): string[] {
  const values: string[] = [];
  for (const pattern of [
    /\b(?:so|that)\s+(.+)$/i,
    /\b(?:people|everyone|family|friends?|visitors?|customers?|fans?)\s+(?:can|will|should|might|could)\s+(.+)$/i,
    /\b(?:to|for)\s+(?:make|help|give|let)\s+(.+)$/i,
  ]) {
    const match = prompt.match(pattern)?.[1];
    if (match) values.push(match.replace(/[.!?]+$/, ""));
  }
  return unique(values).slice(0, 3);
}

function transformationValues(prompt: string): string[] {
  const match = prompt.match(/\b(?:turn|transform)\s+(.+?)\s+\b(?:into|as)\s+(.+)$/i);
  return match ? unique([match[1], match[2].replace(/[.!?]+$/, "")]) : [];
}

function temporalValues(prompt: string, entities: ExperienceEntities, plan: CognitiveExperiencePlan): string[] {
  return unique([
    ...entities.dates,
    ...entities.times,
    ...plan.futureEvolution.filter(value => /\b(?:future|over time|again|return|later|next|continue|grow|evolv|accumulat|milestone|years?)\b/i.test(value)),
    ...(prompt.match(/\b(?:tonight|today|tomorrow|now|later|again|over time|forever)\b/gi) ?? []),
  ]).slice(0, 8);
}

function constraintValues(prompt: string): string[] {
  return unique(prompt.match(/\b(?:don'?t want|do not want|not another|avoid|without|no)\b[^.!?]*/gi) ?? []);
}

function mediumValues(entities: ExperienceEntities): string[] {
  return unique([
    ...entities.products.filter(value => /\b(?:qr|nfc|scan|tag|barcode|code|link|portal|interface)\b/i.test(value)),
    ...entities.media.filter(value => /media/i.test(value)),
  ]);
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
  const { prompt, subject, participants, entities, affordances, emotionalIntent, plan, context } = args;

  const observedEvents = observedEventValues(prompt);
  const eventValues = unique([
    ...observedEvents,
    ...entities.events,
    ...(context?.event?.venue ? [context.event.venue] : []),
  ]);

  const artifactValues = unique([
    ...entities.products.filter(value => !/\b(?:qr|nfc|scan|tag|barcode|code)\b/i.test(value)),
    ...entities.organizations.filter(value => /\b(?:shop|studio|restaurant|hotel|club|brand|company)\b/i.test(value)),
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

  const outcomes = outcomeValues(prompt);
  const transformations = transformationValues(prompt);
  const constraints = constraintValues(prompt);
  const temporal = temporalValues(prompt, entities, plan);
  const media = mediumValues(entities);

  const slots = [
    slot("subject", [subject.value], subject.status, subject.confidence, 1, "central subject claim"),
    slot("event", eventValues, "observed", eventValues.length ? 0.98 : 0, 0.98, "concrete observable event clauses preserved from prompt/context"),
    slot("medium", media, "observed", media.length ? 0.96 : 0, 0.92, "interaction medium or interface evidence"),
    slot("artifact", artifactValues, "observed", artifactValues.length ? 0.9 : 0, 0.88, "physical or concrete artifact evidence"),
    slot("participants", social, social.length ? "observed" : "unknown", social.length ? 0.84 : 0, 0.78, "participant and social evidence"),
    slot("outcome", outcomes, outcomes.length ? "derived" : "unknown", outcomes.length ? 0.78 : 0, outcomes.length ? 0.94 : 0, "desired human outcome inferred from explicit prompt evidence"),
    slot("emotion", emotionalIntent, emotionalIntent.length ? "derived" : "unknown", emotionalIntent.length ? 0.82 : 0, 0.72, "emotional intent inferred from prompt language"),
    slot("affordance", affordances, affordances.length ? "derived" : "unknown", affordances.length ? 0.84 : 0, 0.76, "interaction affordances derived by cognition"),
    slot("temporal", temporal, temporal.length ? "observed" : "unknown", temporal.length ? 0.86 : 0, 0.7, "temporal evidence and future-evolution signals"),
    slot("place", places, places.length ? "observed" : "unknown", places.length ? 0.92 : 0, 0.68, "geographic evidence from prompt or runtime context"),
    slot("social", social, social.length ? "observed" : "unknown", social.length ? 0.84 : 0, 0.72, "social relationship evidence"),
    slot("transformation", transformations, transformations.length ? "observed" : "unknown", transformations.length ? 0.96 : 0, transformations.length ? 0.9 : 0, "explicit transformation relationship in prompt"),
    slot("constraint", constraints, constraints.length ? "observed" : "unknown", constraints.length ? 0.96 : 0, constraints.length ? 0.94 : 0, "explicit rejection or constraint in prompt"),
  ].filter(Boolean) as CognitivePremiseSlot[];

  const relations: CognitivePremiseRelation[] = [];
  const add = (from: CognitivePremiseRole, to: CognitivePremiseRole, name: string, confidence: number, detail: string) => relations.push(relation(from, to, name, confidence, detail));

  if (eventValues.length && media.length) add("event", "medium", "medium operates within event context", 0.96, `${eventValues.join(", ")} + ${media.join(", ")}`);
  if (eventValues.length && subject.value) add("subject", "event", "subject is situated in observed event sequence", 0.94, `${subject.value} + ${eventValues.join(", ")}`);
  if (media.length && subject.value) add("subject", "medium", "subject is carried or accessed through medium", 0.9, `${subject.value} + ${media.join(", ")}`);
  if (artifactValues.length && subject.value) add("subject", "artifact", "subject is represented by or attached to artifact", 0.82, `${subject.value} + ${artifactValues.join(", ")}`);
  if (social.length && outcomes.length) add("participants", "outcome", "participants are intended beneficiaries or actors in the outcome", 0.84, `${social.join(", ")} → ${outcomes.join(", ")}`);
  if (subject.value && outcomes.length) add("subject", "outcome", "experience is intended to move the subject toward the desired outcome", 0.82, `${subject.value} → ${outcomes.join(", ")}`);
  if (transformations.length >= 2) add("transformation", "outcome", "explicit transformation supplies desired end state", 0.96, transformations.join(" → "));
  if (places.length && eventValues.length) add("event", "place", "event is situated at place", 0.9, `${eventValues.join(", ")} @ ${places.join(", ")}`);
  if (temporal.length && subject.value) add("subject", "temporal", "subject evolves or is constrained by temporal context", 0.78, temporal.join(", "));
  if (constraints.length && subject.value) add("subject", "constraint", "subject must satisfy explicit user constraint", 0.96, constraints.join(", "));

  return { slots, relations };
}

export function premiseValues(premise: CognitivePremise | undefined, role: CognitivePremiseRole): string[] {
  return unique(premise?.slots.filter(slotValue => slotValue.role === role).flatMap(slotValue => slotValue.values) ?? []);
}

export function premiseHas(premise: CognitivePremise | undefined, role: CognitivePremiseRole, value: string): boolean {
  const target = lower(value);
  return premiseValues(premise, role).some(item => lower(item).includes(target));
}
