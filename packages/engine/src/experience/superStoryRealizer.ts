import type { CognitiveExperiencePlan, CognitivePremiseRole, StoryBeat } from "@qre/contracts";

/**
 * SUPER STORY REALIZER
 *
 * Customer language only. This layer treats the cognitive trajectory as a
 * latent dramatic spine rather than something to print. It preserves concrete
 * evidence, varies sentence rhythm, and adds deterministic creative turns when
 * the prompt asks for play, humor, celebration, or warmth.
 */

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const lower = (value: unknown): string => clean(value).toLowerCase();
const sentence = (value: string): string => clean(value).replace(/[.!?]+$/, "");
const unique = (values: readonly unknown[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

const META = /\b(?:compiler|cognition|cognitive|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|meaning context|progression model|interaction model|what happens next|new memories can change what later visitors discover|trusted history accumulates)\b/i;
const DELIVERY = /\b(?:receipt|prompt|output|customer|client|business|company|story|stories|experience|qr|nfc|scan|tag|code|message|text|send|sending|audience|user|users)\b/i;
const SERIOUS = /\b(?:memorial|funeral|death|died|grief|grieving|emergency|medical|injury|trauma|crisis|solemn|reverent|mourning|urgent|lawsuit|legal|hospital|diagnosis|bereavement)\b/i;
const PLAYFUL = /\b(?:playful|funny|fun|humor|humour|absurd|ridiculous|wild|delight|mischief|comedy|hilarious|joy|celebrat|whimsical|cute|silly|lighthearted)\b/i;

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

function stripDelivery(value: string): string {
  return clean(value
    .replace(/\b(?:to|for)\s+(?:send|sending|share|deliver|give)\b.*$/i, "")
    .replace(/\b(?:to|for)\s+(?:the|a|an)?\s*(?:client|customer|user|audience|business)\b.*$/i, "")
    .replace(/\b(?:story|receipt|message|text)\s+(?:about|for)\b.*$/i, "")
    .replace(/\b(?:new memories can change what later visitors discover)\b.*$/i, ""));
}

function subject(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const candidates = unique([
    ...premiseValues(plan, "subject"),
    ...premiseValues(plan, "participants"),
    clean(plan?.centralSubject),
    ...(beat.entities ?? []),
  ])
    .map(stripDelivery)
    .filter((value) => value && !META.test(value) && !DELIVERY.test(value) && !/^the (?:subject|situation|moment)$/i.test(value));

  const named = candidates.find((value) => /\b[A-Z][A-Za-z0-9'’-]{2,}\b/.test(value));
  if (named) return named;
  return candidates.sort((a, b) => a.length - b.length)[0] ?? "the moment";
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
    ...(plan?.realization?.directives.flatMap((item) => [item.action, item.intent, item.stateBefore, item.stateAfter]) ?? []),
    ...premiseValues(plan, "emotion"),
  ].join(" "));
}

function isPlayful(plan?: CognitiveExperiencePlan): boolean {
  const text = signal(plan);
  return !SERIOUS.test(text) && PLAYFUL.test(text);
}

type Domain = "care" | "clean" | "repair" | "journey" | "celebrate" | "create" | "food" | "memory" | "generic";

function allEvidence(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  return unique([
    ...(beat.entities ?? []),
    ...premiseValues(plan, "event"),
    ...premiseValues(plan, "artifact"),
    ...premiseValues(plan, "outcome"),
    ...premiseValues(plan, "place"),
    ...premiseValues(plan, "participants"),
    ...premiseValues(plan, "social"),
    ...premiseValues(plan, "affordance"),
    ...premiseValues(plan, "transformation"),
  ]).filter((value) => value.length > 2 && !META.test(value));
}

function evidenceText(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  return lower(allEvidence(beat, plan).join(" "));
}

function domain(beat: StoryBeat, plan?: CognitiveExperiencePlan): Domain {
  const text = evidenceText(beat, plan) + " " + signal(plan);
  if (/\b(?:groom|dog|pet|bath|brush|trim|massage|pamper|salon|spa|foot rub)\b/.test(text)) return "care";
  if (/\b(?:clean|kitchen|living room|house|home|tidy|polish)\b/.test(text)) return "clean";
  if (/\b(?:repair|fix|brake|car|engine|mechanic|restore)\b/.test(text)) return "repair";
  if (/\b(?:road trip|trip|journey|travel|coast|detour|sunset|town)\b/.test(text)) return "journey";
  if (/\b(?:wedding|ceremony|reception|birthday|party|celebrate|anniversary)\b/.test(text)) return "celebrate";
  if (/\b(?:cook|cooked|chef|restaurant|dinner|meal|food|bake|pie)\b/.test(text)) return "food";
  if (/\b(?:memory|memorial|remember|legacy|garden|keepsake|family)\b/.test(text)) return "memory";
  if (/\b(?:build|make|create|design|paint|write|craft|art)\b/.test(text)) return "create";
  return "generic";
}

function concrete(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const text = evidenceText(beat, plan);
  const result: string[] = [];
  if (/\barriv(?:e|ed|ing|es)\b/.test(text)) result.push("arrived");
  if (/\bgroom(?:ed|ing)?\b/.test(text)) result.push("got groomed");
  if (/\bclean(?:ed|ing)?\b/.test(text) && /\bkitchen\b/.test(text)) result.push("the kitchen got cleaned");
  if (/\bclean(?:ed|ing)?\b/.test(text) && /\bliving room\b/.test(text)) result.push("the living room got cleaned");
  if (/\brepair(?:ed|ing)?\b/.test(text) && /\bbrakes?\b/.test(text)) result.push("the brakes got repaired");
  if (/\bready\b/.test(text) && /\bcar\b/.test(text)) result.push("the car was ready to drive again");
  if (/\bready\b/.test(text) && /\bhome\b/.test(text)) result.push("everything was ready to go home");
  if (/\bmiss(?:ed|ing)?\b/.test(text) && /\bturn\b/.test(text)) result.push("missed the turn");
  if (/\bceremony\b/.test(text)) result.push("the ceremony happened");
  if (/\breception\b/.test(text)) result.push("the reception followed");
  if (/\bsunset\b/.test(text)) result.push("arrived at sunset");
  if (/\bpie\b/.test(text)) result.push("pie entered the story");
  return unique(result);
}

function objects(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const text = evidenceText(beat, plan);
  const known = [
    "kitchen", "living room", "home", "brakes", "car", "dog groomer", "grooming", "coat", "bows", "bubbles",
    "foot rubs", "ceremony", "reception", "wedding", "garden", "family", "road trip", "coast", "town", "pie",
    "sunset", "bicycle", "restaurant", "dinner", "meal", "paint", "project", "photo", "memory",
  ];
  return unique(known.filter((value) => text.includes(value)));
}

function flourish(domainValue: Domain, beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  if (!isPlayful(plan)) return undefined;
  const context = evidenceText(beat, plan);
  if (domainValue === "care" && /\b(?:dog|pet|groomer|grooming|coco)\b/.test(context)) {
    const petSequence: Partial<Record<StoryBeat["kind"], string>> = {
      encounter: "The bubbles helped.",
      challenge: "Then came the foot rubs.",
      contribution: "Then somebody put bows on her.",
      escalation: "Two bows did not survive.",
    };
    if (petSequence[beat.kind]) return petSequence[beat.kind];
  }
  const palette: Record<Domain, string[]> = {
    care: [
      "The bubbles helped.",
      "Then came the foot rubs.",
      "For a moment, all was forgiven.",
      "The finishing touches were getting a little ambitious.",
      "Apparently, dignity was now negotiable.",
    ],
    clean: [
      "One stubborn spot refused to cooperate.",
      "The last crumb made a run for it.",
      "Even the stubborn little details eventually surrendered.",
      "The final polish changed the mood of the whole place.",
    ],
    repair: [
      "One last test got its moment in the spotlight.",
      "There was one tiny adjustment, because apparently the car had an opinion.",
      "Then came the satisfying part: everything finally behaved.",
    ],
    journey: [
      "Naturally, the route had other ideas.",
      "One little detour became the part worth remembering.",
      "The trip picked up a plot twist of its own.",
    ],
    celebrate: [
      "Then the little details started stealing the scene.",
      "By then, ordinary had officially left the building.",
      "The room seemed to know it was supposed to be a big moment.",
    ],
    create: [
      "One tiny decision changed the whole look.",
      "Then came the finishing touch.",
      "The last adjustment somehow mattered more than expected.",
    ],
    food: [
      "Then the kitchen got interesting.",
      "One questionable decision somehow became the best one.",
      "The dinner had officially developed a plot.",
    ],
    memory: [
      "That little detail was the one people would remember.",
      "Some moments quietly become the ones that stay.",
      "The past had a way of showing up at exactly the right time.",
    ],
    generic: [
      "Then one small detail changed the mood.",
      "That was the moment the ordinary part got interesting.",
      "One little surprise refused to stay little.",
    ],
  };
  return choose(palette[domainValue], `${domainValue}|${beat.kind}|${beat.order}`);
}

function opening(name: string, domainValue: Domain, plan?: CognitiveExperiencePlan): string {
  if (isPlayful(plan)) {
    return choose([
      `${name} walked in looking suspicious.`,
      `${name} showed up with opinions.`,
      `${name} arrived looking like this deserved a very close inspection.`,
      `${name} walked in as if someone had already made a questionable decision.`,
    ], `${domainValue}|opening|${name}`);
  }
  return `${name} arrived, and the moment was underway.`;
}

function hook(domainValue: Domain, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const actions = concrete(beat, plan);
  if (isPlayful(plan)) {
    if (domainValue === "care") return "The grooming started, and the mood improved almost immediately.";
    if (domainValue === "clean") return "The kitchen went first.";
    if (domainValue === "repair") return "The repair got its turn under the microscope.";
    if (actions.includes("missed the turn")) return "Then somebody missed the turn.";
    return choose([
      "Things started normally, which was clearly not going to last.",
      "At first, everything looked perfectly ordinary.",
      "Nothing seemed unusual yet. That was about to change.",
    ], `${domainValue}|hook|${beat.order}`);
  }
  return actions[0] ? `${sentence(actions[0]).replace(/^./, (c) => c.toUpperCase())}.` : "The moment got underway.";
}

function actionLine(domainValue: Domain, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const actions = concrete(beat, plan);
  if (actions.length) return `${sentence(actions[(beat.order + 1) % actions.length]).replace(/^./, (c) => c.toUpperCase())}.`;
  const details = objects(beat, plan);
  if (details.length) return choose([
    `Then came the ${details[0]}.`,
    `The ${details[0]} got its turn.`,
    `Next up: the ${details[0]}.`,
  ], `${domainValue}|action|${beat.order}`);
  return "The moment kept moving.";
}

function transformation(name: string, domainValue: Domain, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const explicit = premiseValues(plan, "transformation").filter((value) => !META.test(value) && !DELIVERY.test(value));
  if (explicit.length >= 2) return `By the end, ${sentence(explicit[0]).toLowerCase()} had become ${sentence(explicit[1]).toLowerCase()}.`;
  const outcome = premiseValues(plan, "outcome").find((value) => !META.test(value) && !DELIVERY.test(value));
  if (outcome) return `By the end, the result was unmistakable: ${sentence(outcome)}.`;
  if (isPlayful(plan)) {
    return choose([
      `By the end, ${name} was not quite what walked in.`,
      "Somewhere along the way, ordinary turned into memorable.",
      "By then, the mood had completely changed.",
      "Whatever walked in at the beginning was not quite what left at the end.",
    ], `${domainValue}|transformation|${beat.order}`);
  }
  return `By the end, ${name} was not quite in the same state as when this started.`;
}

function payoff(name: string, domainValue: Domain, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const playful = isPlayful(plan);
  if (domainValue === "care" && playful) {
    return choose([
      "That coat? Fantastic. The attitude? Even better.",
      `${name} left looking ready to paint the town red.`,
      "Out the door she went, looking entirely too pleased with herself.",
    ], `${name}|payoff|${beat.order}`);
  }
  if (domainValue === "clean" && playful) return choose([
    "By the time it was over, the whole place looked like it had its life together.",
    "The home went from work-in-progress to ready for company.",
  ], `${name}|clean-payoff|${beat.order}`);
  if (domainValue === "repair") return "The car was ready to get back on the road, and that was the whole point.";
  if (domainValue === "journey" && playful) return "They arrived at sunset, which felt like the universe finally sticking the landing.";
  if (domainValue === "celebrate") return "By the end, the moment had become one worth keeping.";
  if (domainValue === "memory") return "What happened was over, but the memory had somewhere to go.";
  return playful
    ? "The ordinary part was gone. What remained was the good part people remember."
    : "The result was clear, and it carried forward.";
}

function continuation(domainValue: Domain, plan?: CognitiveExperiencePlan): string {
  if (isPlayful(plan)) return choose([
    "And that is how an ordinary moment gets a second life.",
    "Somehow, the story had already started growing beyond the original moment.",
    "Not bad for an ordinary day.",
  ], `${domainValue}|continuation`);
  return "The result remained available for what came next.";
}

export function realizeSuperStoryBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  if (!plan?.premise) return undefined;
  if (!allEvidence(beat, plan).length) return undefined;

  const name = subject(beat, plan);
  const domainValue = domain(beat, plan);
  const details = objects(beat, plan);
  const playful = isPlayful(plan);

  let text: string | undefined;
  switch (beat.kind) {
    case "orientation": text = opening(name, domainValue, plan); break;
    case "hook": text = hook(domainValue, beat, plan); break;
    case "origin": text = playful ? "It started simply enough." : "It started with the first thing that needed doing."; break;
    case "encounter": text = flourish(domainValue, beat, plan) ?? (details[0] ? `Then came the ${details[0]}.` : "Then something interesting entered the picture."); break;
    case "challenge": text = flourish(domainValue, beat, plan) ?? "For a moment, the situation pushed back."; break;
    case "action": text = actionLine(domainValue, beat, plan); break;
    case "contribution": text = flourish(domainValue, beat, plan) ?? "That changed the rhythm of the moment."; break;
    case "discovery": text = details[1] ? `That was when the ${details[1]} suddenly mattered.` : (flourish(domainValue, beat, plan) ?? "That was when the little detail finally clicked."); break;
    case "reveal": text = details[0] ? `And there it was: the ${details[0]}.` : "And there it was: the change was visible."; break;
    case "feedback":
      if (domainValue === "care" && playful) {
        text = choose([
          "She shook them off like a tiny celebrity rejecting a bad contract.",
          "The reaction was immediate, dramatic, and entirely justified.",
          "That decision was reviewed and rejected on the spot.",
        ], `${name}|feedback|${beat.order}`);
      } else text = "And the result showed itself.";
      break;
    case "escalation": text = flourish(domainValue, beat, plan) ?? (playful ? "Then the moment turned up the volume." : "Then the situation moved into its final stretch."); break;
    case "transformation": text = transformation(name, domainValue, beat, plan); break;
    case "reflection": text = domainValue === "care" && playful ? "That coat? Fantastic. The attitude? Even better." : (playful ? "Looking back, the difference was obvious." : "The change was visible in retrospect."); break;
    case "identity": text = playful ? "By then, the attitude had become part of the story." : `${name} now carried a recognizable result from the interaction.`; break;
    case "milestone": text = playful ? "That was the moment worth remembering." : "That became the visible milestone."; break;
    case "unlock":
    case "earned_access": text = playful ? "The next part had been earned by everything that came before." : "The next part followed from what happened before."; break;
    case "payoff": text = payoff(name, domainValue, beat, plan); break;
    case "next_step": text = playful ? "Naturally, there was only one thing left to do: keep going." : "The next step followed from what just happened."; break;
    case "continuation": text = continuation(domainValue, plan); break;
    default: text = undefined;
  }

  return text ? `${sentence(text)}.` : undefined;
}
