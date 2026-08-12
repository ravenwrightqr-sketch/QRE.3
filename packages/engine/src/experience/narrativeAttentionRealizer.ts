import type { CognitiveExperiencePlan, CognitivePremiseRole, StoryBeat } from "@qre/contracts";

/**
 * Universal narrative-attention layer.
 *
 * The cognitive system decides WHAT should happen. This layer decides WHAT
 * the customer notices, in what order, and with what sentence shape.
 *
 * It is intentionally domain-neutral. No dog-groomer, housekeeper, wedding,
 * or other industry template lives here.
 */

const ROLES: CognitivePremiseRole[] = [
  "subject", "participants", "event", "artifact", "outcome", "place",
  "social", "affordance", "temporal", "transformation", "emotion", "medium", "constraint",
];

const INTERNAL = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|meaning context|progression model|interaction model|content model|discovery model|trajectory|mechanic|mechanics|latent state|internal state|future evolution|dynamic behavior|situation is static|concrete reason to continue|new memories can change what later visitors discover)\b/i;
const DELIVERY = /\b(?:customer-facing|generated output|delivery pipeline|delivery layer|scan pipeline|qr pipeline|nfc pipeline)\b/i;
const ABSTRACT = /\b(?:situation|experience|interaction|process|journey|moment|meaning|progression|model|state|condition|possibility|potential|context|result|outcome|change|transformation|development|behavior|behaviour|dynamic|reason to continue)\b/i;
const TONE = /\b(?:funny|fun|playful|humor|humour|comedy|hilarious|ridiculous|absurd|delight|laugh|wild|silly|whimsical|cute|cheeky|witty)\b/i;
const ACTION = /^(?:arriv|arrived|enter|entered|walk|walked|go|went|come|came|leave|left|groom|groomed|grooming|clean|cleaned|cleaning|wash|washed|repair|repaired|fix|fixed|restore|restored|build|built|make|made|create|created|cook|cooked|bake|baked|serve|served|prepare|prepared|open|opened|close|closed|visit|visited|travel|traveled|drive|drove|ride|rode|paint|painted|dance|danced|sing|sang|play|played|choose|chose|pick|picked|decide|decided|touch|touched|hold|held|wear|wore|taste|tasted|smell|smelled|look|looked|see|saw|watch|watched|share|shared|give|gave|take|took|bring|brought|receive|received|check|checked|inspect|inspected|test|tested|measure|measured|install|installed|remove|removed|change|changed|turn|turned|finish|finished|complete|completed|celebrate|celebrated|marry|married|photograph|photographed|capture|captured|record|recorded|teach|taught|learn|learned|discover|discovered|find|found|collect|collected|organize|organized|decorate|decorated|style|styled|trim|trimmed|cut|brushed|dry|dried|massage|massaged|relax|relaxed|pamper|pampered|spoil|spoiled|treat|treated|shake|shook|chew|chewed|tear|tore|eat|ate|run|ran|call|called)$/i;
const GENERIC = /^(?:show|make|create|tell|send|share|story|receipt|message|text|fun|funny|playful|client|customer|owner|business|dog|pet|housekeeper|groomer|ready|great|good|nice|home|today|for|about|with|the|a|an|being|getting|looking)$/i;

const clean = (v: unknown): string => typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
const lower = (v: unknown): string => clean(v).toLowerCase();
const sentence = (v: unknown): string => clean(v).replace(/[.!?]+$/, "");
const unique = (v: readonly unknown[]): string[] => [...new Set(v.map(clean).filter(Boolean))];
const cap = (v: string): string => { const s = sentence(v); return s ? s[0]!.toUpperCase() + s.slice(1) : ""; };

function stripTail(value: string): string {
  return clean(sentence(value)
    .replace(/\s+(?:to|for)\s+(?:send|sending|share|sharing|give|giving|show|showing)\b.*$/i, "")
    .replace(/\s+(?:for|to)\s+(?:the|a|an)?\s*(?:client|customer|owner|user|audience)\b.*$/i, ""));
}

function safe(value: unknown): boolean {
  const s = clean(value);
  return Boolean(s) && !INTERNAL.test(s) && !DELIVERY.test(s);
}

function values(plan: CognitiveExperiencePlan | undefined, role: CognitivePremiseRole): string[] {
  return unique(plan?.premise?.slots.filter((slot) => slot.role === role).flatMap((slot) => slot.values) ?? [])
    .map(stripTail).filter(safe);
}

function subjectOf(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const candidates = unique([
    ...values(plan, "subject"),
    clean(plan?.centralSubject),
    clean(beat.directive?.subject),
    ...(beat.entities ?? []),
  ]).map(stripTail).filter(safe).filter((v) => !ABSTRACT.test(v));

  const proper = candidates.flatMap((v) => v.match(/\b[A-Z][A-Za-z0-9'’-]{2,}\b/g) ?? [])
    .filter((v) => !/^(?:The|Then|And|For|This|That|Make|Create)$/i.test(v));
  if (proper[0]) return proper[0]!;

  return cap(candidates.find((v) => v.split(/\s+/).length <= 3 && !GENERIC.test(v)) ?? "the subject");
}

function evidence(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const raw = unique([
    ...ROLES.flatMap((role) => values(plan, role)),
    ...(beat.entities ?? []),
    beat.directive?.action,
    beat.directive?.stateBefore,
    beat.directive?.stateAfter,
    ...(beat.directive?.relationalFocus ?? []),
  ]).map(stripTail).filter(safe);

  const result = [...raw];
  const has = (x: string) => result.some((v) => lower(v) === x);
  if (has("living") && has("room")) result.push("living room");
  if (has("front") && has("door")) result.push("front door");
  return unique(result);
}

function scoreDetail(value: string): number {
  const text = lower(value);
  if (!text || GENERIC.test(text)) return -100;
  let score = text.split(/\s+/).length > 1 ? 3 : 1;
  if (/\b(?:bow|bows|mud|coffee|toast|shoe|shoes|hat|rain|bubble|bubbles|rub|rubs|coat|brake|brakes|kitchen|living room|bedroom|truck|car|surfboard|wave|photo|video|guitar|watch|jewelry|cake|door|window)\b/i.test(text)) score += 6;
  if (/\b(?:tiny|giant|ridiculous|missing|wrong|burnt|torn|chewed|muddy|sparkling|brand new|first|last|one|favorite|broken|crooked|lopsided)\b/i.test(text)) score += 4;
  if (ACTION.test(text)) score -= 2;
  if (/^(?:kitchen|living|room|home|dog|groomer|housekeeper|groomed|cleaned)$/i.test(text)) score -= 2;
  return score;
}

function details(beat: StoryBeat, plan?: CognitiveExperiencePlan, used = new Set<string>()): string[] {
  return evidence(beat, plan)
    .filter((v) => !used.has(lower(v)) && !ABSTRACT.test(v))
    .sort((a, b) => scoreDetail(b) - scoreDetail(a) || b.length - a.length)
    .slice(0, 8);
}

function playful(plan?: CognitiveExperiencePlan, beat?: StoryBeat): boolean {
  const source = lower([
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.creativePossibilities ?? []),
    plan?.purpose ?? "",
    beat?.emotionalTarget ?? "",
    ...ROLES.flatMap((role) => values(plan, role)),
  ].join(" "));
  return TONE.test(source);
}

function actionOf(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const candidates = unique([
    beat.directive?.action,
    ...values(plan, "event"),
    ...values(plan, "affordance"),
  ]).map(stripTail).filter(safe);
  return candidates.find((v) => {
    const text = lower(v);
    if (GENERIC.test(text)) return false;
    if (/\b(?:make|create|preserve|surface|adapt|resolve|advance|increase|carry)\b.*\b(?:meaning|significance|context|evidence|identity|state|condition|result|experience)\b/i.test(text)) return false;
    return ACTION.test(text) || /\b(?:grooming|cleaning|repair|massage|pampering|travel|driving|painting|cooking)\b/i.test(text);
  });
}

function outcomeOf(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  return unique([...values(plan, "outcome"), ...values(plan, "transformation"), beat.directive?.stateAfter])
    .map(stripTail).filter(safe).filter((v) => !ABSTRACT.test(v) && !GENERIC.test(v))[0];
}

function actionClass(beat: StoryBeat, plan?: CognitiveExperiencePlan): "care" | "clean" | "repair" | "generic" {
  const text = lower([...evidence(beat, plan), plan?.purpose ?? "", plan?.direction ?? ""].join(" "));
  if (/\b(?:groom|grooming|wash|massage|pamper|pampering|style|trim|brush|dry|treat)\b/.test(text)) return "care";
  if (/\b(?:clean|cleaned|cleaning|kitchen|living room|home)\b/.test(text)) return "clean";
  if (/\b(?:repair|repaired|fix|fixed|brake|restore|restored)\b/.test(text)) return "repair";
  return "generic";
}

function article(value: string): string {
  const text = sentence(value).toLowerCase();
  if (/^(?:the|a|an)\b/.test(text)) return text;
  return /^[aeiou]/i.test(text) ? `an ${text}` : `the ${text}`;
}

function choose<T>(valuesList: readonly T[], seed: string): T {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) { hash ^= seed.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return valuesList[(hash >>> 0) % valuesList.length] ?? valuesList[0]!;
}

function actionSentence(action: string): string {
  const text = lower(action);
  if (/\b(?:groomed|grooming|groom)\b/.test(text)) return "The grooming got underway.";
  if (/\b(?:cleaned|cleaning|clean)\b/.test(text)) return "The cleaning got underway.";
  if (/\b(?:repaired|repair|fixed|fix)\b/.test(text)) return "The repair work got underway.";
  if (/\b(?:washed|wash)\b/.test(text)) return "The washing got underway.";
  return `${cap(action)}.`;
}

function realize(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  if (!plan?.premise) return undefined;

  const name = subjectOf(beat, plan);
  const isPlayful = playful(plan, beat);
  const detailList = details(beat, plan);
  const detail = detailList[0];
  const second = detailList[1];
  const action = actionOf(beat, plan);
  const outcome = outcomeOf(beat, plan);
  const transforms = values(plan, "transformation").filter((v) => !ABSTRACT.test(v) && !GENERIC.test(v));
  const kind = actionClass(beat, plan);

  switch (beat.kind) {
    case "orientation":
      return isPlayful
        ? choose([
            `${name} walked in looking ready to call her lawyer.`,
            `${name} walked in with questions and a very clear point of view.`,
            `${name} arrived looking like this deserved a formal review.`,
          ], `${name}|orientation|${beat.id}`)
        : detail ? `${name} arrived with ${article(detail)} already in play.` : `${name} arrived, and things got underway.`;

    case "hook": return detail ? `Then came ${article(detail)}.` : `Then something worth noticing entered the picture.`;
    case "threshold": return detail ? `Then came ${article(detail)}.` : `Then the real work began.`;
    case "origin": return action ? actionSentence(action) : detail ? `It started with ${article(detail)}.` : `That was where it began.`;
    case "need": return detail ? `The job was clear: ${article(detail)}.` : outcome ? `The goal was simple: ${sentence(outcome).toLowerCase()}.` : `There was work to do.`;

    case "action":
      return action ? actionSentence(action) : detail ? `${cap(article(detail))} got its turn.` : `The work got underway.`;

    case "encounter":
      if (detail && isPlayful && /\b(?:bubble|bubbles|rub|rubs|spa|pamper|pampering)\b/i.test(detail)) return `${cap(detail)} helped.`;
      return detail ? `Then came ${article(detail)}.` : action ? actionSentence(action) : `The day moved on.`;

    case "challenge": return detail ? `${cap(article(detail))} had to be dealt with.` : action ? `That called for ${action}.` : `That was the part that needed handling.`;

    case "contribution": return detail ? `${cap(article(detail))} became part of the moment.` : `Another piece fell into place.`;

    case "feedback":
      if (isPlayful) return choose([
        `${name} shook it off and gave everyone a very serious look.`,
        `The reaction was immediate, dramatic, and entirely justified.`,
        `${name} had clearly reached an opinion.`,
      ], `${name}|feedback|${beat.id}`);
      return detail ? `${cap(article(detail))} showed the difference.` : `The difference started to show.`;

    case "discovery": return detail ? `And then ${article(detail)} turned up.` : `That was when a new detail appeared.`;
    case "reveal":
      if (isPlayful && detail && /\b(?:bow|bows)\b/i.test(detail)) return `The bows were apparently a separate negotiation.`;
      return detail ? `There it was: ${sentence(detail).toLowerCase()}.` : `The difference was finally visible.`;

    case "escalation":
      if (isPlayful && kind === "care" && detail && second) {
        return choose([
          `${cap(article(detail))} helped. ${cap(article(second))} helped more.`,
          `${cap(article(detail))} helped. Then ${article(second)} entered the negotiations.`,
          `The pampering was clearly getting serious. ${cap(article(detail))} was only part of it.`,
        ], `${name}|escalation|${beat.id}`);
      }
      return detail ? (isPlayful ? `${cap(article(detail))} was apparently a separate negotiation.` : `${cap(article(detail))} moved things forward.`) : `Then things went a little further.`;

    case "transformation":
      if (transforms.length >= 2) return `${name} went from ${sentence(transforms[0]).toLowerCase()} to ${sentence(transforms[1]).toLowerCase()}.`;
      if (outcome) return `By the end, ${sentence(outcome).toLowerCase()}.`;
      if (isPlayful && kind === "care") return `By the end, ${name} looked fantastic and felt fierce.`;
      return `By the end, the difference was easy to see.`;

    case "reflection": return detail ? `Looking back, ${article(detail)} was the turning point.` : `Looking back, the change was easy to see.`;
    case "milestone": return outcome ? `That marked the moment: ${sentence(outcome).toLowerCase()}.` : detail ? `${cap(article(detail))} marked the change.` : `That marked the change.`;
    case "identity": return detail ? `After that, ${name} had a new look to carry.` : `${name} had become something different.`;

    case "payoff":
      if (isPlayful && kind === "care") return `${name} left the building feeling fierce and ready to paint the town red.`;
      if (outcome) return `By the time it was over, ${sentence(outcome).toLowerCase()}.`;
      if (detail) return `By the time it was over, ${sentence(detail).toLowerCase()}.`;
      return `By the time it was over, the result spoke for itself.`;

    case "next_step": return detail ? `From there, ${article(detail)} was next.` : `From there, the next move was clear.`;
    case "continuation": return `And that left the door open for whatever came next.`;
    case "instruction": return action ? `The next move was ${action}.` : detail ? `The next move involved ${article(detail)}.` : `The next move was clear.`;
    case "unlock":
    case "earned_access": return outcome ? `That opened the way to ${sentence(outcome).toLowerCase()}.` : detail ? `That opened the next door: ${sentence(detail).toLowerCase()}.` : `That opened the next door.`;
    case "provenance": return detail ? `That history stays with ${article(detail)}.` : `That history stays with it.`;
    default: return detail ? `${cap(article(detail))} became the next thing to notice.` : `The moment moved on.`;
  }
}

export function realizeNarrativeBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const text = realize(beat, plan);
  if (!text) return undefined;
  const result = `${sentence(text)}.`;
  return INTERNAL.test(result) || DELIVERY.test(result) ? undefined : result;
}

export function realizeNarrativeBeats(beats: StoryBeat[], plan?: CognitiveExperiencePlan): StoryBeat[] {
  const used = new Set<string>();
  let directSubjectStarts = 0;

  return beats.map((beat) => {
    let text = realizeNarrativeBeat(beat, plan) ?? "";
    const name = subjectOf(beat, plan);
    const direct = new RegExp(`^${name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, "i").test(text);
    if (direct) directSubjectStarts += 1;

    // Narrative attention penalty: once the subject has opened two consecutive
    // sentences, prefer the event/detail as the grammatical topic.
    if (directSubjectStarts > 2 && detailListFor(beat, plan, used)[0]) {
      const d = detailListFor(beat, plan, used)[0]!;
      text = beat.kind === "discovery" ? `And then ${article(d)} turned up.` : `Then came ${article(d)}.`;
    }

    const d = detailListFor(beat, plan, used)[0];
    if (d) used.add(lower(d));
    return { ...beat, text };
  });
}

function detailListFor(beat: StoryBeat, plan: CognitiveExperiencePlan | undefined, used: ReadonlySet<string>): string[] {
  return details(beat, plan, new Set(used));
}

export function isGenericCompilerProse(value: string): boolean {
  return INTERNAL.test(value) || DELIVERY.test(value);
}

export function classifyNarrativeBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): Record<string, boolean> {
  return {
    evidence: evidence(beat, plan).length > 0,
    transformation: values(plan, "transformation").length > 0,
    outcome: values(plan, "outcome").length > 0,
    temporal: values(plan, "temporal").length > 0,
    social: values(plan, "social").length > 0 || values(plan, "participants").length > 0,
    constraint: values(plan, "constraint").length > 0,
    relationship: Boolean(plan?.premise?.relations.some((r) => r.confidence >= 0.72)),
  };
}
