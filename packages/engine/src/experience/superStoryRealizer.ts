import type {
  CognitiveExperiencePlan,
  CognitivePremiseRole,
  StoryBeat,
} from "@qre/contracts";

/**
 * CUSTOMER STORY REALIZER
 *
 * Cognition decides what matters. This layer decides what the customer gets
 * to notice next.
 *
 * Important boundary:
 * - no domain templates
 * - no internal vocabulary in customer prose
 * - no invented factual events
 * - internal trajectory operations may be compressed into one observable move
 * - sentence subjects are varied by discourse role rather than mechanically
 *   repeating the central subject
 */

const ROLES: CognitivePremiseRole[] = [
  "subject",
  "participants",
  "event",
  "artifact",
  "outcome",
  "place",
  "social",
  "affordance",
  "temporal",
  "transformation",
  "emotion",
  "medium",
  "constraint",
];

const INTERNAL = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|meaning context|progression model|interaction model|content model|discovery model|trajectory|mechanic|mechanics|latent state|internal state|future evolution|dynamic behavior|situation is static|concrete reason to continue|new memories can change what later visitors discover)\b/i;

const DELIVERY = /\b(?:customer-facing|generated output|delivery pipeline|delivery layer|scan pipeline|qr pipeline|nfc pipeline)\b/i;

const ABSTRACT = /\b(?:situation|experience|interaction|process|journey|moment|meaning|progression|model|state|condition|possibility|potential|context|result|outcome|change|transformation|development|behavior|behaviour|dynamic|reason to continue)\b/i;

const TONE_WORDS = /^(?:fun|funny|playful|humor|humour|comedy|hilarious|joy|cute|silly|wild|whimsical|lighthearted|serious|dramatic|romantic|mysterious|exciting)$/i;

const ACTION_WORD = /^(?:arriv|arrived|enter|entered|walk|walked|go|went|come|came|leave|left|groom|groomed|grooming|clean|cleaned|cleaning|wash|washed|repair|repaired|fix|fixed|restore|restored|build|built|make|made|create|created|cook|cooked|bake|baked|serve|served|prepare|prepared|open|opened|close|closed|visit|visited|travel|traveled|drive|drove|ride|rode|paint|painted|dance|danced|sing|sang|play|played|choose|chose|pick|picked|decide|decided|touch|touched|hold|held|wear|wore|taste|tasted|smell|smelled|look|looked|see|saw|watch|watched|share|shared|give|gave|take|took|bring|brought|receive|received|check|checked|inspect|inspected|test|tested|measure|measured|install|installed|remove|removed|change|changed|turn|turned|finish|finished|complete|completed|celebrate|celebrated|marry|married|photograph|photographed|capture|captured|record|recorded|teach|taught|learn|learned|discover|discovered|find|found|collect|collected|organize|organized|decorate|decorated|style|styled|trim|trimmed|cut|cut|brush|brushed|dry|dried|massage|massaged|relax|relaxed|pamper|pampered|spoil|spoiled|treat|treated|shake|shook|chew|chewed|tear|tore|eat|ate|run|ran|call|called)$/i;

const GENERIC = /^(?:show|make|create|tell|send|share|story|receipt|message|text|fun|funny|playful|client|customer|owner|business|dog|pet|housekeeper|groomer|ready|great|good|nice|home|today|for|about|with|the|a|an|being|getting|looking)$/i;

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const lower = (value: unknown): string => clean(value).toLowerCase();

const sentence = (value: unknown): string => clean(value).replace(/[.!?]+$/, "");

const unique = (values: readonly unknown[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const cap = (value: string): string => {
  const text = sentence(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
};

function safe(value: unknown): boolean {
  const text = clean(value);
  return Boolean(text) && !INTERNAL.test(text) && !DELIVERY.test(text);
}

function stripPromptTail(value: string): string {
  return clean(
    sentence(value)
      .replace(/\s+(?:to|for)\s+(?:send|sending|share|sharing|give|giving|show|showing)\b.*$/i, "")
      .replace(/\s+(?:for|to)\s+(?:the|a|an)?\s*(?:client|customer|owner|user|audience)\b.*$/i, "")
      .replace(/\s+(?:about|regarding)\s+(?:this|the)\s+(?:story|experience|receipt|message)\b.*$/i, ""),
  );
}

function planValues(
  plan: CognitiveExperiencePlan | undefined,
  role: CognitivePremiseRole,
): string[] {
  return unique(
    plan?.premise?.slots
      .filter((slot) => slot.role === role)
      .flatMap((slot) => slot.values)
      .map(sentence)
      .map(stripPromptTail)
      .filter(safe) ?? [],
  );
}

function subjectOf(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const candidates = unique([
    ...planValues(plan, "subject"),
    clean(plan?.centralSubject),
    clean(beat.directive?.subject),
    ...(beat.entities ?? []),
  ])
    .map(stripPromptTail)
    .filter(safe)
    .filter((value) => !ABSTRACT.test(value));

  const proper = candidates
    .flatMap((value) => value.match(/\b[A-Z][A-Za-z0-9'’-]{2,}\b/g) ?? [])
    .filter((value) => !/^(?:The|Then|And|For|This|That|Make|Create)$/i.test(value));

  if (proper[0]) return proper[0];

  const short = candidates.find(
    (value) => value.split(/\s+/).length <= 3 && !GENERIC.test(value),
  );

  return short ? cap(short) : "The subject";
}

function allEvidence(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  return unique([
    ...ROLES.flatMap((role) => planValues(plan, role)),
    ...(beat.entities ?? []).map(sentence),
    beat.directive?.action,
    beat.directive?.stateBefore,
    beat.directive?.stateAfter,
    ...(beat.directive?.relationalFocus ?? []),
  ])
    .map(stripPromptTail)
    .filter(safe);
}

function normalizeCompoundDetails(values: string[]): string[] {
  const result = [...values];
  const has = (word: string) => result.some((value) => lower(value) === word);
  if (has("living") && has("room") && !result.some((value) => /\bliving room\b/i.test(value))) {
    result.push("living room");
  }
  if (has("front") && has("door") && !result.some((value) => /\bfront door\b/i.test(value))) {
    result.push("front door");
  }
  return unique(result);
}

function detailScore(value: string): number {
  const text = lower(value);
  if (!text || GENERIC.test(text) || TONE_WORDS.test(text)) return -100;

  let score = 0;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length >= 2) score += 3;
  if (words.length === 1) score += 1;

  if (/\b(?:bow|bows|mud|coffee|toast|shoe|shoes|hat|rain|bubble|bubbles|rub|rubs|coat|brake|brakes|kitchen|living room|bedroom|truck|car|surfboard|wave|photo|video|guitar|watch|jewelry|cake|door|window)\b/i.test(text)) score += 6;
  if (/\b(?:tiny|giant|ridiculous|missing|wrong|burnt|torn|chewed|muddy|sparkling|brand new|first|last|one|favorite|broken|crooked|lopsided)\b/i.test(text)) score += 4;
  if (ACTION_WORD.test(text)) score -= 2;
  if (/^(?:kitchen|living|room|home|dog|groomer|housekeeper|groomed|cleaned)$/i.test(text)) score -= 2;

  return score;
}

function detailBank(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
  used: ReadonlySet<string> = new Set(),
): string[] {
  return normalizeCompoundDetails(allEvidence(beat, plan))
    .filter((value) => !used.has(lower(value)))
    .filter((value) => !ABSTRACT.test(value))
    .sort((a, b) => detailScore(b) - detailScore(a) || b.length - a.length)
    .slice(0, 8);
}

function firstDetail(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
  used?: ReadonlySet<string>,
): string | undefined {
  return detailBank(beat, plan, used)[0];
}

function explicitPlayful(plan?: CognitiveExperiencePlan, beat?: StoryBeat): boolean {
  const source = lower([
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.creativePossibilities ?? []),
    plan?.purpose ?? "",
    beat?.emotionalTarget ?? "",
  ].join(" "));

  return /\b(?:funny|fun|playful|humor|humour|comedy|hilarious|ridiculous|absurd|delight|laugh|wild|silly|whimsical|cute|cheeky|witty)\b/i.test(source);
}

function actionOf(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const candidates = unique([
    beat.directive?.action,
    ...planValues(plan, "event"),
    ...planValues(plan, "affordance"),
  ])
    .map(stripPromptTail)
    .filter(safe);

  return candidates.find((value) => {
    const text = lower(value);
    if (GENERIC.test(text)) return false;
    if (/\b(?:make|create|preserve|surface|adapt|resolve|advance|increase|carry)\b.*\b(?:meaning|significance|context|evidence|identity|state|condition|result|experience)\b/i.test(text)) return false;
    return ACTION_WORD.test(text) || /\b(?:grooming|cleaning|repair|massage|pampering|travel|driving|painting|cooking)\b/i.test(text);
  });
}

function outcomeOf(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  return unique([
    ...planValues(plan, "outcome"),
    ...planValues(plan, "transformation"),
    beat.directive?.stateAfter,
  ])
    .map(stripPromptTail)
    .filter(safe)
    .filter((value) => !ABSTRACT.test(value))
    .find((value) => !GENERIC.test(value));
}

function transformationValues(plan?: CognitiveExperiencePlan): string[] {
  return planValues(plan, "transformation")
    .filter((value) => !ABSTRACT.test(value))
    .filter((value) => !GENERIC.test(value));
}

function actionClass(beat: StoryBeat, plan?: CognitiveExperiencePlan): "care" | "clean" | "repair" | "journey" | "celebrate" | "create" | "generic" {
  const text = lower([
    ...allEvidence(beat, plan),
    plan?.purpose ?? "",
    ...(plan?.direction ? [plan.direction] : []),
  ].join(" "));

  if (/\b(?:groom|grooming|wash|massage|pamper|pampering|style|trim|brush|dry|treat)\b/.test(text)) return "care";
  if (/\b(?:clean|cleaned|cleaning|kitchen|living room|home)\b/.test(text)) return "clean";
  if (/\b(?:repair|repaired|fix|fixed|brake|restore|restored)\b/.test(text)) return "repair";
  if (/\b(?:travel|travelled|traveled|drive|drove|ride|rode|trip|journey|beach|road)\b/.test(text)) return "journey";
  if (/\b(?:celebrate|celebrated|wedding|birthday|anniversary|party|ceremony)\b/.test(text)) return "celebrate";
  if (/\b(?:build|built|make|made|create|created|design|designed|cook|cooked|bake|baked|paint|painted|craft)\b/.test(text)) return "create";
  return "generic";
}

function playfulOpening(name: string, beat: StoryBeat): string {
  const options = [
    `${name} walked in looking ready to call her lawyer.`,
    `${name} walked in with questions and a very clear point of view.`,
    `${name} arrived looking like this deserved a formal review.`,
    `${name} showed up with opinions.`,
  ];
  return choose(options, `${name}|opening|${beat.id}`);
}

function choose<T>(values: readonly T[], seed: string): T {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return values[(hash >>> 0) % values.length] ?? values[0]!;
}

function realize(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  if (!plan?.premise) return undefined;

  const name = subjectOf(beat, plan);
  const playful = explicitPlayful(plan, beat);
  const details = detailBank(beat, plan);
  const detail = details[0];
  const second = details[1];
  const action = actionOf(beat, plan);
  const outcome = outcomeOf(beat, plan);
  const transformation = transformationValues(plan);
  const kind = actionClass(beat, plan);

  switch (beat.kind) {
    case "orientation":
      if (playful) return playfulOpening(name, beat);
      return detail ? `${name} arrived with ${article(detail)} already in play.` : `${name} arrived, and things got underway.`;

    case "hook":
      return detail ? `Then came ${article(detail)}.` : `Then something worth noticing entered the picture.`;

    case "origin":
      return action ? `${cap(action)}.` : detail ? `It started with ${article(detail)}.` : `That was where it began.`;

    case "threshold":
      return detail ? `Then came ${article(detail)}.` : `Then the real work began.`;

    case "need":
      return detail ? `The job was clear: ${article(detail)}.` : outcome ? `The goal was simple: ${sentence(outcome).toLowerCase()}.` : `There was work to do.`;

    case "encounter":
      if (detail) {
        if (playful && /\b(?:bubble|bubbles|rub|rubs|spa|pamper|pampering)\b/i.test(detail)) return `${cap(detail)} helped.`;
        return `Then came ${article(detail)}.`;
      }
      return action ? `The next move was ${action}.` : `The day moved on.`;

    case "action":
      if (action) return `${cap(action)}.`;
      if (detail) return `${cap(article(detail))} got its turn.`;
      return `The work got underway.`;

    case "contribution":
      if (detail) return `${cap(article(detail))} became part of the moment.`;
      return `Another piece fell into place.`;

    case "challenge":
      if (detail) return `${cap(article(detail))} had to be dealt with.`;
      return action ? `That called for ${action}.` : `That was the part that needed handling.`;

    case "feedback":
      if (playful) {
        return choose([
          `${name} shook it off and gave everyone a very serious look.`,
          `The reaction was immediate, dramatic, and entirely justified.`,
          `${name} had clearly reached an opinion.`,
        ], `${name}|feedback|${beat.id}`);
      }
      return detail ? `${cap(article(detail))} showed the difference.` : `The difference started to show.`;

    case "discovery":
      return detail ? `And then ${article(detail)} turned up.` : `That was when a new detail appeared.`;

    case "reveal":
      if (playful && detail && /\b(?:bow|bows)\b/i.test(detail)) return `The bows were apparently a separate negotiation.`;
      return detail ? `There it was: ${sentence(detail).toLowerCase()}.` : `The difference was finally visible.`;

    case "escalation":
      if (playful && kind === "care" && detail && second) {
        return choose([
          `${cap(article(detail))} helped. ${cap(article(second))} helped more.`,
          `The pampering was clearly getting serious. ${cap(article(detail))} was only part of it.`,
          `${cap(article(detail))} helped. Then ${article(second)} entered the negotiations.`,
        ], `${name}|care|${detail}|${second}|${beat.id}`);
      }
      if (detail) return playful ? `${cap(article(detail))} was apparently a separate negotiation.` : `${cap(article(detail))} moved things forward.`;
      return `Then things went a little further.`;

    case "transformation":
      if (transformation.length >= 2) {
        return `${name} went from ${sentence(transformation[0]).toLowerCase()} to ${sentence(transformation[1]).toLowerCase()}.`;
      }
      if (outcome) return `By the end, ${sentence(outcome).toLowerCase()}.`;
      if (playful && kind === "care") return `By the end, ${name} looked fantastic and felt fierce.`;
      return `By the end, the difference was easy to see.`;

    case "reflection":
      return detail ? `Looking back, ${article(detail)} was the turning point.` : `Looking back, the change was easy to see.`;

    case "milestone":
      return outcome ? `That marked the moment: ${sentence(outcome).toLowerCase()}.` : detail ? `${cap(article(detail))} marked the change.` : `That marked the change.`;

    case "identity":
      return detail ? `After that, ${name} had a new look to carry.` : `${name} had become something different.`;

    case "payoff":
      if (playful && kind === "care") return `${name} left the building feeling fierce and ready to paint the town red.`;
      if (playful && outcome) return choose([
        `By the time it was over, ${sentence(outcome).toLowerCase()}.`,
        `And there it was: ${sentence(outcome).toLowerCase()}.`,
      ], `${name}|payoff|${outcome}|${beat.id}`);
      if (outcome) return `By the time it was over, ${sentence(outcome).toLowerCase()}.`;
      if (detail) return `By the time it was over, ${sentence(detail).toLowerCase()}.`;
      return `By the time it was over, the result spoke for itself.`;

    case "next_step":
      return detail ? `From there, ${article(detail)} was next.` : `From there, the next move was clear.`;

    case "continuation":
      return `And that left the door open for whatever came next.`;

    case "instruction":
      return action ? `The next move was ${action}.` : detail ? `The next move involved ${article(detail)}.` : `The next move was clear.`;

    case "unlock":
    case "earned_access":
      return outcome ? `That opened the way to ${sentence(outcome).toLowerCase()}.` : detail ? `That opened the next door: ${sentence(detail).toLowerCase()}.` : `That opened the next door.`;

    case "provenance":
      return detail ? `That history stays with ${article(detail)}.` : `That history stays with it.`;

    default:
      return detail ? `${cap(article(detail))} became the next thing to notice.` : `The moment moved on.`;
  }
}

function article(value: string): string {
  const text = sentence(value).toLowerCase();
  if (/^(?:the|a|an)\b/.test(text)) return text;
  if (/^[aeiou]/i.test(text)) return `an ${text}`;
  return `the ${text}`;
}

export function realizeSuperStoryBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  const text = realize(beat, plan);
  if (!text) return undefined;

  const finalText = `${sentence(text)}.`;
  if (INTERNAL.test(finalText) || DELIVERY.test(finalText)) return undefined;
  return finalText;
}
