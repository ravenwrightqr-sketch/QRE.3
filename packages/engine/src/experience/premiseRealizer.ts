import type {
  CognitiveExperiencePlan,
  CognitivePremise,
  CognitivePremiseRole,
  StoryBeat,
} from "@qre/contracts";

/**
 * Canonical language-realization boundary.
 *
 * Cognition owns meaning. The universal compiler owns structure. This file
 * owns presentation copy exactly once.
 *
 * The renderer consumes conserved premise roles and semantic directives. It
 * never maintains a domain lexicon, keyword rescue table, or second planner.
 */

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const lower = (value: unknown): string => clean(value).toLowerCase();

const sentence = (value: unknown): string =>
  clean(value).replace(/[.!?]+$/, "");

const cap = (value: unknown): string => {
  const text = clean(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "The experience";
};

const DEAD_PROSE = [
  /the experience puts into focus/i,
  /deserves a closer look/i,
  /gives the story somewhere concrete to begin/i,
  /the next layer/i,
  /the next move follows from the state reached here/i,
  /what the experience has revealed/i,
  /has become more meaningful through the interaction/i,
  /the experience leaves a meaning behind/i,
  /giving the moment a direction/i,
  /lands differently because of everything that happened/i,
  /the story starts pulling/i,
  /the experience moves forward through/i,
];

const ROLES: CognitivePremiseRole[] = [
  "subject",
  "event",
  "medium",
  "artifact",
  "participants",
  "outcome",
  "emotion",
  "affordance",
  "temporal",
  "place",
  "social",
  "transformation",
  "constraint",
];

function premise(plan?: CognitiveExperiencePlan): CognitivePremise | undefined {
  return plan?.premise;
}

function values(
  plan: CognitiveExperiencePlan | undefined,
  role: CognitivePremiseRole,
): string[] {
  return [
    ...new Set(
      premise(plan)?.slots
        .filter((slot) => slot.role === role)
        .flatMap((slot) => slot.values)
        .map(clean)
        .filter(Boolean) ?? [],
    ),
  ];
}

function first(
  plan: CognitiveExperiencePlan | undefined,
  role: CognitivePremiseRole,
): string {
  return values(plan, role)[0] ?? "";
}

function join(valuesValue: string[], fallback: string): string {
  if (!valuesValue.length) return fallback;
  if (valuesValue.length === 1) return valuesValue[0];
  if (valuesValue.length === 2) return `${valuesValue[0]} and ${valuesValue[1]}`;
  return `${valuesValue.slice(0, -1).join(", ")}, and ${valuesValue.at(-1)}`;
}

function subject(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  return (
    clean(plan?.centralSubject) ||
    first(plan, "subject") ||
    clean(beat.entities?.[0]) ||
    "the experience"
  );
}

function distinctive(value: string): string[] {
  return clean(value)
    .replace(/[^\p{L}\p{N}'’-]+/gu, " ")
    .split(/\s+/)
    .map((word) => word.replace(/^['-]+|['-]+$/g, ""))
    .filter((word) => word.length > 2);
}

function anchorValues(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string[] {
  const subjectValue = lower(subject(beat, plan));
  const slots = ROLES.flatMap((role) => values(plan, role));
  const entities = beat.entities ?? [];

  const candidates = [...slots, ...entities]
    .map(sentence)
    .filter(Boolean)
    .filter((value) => lower(value) !== subjectValue)
    .filter((value) => distinctive(value).length > 0);

  const seen = new Set<string>();
  return candidates.filter((value) => {
    const key = lower(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function directive(beat: StoryBeat, plan?: CognitiveExperiencePlan) {
  const candidate = plan?.realization?.directives.find(
    (item) => item.kind === beat.kind,
  );

  if (!candidate || candidate.confidence < 0.72) return undefined;
  if (!clean(candidate.action)) return undefined;
  return candidate;
}

function contextualDetail(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const rolePriority: Record<StoryBeat["kind"], CognitivePremiseRole[]> = {
    orientation: ["event", "place", "medium", "artifact"],
    hook: ["outcome", "affordance", "event"],
    need: ["constraint", "outcome", "affordance"],
    threshold: ["medium", "event", "place", "affordance"],
    origin: ["artifact", "temporal", "place"],
    encounter: ["participants", "event", "artifact", "social"],
    challenge: ["constraint", "affordance", "outcome"],
    discovery: ["artifact", "event", "medium", "outcome"],
    reveal: ["artifact", "event", "outcome", "transformation"],
    instruction: ["affordance", "medium", "constraint"],
    action: ["affordance", "medium", "artifact"],
    feedback: ["outcome", "transformation", "constraint"],
    contribution: ["participants", "social", "artifact", "outcome"],
    escalation: ["transformation", "constraint", "outcome", "affordance"],
    transformation: ["transformation", "outcome", "artifact"],
    reflection: ["emotion", "outcome", "artifact", "temporal"],
    provenance: ["artifact", "event", "place", "temporal"],
    identity: ["artifact", "social", "place", "event"],
    milestone: ["outcome", "transformation"],
    unlock: ["outcome", "affordance", "artifact"],
    earned_access: ["outcome", "affordance", "constraint"],
    payoff: ["outcome", "transformation"],
    next_step: ["affordance", "outcome", "temporal"],
    continuation: ["temporal", "transformation", "outcome", "social"],
  };

  for (const role of rolePriority[beat.kind]) {
    const value = first(plan, role);
    if (value) return value;
  }

  return anchorValues(beat, plan)[0] ?? "";
}

function directiveText(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  const item = directive(beat, plan);
  if (!item) return undefined;

  const name = cap(item.subject || subject(beat, plan));
  const action = sentence(item.action);
  const after = sentence(item.stateAfter);

  switch (beat.kind) {
    case "orientation":
      return `${name} enters the experience through ${action}${after ? `, leaving it in ${after}` : ""}.`;
    case "hook":
      return `${name} gives the experience a reason to continue: ${action}.`;
    case "need":
      return `${name} begins with the immediate need: ${action}.`;
    case "threshold":
      return `${name} crosses the threshold by ${action}.`;
    case "origin":
      return `${name} brings the relevant past into the present: ${action}.`;
    case "encounter":
      return `${name} encounters the next relationship through ${action}.`;
    case "challenge":
      return `${name} faces the condition that must be resolved: ${action}.`;
    case "discovery":
      return `${name} discovers what the interaction makes available: ${action}.`;
    case "reveal":
      return `${name} reveals what the conserved evidence supports: ${action}.`;
    case "instruction":
      return `${name} provides the next useful move: ${action}.`;
    case "action":
      return `Act on ${name}: ${action}.`;
    case "feedback":
      return `The result becomes evidence for ${name}: ${action}.`;
    case "contribution":
      return `${name} changes as participation becomes contribution: ${action}.`;
    case "escalation":
      return `${name} escalates the experience by ${action}.`;
    case "transformation":
      return `${name} changes through the accumulated interaction: ${action}.`;
    case "reflection":
      return `${name} retains what the interaction means now: ${action}.`;
    case "provenance":
      return `${name} carries the available evidence through ${action}.`;
    case "identity":
      return `${name} becomes more clearly identified through ${action}.`;
    case "milestone":
      return `${name} reaches a meaningful state: ${action}.`;
    case "unlock":
      return `${name} opens the next state through ${action}.`;
    case "earned_access":
      return `${name} earns the next state through ${action}.`;
    case "payoff":
      return `${name} reaches the intended result: ${action}.`;
    case "next_step":
      return `${name} uses the current state to continue: ${action}.`;
    case "continuation":
      return `${name} remains open to what comes next through ${action}.`;
    default:
      return `${name} advances the experience through ${action}.`;
  }
}

function fallbackText(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const name = cap(subject(beat, plan));
  const detail = contextualDetail(beat, plan);
  const anchors = anchorValues(beat, plan);
  const outcome = first(plan, "outcome");
  const transformation = values(plan, "transformation");
  const future = plan?.futureEvolution?.[0] ?? first(plan, "temporal");
  const why = plan?.whyInteract?.[0] ?? "";
  const progression = plan?.progressionModel?.[0] ?? "";
  const interaction = plan?.interactionModel?.[0] ?? "";
  const content = plan?.contentModel?.[0] ?? "";

  switch (beat.kind) {
    case "orientation":
      return detail
        ? `${name} begins with ${detail}.`
        : anchors.length
          ? `${name} begins with ${anchors[0]}.`
          : clean(beat.text) || `${name} begins from the supplied premise.`;
    case "hook":
      return why
        ? `${cap(why)} ${name} makes that intent concrete.`
        : detail
          ? `${cap(detail)} gives ${subject(beat, plan)} its first active turn.`
          : clean(beat.text) || `${name} gives the interaction a reason to continue.`;
    case "need":
      return detail
        ? `${name} begins with ${detail}.`
        : outcome
          ? `${name} begins with ${sentence(outcome)}.`
          : `${name} begins with the concrete need carried by the premise.`;
    case "threshold":
      return interaction
        ? `${name} moves into the next state through ${sentence(interaction)}.`
        : detail
          ? `${name} moves beyond the surface through ${detail}.`
          : `${name} moves from observation into the next state.`;
    case "origin":
      return detail
        ? `${name} brings ${detail} into the present.`
        : `${name} carries what came before into the present.`;
    case "encounter":
      return detail
        ? `${cap(detail)} enters the experience around ${subject(beat, plan)}, changing what happens next.`
        : `${name} encounters the next concrete condition in the premise.`;
    case "challenge":
      return progression
        ? `${name} encounters the next condition in ${sentence(progression)}.`
        : detail
          ? `${name} must resolve ${detail}.`
          : `${name} must resolve the next concrete condition in the premise.`;
    case "discovery":
    case "reveal":
      return detail
        ? `${name} reveals more through ${detail}.`
        : clean(beat.text) || `${name} reveals another concrete part of the premise.`;
    case "instruction":
      return content
        ? `${name} provides the useful information: ${sentence(content)}.`
        : interaction
          ? `${name} makes the next move concrete through ${sentence(interaction)}.`
          : `${name} supplies the next usable piece of information.`;
    case "action":
      return interaction
        ? `Act on ${subject(beat, plan)}: ${sentence(interaction)}.`
        : detail
          ? `Act on ${subject(beat, plan)} through ${detail}.`
          : `${name} becomes the next concrete action.`;
    case "feedback":
      return outcome
        ? `The result becomes evidence for ${subject(beat, plan)}: ${sentence(outcome)}.`
        : `${name} uses the result as evidence for what happens next.`;
    case "contribution":
      return detail
        ? `${cap(detail)} is added to ${subject(beat, plan)}, changing what is available next.`
        : `${name} changes when participation becomes contribution.`;
    case "escalation":
      return detail
        ? `${name} raises the stakes around ${detail}.`
        : progression
          ? `${name} escalates through ${sentence(progression)}.`
          : `${name} raises the stakes around what comes next.`;
    case "transformation":
      return transformation.length >= 2
        ? `${name} changes from ${sentence(transformation[0])} toward ${sentence(transformation[1])}.`
        : outcome
          ? `${name} changes toward ${sentence(outcome)}.`
          : `${name} changes because of the preceding interaction.`;
    case "reflection":
      return detail
        ? `${name} retains what ${detail} changed about the experience.`
        : `${name} retains the consequence of what happened.`;
    case "provenance":
      return anchors.length
        ? `${name} preserves the supplied evidence: ${join(anchors.slice(0, 3), "the premise")}.`
        : `${name} preserves the supplied evidence.`;
    case "identity":
      return detail
        ? `${name} becomes identifiable through ${detail}.`
        : `${name} becomes identifiable through the supplied context.`;
    case "milestone":
      return progression
        ? `${name} reaches a milestone in ${sentence(progression)}.`
        : `${name} reaches the next state established by the experience.`;
    case "unlock":
    case "earned_access":
      return outcome
        ? `${name} opens access tied to ${sentence(outcome)}.`
        : `${name} opens the next state because of what happened before it.`;
    case "payoff":
      return outcome
        ? `${name} reaches the payoff: ${sentence(outcome)}.`
        : `${name} reaches the result established by the premise.`;
    case "next_step":
      return progression
        ? `${name} continues through ${sentence(progression)}.`
        : `${name} uses the current state to determine the next action.`;
    case "continuation":
      return future
        ? `${name} remains open to ${sentence(future)}.`
        : `${name} carries the current state into what comes next.`;
    default:
      return clean(beat.text) || `${name} continues from the supplied premise.`;
  }
}

function preserveConcreteEvidence(
  text: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const normalized = lower(text);
  const detail = contextualDetail(beat, plan);
  if (!detail || normalized.includes(lower(detail))) return text;

  return `${sentence(text)}, with ${detail} still part of the moment.`;
}

export function realizePremiseBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const directed = directiveText(beat, plan);
  let text = clean(directed ?? fallbackText(beat, plan));

  if (isGenericCompilerProse(text)) {
    text = clean(fallbackText(beat, plan));
  }

  return preserveConcreteEvidence(text, beat, plan);
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

/** Diagnostic-only classification. It never selects or realizes a story. */
export function classifyPremise(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): Record<string, boolean> {
  const text = lower([
    beat.text,
    subject(beat, plan),
    ...ROLES.flatMap((role) => values(plan, role)),
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.interactionModel ?? []),
    ...(plan?.futureEvolution ?? []),
  ].join(" "));

  const dimensions: Record<string, RegExp> = {
    humor: /\b(fun|funny|humor|laugh|joke|comic|playful)\b/i,
    suspense: /\b(horror|haunted|scary|fear|dread|creepy|threat|danger|suspense)\b/i,
    absurdity: /\b(absurd|surreal|bizarre|impossible|wild|ridiculous|excessive)\b/i,
    indulgence: /\b(luxury|luxurious|indulgent|exclusive|opulent|lavish|pamper|extravagant)\b/i,
    accumulation: /\b(add|adding|accumulate|grows|growing|again|over time|keeps growing|builds up)\b/i,
    participation: /\b(everyone|family|friends|group|community|shared|together|contribute|participate|members)\b/i,
    contrast: /\b(before|after|transform|transformation|changed|change|restore|difference|compare|old state|new state)\b/i,
    process: /\b(build|building|repair|restore|prepare|process|step|steps|cleaning)\b/i,
    discovery: /\b(discover|discovery|hidden|secret|uncover|find|forgotten|reveal|clue|mystery|unknown|search|document)\b/i,
    temporal: /\b(again|return|future|later|next|over time|keeps|continue|comes back)\b/i,
    memory: /\b(memory|remember|remembered|past|history|childhood|keepsake|legacy|preserve|remembering)\b/i,
    social: /\b(everyone|family|friends|group|community|together|shared|people|relationship|collective|members)\b/i,
    utility: /\b(useful|help|solve|answer|instruction|guide|fix|need|practical|task)\b/i,
    media: /\b(qr|nfc|photo|image|video|film|music|song|voice|recording|scan|scanned)\b/i,
  };

  return Object.fromEntries(
    Object.entries(dimensions).map(([name, pattern]) => [name, pattern.test(text)]),
  );
}
