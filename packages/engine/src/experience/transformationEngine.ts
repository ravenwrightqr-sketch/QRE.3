import type { CognitiveExperiencePlan, CognitivePremiseRole, StoryBeat } from "@qre/contracts";

/**
 * UNIVERSAL TRANSFORMATION REALIZER
 *
 * This is the customer-language boundary. Cognition may think in plans,
 * mechanics, directives, hypotheses, and progression. The customer should
 * never have to.
 *
 * The realizer therefore performs four operations:
 *   1. recover concrete evidence from the conserved premise + beat entities;
 *   2. fuse that evidence into observable actions and objects;
 *   3. arrange those facts into changing narrative states;
 *   4. add small, deterministic creative flourishes when the prompt invites
 *      play, without pretending invented flourishes were observed facts.
 *
 * Hard rules:
 * - no compiler/cognition vocabulary in customer prose;
 * - delivery words such as "receipt" or "client" never become the subject;
 * - concrete prompt evidence outranks generic semantic language;
 * - do not repeat the subject at the beginning of every beat;
 * - transformation must be observable, not merely announced;
 * - serious material is never forced into comedy;
 * - output is deterministic.
 */

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const lower = (value: unknown): string => clean(value).toLowerCase();
const sentence = (value: unknown): string => clean(value).replace(/[.!?]+$/, "");
const unique = (values: readonly unknown[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

const META = /\b(?:compiler|cognition|cognitive|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|meaning context|progression model|interaction model)\b/i;
const DELIVERY = /\b(?:receipt|prompt|output|customer|client|business|company|story|stories|experience|qr|nfc|scan|tag|code|message|text|send|sending|audience|user|users)\b/i;
const SERIOUS = /\b(?:memorial|funeral|death|died|grief|grieving|emergency|medical|injury|trauma|crisis|solemn|reverent|mourning|urgent|lawsuit|legal|hospital|diagnosis|bereavement)\b/i;
const PLAYFUL = /\b(?:playful|funny|fun|humor|humour|absurd|ridiculous|wild|delight|mischief|comedy|hilarious|joy|celebrat|whimsical|cute|silly|lighthearted)\b/i;
const ACTION = /\b(?:arriv|enter|walk|go|went|come|came|leave|left|return|groom|clean|wash|repair|fix|restore|build|make|create|design|write|cook|bake|serve|prepare|deliver|open|close|visit|travel|drive|ride|paint|dance|sing|play|choose|pick|select|decide|touch|hold|wear|taste|smell|look|see|watch|share|give|take|bring|send|receive|check|inspect|test|measure|install|remove|change|turn|transform|upgrade|finish|complete|celebrat|marry|vow|photograph|capture|record|teach|learn|discover|find|collect|organize|organise|decorate|style|trim|cut|brush|dry|massage|relax|pamper|spoil|treat|ready|groomed|cleaned|repaired|polished|painted)\w*\b/i;

const ACTION_WORDS = new Set([
  "arrive", "arrives", "arrived", "arriving", "enter", "enters", "entered", "entering",
  "walk", "walks", "walked", "walking", "go", "goes", "went", "going", "come", "comes", "came",
  "leave", "leaves", "left", "leaving", "return", "returns", "returned", "returning",
  "groom", "grooms", "groomed", "grooming", "clean", "cleans", "cleaned", "cleaning",
  "wash", "washed", "washing", "repair", "repaired", "repairing", "fix", "fixed", "fixing",
  "restore", "restored", "restoring", "build", "built", "building", "make", "made", "making",
  "create", "created", "creating", "cook", "cooked", "cooking", "bake", "baked", "baking",
  "serve", "served", "serving", "prepare", "prepared", "preparing", "travel", "traveled", "traveling",
  "drive", "drove", "driving", "ride", "rode", "riding", "paint", "painted", "painting",
  "dance", "danced", "dancing", "sing", "sang", "singing", "play", "played", "playing",
  "choose", "chose", "choosing", "pick", "picked", "picking", "select", "selected", "selecting",
  "decide", "decided", "deciding", "wear", "wore", "wearing", "taste", "tasted", "tasting",
  "look", "looked", "looking", "see", "saw", "seeing", "watch", "watched", "watching",
  "give", "gave", "giving", "take", "took", "taking", "bring", "brought", "bringing",
  "check", "checked", "checking", "inspect", "inspected", "inspecting", "test", "tested", "testing",
  "install", "installed", "installing", "remove", "removed", "removing", "change", "changed", "changing",
  "turn", "turned", "turning", "transform", "transformed", "transforming", "finish", "finished", "finishing",
  "complete", "completed", "celebrate", "celebrated", "celebrating", "marry", "married", "photograph", "photographed",
  "record", "recorded", "teach", "taught", "learn", "learned", "discover", "discovered", "find", "found",
  "collect", "collected", "organize", "organized", "decorate", "decorated", "style", "styled", "trim", "trimmed",
  "cut", "brushed", "brush", "dried", "dry", "massage", "massaged", "relax", "relaxed", "pamper", "pampered",
  "spoil", "spoiled", "treat", "treated", "ready", "groomed", "cleaned", "repaired", "polished", "painted",
]);

function premiseValues(plan: CognitiveExperiencePlan | undefined, role: CognitivePremiseRole): string[] {
  return unique(plan?.premise?.slots.filter((slot) => slot.role === role).flatMap((slot) => slot.values) ?? []);
}

function choose<T>(values: readonly T[], seed: string): T {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return values[(hash >>> 0) % values.length] ?? values[0]!;
}

function stripDeliveryTail(value: string): string {
  return clean(value
    .replace(/\b(?:to|for)\s+(?:send|sending|share|deliver|give)\b.*$/i, "")
    .replace(/\b(?:to|for)\s+(?:the|a|an)?\s*(?:client|customer|user|audience|business)\b.*$/i, "")
    .replace(/\b(?:story|receipt|message|text)\s+(?:about|for)\b.*$/i, "")
    .replace(/\b(?:new memories can change what later visitors discover)\b.*$/i, ""));
}

function isUsableSubject(value: string): boolean {
  const text = clean(value);
  return Boolean(text) && !META.test(text) && !/^the subject$/i.test(text) && !/^the situation$/i.test(text);
}

function subjectCandidates(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  return unique([
    ...premiseValues(plan, "subject"),
    ...premiseValues(plan, "participants"),
    ...premiseValues(plan, "social"),
    clean(plan?.centralSubject),
    ...(beat.entities ?? []),
  ])
    .map(stripDeliveryTail)
    .filter(isUsableSubject);
}

function subject(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const candidates = subjectCandidates(beat, plan);

  const named = candidates.find((value) =>
    /\b[A-Z][A-Za-z0-9'’-]{2,}\b/.test(value) &&
    !DELIVERY.test(value) &&
    !ACTION.test(value),
  );
  if (named) return named;

  const compact = candidates
    .filter((value) => !DELIVERY.test(value) && !ACTION.test(value))
    .sort((a, b) => a.length - b.length)[0];
  if (compact) return compact;

  return "the moment";
}

function sequence(beat: StoryBeat): string[] {
  return unique(beat.entities ?? [])
    .map((value) => clean(value).toLowerCase())
    .filter((value) => value.length > 2 && !META.test(value));
}

function hasWord(words: readonly string[], pattern: RegExp): boolean {
  return pattern.test(words.join(" "));
}

function actionWords(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const words = sequence(beat);
  const result: string[] = [];

  for (const word of words) {
    const normalized = word.replace(/[^a-z]/g, "");
    if (ACTION_WORDS.has(normalized)) result.push(normalized);
  }

  for (const value of premiseValues(plan, "event")) {
    if (ACTION.test(value)) result.push(...value.toLowerCase().split(/\s+/).filter((word) => ACTION_WORDS.has(word.replace(/[^a-z]/g, ""))));
  }

  return unique(result);
}

function compoundDetails(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const words = sequence(beat).join(" ");
  const details: string[] = [];
  const compounds = [
    "living room", "road trip", "dog groomer", "best meal", "go home", "paint the town red",
    "small restaurant", "strange little town", "red bicycle", "warm towel", "foot rub", "foot rubs",
    "brakes", "car", "kitchen", "home", "ceremony", "reception", "garden", "family", "sunset", "pie",
  ];
  for (const compound of compounds) if (words.includes(compound)) details.push(compound);

  const direct = [
    ...premiseValues(plan, "event"),
    ...premiseValues(plan, "artifact"),
    ...premiseValues(plan, "outcome"),
    ...premiseValues(plan, "place"),
  ];
  for (const value of direct) {
    if (!META.test(value) && !DELIVERY.test(value) && value.length >= 3) details.push(value);
  }

  return unique(details).slice(0, 18);
}

function concreteActions(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const words = sequence(beat);
  const details = compoundDetails(beat, plan);
  const actions = actionWords(beat, plan);
  const result: string[] = [];

  if (hasWord(words, /\barriv(?:e|ed|es|ing)\b/) || details.includes("go home")) result.push("arrived");
  if (hasWord(words, /\bgroom(?:ed|ing)?\b/) || details.includes("dog groomer")) result.push("got groomed");
  if (hasWord(words, /\bclean(?:ed|ing)?\b/) && details.includes("kitchen")) result.push("the kitchen got cleaned");
  if (hasWord(words, /\bclean(?:ed|ing)?\b/) && details.includes("living room")) result.push("the living room got cleaned");
  if (hasWord(words, /\brepair(?:ed|ing)?\b/) && details.includes("brakes")) result.push("the brakes got repaired");
  if (hasWord(words, /\bready\b/) && details.includes("car")) result.push("the car was ready to drive again");
  if (hasWord(words, /\bready\b/) && details.includes("home")) result.push("everything was ready to go home");
  if (hasWord(words, /\bmiss(?:ed|ing)?\b|turn/)) result.push("missed the turn");
  if (details.includes("ceremony")) result.push("the ceremony happened");
  if (details.includes("reception")) result.push("the reception followed");
  if (details.includes("pie")) result.push("pie entered the story");
  if (details.includes("sunset")) result.push("arrived at sunset");

  for (const action of actions) {
    if (/^(?:send|share|message|text|deliver)$/.test(action)) continue;
    result.push(action);
  }

  return unique(result).filter((value) => !META.test(value)).slice(0, 18);
}

function detailNouns(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const words = sequence(beat);
  const stop = new Set([
    "funny", "fun", "playful", "story", "receipt", "client", "customer", "business", "send", "show", "about",
    "make", "create", "the", "and", "then", "being", "getting", "looking", "ready", "arriving", "groomed", "cleaned",
  ]);
  const nouns = words.filter((word) =>
    !stop.has(word) &&
    !ACTION_WORDS.has(word) &&
    word.length > 2,
  );
  return unique([...compoundDetails(beat, plan), ...nouns]).slice(0, 16);
}

function signalText(plan?: CognitiveExperiencePlan): string {
  return lower([
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.affordances ?? []),
    ...(plan?.futureEvolution ?? []),
    ...(plan?.creativePossibilities ?? []),
    ...(plan?.dynamicBehavior ?? []),
    ...(plan?.interactionModel ?? []),
    ...(plan?.progressionModel ?? []),
    ...(plan?.contentModel ?? []),
    ...(plan?.discoveryModel ?? []),
    ...(plan?.realization?.semanticArc ?? []),
    ...(plan?.realization?.directives.flatMap((item) => [item.action, item.intent, item.stateBefore, item.stateAfter]) ?? []),
    ...premiseValues(plan, "emotion"),
  ].join(" "));
}

function playful(plan?: CognitiveExperiencePlan): boolean {
  const signal = signalText(plan);
  return !SERIOUS.test(signal) && PLAYFUL.test(signal);
}

type ActionClass = "care" | "clean" | "repair" | "journey" | "celebrate" | "create" | "generic";

function actionClass(beat: StoryBeat, plan?: CognitiveExperiencePlan): ActionClass {
  const text = lower([...actionWords(beat, plan), ...detailNouns(beat, plan), signalText(plan)].join(" "));
  if (/\b(?:groom|wash|massage|pamper|style|trim|brush|dry|treat)\b/.test(text)) return "care";
  if (/\b(?:clean|kitchen|living room|home)\b/.test(text)) return "clean";
  if (/\b(?:repair|fix|brake|car|test|restore)\b/.test(text)) return "repair";
  if (/\b(?:travel|drive|ride|journey|trip|turn|coast|sunset)\b/.test(text)) return "journey";
  if (/\b(?:celebrate|marry|wedding|party|birthday|dance|ceremony|reception)\b/.test(text)) return "celebrate";
  if (/\b(?:build|make|create|design|write|cook|bake|paint|craft)\b/.test(text)) return "create";
  return "generic";
}

const FLOURISHES: Record<ActionClass, string[]> = {
  care: [
    "The bubbles helped.",
    "Then came the foot rubs.",
    "For a moment, all was forgiven.",
    "The finishing touch suddenly felt very important.",
    "Then somebody made a styling decision with consequences.",
  ],
  clean: [
    "One stubborn spot refused to cooperate.",
    "The last crumb made a run for it.",
    "By the end, even the stubborn little details had surrendered.",
    "The final polish changed the mood of the whole place.",
  ],
  repair: [
    "One last test got its moment in the spotlight.",
    "There was a tiny adjustment, because apparently one more thing had an opinion.",
    "Then came the satisfying part: everything finally behaved.",
  ],
  journey: [
    "Naturally, the route had other ideas.",
    "One little detour became the part worth remembering.",
    "The trip picked up a plot twist of its own.",
  ],
  celebrate: [
    "The room seemed to know it was supposed to be a big moment.",
    "Then the little details started stealing the scene.",
    "By then, ordinary had officially left the building.",
  ],
  create: [
    "One tiny decision changed the whole look.",
    "Then came the finishing touch.",
    "The last adjustment somehow mattered more than expected.",
  ],
  generic: [
    "Then one small detail changed the mood.",
    "That was the moment the ordinary part got interesting.",
    "One little surprise refused to stay little.",
  ],
};

function flourish(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  if (!playful(plan) || SERIOUS.test(signalText(plan))) return undefined;
  return choose(FLOURISHES[actionClass(beat, plan)], `${beat.id}|flourish`);
}

function factsForBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  return unique([
    ...concreteActions(beat, plan),
    ...compoundDetails(beat, plan),
    ...detailNouns(beat, plan),
  ]).filter((value) => !META.test(value) && value.length > 2);
}

function opening(name: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  if (playful(plan)) {
    return choose([
      `${name} walked in looking suspicious.`,
      `${name} showed up with opinions.`,
      `${name} arrived looking like this deserved a very close inspection.`,
      `${name} walked in as if someone had already made a questionable decision.`,
    ], `${name}|opening|${beat.order}`);
  }

  const actions = concreteActions(beat, plan);
  if (actions.includes("arrived")) return `${name} arrived, and the moment was underway.`;
  return `${name} stepped into the moment, and things began to move.`;
}

function hook(name: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const actions = concreteActions(beat, plan);
  const details = detailNouns(beat, plan);
  if (playful(plan)) {
    if (actions.includes("got groomed")) return "The grooming started, and the mood improved almost immediately.";
    if (actions.includes("the kitchen got cleaned")) return "The kitchen went first.";
    if (actions.includes("the brakes got repaired")) return "The brakes got their turn under the microscope.";
    if (actions.includes("missed the turn")) return "Then somebody missed the turn.";
    if (details.length) return `Things started with ${details[0]}.`;
    return "Things started normally, which was clearly not going to last.";
  }
  if (actions[0]) return `${sentence(actions[0]).charAt(0).toUpperCase() + sentence(actions[0]).slice(1)}.`;
  return "The moment got underway.";
}

function encounter(name: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const flourishText = flourish(beat, plan);
  const actions = concreteActions(beat, plan);
  if (playful(plan)) {
    if (flourishText) return flourishText;
    if (actions[0]) return `Then came ${sentence(actions[0]).toLowerCase()}.`;
    return "Then the situation acquired a personality of its own.";
  }
  return actions[0] ? `Then came ${sentence(actions[0]).toLowerCase()}.` : undefined;
}

function actionBeat(name: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const actions = concreteActions(beat, plan);
  if (actions.length) {
    const action = choose(actions, `${beat.id}|action`);
    return `${action.charAt(0).toUpperCase() + action.slice(1)}.`;
  }
  const facts = factsForBeat(beat, plan).filter((value) => ACTION.test(value));
  if (facts[0]) return `${sentence(facts[0]).charAt(0).toUpperCase() + sentence(facts[0]).slice(1)}.`;
  return "The moment kept moving.";
}

function transformation(name: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const explicit = premiseValues(plan, "transformation");
  if (explicit.length >= 2 && explicit[0] && explicit[1]) {
    return `${name} went from ${sentence(explicit[0]).toLowerCase()} to ${sentence(explicit[1]).toLowerCase()}.`;
  }

  const outcome = premiseValues(plan, "outcome")[0];
  if (outcome && !META.test(outcome) && !DELIVERY.test(outcome)) {
    return `By the end, the result was unmistakable: ${sentence(outcome)}.`;
  }

  if (playful(plan)) {
    return choose([
      "By the end, the whole situation had changed.",
      "Somewhere along the way, ordinary turned into memorable.",
      "By then, the mood had completely changed.",
      "Whatever walked in at the beginning was not quite what left at the end.",
    ], `${name}|transformation|${beat.order}`);
  }

  return `By the end, ${name} was not quite in the same state as when this started.`;
}

function payoff(name: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const details = detailNouns(beat, plan);
  const actions = concreteActions(beat, plan);

  if (playful(plan)) {
    if (actionClass(beat, plan) === "care") {
      return choose([
        "Out the door went a completely different attitude.",
        "The coat was fantastic. The attitude was even better.",
        `${name} left looking ready to paint the town red.`,
      ], `${name}|payoff|${beat.order}`);
    }
    if (actionClass(beat, plan) === "clean") {
      return choose([
        "The home went from work-in-progress to ready for company.",
        "By the time it was over, the whole place looked like it had its life together.",
      ], `${name}|payoff|${beat.order}`);
    }
    if (actionClass(beat, plan) === "repair") {
      return choose([
        "The car was ready to get back on the road, and that was the whole point.",
        "Everything was working again. The road could have its turn now.",
      ], `${name}|payoff|${beat.order}`);
    }
    if (details.includes("sunset")) return "They arrived at sunset, which felt like the universe finally sticking the landing.";
    return choose([
      "By the time it was over, the moment had become a story worth keeping.",
      "The ordinary part was gone. What remained was the good part people remember.",
      "And there it was: the payoff, earned by everything that came before it.",
    ], `${name}|payoff|${beat.order}`);
  }

  if (actions.includes("the car was ready to drive again")) return "The car was ready to drive again, and the problem was behind it.";
  if (actions.includes("everything was ready to go home")) return "Everything was ready to go home, carrying the result of what just happened.";
  return `The result was clear, and ${name} carried it forward.`;
}

function realizeBeat(name: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  switch (beat.kind) {
    case "orientation": return opening(name, beat, plan);
    case "hook": return hook(name, beat, plan);
    case "origin": {
      const actions = concreteActions(beat, plan);
      return actions[0] ? `It started with ${sentence(actions[0]).toLowerCase()}.` : "That was where the story got moving.";
    }
    case "encounter": return encounter(name, beat, plan);
    case "challenge": {
      const flourishText = flourish(beat, plan);
      return flourishText ? flourishText : "Then something demanded a response.";
    }
    case "action": return actionBeat(name, beat, plan);
    case "contribution": {
      const flourishText = flourish(beat, plan);
      if (flourishText) return flourishText;
      const actions = concreteActions(beat, plan);
      return actions[0] ? `That changed the moment: ${sentence(actions[0])}.` : "That was enough to change the rhythm.";
    }
    case "discovery": {
      const flourishText = flourish(beat, plan);
      const details = detailNouns(beat, plan);
      if (flourishText) return flourishText;
      return details[0] ? `That was when ${details[0]} suddenly mattered.` : "That was when the whole thing finally clicked.";
    }
    case "reveal": {
      const details = detailNouns(beat, plan);
      return details[0] ? `And there it was: ${details[0]}.` : "The result finally came into view.";
    }
    case "feedback": {
      if (playful(plan) && actionClass(beat, plan) === "care") {
        return choose([
          "She shook it off like a tiny celebrity rejecting a bad contract.",
          "The reaction was immediate, dramatic, and entirely justified.",
          "That decision was reviewed and rejected on the spot.",
        ], `${name}|feedback|${beat.order}`);
      }
      const actions = concreteActions(beat, plan);
      return actions[0] ? `And the result showed: ${sentence(actions[0])}.` : "And the result showed.";
    }
    case "escalation": {
      const flourishText = flourish(beat, plan);
      if (playful(plan)) return flourishText ?? "Then the moment turned up the volume.";
      return "Then the situation moved into its final stretch.";
    }
    case "transformation": return transformation(name, beat, plan);
    case "reflection": {
      if (playful(plan) && actionClass(beat, plan) === "care") return "That coat? Fantastic. The attitude? Even better.";
      return playful(plan) ? "Looking back, the difference was obvious." : "The change was visible in retrospect.";
    }
    case "identity": return playful(plan) ? "At this point, the attitude had become part of the story." : `${name} now carried a recognizable result from the interaction.`;
    case "milestone": return playful(plan) ? "That was the moment worth remembering." : "That became the visible milestone.";
    case "unlock":
    case "earned_access": return playful(plan) ? "The next part had been earned by everything that came before." : "The next part followed from what happened before.";
    case "payoff": return payoff(name, beat, plan);
    case "next_step": return playful(plan) ? "Naturally, there was only one thing left to do: keep going." : "The next step followed from what just happened.";
    case "continuation": return playful(plan) ? "And that is how an ordinary moment gets a second life." : "The result remained available for what came next.";
    default: return undefined;
  }
}

export function realizeTransformationalBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  if (!plan?.premise) return undefined;

  const evidence = unique([
    ...premiseValues(plan, "subject"),
    ...premiseValues(plan, "participants"),
    ...premiseValues(plan, "event"),
    ...premiseValues(plan, "artifact"),
    ...premiseValues(plan, "outcome"),
    ...premiseValues(plan, "affordance"),
    ...premiseValues(plan, "transformation"),
    ...(beat.entities ?? []),
  ]);
  if (!evidence.length) return undefined;

  const name = subject(beat, plan);
  const text = realizeBeat(name, beat, plan);
  if (!text) return undefined;
  return sentence(text) + ".";
}

export function inspectTransformation(beat: StoryBeat, plan?: CognitiveExperiencePlan) {
  const explicit = premiseValues(plan, "transformation");
  const evidence = unique([
    ...premiseValues(plan, "event"),
    ...premiseValues(plan, "artifact"),
    ...premiseValues(plan, "outcome"),
    ...premiseValues(plan, "affordance"),
    ...premiseValues(plan, "transformation"),
    ...concreteActions(beat, plan),
    ...compoundDetails(beat, plan),
    ...detailNouns(beat, plan),
  ]).slice(0, 24);

  return {
    subject: subject(beat, plan),
    before: explicit[0],
    after: explicit[1] ?? premiseValues(plan, "outcome")[0],
    evidence,
    playful: playful(plan),
    beatKind: beat.kind,
  };
}
