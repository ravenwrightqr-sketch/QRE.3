import type { CognitiveExperiencePlan, CognitivePremiseRole, StoryBeat } from "@qre/contracts";

/**
 * UNIVERSAL TRANSFORMATION REALIZER
 *
 * The cognitive compiler supplies meaning, evidence, mechanics, and a causal
 * trajectory. This boundary turns that material into customer-facing prose.
 *
 * Hard rules:
 * - preserve concrete prompt evidence;
 * - keep delivery artifacts (receipt, story, QR, client) out of the subject;
 * - invent only presentation details, never premise facts;
 * - vary sentence openings and rhythm;
 * - make transformation observable;
 * - serious material never gets forced into comedy;
 * - deterministic output for repeatable builds/tests.
 */

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const lower = (value: unknown): string => clean(value).toLowerCase();
const sentence = (value: unknown): string => clean(value).replace(/[.!?]+$/, "");
const unique = (values: readonly unknown[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const META = /\b(?:compiler|cognition|cognitive|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|progression|meaning context)\b/i;
const DELIVERY = /\b(?:receipt|prompt|output|customer|client|business|company|story|stories|experience|qr|nfc|scan|tag|code|message|text|send|sending|audience|user|users)\b/i;
const SERIOUS = /\b(?:memorial|funeral|death|died|grief|grieving|emergency|medical|injury|trauma|crisis|solemn|reverent|mourning|urgent|lawsuit|legal|hospital|diagnosis)\b/i;
const PLAYFUL = /\b(?:playful|funny|fun|humor|humour|absurd|ridiculous|wild|delight|mischief|comedy|hilarious|joy|celebrat|whimsical|cute|silly|lighthearted)\b/i;
const ACTION = /\b(?:arriv|enter|walk|go|went|come|came|leave|left|return|groom|clean|wash|repair|fix|restore|build|make|create|design|write|cook|bake|serve|prepare|deliver|open|close|visit|travel|drive|ride|paint|dance|sing|play|choose|pick|select|decide|touch|hold|wear|taste|smell|look|see|watch|share|give|take|bring|send|receive|check|inspect|test|measure|install|remove|change|turn|transform|upgrade|finish|complete|celebrat|marry|vow|photograph|capture|record|teach|learn|discover|find|collect|organize|organise|decorate|style|trim|cut|brush|dry|massage|relax|pamper|spoil|treat|ready|groomed)\w*\b/i;

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
  "complete", "completed", "celebrate", "celebrated", "celebrating", "marry", "married", "photograph",
  "photographed", "record", "recorded", "teach", "taught", "learn", "learned", "discover", "discovered",
  "find", "found", "collect", "collected", "organize", "organized", "decorate", "decorated", "style",
  "styled", "trim", "trimmed", "cut", "brushed", "brush", "dried", "dry", "massage", "massaged",
  "relax", "relaxed", "pamper", "pampered", "spoil", "spoiled", "treat", "treated", "ready", "groomed",
]);

function premiseValues(plan: CognitiveExperiencePlan | undefined, role: CognitivePremiseRole): string[] {
  return unique(
    plan?.premise?.slots
      .filter((slot) => slot.role === role)
      .flatMap((slot) => slot.values) ?? [],
  );
}

function isGeneric(value: string): boolean {
  return !value || META.test(value) || (DELIVERY.test(value) && value.split(/\s+/).length <= 2);
}

function likelyName(value: string): boolean {
  return /\b[A-Z][A-Za-z0-9'’-]{2,}\b/.test(value) && !META.test(value);
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
    .replace(/\b(?:story|receipt|message|text)\s+(?:about|for)\b.*$/i, ""));
}

function subjectCandidates(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  return unique([
    ...premiseValues(plan, "subject"),
    ...premiseValues(plan, "participants"),
    ...premiseValues(plan, "social"),
    ...(beat.entities ?? []),
    clean(plan?.centralSubject),
  ])
    .map(stripDeliveryTail)
    .filter((value) => value.length >= 2 && !META.test(value));
}

function subject(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const candidates = subjectCandidates(beat, plan);
  const named = candidates
    .filter((value) => likelyName(value) && !DELIVERY.test(value))
    .sort((a, b) => a.length - b.length)[0];
  if (named) return named;

  const useful = candidates
    .map((value, index) => {
      let score = 0;
      if (isGeneric(value)) score -= 80;
      if (likelyName(value)) score += 35;
      if (ACTION.test(value)) score -= 8;
      if (value.split(/\s+/).length <= 3) score += 8;
      if (value.length >= 3 && value.length <= 40) score += 4;
      score -= index * 0.01;
      return { value, score };
    })
    .sort((a, b) => b.score - a.score)[0]?.value;

  return useful || "the subject";
}

function clauses(value: string): string[] {
  return unique(
    sentence(value)
      .replace(/\b(?:and then|then)\b/gi, ",")
      .split(/,|;|\s+and\s+/i)
      .map((part) => part.trim())
      .map((part) => part.replace(/^(?:shows?|showing|about|that|which|what)\s+/i, ""))
      .filter((part) => part.length >= 3)
      .slice(0, 16),
  );
}

function rawEvidence(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  return unique([
    ...premiseValues(plan, "event"),
    ...premiseValues(plan, "artifact"),
    ...premiseValues(plan, "outcome"),
    ...premiseValues(plan, "affordance"),
    ...premiseValues(plan, "place"),
    ...premiseValues(plan, "temporal"),
    ...premiseValues(plan, "participants"),
    ...premiseValues(plan, "social"),
    ...premiseValues(plan, "transformation"),
    ...premiseValues(plan, "emotion"),
    ...(beat.entities ?? []),
    beat.text,
    ...((plan?.realization?.directives ?? []).flatMap((item) => [item.action, item.intent, item.stateBefore, item.stateAfter])),
  ]);
}

function actionAtoms(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const atoms: string[] = [];

  for (const value of rawEvidence(beat, plan)) {
    for (const clause of clauses(value)) {
      const words = clause.split(/\s+/).filter(Boolean);
      const actionIndex = words.findIndex((word) => ACTION_WORDS.has(word.toLowerCase().replace(/[^a-z]/g, "")));
      if (actionIndex >= 0) {
        const tail = words.slice(actionIndex, Math.min(words.length, actionIndex + 7)).join(" ");
        if (tail.length >= 3 && !META.test(tail)) atoms.push(tail);
      }
    }
  }

  return unique(atoms).filter((value) => !DELIVERY.test(value) || ACTION.test(value)).slice(0, 12);
}

function concreteDetails(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const subjectValue = lower(subject(beat, plan));
  const candidates = rawEvidence(beat, plan)
    .flatMap(clauses)
    .map((value) => sentence(value).replace(new RegExp(`^${subjectValue}\\s+`, "i"), "").trim())
    .filter((value) => value.length >= 3 && !META.test(value));

  return unique(candidates)
    .map((value, index) => {
      let score = 0;
      if (ACTION.test(value)) score += 30;
      if (/\b(?:show|shows|story|receipt|experience|business|customer|client|new memories|later visitors|meaningful point|progression)\b/i.test(value)) score -= 40;
      if (value.length >= 5 && value.length <= 90) score += 8;
      score -= index * 0.01;
      return { value, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.value)
    .slice(0, 12);
}

function bestAction(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const directive = sentence(plan?.realization?.directives.find((item) => item.kind === beat.kind)?.action);
  if (directive && !META.test(directive) && !DELIVERY.test(directive)) return directive;
  return actionAtoms(beat, plan)[0];
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

function afterState(plan?: CognitiveExperiencePlan): string | undefined {
  const transformation = premiseValues(plan, "transformation");
  if (transformation[1]) return sentence(transformation[1]);
  const outcome = premiseValues(plan, "outcome")[0];
  if (outcome) return sentence(outcome);
  return plan?.realization?.directives
    .map((item) => sentence(item.stateAfter))
    .find((value) => value && !META.test(value) && !DELIVERY.test(value));
}

function beforeState(plan?: CognitiveExperiencePlan): string | undefined {
  const transformation = premiseValues(plan, "transformation");
  if (transformation[0]) return sentence(transformation[0]);
  return plan?.realization?.directives
    .map((item) => sentence(item.stateBefore))
    .find((value) => value && !META.test(value) && !DELIVERY.test(value));
}

type ActionClass = "care" | "repair" | "clean" | "journey" | "celebrate" | "create" | "generic";

function actionClass(actions: string[], plan?: CognitiveExperiencePlan): ActionClass {
  const text = lower(actions.join(" ") + " " + signalText(plan));
  if (/\b(?:groom|wash|massage|pamper|style|trim|brush|dry|treat)\b/.test(text)) return "care";
  if (/\b(?:repair|fix|restore|inspect|test|install)\b/.test(text)) return "repair";
  if (/\b(?:clean|organize|organise|scrub|polish)\b/.test(text)) return "clean";
  if (/\b(?:travel|drive|ride|journey|visit|return|go|went)\b/.test(text)) return "journey";
  if (/\b(?:celebrate|marry|wedding|party|birthday|dance|vow)\b/.test(text)) return "celebrate";
  if (/\b(?:build|make|create|design|write|cook|bake|paint|craft)\b/.test(text)) return "create";
  return "generic";
}

const CREATIVE_AFFORDANCES: Record<ActionClass, string[]> = {
  care: ["bubbles", "a warm towel", "a little finishing touch", "one surprisingly serious styling decision"],
  repair: ["one last test", "a stubborn little rattle", "one final adjustment", "the moment the machine finally behaved"],
  clean: ["one last stubborn spot", "the final polish", "a suspiciously perfect finish", "the last crumb standing"],
  journey: ["an unexpected turn", "a view worth stopping for", "a small detour", "the part of the route nobody planned"],
  celebrate: ["one perfectly timed moment", "a little extra drama", "a toast that went longer than expected", "the detail everyone remembered"],
  create: ["one final adjustment", "the finishing touch", "a tiny decision that changed the whole look", "the last stroke"],
  generic: ["one small surprise", "a tiny turn", "a finishing detail", "one detail nobody expected"],
};

function creativeAffordance(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  if (!playful(plan) || SERIOUS.test(signalText(plan))) return undefined;
  const kind = actionClass(actionAtoms(beat, plan), plan);
  return choose(CREATIVE_AFFORDANCES[kind], `${subject(beat, plan)}|affordance|${beat.order}|${kind}`);
}

function creativePressure(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  if (!playful(plan) || SERIOUS.test(signalText(plan))) return undefined;

  const actions = actionAtoms(beat, plan);
  const kind = actionClass(actions, plan);
  const seed = `${subject(beat, plan)}|${beat.kind}|${beat.order}|${actions.join("|")}`;
  const affordance = creativeAffordance(beat, plan);

  const candidates: Record<ActionClass, string[]> = {
    care: [
      "one finishing touch became a surprisingly serious matter",
      "the smallest detail suddenly had the biggest opinion",
      "the final styling decision was treated like a matter of international importance",
    ],
    repair: [
      "one last rattle refused to leave quietly",
      "the final test produced exactly enough drama to keep things interesting",
      "one stubborn little detail demanded a second opinion",
    ],
    clean: [
      "one suspiciously stubborn detail survived until the very end",
      "the last little imperfection appeared to be negotiating for its life",
      "one tiny mess somehow became the final boss",
    ],
    journey: [
      "one unexpected turn made the route considerably more memorable",
      "the trip acquired a small plot twist of its own",
      "one detour turned out to be exactly the kind of thing people remember",
    ],
    celebrate: [
      "one tiny detail threatened to steal the scene",
      "the moment picked up just enough drama to become a story",
      "someone made one decision that guaranteed nobody would forget the night",
    ],
    create: [
      "one tiny decision suddenly mattered far more than expected",
      "the finishing touch developed a personality of its own",
      "one last adjustment turned out to be the difference between ordinary and memorable",
    ],
    generic: [
      "one small detail became impossible to ignore",
      "the ordinary part of the moment developed an unexpected personality",
      "one little turn made the whole thing more interesting",
    ],
  };

  const selected = choose(candidates[kind], seed);
  if (affordance && beat.kind !== "transformation" && beat.kind !== "payoff") {
    return choose([selected, `${affordance} became part of the story`, `Then came ${affordance}`], `${seed}|affordance`);
  }
  return selected;
}

function opening(name: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  if (playful(plan)) {
    return choose([
      `${name} walked in looking suspicious.`,
      `${name} showed up with opinions.`,
      `${name} arrived looking like this deserved a very close inspection.`,
      `${name} walked in as if someone had already made a questionable decision.`,
      `${name} arrived ready to see what the day had planned.`,
    ], `${name}|opening|${beat.order}`);
  }
  const action = actionAtoms(beat, plan)[0];
  return action ? `${name} ${sentence(action)}.` : `${name} arrives, and the experience begins.`;
}

function hook(name: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const detail = concreteDetails(beat, plan).find((value) => ACTION.test(value));
  if (playful(plan)) {
    return detail
      ? choose([
          `The first move was simple: ${sentence(detail).toLowerCase()}.`,
          `Then things started moving: ${sentence(detail).toLowerCase()}.`,
          `At first, the situation looked manageable.`,
        ], `${name}|hook|${beat.order}`)
      : `Things started normally, which was clearly not going to last.`;
  }
  return detail ? `${sentence(detail)}.` : `${name} is now fully in the moment.`;
}

function encounter(name: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const pressure = creativePressure(beat, plan);
  const detail = concreteDetails(beat, plan).find((value) => ACTION.test(value) && !/show|story|receipt/i.test(value));
  if (playful(plan)) {
    if (pressure) return choose([
      `${pressure.charAt(0).toUpperCase() + pressure.slice(1)}.`,
      `Then came the part nobody had quite planned for: ${pressure}.`,
      `That was when ${pressure}.`,
    ], `${name}|encounter|${beat.order}`);
    return detail ? `Then came ${sentence(detail).toLowerCase()}.` : `The next part arrived with its own personality.`;
  }
  return detail ? `${sentence(detail)}.` : undefined;
}

function actionBeat(name: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const action = bestAction(beat, plan);
  const details = concreteDetails(beat, plan);
  const detail = details.find((value) => ACTION.test(value));
  if (action && !DELIVERY.test(action)) {
    const normalized = sentence(action);
    return `${normalized.charAt(0).toUpperCase() + normalized.slice(1)}.`;
  }
  return detail ? `${sentence(detail)}.` : `${name} keeps the moment moving.`;
}

function transformation(name: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const before = beforeState(plan);
  const after = afterState(plan);
  if (before && after && lower(before) !== lower(after)) {
    return `${name} came out of it different: ${after}.`;
  }
  if (playful(plan)) {
    return choose([
      `By the end, the whole situation had changed.`,
      `Somewhere along the way, ordinary turned into memorable.`,
      `By then, the mood had completely changed.`,
    ], `${name}|transformation|${beat.order}`);
  }
  return after ? `${name} came out of it ${after}.` : `By the end, the situation had changed.`;
}

function payoff(name: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const after = afterState(plan);
  if (playful(plan)) {
    return after
      ? choose([
          `${name} left ${after}, looking like the whole thing had been worth it.`,
          `${name} walked out ${after}, with the kind of attitude that suggested this story was not over.`,
          `${name} left ${after}, ready to take the victory lap.`,
        ], `${name}|payoff|${beat.order}`)
      : choose([
          `By the time it was over, ${name} looked like the day had upgraded them.`,
          `Out the door went a completely different mood.`,
          `The final verdict was simple: worth the trip.`,
        ], `${name}|payoff|${beat.order}`);
  }
  return after ? `${name} reaches ${after}.` : `The experience resolves in a visible result.`;
}

function realizeBeat(name: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  switch (beat.kind) {
    case "orientation": return opening(name, beat, plan);
    case "hook": return hook(name, beat, plan);
    case "origin": {
      const actions = actionAtoms(beat, plan);
      return actions[0] ? `The story starts with ${sentence(actions[0]).toLowerCase()}.` : `This is where the story gets moving.`;
    }
    case "encounter": return encounter(name, beat, plan);
    case "challenge": {
      const pressure = creativePressure(beat, plan);
      return pressure ? `Then came the challenge: ${pressure}.` : `Something in the moment demanded a response.`;
    }
    case "action": return actionBeat(name, beat, plan);
    case "contribution": {
      const detail = concreteDetails(beat, plan).find((value) => ACTION.test(value));
      return detail ? `That changed the moment: ${sentence(detail)}.` : `The moment started to carry its own momentum.`;
    }
    case "discovery": {
      const pressure = creativePressure(beat, plan);
      const detail = concreteDetails(beat, plan).find((value) => !DELIVERY.test(value) && value.length > 5);
      return pressure ? `Then came the realization: ${pressure}.` : detail ? `That was when ${sentence(detail).toLowerCase()} finally clicked.` : `Something new clicked into place.`;
    }
    case "reveal": {
      const after = afterState(plan);
      return after ? `The result was finally clear: ${after}.` : `The important part finally came into view.`;
    }
    case "feedback": {
      const detail = concreteDetails(beat, plan).find((value) => ACTION.test(value));
      return detail ? `And the result showed it: ${sentence(detail)}.` : `The result spoke for itself.`;
    }
    case "escalation": {
      const pressure = creativePressure(beat, plan);
      return pressure ? `Naturally, it went further. ${pressure.charAt(0).toUpperCase() + pressure.slice(1)}.` : `Then the moment turned up the volume.`;
    }
    case "transformation": return transformation(name, beat, plan);
    case "reflection": return playful(plan) ? `For a moment, it was easy to see how far the whole thing had come.` : `The change was visible in retrospect.`;
    case "identity": return playful(plan) ? `At this point, the attitude had become part of the story.` : `The experience now carried a recognizable identity.`;
    case "milestone": return playful(plan) ? `That felt like the moment worth remembering.` : `That became the visible milestone.`;
    case "unlock":
    case "earned_access": return `The next part was earned by what happened before.`;
    case "payoff": return payoff(name, beat, plan);
    case "next_step": return playful(plan) ? `So naturally, there was only one thing left to do: keep going.` : `The next step follows from what just happened.`;
    case "continuation": return playful(plan) ? `And that is how an ordinary moment gets a second life.` : `The result remains available for what comes next.`;
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
    beat.text,
  ]);
  if (!evidence.length) return undefined;

  const name = subject(beat, plan);
  const text = realizeBeat(name, beat, plan);
  if (!text) return undefined;
  return sentence(text) + ".";
}

export function inspectTransformation(beat: StoryBeat, plan?: CognitiveExperiencePlan) {
  const explicit = premiseValues(plan, "transformation");
  return {
    subject: subject(beat, plan),
    before: explicit[0] ?? beforeState(plan),
    after: explicit[1] ?? afterState(plan),
    evidence: [
      ...premiseValues(plan, "event"),
      ...premiseValues(plan, "artifact"),
      ...premiseValues(plan, "outcome"),
      ...premiseValues(plan, "affordance"),
      ...premiseValues(plan, "transformation"),
      ...actionAtoms(beat, plan),
      ...concreteDetails(beat, plan),
    ].slice(0, 24),
    playful: playful(plan),
    beatKind: beat.kind,
  };
}
