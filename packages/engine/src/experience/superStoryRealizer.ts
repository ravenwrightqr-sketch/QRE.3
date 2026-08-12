import type {
  CognitiveExperiencePlan,
  CognitivePremiseRole,
  StoryBeat,
} from "@qre/contracts";

/**
 * CUSTOMER STORY REALIZER
 *
 * This layer writes the scene that the trajectory selected.
 *
 * It does NOT invent a subject, event, result, or delivery mechanism.
 * Creative language is allowed only as a lens over concrete evidence.
 */

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const sentence = (value: unknown): string =>
  clean(value).replace(/[.!?]+$/, "");

const lower = (value: unknown): string => clean(value).toLowerCase();

const unique = (values: readonly unknown[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const cap = (value: string): string => {
  const text = sentence(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
};

const META = /\b(?:compiler|cognition|cognitive|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|meaning context|progression model|interaction model|content model|discovery model|trajectory|mechanic|mechanics|latent state|internal state|future evolution|dynamic behavior)\b/i;

const META_PHRASE = /\b(?:new memories can change what later visitors discover|the situation has not been entered|the subject and situation are established|the subject has a concrete reason to continue|the result remains available for what comes next|the current state remains available|the next step follows from what just happened)\b/i;

const DELIVERY = /\b(?:receipt|customer-facing|internal output|generated output|delivery pipeline|delivery layer|send pipeline|scan pipeline|qr pipeline|nfc pipeline)\b/i;

const PLAYFUL = /\b(?:play|playful|funny|fun|humor|humour|absurd|ridiculous|wild|delight|mischief|comedy|hilarious|joy|celebrat|whimsical|cute|silly|lighthearted|crazy|cheeky|witty|comic)\b/i;

const SERIOUS = /\b(?:memorial|funeral|death|died|grief|grieving|emergency|medical|injury|trauma|crisis|solemn|reverent|mourning|urgent|lawsuit|legal|hospital|diagnosis|bereavement|accident|loss)\b/i;

const ACTION = /\b(?:arriv|enter|walk|go|went|come|came|leave|left|return|groom|clean|wash|repair|fix|restore|build|make|create|design|write|cook|bake|serve|prepare|open|close|visit|travel|drive|ride|paint|dance|sing|play|choose|pick|select|decide|touch|hold|wear|taste|smell|look|see|watch|share|give|take|bring|receive|check|inspect|test|measure|install|remove|change|turn|transform|upgrade|finish|complete|celebrat|marry|photograph|capture|record|teach|learn|discover|find|collect|organize|organise|decorate|style|trim|cut|brush|dry|massage|relax|pamper|spoil|treat|ready|groomed|cleaned|repaired|polished|painted|shake|shook|chew|chewed|run|ran|call|called)\w*\b/i;

const ABSTRACT = /\b(?:situation|experience|interaction|process|journey|moment|meaning|progression|model|state|condition|possibility|potential|future|memory|memories|history|context|result|outcome|change|transformation|development|behavior|behaviour|dynamic|reason to continue)\b/i;

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
];

function premiseValues(
  plan: CognitiveExperiencePlan | undefined,
  role: CognitivePremiseRole,
): string[] {
  return unique(
    plan?.premise?.slots
      .filter((slot) => slot.role === role)
      .flatMap((slot) => slot.values) ?? [],
  );
}

function stripDeliveryTail(value: string): string {
  return clean(
    value
      .replace(/\b(?:to|for)\s+(?:send|sending|share|deliver|give)\b.*$/i, "")
      .replace(/\b(?:to|for)\s+(?:the|a|an)?\s*(?:client|customer|user|audience|business)\b.*$/i, "")
      .replace(/\b(?:story|receipt|message|text)\s+(?:about|for)\b.*$/i, ""),
  );
}

function usable(value: unknown): boolean {
  const text = stripDeliveryTail(clean(value));
  return Boolean(
    text.length >= 3 &&
    !META.test(text) &&
    !META_PHRASE.test(text) &&
    !DELIVERY.test(text),
  );
}

function evidence(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string[] {
  return unique([
    ...(beat.entities ?? []),
    ...ROLES.flatMap((role) => premiseValues(plan, role)),
    beat.directive?.subject,
    beat.directive?.action,
    beat.directive?.stateBefore,
    beat.directive?.stateAfter,
    ...(beat.directive?.relationalFocus ?? []),
  ])
    .map(stripDeliveryTail)
    .filter(usable);
}

function signal(plan?: CognitiveExperiencePlan): string {
  return lower([
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.purpose ? [plan.purpose] : []),
    ...(plan?.storyStructure ?? []),
    ...(plan?.creativePossibilities ?? []),
    ...(plan?.dynamicBehavior ?? []),
    ...(plan?.interactionModel ?? []),
    ...(plan?.progressionModel ?? []),
    ...(plan?.contentModel ?? []),
    ...(plan?.discoveryModel ?? []),
    ...(plan?.futureEvolution ?? []),
    ...(plan?.realization?.semanticArc ?? []),
    ...(plan?.realization?.directives.flatMap((item) => [
      item.action,
      item.intent,
      item.stateBefore,
      item.stateAfter,
    ]) ?? []),
    ...premiseValues(plan, "emotion"),
    ...(plan?.premise?.slots.flatMap((slot) => slot.values) ?? []),
  ].join(" "));
}

function playful(plan?: CognitiveExperiencePlan): boolean {
  const text = signal(plan);
  return !SERIOUS.test(text) && PLAYFUL.test(text);
}

function subject(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const candidates = unique([
    ...premiseValues(plan, "subject"),
    clean(plan?.centralSubject),
    ...(beat.entities ?? []),
    ...premiseValues(plan, "participants"),
    beat.directive?.subject,
  ])
    .map(stripDeliveryTail)
    .filter(usable);

  // If centralSubject was accidentally polluted with the prompt, recover the
  // proper name instead of letting the pollution become the protagonist.
  const proper = candidates
    .flatMap((value) => value.match(/\b[A-Z][A-Za-z0-9'’-]{2,}\b/g) ?? [])
    .filter((value) => !/^(?:The|Then|And|For|This|That)$/i.test(value));

  if (proper[0]) return proper[0];

  return candidates
    .filter((value) => !ACTION.test(value) && !ABSTRACT.test(value))
    .sort((a, b) => a.length - b.length)[0] ?? "the subject";
}

function animate(plan?: CognitiveExperiencePlan): boolean {
  return [
    ...premiseValues(plan, "subject"),
    ...premiseValues(plan, "participants"),
    ...premiseValues(plan, "social"),
  ].some((value) =>
    /\b(?:person|people|man|woman|child|kid|family|dog|cat|pet|couple|bride|groom|friend|guest|owner|team|crowd|everyone|someone|they|he|she)\b/i.test(value),
  );
}

function pronoun(plan?: CognitiveExperiencePlan): string {
  return animate(plan) ? "they" : "it";
}

function actionValues(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string[] {
  return unique([
    ...premiseValues(plan, "event"),
    beat.directive?.action,
    ...(beat.entities ?? []),
  ])
    .map(stripDeliveryTail)
    .filter(usable)
    .filter((value) => ACTION.test(value));
}

function actionWords(value: string): string[] {
  return lower(value)
    .split(/[^a-z0-9'’-]+/)
    .filter(Boolean)
    .filter((word) => ACTION.test(word));
}

function detailParts(value: string): string[] {
  const text = stripDeliveryTail(value);
  if (!text || !usable(text)) return [];

  const parts = text
    .split(/\s+(?:and|then|after|while)\s+|[,;|]/i)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length > 1 ? parts : [text];
}

function detailBank(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string[] {
  const values = evidence(beat, plan);
  const details = values.flatMap(detailParts);

  const filtered = details.filter((value) => {
    const text = lower(value);
    if (!text || ABSTRACT.test(text) || META.test(text)) return false;
    if (/^(?:funny|fun|playful|story|receipt|client|customer|business|show|make|create|being|getting|looking|ready)$/i.test(text)) return false;
    return true;
  });

  // Prefer multi-word concrete details, then useful single nouns.
  return unique(filtered).sort((a, b) => {
    const aWords = a.split(/\s+/).length;
    const bWords = b.split(/\s+/).length;
    return bWords - aWords || b.length - a.length;
  });
}

function outcome(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  return unique([
    ...premiseValues(plan, "outcome"),
    ...premiseValues(plan, "transformation"),
    beat.directive?.stateAfter,
  ])
    .map(stripDeliveryTail)
    .filter(usable)
    .filter((value) => !ABSTRACT.test(value))
    .find(Boolean);
}

function states(
  plan?: CognitiveExperiencePlan,
): { before?: string; after?: string } {
  const transformation = premiseValues(plan, "transformation")
    .map(stripDeliveryTail)
    .filter(usable)
    .filter((value) => !ABSTRACT.test(value));

  const directive = plan?.realization?.directives.find(
    (item) => usable(item.stateBefore) || usable(item.stateAfter),
  );

  return {
    before: transformation[0] ?? (usable(directive?.stateBefore) ? clean(directive?.stateBefore) : undefined),
    after: transformation[1] ?? (usable(directive?.stateAfter) ? clean(directive?.stateAfter) : undefined),
  };
}

type ActionClass = "care" | "clean" | "repair" | "journey" | "celebrate" | "create" | "generic";

function actionClass(beat: StoryBeat, plan?: CognitiveExperiencePlan): ActionClass {
  const text = lower([
    ...actionValues(beat, plan),
    ...detailBank(beat, plan),
    signal(plan),
  ].join(" "));

  if (/\b(?:groom|wash|massage|pamper|style|trim|brush|dry|treat)\b/.test(text)) return "care";
  if (/\b(?:clean|kitchen|living room|home)\b/.test(text)) return "clean";
  if (/\b(?:repair|fix|brake|car|test|restore)\b/.test(text)) return "repair";
  if (/\b(?:travel|drive|ride|trip|road|turn|sunset|beach)\b/.test(text)) return "journey";
  if (/\b(?:celebrate|marry|wedding|party|birthday|dance|ceremony|reception)\b/.test(text)) return "celebrate";
  if (/\b(?:build|make|create|design|write|cook|bake|paint|craft)\b/.test(text)) return "create";
  return "generic";
}

function choose<T>(values: readonly T[], seed: string): T {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return values[(hash >>> 0) % values.length] ?? values[0]!;
}

function firstUseful(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  return detailBank(beat, plan)[0];
}

function secondUseful(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  return detailBank(beat, plan)[1] ?? detailBank(beat, plan)[0];
}

function opening(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const name = subject(beat, plan);

  if (playful(plan)) {
    return choose([
      `${name} walked in looking ready to call a lawyer.`,
      `${name} walked in with questions and a very clear point of view.`,
      `${name} arrived looking like this deserved a formal review.`,
      `${name} showed up with opinions.`,
    ], `${name}|opening|${beat.id}`);
  }

  const detail = firstUseful(beat, plan);
  return detail
    ? `${name} arrived, and ${article(detail)} set things in motion.`
    : `${name} arrived, and things got underway.`;
}

function article(value: string): string {
  const text = sentence(value).toLowerCase();
  if (/^(?:the|a|an)\b/.test(text)) return text;
  return `the ${text}`;
}

function hook(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const detail = firstUseful(beat, plan);
  if (!detail) return "Then the work got underway.";

  if (playful(plan)) {
    return choose([
      `${cap(article(detail))} entered the picture.`,
      `Then came ${article(detail)}.`,
      `At first, it seemed to be about ${article(detail)}.`,
      `${cap(article(detail))} looked innocent enough.`
    ], `${beat.id}|hook|${detail}`);
  }

  return `The work began with ${article(detail)}.`;
}

function actionBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const actions = actionValues(beat, plan);
  const action = actions.find((value) => !/^(?:show|make|create|send|share|message|text)$/i.test(value));
  const detail = firstUseful(beat, plan);

  if (action) return `${cap(sentence(action))}.`;
  if (detail) return `${cap(article(detail))} got its turn.`;
  return "The work moved forward.";
}

function escalation(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const details = detailBank(beat, plan);
  const detail = details[0];
  const second = details[1];

  if (!playful(plan)) {
    return detail ? `${cap(article(detail))} moved the work toward the finish.` : "The work moved toward the finish.";
  }

  const kind = actionClass(beat, plan);

  if (kind === "care" && detail && second) {
    return choose([
      `${cap(article(detail))} helped. ${cap(article(second))} helped more.`,
      `The extras started arriving. ${cap(article(detail))} was only the beginning.`,
      `${cap(article(detail))} helped. Then ${article(second)} entered the negotiations.`
    ], `${beat.id}|care|${detail}|${second}`);
  }

  if (detail) {
    return choose([
      `${cap(article(detail))} was apparently a separate negotiation.`,
      `Then ${article(detail)} became the main event.`,
      `${cap(article(detail))} suddenly seemed like a matter of principle.`,
      `Nobody said there was a problem. ${cap(article(detail))} apparently disagreed.`
    ], `${beat.id}|escalation|${detail}`);
  }

  return "Then one small detail got much more interesting than expected.";
}

function feedback(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const detail = firstUseful(beat, plan);
  const name = subject(beat, plan);

  if (playful(plan)) {
    return choose([
      `${name} shook it off and gave everyone a very serious look.`,
      `The reaction was immediate, dramatic, and entirely justified.`,
      `${name} had clearly reached an opinion.`
    ], `${beat.id}|feedback|${detail ?? "none"}|${name}`);
  }

  return detail ? `${cap(article(detail))} showed the difference.` : "The difference started to show.";
}

function transformation(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const name = subject(beat, plan);
  const state = states(plan);

  if (state.before && state.after) {
    return `${name} went from ${sentence(state.before).toLowerCase()} to ${sentence(state.after).toLowerCase()}.`;
  }

  const result = outcome(beat, plan);
  if (result) {
    return `${name} came out of it ${sentence(result).toLowerCase()}.`;
  }

  if (playful(plan)) {
    return choose([
      `By the end, ${name} looked like the whole thing had been worth it.`,
      `Somewhere along the way, ordinary turned into memorable.`,
      `Whatever walked in was not quite what walked out.`
    ], `${name}|transformation|${beat.id}`);
  }

  return `By the end, ${name} was visibly different from where this started.`;
}

function payoff(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const name = subject(beat, plan);
  const result = outcome(beat, plan);
  const kind = actionClass(beat, plan);

  if (playful(plan)) {
    if (kind === "care") {
      return choose([
        `${name} walked out looking fantastic.`,
        `${name} walked out looking ready to paint the town red.`,
        `Out the door went a completely different attitude.`
      ], `${name}|care|payoff|${beat.id}`);
    }

    if (result) {
      return choose([
        `And there it was: ${sentence(result).toLowerCase()}.`,
        `By the time it was over, ${sentence(result).toLowerCase()}.`,
        `The result was in, and it looked good.`
      ], `${name}|payoff|${result}`);
    }

    return `By the time it was over, the ordinary part had become the part worth remembering.`;
  }

  return result
    ? `The result was clear: ${sentence(result)}.`
    : `The result was clear, and ${name} carried it forward.`;
}

function continuation(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  if (playful(plan)) {
    return "And somehow, that felt like the beginning of another story.";
  }
  return "The result remained available for what came next.";
}

export function realizeSuperStoryBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  if (!plan?.premise) return undefined;

  const facts = evidence(beat, plan);
  if (!facts.length) return undefined;

  let text: string;

  switch (beat.kind) {
    case "orientation":
      text = opening(beat, plan);
      break;
    case "hook":
    case "threshold":
      text = hook(beat, plan);
      break;
    case "need":
    case "challenge":
      text = escalation(beat, plan);
      break;
    case "origin":
      text = actionBeat(beat, plan);
      break;
    case "encounter":
    case "discovery":
    case "reveal":
      text = escalation(beat, plan);
      break;
    case "instruction":
    case "action":
      text = actionBeat(beat, plan);
      break;
    case "feedback":
    case "contribution":
      text = feedback(beat, plan);
      break;
    case "escalation":
      text = escalation(beat, plan);
      break;
    case "transformation":
      text = transformation(beat, plan);
      break;
    case "reflection":
      text = playful(plan)
        ? `Looking back, ${article(firstUseful(beat, plan) ?? "the whole thing")} had been telling the story.`
        : "Looking back, the difference was clear.";
      break;
    case "provenance":
    case "identity":
    case "milestone":
      text = playful(plan)
        ? `That became the part worth remembering.`
        : "That marked the change.";
      break;
    case "unlock":
    case "earned_access":
    case "next_step":
      text = "The next part followed naturally.";
      break;
    case "payoff":
      text = payoff(beat, plan);
      break;
    case "continuation":
      text = continuation(beat, plan);
      break;
    default:
      return undefined;
  }

  const finalText = `${sentence(text)}.`;

  if (META.test(finalText) || META_PHRASE.test(finalText) || DELIVERY.test(finalText)) {
    return undefined;
  }

  return finalText;
}
