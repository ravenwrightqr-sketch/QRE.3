import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";

/**
 * UNIVERSAL PREMISE REALIZER
 *
 * This is the language boundary after cognition has already selected meaning.
 * It does not own a subject catalog, industry templates, or a second planner.
 *
 * The realization rule is:
 *
 *   semantic evidence + beat role + cognitive intent
 *     -> subject-native language
 *
 * The important change is that realization no longer asks:
 *   "Which generic story sentence fits this beat?"
 *
 * It asks:
 *   "Which pieces of the user's premise are most useful here, and how does
 *    this beat change their relationship?"
 *
 * This keeps arbitrary prompts extensible because new nouns inherit the same
 * evidence-selection machinery instead of requiring a new narrative branch.
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
  "story", "about", "through", "just", "more", "than", "then", "now", "will", "into",
]);

/**
 * Legacy phrases are retained only as an integrity detector. They are never
 * used as realization vocabulary.
 */
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
  structure: string;
  memory: string;
  discovery: string;
  reward: string;
  progression: string;
  content: string;
  future: string;
  emotion: string;
  audience: string;
};

const PLAN_FIELDS: SignalField[] = [
  "direction",
  "centralSubject",
  "purpose",
  "whyInteract",
  "storyStructure",
  "interactionModel",
  "memoryModel",
  "geographicModel",
  "socialModel",
  "discoveryModel",
  "rewardModel",
  "commerceModel",
  "progressionModel",
  "contentModel",
  "dynamicBehavior",
  "futureEvolution",
  "creativePossibilities",
  "emotionalIntent",
];

function planValues(
  plan: CognitiveExperiencePlan | undefined,
  field: SignalField,
): string[] {
  const value = plan?.[field];

  if (typeof value === "string") {
    const result = sentence(value);
    return result ? [result] : [];
  }

  if (Array.isArray(value)) {
    return value
      .map(String)
      .map(sentence)
      .filter(Boolean);
  }

  return [];
}

function firstPlanValue(
  plan: CognitiveExperiencePlan | undefined,
  field: SignalField,
): string {
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
  return [
    ...new Map(
      values
        .map(clean)
        .filter(Boolean)
        .map((value) => [lower(value), value]),
    ).values(),
  ];
}

function subject(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  return clean(
    plan?.centralSubject ||
      beat.entities?.[0] ||
      "the premise",
  );
}

function buildAnchors(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const subjectValue = lower(subject(beat, plan));
  const candidates = [
    ...(beat.entities ?? []),
    ...planValues(plan, "creativePossibilities"),
    ...planValues(plan, "contentModel"),
    ...planValues(plan, "discoveryModel"),
    ...planValues(plan, "memoryModel"),
    ...planValues(plan, "socialModel"),
    ...planValues(plan, "commerceModel"),
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
    if (!previous || score > previous.score) {
      scored.set(key, { value, score });
    }
  }

  // Preserve distinctive prompt vocabulary even when cognition did not place
  // it into a dedicated field. This is particularly important for arbitrary
  // nouns, names, media, products, and short technical tokens such as QR/NFC.
  const rawPromptMaterial = [
    beat.text,
    ...(beat.entities ?? []),
  ].join(" ");

  for (const token of distinctiveTokens(rawPromptMaterial)) {
    if (lower(token) === subjectValue) continue;
    const key = lower(token);
    if (!scored.has(key)) {
      scored.set(key, { value: token, score: 2 });
    }
  }

  return [...scored.values()]
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.value)
    .slice(0, 10);
}

function evidence(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): SemanticEvidence {
  const anchors = buildAnchors(beat, plan);

  return {
    subject: subject(beat, plan),
    anchors,
    why: firstPlanValue(plan, "whyInteract"),
    purpose: firstPlanValue(plan, "purpose"),
    interaction: firstPlanValue(plan, "interactionModel"),
    structure: firstPlanValue(plan, "storyStructure"),
    memory: firstPlanValue(plan, "memoryModel"),
    discovery: firstPlanValue(plan, "discoveryModel"),
    reward: firstPlanValue(plan, "rewardModel"),
    progression: firstPlanValue(plan, "progressionModel"),
    content: firstPlanValue(plan, "contentModel"),
    future: firstPlanValue(plan, "futureEvolution"),
    emotion: firstPlanValue(plan, "emotionalIntent"),
    audience: firstPlanValue(plan, "socialModel") ||
      (plan?.audience?.length ? plan.audience.join(", ") : ""),
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
  ]).slice(0, count);
}

function subjectWithMaterial(ev: SemanticEvidence, count = 2): string {
  const values = material(ev, count);
  return values.length
    ? `${ev.subject} — ${values.join("; ")}`
    : ev.subject;
}

function direction(ev: SemanticEvidence, plan?: CognitiveExperiencePlan): string {
  return lower(firstPlanValue(plan, "direction"));
}

/**
 * Realize a beat from evidence rather than from a sentence catalog.
 *
 * Beat kinds describe the transformation occurring at this point. The actual
 * nouns, people, media, motives, memories, and actions come from cognition.
 */
function realize(ev: SemanticEvidence, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const name = cap(ev.subject);
  const first = ev.anchors[0] ?? "the current detail";
  const second = ev.anchors[1] ?? "the next detail";
  const dir = direction(ev, plan);

  switch (beat.kind) {
    case "orientation":
      return ev.anchors.length
        ? `${name} begins with ${first}${ev.anchors.length > 1 ? `, alongside ${second}` : ""}.`
        : ev.purpose
          ? `${name} begins because ${sentence(ev.purpose)}.`
          : `${name} begins from the information the prompt supplied.`;

    case "hook":
      return ev.why
        ? `${cap(ev.why)} ${name} makes that intent concrete.`
        : `${cap(first)} gives ${ev.subject} its first active point of attention.`;

    case "need":
      return ev.why
        ? `${cap(ev.why)} ${name} is the subject that carries that need.`
        : ev.purpose
          ? `${name} has a concrete purpose: ${sentence(ev.purpose)}.`
          : `${name} is the part of the premise that requires an answer.`;

    case "threshold":
      return ev.interaction
        ? `${name} reaches a threshold through ${sentence(ev.interaction)}.`
        : `${name} moves from observation into participation.`;

    case "origin":
      return ev.memory
        ? `${name} brings its history into the present through ${sentence(ev.memory)}.`
        : ev.anchors.length
          ? `${name} carries ${first} from the premise into the present.`
          : `${name} carries its starting context into the present.`;

    case "encounter":
      return ev.anchors.length > 1
        ? `${cap(first)} meets ${second} inside ${ev.subject}, changing what can happen next.`
        : ev.interaction
          ? `${name} becomes actionable through ${sentence(ev.interaction)}.`
          : `${cap(first)} enters the experience and changes ${ev.subject}.`;

    case "action":
      return ev.interaction
        ? `${name} changes through ${sentence(ev.interaction)}.`
        : `${cap(first)} becomes an action applied to ${ev.subject}.`;

    case "challenge":
      return ev.progression
        ? `${name} encounters a constraint inside ${sentence(ev.progression)}.`
        : ev.discovery
          ? `${name} has to work through ${sentence(ev.discovery)}.`
          : `${name} has to resolve the next concrete condition in the premise.`;

    case "discovery":
    case "reveal":
      return ev.discovery
        ? `${name} reveals ${sentence(ev.discovery)}.`
        : ev.anchors.length > 1
          ? `${cap(first)} connects with ${second}, exposing more of ${ev.subject}.`
          : `${cap(first)} becomes visible as a new part of ${ev.subject}.`;

    case "instruction":
      return ev.content
        ? `${name} provides the useful information: ${sentence(ev.content)}.`
        : ev.interaction
          ? `${name} turns the prompt into a usable action: ${sentence(ev.interaction)}.`
          : `${name} supplies the next usable piece of information.`;

    case "feedback":
      return ev.progression
        ? `The result feeds back into ${ev.subject}: ${sentence(ev.progression)}.`
        : `${cap(first)} becomes evidence for the next decision about ${ev.subject}.`;

    case "contribution":
      return ev.anchors.length
        ? `${cap(first)} is added to ${ev.subject}, changing the material available to the next interaction.`
        : ev.social
          ? `${name} changes when another participant contributes to it.`
          : `${name} changes when new material is added.`;

    case "escalation":
      return ev.progression
        ? `${name} escalates through ${sentence(ev.progression)}.`
        : ev.anchors.length > 1
          ? `${cap(first)} raises the stakes around ${second}.`
          : `${name} moves into a stronger version of the condition established before it.`;

    case "transformation":
      return ev.anchors.length > 1
        ? `${name} changes from ${first} toward ${second}.`
        : ev.progression
          ? `${name} changes as ${sentence(ev.progression)}.`
          : `${name} reaches a different state because of the preceding interaction.`;

    case "reflection":
      return ev.memory
        ? `${name} retains ${sentence(ev.memory)}.`
        : ev.emotion
          ? `${name} leaves behind ${sentence(ev.emotion)}.`
          : ev.anchors.length > 1
            ? `${name} now carries ${first} together with ${second}.`
            : `${name} retains the consequence of what happened.`;

    case "provenance":
      return ev.anchors.length
        ? `${name} preserves where this version came from: ${material(ev, 3).join(", ")}.`
        : `${name} preserves the evidence that produced this version.`;

    case "identity":
      return ev.anchors.length
        ? `${name} is identified by ${material(ev, 3).join(", ")}.`
        : `${name} becomes identifiable through the context supplied by the prompt.`;

    case "milestone":
      return ev.progression
        ? `${name} reaches a milestone in ${sentence(ev.progression)}.`
        : `${name} reaches the next state established by the experience.`;

    case "unlock":
    case "earned_access":
      return ev.reward
        ? `${name} unlocks ${sentence(ev.reward)}.`
        : ev.progression
          ? `${name} earns the next state through ${sentence(ev.progression)}.`
          : `${name} opens the next state because of what happened before it.`;

    case "payoff":
      return ev.reward
        ? `${name} reaches the payoff: ${sentence(ev.reward)}.`
        : ev.purpose
          ? `${name} resolves around ${sentence(ev.purpose)}.`
          : ev.memory
            ? `${name} resolves by retaining ${sentence(ev.memory)}.`
            : `${name} reaches the state produced by the preceding events.`;

    case "next_step":
      return ev.progression
        ? `${name} continues with ${sentence(ev.progression)}.`
        : ev.future
          ? `${name} continues through ${sentence(ev.future)}.`
          : `${name} uses the current state to determine the next action.`;

    case "continuation":
      return ev.future
        ? `${name} remains open to ${sentence(ev.future)}.`
        : ev.memory
          ? `${name} can carry ${sentence(ev.memory)} into another interaction.`
          : ev.anchors.length
            ? `${name} remains open as ${first} changes what comes next.`
            : `${name} continues from the state established here.`;

    default:
      // This is intentionally evidence-bearing rather than a generic story
      // sentence. If cognition knows a direction, expose it; otherwise keep
      // the subject and the strongest material visible.
      return dir
        ? `${name} continues under ${dir} with ${material(ev, 2).join(" and ") || "the supplied premise"}.`
        : `${name} continues with ${material(ev, 2).join(" and ") || "the supplied premise"}.`;
  }
}

export function realizePremiseBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const ev = evidence(beat, plan);
  const value = clean(realize(ev, beat, plan));

  if (value && !isGenericCompilerProse(value)) {
    return value;
  }

  // Never manufacture significance prose to hide a realization failure.
  // Preserve the existing beat text if it contains actual prompt material.
  const original = clean(beat.text);
  if (original && !isGenericCompilerProse(original)) {
    return original;
  }

  const fallbackMaterial = material(ev, 3);
  return fallbackMaterial.length
    ? `${cap(ev.subject)} carries ${fallbackMaterial.join(", ")}.`
    : cap(ev.subject);
}

export function realizePremiseBeats(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
): StoryBeat[] {
  return beats.map((beat) => ({
    ...beat,
    text: realizePremiseBeat(beat, plan),
  }));
}

export function isGenericCompilerProse(value: string): boolean {
  return DEAD_PROSE.some((pattern) => pattern.test(value));
}

/**
 * Compatibility export retained for diagnostics/tests. The old implementation
 * exposed force categories; the cognitive plan is now the authoritative
 * semantic source, so this reports whether each dimension has evidence rather
 * than driving realization with a fixed branch catalog.
 */
export function classifyPremise(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): Record<string, boolean> {
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
    contrast: /\b(?:before|after|transform|transformation|changed|change|restore|difference|compare|old state|new state)\b/i,
    process: /\b(?:build|building|repair|repairing|restore|restoring|prepare|preparing|process|processing|step|steps|cleaning)\b/i,
    discovery: /\b(?:discover|discovery|hidden|secret|uncover|find|forgotten|reveal|clue|mystery|unknown|search|document)\b/i,
    temporal: /\b(?:again|return|future|later|next|over time|keeps|continue|comes back)\b/i,
    memory: /\b(?:memory|remember|remembered|past|history|childhood|keepsake|legacy|preserve|remembering)\b/i,
    social: /\b(?:everyone|family|friends|group|community|together|shared|people|relationship|collective|members)\b/i,
    utility: /\b(?:useful|help|solve|answer|instruction|guide|fix|need|practical|task)\b/i,
    media: /\b(?:qr|nfc|photo|image|video|film|music|song|voice|recording|scan|scanned)\b/i,
  };

  return Object.fromEntries(
    Object.entries(dimensions).map(([name, pattern]) => [name, pattern.test(text)]),
  );
}
