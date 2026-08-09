/**
 * =============================================================
 * QRE SUPER COG — UNIVERSAL COGNITIVE EXPERIENCE COMPILER
 * =============================================================
 *
 * Prompt
 *   ↓
 * Evidence
 *   ↓
 * Understanding
 *   ↓
 * Hypotheses
 *   ↓
 * Opportunity space
 *   ↓
 * Selected direction
 *   ↓
 * Cognitive plan
 *   ↓
 * Universal realization
 *   ↓
 * Blueprint / Flow / Moments / Scenes
 *
 * This file is the decision-making layer. It does not select a
 * business template. It scores semantic possibilities from the
 * prompt, preserves evidence, and realizes the selected cognition.
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 * =============================================================
 */

import {
  extractEntities,
} from "../compiler/entityExtractor.js";

import {
  cinematicRuntime,
} from "../runtime/cinematic/cinematicRuntime.js";

import type {
  CognitiveCompilation,
  CognitiveDirection,
  CognitiveEvidence,
  CognitiveExperiencePlan,
  CognitiveHypothesis,
  CognitiveOpportunitySet,
  CognitiveSubject,
  CognitiveUnderstanding,
  ExperienceBlueprint,
  ExperienceEnergy,
  ExperienceGenome,
  ExperienceIndustry,
  ExperienceMeaning,
  ExperienceModel,
  ExperienceMoment,
  ExperiencePacing,
  ExperienceSocial,
  ExperienceStory,
  ExperienceTone,
  ExperienceType,
  ExperienceWorld,
  FlowStep,
  Moment,
  CinematicScene,
  StoryBeat,
  StoryBeatKind,
  StoryScenePlan,
} from "@qre/contracts";

const UNIQUE = (values: string[]): string[] =>
  [...new Set(values.map((value) => value.trim()).filter(Boolean))];

const lower = (value: string): string => value.toLowerCase();

const has = (text: string, terms: readonly string[]): boolean =>
  terms.some((term) => text.includes(term));

const count = (text: string, terms: readonly string[]): number =>
  terms.reduce((total, term) => total + (text.includes(term) ? 1 : 0), 0);

const cap = (value: string): string =>
  value.length ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const evidence = (
  signal: string,
  source: CognitiveEvidence["source"],
  weight: number,
): CognitiveEvidence => ({
  signal,
  source,
  weight: Math.max(0, Math.min(1, weight)),
});

function extractSubject(prompt: string, entities: ReturnType<typeof extractEntities>): CognitiveSubject {
  const candidates: string[] = [];
  const patterns = [
    /\b(?:for|about|involving|around|using|with|from)\s+(?:my|the|a|an)?\s*([^,.!?;\n]+)/i,
    /\b(?:make|create|turn|preserve|teach|build|design|transform)\s+(?:a|an|the|my|this)?\s*([^,.!?;\n]+?)(?=\s+(?:for|about|so|that|to|feel|into)\b|[,.!?;]|$)/i,
    /\b(?:my|our|this|the)\s+([A-Za-z0-9][^,.!?;\n]{1,60})/i,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match?.[1]) candidates.push(match[1].trim());
  }

  if (entities.products[0]) candidates.push(entities.products[0]);
  if (entities.events[0]) candidates.push(entities.events[0]);
  if (entities.people[0]) candidates.push(entities.people[0]);
  if (entities.places[0]) candidates.push(entities.places[0]);

  const cleaned = candidates
    .map((value) => value.replace(/^(?:a|an|the|my|our|this)\s+/i, "").trim())
    .map((value) => value.split(/\s+(?:tonight|forever|now|today)\b/i)[0].trim())
    .filter((value) => value.length > 1 && value.length < 90);

  const value = cleaned[0] ?? prompt.trim().split(/\s+/).slice(0, 8).join(" ");

  return {
    value,
    confidence: entities.people.length || entities.places.length || entities.products.length ? 0.94 : 0.78,
    evidence: [evidence(value, "prompt", 0.9)],
  };
}

function understand(prompt: string): CognitiveUnderstanding {
  const text = lower(prompt);
  const entities = extractEntities(prompt);
  const themes: string[] = [];
  const emotions: string[] = [];
  const memorySignals: string[] = [];
  const worldSignals: string[] = [];
  const affordances: string[] = [];

  const add = (target: string[], values: readonly string[]) => {
    for (const value of values) if (text.includes(value)) target.push(value);
  };

  add(themes, ["memory", "memorial", "legacy", "preserve", "history", "old", "forever", "remember"]);
  add(themes, ["mystery", "mysterious", "secret", "hidden", "portal", "unknown", "rare", "exclusive", "discover"]);
  add(themes, ["hunt", "quest", "puzzle", "challenge", "game", "mission"]);
  add(themes, ["teach", "learn", "how to", "guide", "instructions", "explain"]);
  add(themes, ["together", "everyone", "people", "group", "community", "friends", "fans", "crowd"]);
  add(themes, ["brand", "business", "shop", "customer", "product", "launch", "sell", "loyalty"]);
  add(themes, ["travel", "traveled", "journey", "destination", "route", "map", "place", "location"]);
  add(themes, ["identity", "profile", "owner", "artist", "creator", "signature"]);
  add(themes, ["dog", "cat", "pet", "grandmother", "grandfather", "wedding", "family"]);

  if (has(text, ["love", "romantic", "grandmother", "grandfather", "memorial", "wedding"])) emotions.push("tenderness");
  if (has(text, ["fun", "wild", "weird", "crazy", "playful"])) emotions.push("playfulness");
  if (has(text, ["mysterious", "secret", "hidden", "unknown"])) emotions.push("curiosity");
  if (has(text, ["exciting", "rave", "nightclub", "hunt", "challenge"])) emotions.push("excitement");
  if (has(text, ["luxury", "premium", "elite"])) emotions.push("aspiration");
  if (has(text, ["missing", "lost", "protect", "safe", "emergency"])) emotions.push("urgency");

  if (has(text, ["remember", "memory", "memorial", "preserve", "old", "legacy", "forever"])) {
    memorySignals.push("past is relevant to the present");
  }
  if (has(text, ["forever", "after", "future", "gone", "keep growing"])) {
    memorySignals.push("the experience should persist into the future");
  }
  if (entities.places.length || has(text, ["at ", "near ", "travel", "traveled", "destination", "route", "map"])) {
    worldSignals.push("place or movement can carry meaning");
  }
  if (entities.events.length || entities.places.length) worldSignals.push("environment can participate in the experience");

  add(affordances, ["scan", "tap", "click", "play", "hunt", "solve", "learn", "share", "remember", "discover", "return", "buy", "book", "contribute", "navigate"]);
  if (!affordances.length) affordances.push("notice", "respond", "return");

  const intent = has(text, ["teach", "how to", "explain", "guide"])
    ? ["teach"]
    : has(text, ["preserve", "remember", "memorial", "keep", "forever"])
      ? ["preserve"]
      : has(text, ["sell", "loyalty", "customer", "brand", "launch"])
        ? ["engage"]
        : has(text, ["find", "hunt", "discover", "secret", "mystery"])
          ? ["discover"]
          : ["create"];

  return {
    prompt,
    intent,
    themes: UNIQUE(themes),
    entities,
    relationships: [],
    emotions: UNIQUE(emotions),
    memorySignals: UNIQUE(memorySignals),
    audience: UNIQUE(
      [
        ...(entities.people.length ? ["named people"] : []),
        ...(has(text, ["everyone", "people", "group", "community", "fans", "crowd"]) ? ["shared"] : []),
        ...(has(text, ["customer", "buyer", "client", "shopper"]) ? ["customer"] : []),
        ...(has(text, ["kids", "children"])? ["children"] : []),
      ],
    ),
    worldSignals: UNIQUE(worldSignals),
    affordances: UNIQUE(affordances),
    confidence: Math.min(0.98, 0.45 + Math.min(0.45, (themes.length + emotions.length + worldSignals.length) * 0.05)),
  };
}

const DIRECTION_TERMS: Record<CognitiveDirection, readonly string[]> = {
  utility: ["teach", "how to", "guide", "instruction", "explain", "help", "learn", "fix"],
  game: ["game", "hunt", "quest", "puzzle", "challenge", "mission", "play"],
  discovery: ["secret", "hidden", "mystery", "mysterious", "portal", "unknown", "rare", "exclusive", "reveal", "discover"],
  memory: ["memory", "memorial", "grandmother", "grandfather", "remember", "preserve", "old", "legacy", "forever", "gone", "history"],
  social: ["everyone", "people", "together", "group", "community", "friends", "fans", "crowd", "nightclub", "party"],
  commerce: ["brand", "business", "shop", "customer", "product", "launch", "sell", "loyalty", "buyer", "luxury"],
  journey: ["travel", "traveled", "journey", "destination", "route", "map", "path", "way", "movement"],
  identity: ["identity", "profile", "owner", "artist", "creator", "signature", "my story"],
  story: ["story", "experience", "life", "meaning", "about"],
};

function scoreHypotheses(prompt: string, understanding: CognitiveUnderstanding): CognitiveHypothesis[] {
  const text = lower(prompt);
  const hypotheses = (Object.keys(DIRECTION_TERMS) as CognitiveDirection[]).map((kind) => {
    const lexical = count(text, DIRECTION_TERMS[kind]);
    let score = lexical * 0.12;
    const supporting: CognitiveEvidence[] = [];

    if (lexical) supporting.push(evidence(`${kind}:${lexical} semantic signals`, "prompt", Math.min(1, lexical / 4)));
    if (kind === "memory" && understanding.memorySignals.length) score += 0.28;
    if (kind === "social" && understanding.audience.includes("shared")) score += 0.24;
    if (kind === "commerce" && understanding.entities.products.length) score += 0.2;
    if (kind === "journey" && understanding.worldSignals.length) score += 0.18;
    if (kind === "discovery" && understanding.entities.products.length && has(text, ["portal", "secret", "mystery"])) score += 0.2;
    if (kind === "story" && lexical === 0) score += 0.22;
    if (kind === "utility" && understanding.intent.includes("teach")) score += 0.25;

    return {
      kind,
      score: Math.min(1, score),
      rationale: supporting.length
        ? `Supported by ${supporting.map((item) => item.signal).join(", ")}.`
        : "Kept as a lower-confidence alternative because the prompt does not strongly support this direction.",
      evidence: supporting,
    };
  });

  hypotheses.sort((a, b) => b.score - a.score);
  const top = hypotheses[0];
  if (!top || top.score < 0.18) {
    const fallback = hypotheses.find((item) => item.kind === "story");
    if (fallback) fallback.score = Math.max(fallback.score, 0.46);
    hypotheses.sort((a, b) => b.score - a.score);
  }

  const max = hypotheses[0]?.score ?? 1;
  return hypotheses.map((item) => ({
    ...item,
    score: Number((item.score / Math.max(max, 0.001)).toFixed(3)),
  }));
}

function opportunities(prompt: string, understanding: CognitiveUnderstanding): CognitiveOpportunitySet {
  const text = lower(prompt);
  const result: CognitiveOpportunitySet = {
    memory: [],
    geographic: [],
    social: [],
    discovery: [],
    temporal: [],
    commercial: [],
  };

  if (understanding.memorySignals.length || has(text, ["grandmother", "grandfather", "wedding", "old", "past", "forever"])) {
    result.memory.push(`Let ${understanding.entities.people[0] ?? "the subject"} carry evidence of the past into the present.`);
  }
  if (understanding.worldSignals.length || has(text, ["travel", "traveled", "place", "city", "venue", "destination", "map"])) {
    result.geographic.push(`Use place and movement as evidence around ${understanding.entities.places[0] ?? "the subject"}.`);
  }
  if (understanding.audience.includes("shared") || has(text, ["people", "together", "everyone", "group", "community", "nightclub"])) {
    result.social.push(`Let participants change or add to the experience around ${understanding.entities.events[0] ?? "the shared moment"}.`);
  }
  if (has(text, ["secret", "hidden", "mystery", "portal", "unknown", "rare", "discover", "reveal"])) {
    result.discovery.push(`Expose meaning in layers so ${understanding.entities.products[0] ?? "the subject"} is not exhausted by the first encounter.`);
  }
  if (has(text, ["today", "tonight", "tomorrow", "after", "forever", "again", "next", "old", "past"])) {
    result.temporal.push("Let the experience change as time, return visits, or later evidence accumulate.");
  }
  if (understanding.entities.products.length || has(text, ["brand", "shop", "customer", "loyalty", "sell", "launch", "luxury"])) {
    result.commercial.push(`Create value around ${understanding.entities.products[0] ?? "the offering"} without reducing the interaction to a transaction.`);
  }

  return result;
}

function buildPlan(
  prompt: string,
  understanding: CognitiveUnderstanding,
  subject: CognitiveSubject,
  selected: CognitiveHypothesis,
  opportunitiesValue: CognitiveOpportunitySet,
): CognitiveExperiencePlan {
  const direction = selected.kind;
  const subjectName = subject.value;
  const interaction = understanding.affordances[0] ?? "respond";
  const future = opportunitiesValue.temporal[0] ?? `A later interaction can add evidence to ${subjectName}.`;

  const purposeByDirection: Record<CognitiveDirection, string> = {
    utility: `Make ${subjectName} useful by turning understanding into a next action.`,
    game: `Turn ${subjectName} into something the participant can actively test.`,
    discovery: `Give ${subjectName} layers that become visible through attention and action.`,
    memory: `Give ${subjectName} a way to carry what came before into the present.`,
    social: `Make ${subjectName} a shared point where participation changes meaning.`,
    commerce: `Give ${subjectName} a reason to matter beyond the transaction.`,
    journey: `Let ${subjectName} change through movement, sequence, and return.`,
    identity: `Use ${subjectName} to make identity visible through context and participation.`,
    story: `Turn ${subjectName} into an experience whose meaning develops through interaction.`,
  };

  const emotionalIntent = UNIQUE([
    ...understanding.emotions,
    direction === "memory" ? "reflection" : "curiosity",
    direction === "game" ? "excitement" : "attention",
  ]);

  const interactionModel = UNIQUE([
    `Begin with ${subjectName}, then let the participant ${interaction}.`,
    ...(understanding.audience.includes("shared") ? ["Allow another participant's response to alter what comes next."] : []),
    ...(opportunitiesValue.discovery.length ? ["Reveal additional information only when the interaction earns it."] : []),
  ]);

  const storyStructure: string[] = ["orientation"];
  if (understanding.memorySignals.length) storyStructure.push("origin");
  if (has(lower(prompt), ["challenge", "hunt", "quest", "puzzle", "game"])) storyStructure.push("challenge");
  if (has(lower(prompt), ["secret", "hidden", "mystery", "portal", "unknown", "discover"])) storyStructure.push("reveal", "discovery");
  if (understanding.audience.includes("shared")) storyStructure.push("contribution");
  if (understanding.entities.products.length && direction === "commerce") storyStructure.push("identity");
  if (has(lower(prompt), ["change", "transform", "become", "journey", "travel", "traveled"])) storyStructure.push("transformation");
  if (understanding.emotions.length) storyStructure.push("reflection");
  storyStructure.push(direction === "utility" ? "next_step" : "payoff");
  if (future) storyStructure.push("continuation");

  return {
    direction,
    centralSubject: subjectName,
    purpose: purposeByDirection[direction],
    whyInteract: [
      purposeByDirection[direction],
      `The interaction should add evidence to what ${subjectName} means rather than replace it with a preset story.`,
    ],
    interactionModel,
    storyStructure: UNIQUE(storyStructure),
    progressionModel: [
      `Start with what is already known about ${subjectName}.`,
      `Increase specificity as the participant supplies or discovers evidence.`,
      `Return a meaningful consequence of what happened.`,
    ],
    dynamicBehavior: UNIQUE([
      "Choose the next beat from the evidence available at the current moment.",
      ...(opportunitiesValue.discovery.length ? ["Gate deeper material behind demonstrated curiosity or action."] : []),
      ...(opportunitiesValue.social.length ? ["Allow participant contribution to alter later context."] : []),
      ...(opportunitiesValue.temporal.length ? ["Preserve later evidence so repeat encounters can differ."] : []),
    ]),
    futureEvolution: [
      future,
      `New evidence can change the later interpretation of ${subjectName}.`,
    ],
    audience: understanding.audience.length ? understanding.audience : ["participant"],
    emotionalIntent,
    memoryModel: opportunitiesValue.memory,
    creativePossibilities: UNIQUE([
      ...opportunitiesValue.discovery,
      ...opportunitiesValue.geographic,
      ...opportunitiesValue.social,
      ...opportunitiesValue.commercial,
      `Let ${subjectName} remain the semantic anchor while presentation adapts to context.`,
    ]),
    evidence: [
      ...subject.evidence,
      ...selected.evidence,
    ],
    confidence: Math.min(0.98, Math.max(0.55, 0.5 + selected.score * 0.45)),
  };
}

function observe(prompt: string, understanding: CognitiveUnderstanding, subject: CognitiveSubject, plan: CognitiveExperiencePlan): import("@qre/contracts").ExperienceObservation {
  const activity =
    (prompt.match(/\b(create|make|teach|preserve|turn|build|design|transform|find|run|want|keep|help|show)\b/i)?.[1] ?? "experience").toLowerCase();

  return {
    prompt,
    subject: subject.value,
    activity,
    affordances: understanding.affordances,
    audience: understanding.audience,
    explicitEmotions: understanding.emotions,
    context: UNIQUE([...understanding.themes, ...understanding.worldSignals, ...plan.direction]),
    entities: understanding.entities,
    evidence: [
      evidence(subject.value, "prompt", subject.confidence),
      ...plan.evidence,
    ],
  };
}

function situation(prompt: string, understanding: CognitiveUnderstanding): import("@qre/contracts").StorySituation {
  return {
    setting: UNIQUE([
      ...understanding.entities.places,
      ...understanding.entities.events,
      ...understanding.worldSignals,
    ]),
    actors: UNIQUE([
      ...understanding.entities.people,
      ...understanding.audience,
    ]),
    temporal: UNIQUE([
      ...understanding.entities.dates,
      ...understanding.entities.times,
      ...(has(lower(prompt), ["tonight"]) ? ["tonight"] : []),
      ...(has(lower(prompt), ["forever"]) ? ["forever"] : []),
    ]),
    social: understanding.audience,
  };
}

function purposeForBeat(kind: StoryBeatKind, plan: CognitiveExperiencePlan): string {
  const map: Partial<Record<StoryBeatKind, string>> = {
    orientation: `Establish ${plan.centralSubject} and the evidence already present.`,
    hook: `Create a reason to look more closely at ${plan.centralSubject}.`,
    encounter: `Put the participant into a relationship with ${plan.centralSubject}.`,
    escalation: "Increase consequence using what the participant has already done.",
    discovery: "Connect newly revealed evidence to meaning.",
    reveal: "Expose a relationship that was not visible at first.",
    transformation: `Show what changed around ${plan.centralSubject}.`,
    reflection: "Let the experience register what remains meaningful.",
    payoff: "Return a consequence earned by the interaction.",
    continuation: "Keep the experience open to future evidence.",
    need: `Make the immediate need around ${plan.centralSubject} explicit.`,
    threshold: "Move from the obvious surface into the next layer.",
    origin: `Surface what came before ${plan.centralSubject}.`,
    challenge: "Give the participant something meaningful to solve or test.",
    instruction: "Provide the next useful piece of information.",
    action: "Turn understanding into a concrete participant action.",
    feedback: "Use the participant's result to determine what follows.",
    contribution: `Let participation change what ${plan.centralSubject} can become.`,
    identity: `Make the identity carried by ${plan.centralSubject} more visible.`,
    milestone: "Mark a meaningful change in progression.",
    unlock: "Expose material that was previously unavailable.",
    earned_access: "Connect access to what the participant actually did.",
    next_step: "Give the participant the clearest useful next move.",
  };
  return map[kind] ?? `Advance ${plan.centralSubject} through ${kind}.`;
}

function renderBeat(kind: StoryBeatKind, observation: import("@qre/contracts").ExperienceObservation, situationValue: import("@qre/contracts").StorySituation, plan: CognitiveExperiencePlan): string {
  const subject = observation.subject;
  const detail = observation.entities.keywords[0] ?? observation.entities.products[0] ?? observation.entities.events[0];
  const actor = observation.entities.people[0] ?? situationValue.actors[0];
  const setting = situationValue.setting[0];

  switch (kind) {
    case "orientation":
      return setting ? `${cap(subject)} is here, in ${setting}.` : `${cap(subject)} is the thing the experience puts into relationship with the participant.`;
    case "hook":
      return `${cap(plan.purpose)} The reason to keep looking is already inside ${subject}.`;
    case "need":
      return `${cap(plan.purpose)}`;
    case "origin":
      return actor ? `${actor} gives ${subject} a past that is present here.` : `${cap(subject)} carries something from before this moment into the present.`;
    case "encounter":
      return actor ? `${actor} changes the relationship with ${subject}.` : `The participant now has a way to act on ${subject}.`;
    case "challenge":
      return detail ? `${cap(subject)} asks for a response to ${detail}.` : `${cap(subject)} asks the participant to do something before the next layer appears.`;
    case "reveal":
      return detail ? `${cap(subject)} reveals ${detail}.` : `A hidden relationship around ${subject} becomes visible.`;
    case "discovery":
      return plan.creativePossibilities[0] ?? `The deeper meaning of ${subject} becomes visible through the interaction.`;
    case "contribution":
      return `${cap(subject)} changes when someone adds evidence of their own.`;
    case "identity":
      return `${cap(subject)} carries an identity shaped by the context around it.`;
    case "transformation":
      return `${cap(subject)} is different because of what happened along the way.`;
    case "reflection":
      return observation.explicitEmotions.length
        ? `What remains is ${observation.explicitEmotions.join(" and ")}.`
        : `What remains is the meaning attached to ${subject}.`;
    case "instruction":
      return `${cap(plan.interactionModel[0] ?? `Use ${subject} as the next point of action.`)}`;
    case "action":
      return `${cap(observation.affordances[0] ?? "respond")} to what ${subject} has revealed.`;
    case "feedback":
      return `What happens next depends on what the interaction reveals.`;
    case "next_step":
      return plan.progressionModel[1] ?? `Use what ${subject} revealed to choose the next step.`;
    case "unlock":
      return plan.creativePossibilities[0] ?? `Something previously unavailable around ${subject} is now open.`;
    case "earned_access":
      return `Access follows from what the participant just did with ${subject}.`;
    case "milestone":
      return `The relationship with ${subject} has reached a meaningful point.`;
    case "escalation":
      return `The next move becomes more specific because the experience learned from what happened already.`;
    case "payoff":
      return `The interaction gives ${subject} a consequence that belongs to this encounter.`;
    case "continuation":
      return plan.futureEvolution[0] ?? `The next interaction can change what ${subject} means.`;
    case "threshold":
      return `Look past the obvious layer of ${subject}.`;
    default:
      return `${cap(subject)} continues to develop through the interaction.`;
  }
}

function chooseBeatKinds(plan: CognitiveExperiencePlan, understanding: CognitiveUnderstanding): StoryBeatKind[] {
  const selected: StoryBeatKind[] = ["orientation"];
  const prompt = lower(understanding.prompt);
  const add = (kind: StoryBeatKind) => { if (!selected.includes(kind)) selected.push(kind); };

  if (has(prompt, ["mystery", "mysterious", "secret", "hidden", "portal", "unknown", "discover", "exclusive"])) add("hook");
  if (plan.direction === "utility") add("need");
  if (understanding.memorySignals.length) add("origin");
  if (understanding.entities.people.length || understanding.entities.places.length || understanding.audience.includes("shared")) add("encounter");
  if (has(prompt, ["hunt", "quest", "puzzle", "challenge", "game", "mission"])) add("challenge");
  if (has(prompt, ["secret", "hidden", "mystery", "portal", "unknown", "reveal"])) add("reveal");
  if (understanding.affordances.length && plan.direction !== "story") add("action");
  if (understanding.audience.includes("shared")) add("contribution");
  if (plan.direction === "commerce") add("identity");
  if (has(prompt, ["travel", "traveled", "journey", "transform", "change", "become"])) add("transformation");
  if (understanding.emotions.length || understanding.memorySignals.length) add("reflection");
  add(plan.direction === "utility" ? "next_step" : "payoff");
  if (plan.futureEvolution.length) add("continuation");

  return selected.slice(0, 9);
}

function buildStory(
  observation: import("@qre/contracts").ExperienceObservation,
  situationValue: import("@qre/contracts").StorySituation,
  plan: CognitiveExperiencePlan,
  understanding: CognitiveUnderstanding,
): ExperienceStory {
  const kinds = chooseBeatKinds(plan, understanding);
  const beats: StoryBeat[] = kinds.map((kind, index) => ({
    id: `beat-${index}-${kind}`,
    kind,
    order: index,
    purpose: purposeForBeat(kind, plan),
    text: renderBeat(kind, observation, situationValue, plan),
    entities: UNIQUE([
      observation.subject,
      ...observation.entities.keywords.slice(0, 4),
      ...situationValue.actors.slice(0, 2),
    ]),
    emotionalTarget: plan.emotionalIntent[0] ?? "curiosity",
    provenance: [
      evidence(observation.subject, "prompt", 0.9),
      ...plan.evidence,
    ],
  }));

  const baseTitle = cap(observation.subject.replace(/^the\s+/i, ""));
  const title = observation.entities.people[0]
    ? `${baseTitle} — ${observation.entities.people[0]}`
    : observation.entities.places[0]
      ? `${baseTitle} — ${observation.entities.places[0]}`
      : baseTitle;

  return {
    title,
    hook: beats[0]?.text ?? `A moment begins with ${observation.subject}.`,
    logline: plan.purpose,
    beats,
    ending: beats.find((beat) => beat.kind === "payoff")?.text ?? beats.at(-1)?.text ?? `The moment continues with ${observation.subject}.`,
    continuation: beats.find((beat) => beat.kind === "continuation")?.text,
    tone: UNIQUE(plan.emotionalIntent),
    provenance: [
      ...observation.evidence,
      ...plan.evidence,
    ],
  };
}

function buildGenome(
  understanding: CognitiveUnderstanding,
  story: ExperienceStory,
  plan: CognitiveExperiencePlan,
): ExperienceGenome {
  const interpretation = {
    intent: understanding.intent,
    concepts: UNIQUE([understanding.themes, plan.direction, plan.centralSubject].flat()),
    emotionalSignals: understanding.emotions,
    worldSignals: understanding.worldSignals,
    cognitiveSignals: ["evidence_weighting", "hypothesis_search", "opportunity_projection", "plan_native_realization"],
    confidence: understanding.confidence,
  };

  const meaning: ExperienceMeaning = {
    why: plan.purpose,
    emotions: understanding.emotions,
    memories: plan.memoryModel,
    desiredFeeling: plan.emotionalIntent,
    transformation: story.ending,
  };

  const energy: ExperienceEnergy = understanding.emotions.includes("excitement")
    ? "intense"
    : understanding.emotions.includes("playfulness")
      ? "playful"
      : understanding.emotions.includes("aspiration")
        ? "premium"
        : understanding.emotions.includes("tenderness")
          ? "emotional"
          : "mysterious";

  const pacing: ExperiencePacing = plan.direction === "utility" ? "medium" : plan.direction === "game" || plan.direction === "discovery" ? "fast" : "slow";
  const social: ExperienceSocial = understanding.audience.includes("shared") ? "shared" : "solo";

  return {
    intent: understanding.intent,
    interpretation,
    archetypes: [plan.direction],
    themes: UNIQUE([...understanding.themes, plan.direction]),
    emotions: understanding.emotions,
    meaning,
    relationships: [],
    energy,
    pacing,
    social,
    journey: ["arrival", ...story.beats.some((beat) => beat.kind === "discovery" || beat.kind === "reveal") ? ["discovery", "reveal"] : [], ...story.beats.some((beat) => beat.kind === "transformation") ? ["transformation"] : [], "return"],
    discovery: plan.direction === "discovery" || plan.creativePossibilities.some((value) => lower(value).includes("discover")) ? 0.9 : 0.35,
    memory: plan.memoryModel.length ? 0.95 : 0,
    commerce: plan.direction === "commerce" ? 0.9 : 0,
    immersion: understanding.entities.media.length ? 0.9 : 0.45,
    interaction: understanding.affordances.length ? 0.85 : 0.35,
    replay: plan.futureEvolution.length ? 0.85 : 0.25,
    entities: understanding.entities,
    environments: understanding.worldSignals,
    audience: understanding.audience.length ? understanding.audience : ["participant"],
    dna: UNIQUE([
      "adaptive",
      "subject-native",
      "evidence-driven",
      "variable-length",
      "cognitive-directed",
      "plan-native-realization",
      ...plan.direction ? [plan.direction] : [],
      ...understanding.affordances,
    ]),
  };
}

function composeWorld(genome: ExperienceGenome): ExperienceWorld {
  const direction = genome.archetypes[0];
  const domain = direction === "memory" ? "memory_world"
    : direction === "social" ? "community_world"
      : direction === "commerce" ? "commerce_world"
        : direction === "journey" ? "journey_world"
          : direction === "identity" ? "identity_world"
            : direction === "discovery" || direction === "game" ? "discovery_world"
              : "relationship_world";

  return {
    domain,
    archetype: direction,
    atmosphere: UNIQUE([genome.energy, ...genome.emotions]),
    journey: genome.journey,
    atoms: UNIQUE(["identity", "story", ...(genome.entities.places.length ? ["location"] : []), ...(genome.entities.media.length ? ["media"] : []), ...(genome.interaction >= 0.5 ? ["interaction"] : []), ...(genome.replay >= 0.5 ? ["replay"] : [])]),
    themes: genome.themes,
  };
}

function composeBlueprint(story: ExperienceStory, genome: ExperienceGenome, plan: CognitiveExperiencePlan): ExperienceBlueprint {
  const moments = story.beats.map((beat) => ({
    type: "story" as const,
    component: "story" as const,
    title: ["orientation", "hook", "need", "threshold"].includes(beat.kind) ? story.title : cap(beat.kind.replace(/_/g, " ")),
    subtitle: beat.emotionalTarget,
    description: beat.text,
    editable: true,
    demo: false,
    order: beat.order,
    payload: {
      beatId: beat.id,
      purpose: beat.purpose,
      entities: beat.entities,
      provenance: beat.provenance,
      cognitiveDirection: plan.direction,
    },
  }));

  return {
    title: story.title,
    type: "story" as ExperienceType,
    tone: story.tone.filter((value): value is ExperienceTone => ["luxury", "cinematic", "emotional", "viral", "professional", "friendly", "energetic", "humorous", "romantic", "premium", "playful", "dark", "trustworthy", "mysterious", "educational"].includes(value)),
    meaning: genome.meaning,
    moments,
    entities: genome.entities,
    cognitivePlan: plan,
    metadata: {
      archetypes: genome.archetypes,
      themes: genome.themes,
      dna: genome.dna,
    },
  };
}

function buildFlow(story: ExperienceStory): FlowStep[] {
  return story.beats.map((beat) => ({
    id: beat.id,
    order: beat.order,
    type: "story",
    payload: { beat },
  }));
}

function buildMoments(story: ExperienceStory): Moment[] {
  return story.beats.map((beat) => ({
    type: "message",
    order: beat.order,
    text: beat.text,
    meta: {
      duration: beat.kind === "payoff" ? 2800 : beat.kind === "hook" || beat.kind === "threshold" ? 2400 : 2200,
      beatId: beat.id,
      beatKind: beat.kind,
      emotionalTarget: beat.emotionalTarget,
      entities: beat.entities,
      provenance: beat.provenance,
    },
  }));
}

function buildScenePlan(story: ExperienceStory): StoryScenePlan[] {
  return story.beats.map((beat) => ({
    id: `scene-${beat.id}`,
    order: beat.order,
    beatId: beat.id,
    purpose: beat.purpose,
    text: beat.text,
    emotionalTarget: beat.emotionalTarget,
    entities: beat.entities,
    duration: beat.kind === "payoff" ? 2800 : beat.kind === "hook" || beat.kind === "threshold" ? 2400 : 2200,
    transition: beat.kind === "hook" || beat.kind === "threshold" ? "zoom" : beat.kind === "payoff" ? "cinematic" : "fade",
    visual: {
      theme: "cinematic",
      animation: beat.kind === "hook" || beat.kind === "threshold" ? "slow_zoom" : beat.kind === "escalation" || beat.kind === "challenge" ? "parallax" : "none",
    },
    audio: { type: "ambient", mood: beat.emotionalTarget },
    provenance: beat.provenance,
  }));
}

function buildModel(blueprint: ExperienceBlueprint, prompt: string, plan: CognitiveExperiencePlan): ExperienceModel {
  const industry: ExperienceIndustry = plan.direction === "commerce" ? "business" : plan.direction === "memory" ? "personal" : plan.direction === "social" ? "event" : "generic";
  return {
    title: blueprint.title,
    description: prompt,
    industry,
    goal: plan.direction === "utility" ? "educate" : plan.direction === "commerce" ? "conversion" : plan.direction === "memory" ? "memory" : "storytelling",
    tone: blueprint.tone,
    moments: blueprint.moments,
    metadata: {
      category: "cognitive_experience",
      tags: ["any-prompt", "evidence-driven", "subject-native", "cognitive-directed", "no-template-realization", plan.direction],
    },
  };
}

export function compileCognitiveExperience(prompt: string): ReturnType<typeof compileCognitiveExperienceInternal> {
  return compileCognitiveExperienceInternal(prompt);
}

function compileCognitiveExperienceInternal(prompt: string) {
  if (!prompt.trim()) throw new Error("Experience prompt required.");

  const understanding = understand(prompt);
  const subject = extractSubject(prompt, understanding.entities);
  const hypotheses = scoreHypotheses(prompt, understanding);
  const selectedHypothesis = hypotheses[0];
  if (!selectedHypothesis) throw new Error("Cognitive compiler produced no hypothesis.");

  const opportunityValue = opportunities(prompt, understanding);
  const plan = buildPlan(prompt, understanding, subject, selectedHypothesis, opportunityValue);
  const observation = observe(prompt, understanding, subject, plan);
  const situationValue = situation(prompt, understanding);
  const story = buildStory(observation, situationValue, plan, understanding);
  const genome = buildGenome(understanding, story, plan);
  const world = composeWorld(genome);
  const blueprint = composeBlueprint(story, genome, plan);
  const flowSteps = buildFlow(story);
  const momentList = buildMoments(story);
  const scenePlan = buildScenePlan(story);
  const cinematicScenes: CinematicScene[] = cinematicRuntime({ moments: momentList, geoStory: null });
  const model = buildModel(blueprint, prompt, plan);

  const cognition: CognitiveCompilation = {
    prompt,
    understanding,
    subject,
    hypotheses,
    selectedHypothesis,
    plan,
    opportunities: opportunityValue,
    memoryOpportunities: opportunityValue.memory,
    geographicOpportunities: opportunityValue.geographic,
    socialOpportunities: opportunityValue.social,
    discoveryOpportunities: opportunityValue.discovery,
    temporalOpportunities: opportunityValue.temporal,
    commercialOpportunities: opportunityValue.commercial,
    observation,
    situation: situationValue,
    story,
  };

  return {
    cognition,
    genome,
    world,
    blueprint,
    flowSteps,
    moments: momentList,
    cinematicScenes,
    scenePlan,
    story,
    model,
    title: story.title,
    estimatedDuration: momentList.reduce((total, moment) => total + (moment.meta?.duration ?? 2200), 0),
    momentCount: momentList.length,
  };
}
