import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";

/**
 * UNIVERSAL PREMISE REALIZER
 *
 * Evidence-first language realization.
 *
 * Cognition chooses direction. The universal compiler chooses structure.
 * This layer only turns the selected structure into readable language while
 * preserving the concrete evidence carried by the prompt and beat.
 *
 * It must never replace prompt evidence with generic significance prose.
 */

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const lower = (value: string) => clean(value).toLowerCase().replace(/[’]/g, "'");
const sentence = (value: string) => clean(value).replace(/[.!?]+$/, "");
const cap = (value: string) => {
  const text = clean(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "The premise";
};

const STOP = new Set([
  "a", "an", "and", "are", "as", "at", "be", "because", "by", "can", "could",
  "create", "do", "does", "doing", "for", "from", "get", "give", "gives", "given",
  "has", "have", "how", "i", "if", "in", "into", "is", "it", "its", "make", "makes",
  "making", "me", "my", "of", "on", "or", "our", "people", "please", "that", "the",
  "their", "this", "those", "to", "turn", "up", "was", "we", "what", "when", "where",
  "which", "who", "with", "you", "your", "something", "someone", "thing", "experience",
  "story", "about", "through", "just", "more", "than", "then", "now", "will", "keep",
]);

const DEAD_PROSE = [
  /is the thing the experience puts into focus/i,
  /has become more meaningful through the interaction/i,
  /something about .* deserves a closer look/i,
  /deserves a closer look/i,
  /the experience leaves a meaning behind/i,
  /giving the moment a direction/i,
  /what the experience has revealed/i,
  /lands differently because of everything that happened/i,
  /enters the story through/i,
  /gives the story somewhere concrete to begin/i,
  /the story starts pulling/i,
  /the experience moves forward through/i,
  /the subject now means more/i,
  /another layer of/i,
  /hidden relationship around/i,
  /meaningful point has been reached/i,
  /continues to develop through the interaction/i,
  /the next layer/i,
  /the next move follows from the state reached here/i,
];

type SignalField = keyof CognitiveExperiencePlan;

type SemanticEvidence = {
  subject: string;
  anchors: string[];
  why: string;
  purpose: string;
  interaction: string;
  memory: string;
  discovery: string;
  reward: string;
  progression: string;
  content: string;
  future: string;
  emotion: string;
  audience: string;
};

function planValues(plan: CognitiveExperiencePlan | undefined, field: SignalField): string[] {
  const value = plan?.[field];
  if (typeof value === "string") return value.trim() ? [sentence(value)] : [];
  if (Array.isArray(value)) return value.map(String).map(sentence).filter(Boolean);
  return [];
}

function firstPlanValue(plan: CognitiveExperiencePlan | undefined, field: SignalField): string {
  return planValues(plan, field)[0] ?? "";
}

function tokens(value: string): string[] {
  return clean(value)
    .replace(/[^\p{L}\p{N}'-]+/gu, " ")
    .split(/\s+/)
    .map((word) => word.replace(/^['-]+|['-]+$/g, ""))
    .filter(Boolean);
}

function distinctiveTokens(value: string): string[] {
  return tokens(value)
    .filter((word) => word.length > 1)
    .filter((word) => !STOP.has(lower(word)));
}

function unique(values: string[]): string[] {
  return [...new Map(values.map(clean).filter(Boolean).map((value) => [lower(value), value])).values()];
}

function subject(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  return clean(plan?.centralSubject || beat.entities?.[0] || "the premise");
}

function semanticLexemes(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const text = lower([
    beat.text,
    ...(beat.entities ?? []),
    ...planValues(plan, "whyInteract"),
    ...planValues(plan, "purpose"),
    ...planValues(plan, "interactionModel"),
    ...planValues(plan, "storyStructure"),
    ...planValues(plan, "memoryModel"),
    ...planValues(plan, "socialModel"),
    ...planValues(plan, "discoveryModel"),
    ...planValues(plan, "rewardModel"),
    ...planValues(plan, "progressionModel"),
    ...planValues(plan, "contentModel"),
    ...planValues(plan, "dynamicBehavior"),
    ...planValues(plan, "futureEvolution"),
    ...planValues(plan, "creativePossibilities"),
    ...planValues(plan, "emotionalIntent"),
    plan?.centralSubject ?? "",
  ].join(" "));

  const result: string[] = [];
  const add = (value: string) => {
    if (value && !result.some((item) => lower(item) === lower(value))) result.push(value);
  };

  const patterns: Array<[RegExp, string]> = [
    [/\b(?:remember|memory|memorial|nostalgia|preserve|legacy|remembering)\b/, "remember"],
    [/\b(?:fun|funny|humor|humorous|laugh|playful|joy)\b/, "fun"],
    [/\b(?:family|relatives|parents|children|daughter|son|mother|father)\b/, "family"],
    [/\b(?:add|adding|contribute|contribution|accumulate|accumulates|grows|growing)\b/, "adding"],
    [/\b(?:next|progression|chapter|continue|continuation|future)\b/, "next"],
    [/\b(?:clue|clues|scavenger|hunt|mystery|secret)\b/, "clue"],
    [/\b(?:terrifying|terror|horror|haunted|scary|fear|dread|creepy)\b/, "terrifying"],
    [/\b(?:luxury|luxurious|billionaire|opulent|lavish|indulgent)\b/, "luxury"],
    [/\b(?:absurd|surreal|bizarre|impossible|weird|wild)\b/, "absurd"],
    [/\b(?:concert|festival|nightclub|wedding|birthday|museum|spa|house|home|recipe|robot)\b/, "context"],
    [/\b(?:qr|nfc|scan|scanned|tag)\b/, "QR"],
  ];

  for (const [pattern, value] of patterns) {
    if (!pattern.test(text)) continue;
    if (value === "context") {
      const match = text.match(pattern);
      if (match?.[0]) add(match[0]);
    } else {
      add(value);
    }
  }

  return result;
}

function buildAnchors(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const subjectValue = lower(subject(beat, plan));
  const candidates = [
    ...(beat.entities ?? []),
    ...semanticLexemes(beat, plan),
    ...planValues(plan, "creativePossibilities"),
    ...planValues(plan, "contentModel"),
    ...planValues(plan, "discoveryModel"),
    ...planValues(plan, "memoryModel"),
    ...planValues(plan, "socialModel"),
    ...planValues(plan, "commerceModel"),
    ...planValues(plan, "progressionModel"),
    ...distinctiveTokens(beat.text),
  ];

  const scored = new Map<string, { value: string; score: number }>();

  for (const candidate of candidates) {
    const value = sentence(candidate);
    if (!value || lower(value) === subjectValue) continue;
    const words = distinctiveTokens(value);
    if (!words.length) continue;

    const score =
      (beat.entities?.some((entity) => lower(entity) === lower(value)) ? 8 : 0) +
      Math.min(words.length, 6) +
      (value.length <= 72 ? 1 : 0);

    const key = lower(value);
    const previous = scored.get(key);
    if (!previous || score > previous.score) scored.set(key, { value, score });
  }

  return [...scored.values()]
    .sort((a, b) => b.score - a.score || b.value.length - a.value.length)
    .map((entry) => entry.value)
    .slice(0, 16);
}

function evidence(beat: StoryBeat, plan?: CognitiveExperiencePlan): SemanticEvidence {
  return {
    subject: subject(beat, plan),
    anchors: buildAnchors(beat, plan),
    why: firstPlanValue(plan, "whyInteract"),
    purpose: firstPlanValue(plan, "purpose"),
    interaction: firstPlanValue(plan, "interactionModel"),
    memory: firstPlanValue(plan, "memoryModel"),
    discovery: firstPlanValue(plan, "discoveryModel"),
    reward: firstPlanValue(plan, "rewardModel"),
    progression: firstPlanValue(plan, "progressionModel"),
    content: firstPlanValue(plan, "contentModel"),
    future: firstPlanValue(plan, "futureEvolution"),
    emotion: firstPlanValue(plan, "emotionalIntent"),
    audience: firstPlanValue(plan, "socialModel") || (plan?.audience?.length ? plan.audience.join(", ") : ""),
  };
}

function material(ev: SemanticEvidence, count = 2): string[] {
  return unique([
    ...ev.anchors,
    ev.why,
    ev.purpose,
    ev.content,
    ev.discovery,
    ev.memory,
    ev.progression,
    ev.reward,
    ev.future,
  ].filter((value) => !isGenericCompilerProse(value))).slice(0, count);
}

function realize(ev: SemanticEvidence, beat: StoryBeat): string {
  const name = cap(ev.subject);
  const first = ev.anchors[0] ?? "the supplied detail";
  const second = ev.anchors[1] ?? "the next detail";

  switch (beat.kind) {
    case "orientation":
      return ev.anchors.length > 0
        ? `${name} begins with ${first}${ev.anchors.length > 1 ? `, alongside ${second}` : ""}.`
        : `${name} begins from the evidence supplied by the prompt.`;
    case "hook":
      return ev.why ? `${cap(ev.why)} ${name} makes that intent concrete.` : `${cap(first)} gives ${ev.subject} its first active point.`;
    case "need":
      return ev.why ? `${cap(ev.why)} ${name} carries that need.` : ev.purpose ? `${name} has a concrete purpose: ${sentence(ev.purpose)}.` : `${name} starts with the concrete need in the premise.`;
    case "threshold":
      return ev.interaction ? `${name} reaches a threshold through ${sentence(ev.interaction)}.` : `${name} moves from observation into participation.`;
    case "origin":
      return ev.memory ? `${name} brings its history into the present through ${sentence(ev.memory)}.` : `${name} carries ${first} from the premise into the present.`;
    case "encounter":
      return ev.anchors.length > 1 ? `${cap(first)} meets ${second} inside ${ev.subject}, changing what can happen next.` : `${cap(first)} enters ${ev.subject} and changes what can happen next.`;
    case "challenge":
      return ev.progression ? `${name} encounters a constraint inside ${sentence(ev.progression)}.` : `${name} has to resolve the next concrete condition in the premise.`;
    case "discovery":
    case "reveal":
      return ev.discovery ? `${name} reveals ${sentence(ev.discovery)}.` : ev.anchors.length > 1 ? `${cap(first)} connects with ${second}, exposing more of ${ev.subject}.` : `${cap(first)} becomes visible as a new part of ${ev.subject}.`;
    case "instruction":
      return ev.content ? `${name} provides the useful information: ${sentence(ev.content)}.` : ev.interaction ? `${name} turns the prompt into a usable action: ${sentence(ev.interaction)}.` : `${name} supplies the next usable piece of information.`;
    case "action":
      return ev.interaction ? `Act on ${ev.subject}: ${sentence(ev.interaction)}.` : `${name} turns the premise into the next concrete action.`;
    case "feedback":
      return ev.progression ? `The result feeds back into ${ev.subject}: ${sentence(ev.progression)}.` : `${cap(first)} becomes evidence for the next decision about ${ev.subject}.`;
    case "contribution":
      return ev.anchors.length ? `${cap(first)} is added to ${ev.subject}, changing the material available to the next interaction.` : `${name} changes when new material is added.`;
    case "escalation":
      return ev.progression ? `${name} escalates through ${sentence(ev.progression)}.` : `${cap(first)} raises the stakes around ${second}.`;
    case "transformation":
      return ev.anchors.length > 1 ? `${name} changes from ${first} toward ${second}.` : ev.progression ? `${name} changes as ${sentence(ev.progression)}.` : `${name} changes because of the preceding interaction.`;
    case "reflection":
      return ev.memory ? `${name} retains ${sentence(ev.memory)}.` : ev.emotion ? `${name} carries ${sentence(ev.emotion)} forward.` : `${name} retains the consequence of what happened.`;
    case "provenance":
      return `${name} preserves source evidence: ${material(ev, 4).join(", ") || "the supplied prompt"}.`;
    case "identity":
      return ev.anchors.length ? `${name} is identified by ${material(ev, 3).join(", ")}.` : `${name} becomes identifiable through the supplied context.`;
    case "milestone":
      return ev.progression ? `${name} reaches a milestone in ${sentence(ev.progression)}.` : `${name} reaches the next state established by the experience.`;
    case "unlock":
    case "earned_access":
      return ev.reward ? `${name} unlocks ${sentence(ev.reward)}.` : ev.progression ? `${name} earns the next state through ${sentence(ev.progression)}.` : `${name} opens the next state because of what happened before it.`;
    case "payoff":
      return ev.reward ? `${name} reaches the payoff: ${sentence(ev.reward)}.` : ev.purpose ? `${name} resolves around ${sentence(ev.purpose)}.` : ev.memory ? `${name} resolves by retaining ${sentence(ev.memory)}.` : `${name} reaches the result established by the premise.`;
    case "next_step":
      return ev.progression ? `${name} continues with ${sentence(ev.progression)}.` : ev.future ? `${name} continues through ${sentence(ev.future)}.` : `${name} uses the current state to determine the next action.`;
    case "continuation":
      return ev.future ? `${name} remains open to ${sentence(ev.future)}.` : ev.memory ? `${name} can carry ${sentence(ev.memory)} into another interaction.` : `${name} remains open as ${first} changes what comes next.`;
    default:
      return `${name} continues with ${material(ev, 2).join(" and ") || "the supplied premise"}.`;
  }
}

function preserveEvidence(text: string, ev: SemanticEvidence): string {
  const normalized = lower(text);
  const anchors = ev.anchors
    .filter((anchor) => distinctiveTokens(anchor).length > 0)
    .filter((anchor) => !isGenericCompilerProse(anchor))
    .filter((anchor) => !normalized.includes(lower(anchor)))
    .slice(0, 6);

  if (!anchors.length) return text;

  return `${clean(text).replace(/[.!?]+$/, "")}. Evidence carried forward: ${anchors.join(", ")}.`;
}

export function realizePremiseBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const ev = evidence(beat, plan);
  let value = clean(realize(ev, beat));

  if (isGenericCompilerProse(value)) {
    const original = clean(beat.text);
    value = original && !isGenericCompilerProse(original)
      ? original
      : `${cap(ev.subject)} carries ${material(ev, 3).join(", ") || "the supplied premise"}.`;
  }

  return preserveEvidence(value, ev);
}

export function realizePremiseBeats(beats: StoryBeat[], plan?: CognitiveExperiencePlan): StoryBeat[] {
  return beats.map((beat) => ({ ...beat, text: realizePremiseBeat(beat, plan) }));
}

export function isGenericCompilerProse(value: string): boolean {
  return DEAD_PROSE.some((pattern) => pattern.test(value));
}

/** Diagnostic compatibility export. These dimensions never drive realization. */
export function classifyPremise(beat: StoryBeat, plan?: CognitiveExperiencePlan): Record<string, boolean> {
  const ev = evidence(beat, plan);
  const text = lower([
    beat.text,
    ev.subject,
    ...ev.anchors,
    ev.why,
    ev.purpose,
    ev.interaction,
    ev.memory,
    ev.discovery,
    ev.reward,
    ev.progression,
    ev.content,
    ev.future,
    ev.emotion,
  ].join(" "));

  const dimensions: Record<string, RegExp> = {
    humor: /\b(?:fun|funny|humor|humorous|laugh|laughter|joke|comic|playful|ridiculous)\b/i,
    suspense: /\b(?:terrifying|terror|horror|haunted|scary|fear|dread|creepy|threat|danger|suspense|unease)\b/i,
    absurdity: /\b(?:absurd|surreal|bizarre|impossible|wild|ridiculous|unreasonable|excessive)\b/i,
    indulgence: /\b(?:luxury|luxurious|billionaire|indulgent|exclusive|opulent|lavish|pamper|extravagant)\b/i,
    accumulation: /\b(?:add|adding|accumulate|accumulates|grows|growing|each person|next person|again|over time|keeps growing|builds up)\b/i,
    participation: /\b(?:everyone|family|friends|group|community|shared|together|contribute|contribution|participate|members)\b/i,
    contrast: /\b(?:before|after|transform|transformation|changed|change|restore|restoring|difference|compare|old state|new state)\b/i,
    process: /\b(?:build|building|repair|repairing|restore|restoring|prepare|preparing|process|processing|step|steps|cleaning)\b/i,
    discovery: /\b(?:discover|discovery|hidden|secret|uncover|find|forgotten|reveal|clue|mystery|unknown|search|document)\b/i,
    temporal: /\b(?:again|return|future|later|next|over time|keeps|continue|comes back)\b/i,
    memory: /\b(?:memory|remember|remembered|past|history|childhood|keepsake|legacy|preserve|remembering)\b/i,
    social: /\b(?:everyone|family|friends|group|community|together|shared|people|relationship|collective|members)\b/i,
    utility: /\b(?:useful|help|solve|answer|instruction|guide|fix|need|practical|task)\b/i,
    media: /\b(?:qr|nfc|photo|image|video|film|music|song|voice|recording|scan|scanned)\b/i,
  };

  return Object.fromEntries(Object.entries(dimensions).map(([name, pattern]) => [name, pattern.test(text)]));
}
