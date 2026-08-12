import type { CognitiveExperiencePlan, CognitivePremiseRole, StoryBeat } from "@qre/contracts";

/**
 * UNIVERSAL CUSTOMER-LANGUAGE REALIZER
 *
 * The cognitive layers decide what the experience means. This layer decides
 * how that meaning becomes readable human language.
 *
 * There are deliberately no domain modes here. A dog, house, wedding,
 * surfboard, business, rave, memorial, journey, product, or arbitrary object
 * all arrive as evidence + relations + trajectory. The language layer finds
 * the strongest supplied detail, gives the beat a narrative job, varies
 * attention, and makes the state change visible.
 */

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const lower = (value: unknown): string => clean(value).toLowerCase();
const sentence = (value: unknown): string => clean(value).replace(/[.!?]+$/, "");
const unique = (values: readonly unknown[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const META = /\b(?:compiler|cognition|cognitive|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|meaning context|progression model|interaction model|what happens next|trusted history|memory model|geographic model|social model)\b/i;
const DELIVERY = /\b(?:receipt|prompt|output|customer-facing|customer|client|audience|user|users|qr|nfc|scan|tag|code|send|sending|deliver|delivery)\b/i;
const SERIOUS = /\b(?:memorial|funeral|death|died|grief|grieving|emergency|medical|injury|trauma|crisis|solemn|reverent|mourning|urgent|lawsuit|legal|hospital|diagnosis|bereavement)\b/i;
const PLAYFUL = /\b(?:playful|funny|fun|humor|humour|absurd|ridiculous|wild|delight|mischief|comedy|hilarious|joy|celebrat|whimsical|cute|silly|lighthearted|crazy)\b/i;
const ACTION = /\b(?:arriv|enter|walk|go|went|come|came|leave|left|return|groom|clean|wash|repair|fix|restore|build|make|create|design|write|cook|bake|serve|prepare|deliver|open|close|visit|travel|drive|ride|paint|dance|sing|play|choose|pick|select|decide|touch|hold|wear|taste|smell|look|see|watch|share|give|take|bring|receive|check|inspect|test|measure|install|remove|change|turn|transform|upgrade|finish|complete|celebrat|marry|vow|photograph|capture|record|teach|learn|discover|find|collect|organize|organise|decorate|style|trim|cut|brush|dry|massage|relax|pamper|spoil|treat|ready|groomed|cleaned|repaired|polished|painted)\w*\b/i;

const GENERIC = new Set([
  "the", "a", "an", "and", "or", "but", "for", "with", "about", "from",
  "into", "this", "that", "then", "there", "here", "moment", "situation",
  "thing", "things", "story", "experience", "result", "part", "way", "time",
  "one", "something", "everything", "nothing", "really", "very", "just", "got",
  "getting", "looked", "looking", "ready", "started", "happened", "made", "make",
  "create", "created", "creating",
]);

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

function signal(plan?: CognitiveExperiencePlan): string {
  return lower([
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.creativePossibilities ?? []),
    ...(plan?.futureEvolution ?? []),
    ...(plan?.affordances ?? []),
    ...(plan?.dynamicBehavior ?? []),
    ...(plan?.interactionModel ?? []),
    ...(plan?.progressionModel ?? []),
    ...(plan?.contentModel ?? []),
    ...(plan?.discoveryModel ?? []),
    ...(plan?.realization?.semanticArc ?? []),
    ...(plan?.realization?.directives.flatMap((item) => [
      item.action,
      item.intent,
      item.stateBefore,
      item.stateAfter,
    ]) ?? []),
    ...premiseValues(plan, "emotion"),
  ].join(" "));
}

function playful(plan?: CognitiveExperiencePlan): boolean {
  const text = signal(plan);
  return !SERIOUS.test(text) && PLAYFUL.test(text);
}

function evidence(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const directive = beat.directive;
  return unique([
    ...(beat.entities ?? []),
    ...premiseValues(plan, "subject"),
    ...premiseValues(plan, "event"),
    ...premiseValues(plan, "artifact"),
    ...premiseValues(plan, "participants"),
    ...premiseValues(plan, "outcome"),
    ...premiseValues(plan, "place"),
    ...premiseValues(plan, "social"),
    ...premiseValues(plan, "affordance"),
    ...premiseValues(plan, "temporal"),
    ...premiseValues(plan, "transformation"),
    directive?.subject,
    directive?.action,
    directive?.stateBefore,
    directive?.stateAfter,
    ...(directive?.relationalFocus ?? []),
  ]).filter(
    (value) => value.length > 2 && !META.test(value) && !DELIVERY.test(value),
  );
}

function subject(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const candidates = unique([
    clean(plan?.centralSubject),
    ...premiseValues(plan, "subject"),
    ...premiseValues(plan, "participants"),
    ...(beat.entities ?? []),
    beat.directive?.subject,
  ]).filter(
    (value) => value && !META.test(value) && !DELIVERY.test(value),
  );
  const named = candidates.find((value) =>
    /\b[A-Z][A-Za-z0-9'’-]{2,}\b/.test(value),
  );
  return named ?? candidates.sort((a, b) => a.length - b.length)[0] ?? "the moment";
}

function atomWords(value: string): string[] {
  return clean(value)
    .toLowerCase()
    .split(/[^a-z0-9'’-]+/)
    .filter((word) => word.length > 2);
}

/**
 * Select memorable detail from the evidence itself.
 *
 * This is intentionally generic. Specificity comes from the supplied world:
 * names, places, objects, multi-word phrases, numbers, visual descriptors,
 * outcomes, and transformations all naturally score higher.
 */
function detailScore(value: string, plan?: CognitiveExperiencePlan): number {
  const words = atomWords(value);
  const concreteBonus = words.filter((word) => !GENERIC.has(word)).length * 2;
  const lengthBonus = Math.min(8, words.length * 2);
  const visualBonus = /\d|\b(red|blue|black|white|gold|silver|tiny|giant|old|new|little|big|long|short|warm|cold|bright|dark)\b/i.test(value)
    ? 4
    : 0;
  const namedBonus = /\b[A-Z][A-Za-z0-9'’-]{2,}\b/.test(value) ? 5 : 0;
  const salientRole = [
    "artifact",
    "place",
    "outcome",
    "transformation",
    "event",
    "social",
  ].some((role) =>
    premiseValues(plan, role as CognitivePremiseRole).includes(value),
  )
    ? 4
    : 0;
  return concreteBonus + lengthBonus + visualBonus + namedBonus + salientRole;
}

function details(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  return unique(evidence(beat, plan))
    .filter((value) => atomWords(value).some((word) => !GENERIC.has(word)))
    .sort((a, b) => detailScore(b, plan) - detailScore(a, plan));
}

function actions(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const values = unique([
    ...premiseValues(plan, "event"),
    beat.directive?.action,
    ...(beat.entities ?? []),
  ]).filter((value) => !META.test(value) && !DELIVERY.test(value));
  return values.filter((value) => ACTION.test(value));
}

function outcome(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  return unique([
    ...premiseValues(plan, "outcome"),
    ...premiseValues(plan, "transformation"),
    beat.directive?.stateAfter,
  ]).find((value) => value && !META.test(value) && !DELIVERY.test(value));
}

function beforeAfter(plan?: CognitiveExperiencePlan): {
  before?: string;
  after?: string;
} {
  const transformation = premiseValues(plan, "transformation").filter(
    (value) => !META.test(value) && !DELIVERY.test(value),
  );
  const directive = plan?.realization?.directives.find(
    (item) => item.stateBefore || item.stateAfter,
  );
  return {
    before: transformation[0] ?? (clean(directive?.stateBefore) || undefined),
    after: transformation[1] ?? (clean(directive?.stateAfter) || undefined),
  };
}

function cap(value: string): string {
  const text = sentence(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function withArticle(value: string): string {
  const text = sentence(value).toLowerCase();
  return /^(?:the|a|an)\b/i.test(text) ? text : `the ${text}`;
}

function choose<T>(values: readonly T[], seed: string): T {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return values[(hash >>> 0) % values.length] ?? values[0]!;
}

function opening(
  name: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  if (playful(plan)) {
    return choose(
      [
        `${name} walked in looking like this deserved a formal review.`,
        `${name} arrived with the unmistakable energy of someone who had questions.`,
        `${name} showed up, and somehow the ordinary part already felt suspicious.`,
        `${name} walked in as if the day had personally challenged them.`,
      ],
      `${name}|open|${beat.id}`,
    );
  }
  return actions(beat, plan)[0]
    ? `${name} arrived, and things got underway.`
    : `${name} stepped into the moment, and it began to move.`;
}

function hook(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const detail = details(beat, plan)[0];
  if (detail) {
    return playful(plan)
      ? choose(
          [
            `At first, it was all about ${withArticle(detail)}.`,
            `Then ${withArticle(detail)} started to matter.`,
            `Everything seemed ordinary until ${withArticle(detail)} entered the picture.`,
          ],
          `${beat.id}|hook|${detail}`,
        )
      : `The moment began with ${withArticle(detail)}.`;
  }
  const action = actions(beat, plan)[0];
  return action ? cap(action) : "Things began to move.";
}

function origin(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const action = actions(beat, plan)[0] ?? premiseValues(plan, "event")[0];
  if (action) return `It started with ${withArticle(action)}.`;
  const place = premiseValues(plan, "place")[0];
  return place
    ? `It started there, at ${sentence(place)}.`
    : "It started simply enough.";
}

function encounter(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const detail = details(beat, plan)[0];
  if (detail) {
    return choose(
      [
        `Then came ${withArticle(detail)}.`,
        `${cap(detail)} got its turn.`,
        `Next, ${withArticle(detail)} took over the frame.`,
      ],
      `${beat.id}|encounter|${detail}`,
    );
  }
  const action = actions(beat, plan)[0];
  return action
    ? `Then came ${sentence(action).toLowerCase()}.`
    : "Then something changed the rhythm.";
}

function challenge(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const detail = details(beat, plan)[0];
  if (detail && playful(plan)) {
    return choose(
      [
        `${cap(detail)} was not going to make this easy.`,
        `For a moment, ${withArticle(detail)} had other plans.`,
        `${cap(detail)} suddenly became the part nobody could ignore.`,
      ],
      `${beat.id}|challenge|${detail}`,
    );
  }
  return detail
    ? `For a moment, ${withArticle(detail)} slowed things down.`
    : "For a moment, the momentum broke.";
}

function actionBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const action = actions(beat, plan)[0];
  if (action) return `${cap(action)}.`;
  const detail = details(beat, plan)[0];
  return detail
    ? `${cap(detail)} moved the moment forward.`
    : "The moment kept moving.";
}

function discovery(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const detail = details(beat, plan)[0];
  if (detail) {
    return playful(plan)
      ? `That was when ${withArticle(detail)} suddenly became the part worth noticing.`
      : `That was when ${withArticle(detail)} stood out.`;
  }
  return "Then the important detail came into focus.";
}

function reveal(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const value = outcome(beat, plan) ?? details(beat, plan)[0];
  if (value) return `And there it was: ${sentence(value).toLowerCase()}.`;
  return "And there it was: the change was visible.";
}

function feedback(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const detail = details(beat, plan)[0];
  if (playful(plan) && detail) {
    return choose(
      [
        `The reaction to ${withArticle(detail)} was immediate.`,
        `${cap(detail)} got a response. A memorable one.`,
        `Apparently, ${withArticle(detail)} had opinions of its own.`,
      ],
      `${beat.id}|feedback|${detail}`,
    );
  }
  return detail
    ? `${cap(detail)} showed what had changed.`
    : "The result started to show itself.";
}

function contribution(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const detail = details(beat, plan)[0];
  return detail
    ? `That shifted the moment around ${withArticle(detail)}.`
    : "That changed the rhythm of what followed.";
}

function escalation(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const detail = details(beat, plan)[0];
  if (detail && playful(plan)) {
    return choose(
      [
        `${cap(detail)} was no longer a side detail. It had become the whole mood.`,
        `By then, ${withArticle(detail)} had completely changed the scale of the moment.`,
        `And somehow, ${withArticle(detail)} kept getting more important.`,
      ],
      `${beat.id}|escalation|${detail}`,
    );
  }
  return detail
    ? `${cap(detail)} carried the moment into its final stretch.`
    : "The moment moved into its final stretch.";
}

function transformation(
  name: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const states = beforeAfter(plan);
  if (states.before && states.after) {
    return `${name} went from ${sentence(states.before).toLowerCase()} to ${sentence(states.after).toLowerCase()}.`;
  }
  const value = outcome(beat, plan);
  if (value) return `By the end, the result was clear: ${sentence(value)}.`;
  return playful(plan)
    ? choose(
        [
          `By the end, ${name} was not quite the same as when this started.`,
          "Somewhere along the way, ordinary turned into memorable.",
        ],
        `${name}|transform|${beat.id}`,
      )
    : `By the end, ${name} was not quite in the same state as when this started.`;
}

function reflection(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const detail = details(beat, plan)[0];
  if (detail) {
    return playful(plan)
      ? `Looking back, ${withArticle(detail)} was the giveaway.`
      : `Looking back, ${withArticle(detail)} made the change easy to see.`;
  }
  return "Looking back, the difference was clear.";
}

function payoff(
  name: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const value = outcome(beat, plan);
  if (value) {
    return playful(plan)
      ? choose(
          [
            `And there it was: ${sentence(value).toLowerCase()}.`,
            `That was the payoff: ${sentence(value).toLowerCase()}.`,
          ],
          `${name}|payoff|${value}`,
        )
      : `The result was clear: ${sentence(value)}.`;
  }
  const detail = details(beat, plan)[0];
  if (detail && playful(plan)) {
    return `And somehow, ${withArticle(detail)} became the detail people would remember.`;
  }
  return playful(plan)
    ? "The ordinary part was gone. What remained was the part worth keeping."
    : `The result was clear, and ${name} carried it forward.`;
}

function continuation(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const future = plan?.futureEvolution?.find(
    (value) => !META.test(value) && !DELIVERY.test(value),
  );
  if (future) return `And that left room for ${sentence(future).toLowerCase()}.`;
  const detail = details(beat, plan)[0];
  return playful(plan)
    ? detail
      ? `That detail could have ended there. It probably won't.`
      : "And that is where the next part can begin."
    : "The result remained available for what came next.";
}

export function realizeSuperStoryBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  if (!plan?.premise) return undefined;
  if (!evidence(beat, plan).length) return undefined;

  const name = subject(beat, plan);
  let text: string | undefined;

  switch (beat.kind) {
    case "orientation":
      text = opening(name, beat, plan);
      break;
    case "hook":
      text = hook(beat, plan);
      break;
    case "need":
      text = details(beat, plan)[0]
        ? `There was something to do about ${withArticle(details(beat, plan)[0])}.`
        : "There was a reason to keep going.";
      break;
    case "threshold":
      text = "The next part was underway.";
      break;
    case "origin":
      text = origin(beat, plan);
      break;
    case "encounter":
      text = encounter(beat, plan);
      break;
    case "challenge":
      text = challenge(beat, plan);
      break;
    case "discovery":
      text = discovery(beat, plan);
      break;
    case "reveal":
      text = reveal(beat, plan);
      break;
    case "instruction":
      text = details(beat, plan)[0]
        ? `The next move was ${withArticle(details(beat, plan)[0])}.`
        : "The next move became clear.";
      break;
    case "action":
      text = actionBeat(beat, plan);
      break;
    case "feedback":
      text = feedback(beat, plan);
      break;
    case "contribution":
      text = contribution(beat, plan);
      break;
    case "escalation":
      text = escalation(beat, plan);
      break;
    case "transformation":
      text = transformation(name, beat, plan);
      break;
    case "reflection":
      text = reflection(beat, plan);
      break;
    case "provenance":
      text = details(beat, plan)[0]
        ? "That detail belonged to the moment."
        : "The moment stayed connected to what came before.";
      break;
    case "identity": {
      const value = outcome(beat, plan);
      text = value
        ? `${name} now carried ${withArticle(value)}.`
        : "The result had become part of the identity of the moment.";
      break;
    }
    case "milestone": {
      const detail = details(beat, plan)[0];
      text = detail
        ? `${cap(detail)} became the detail that marked the change.`
        : "That became the moment worth remembering.";
      break;
    }
    case "unlock":
    case "earned_access":
      text = "The next part opened from everything that came before.";
      break;
    case "payoff":
      text = payoff(name, beat, plan);
      break;
    case "next_step":
      text = "There was only one thing left to do: keep going.";
      break;
    case "continuation":
      text = continuation(beat, plan);
      break;
    default:
      text = undefined;
  }

  return text ? `${sentence(text)}.` : undefined;
}
